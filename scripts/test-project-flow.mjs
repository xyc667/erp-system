/**
 * Project module smoke test — full API lifecycle.
 * Usage: node scripts/test-project-flow.mjs
 */
const apiURL = process.env.E2E_API_URL || 'http://localhost:3001'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'
const demoPassword = process.env.E2E_DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || 'demo123'

async function login(username = 'admin', password = adminPassword) {
  const res = await fetch(`${apiURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenantCode: 'default' }),
  })
  if (!res.ok) throw new Error(`login ${username} failed: ${res.status}`)
  const data = await res.json()
  return { Authorization: `Bearer ${data.access_token}`, 'Content-Type': 'application/json' }
}

async function api(h, method, path, body) {
  const res = await fetch(`${apiURL}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, ok: res.ok, data: await res.json().catch(() => null) }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const results = []
async function step(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log('✓', name)
  } catch (e) {
    results.push({ name, ok: false, error: e.message })
    console.log('✗', name, '-', e.message)
  }
}

const h = await login()
const cleanup = { projectId: null }

await step('seed project PRJ001 present', async () => {
  const list = (await api(h, 'GET', '/api/projects')).data
  assert(Array.isArray(list), 'expected array')
  const seed = list.find((p) => p.code === 'PRJ001')
  assert(seed, 'missing PRJ001')
  assert(['active', 'completed'].includes(seed.status), `PRJ001 status ${seed.status}`)
  assert(seed.tasks?.length > 0, 'PRJ001 should have tasks')
  assert(seed.manager?.name === '王五', 'manager should be E001')
})

await step('create project with tasks (planning)', async () => {
  const employees = (await api(h, 'GET', '/api/hr/employees')).data
  const mgr = employees.find((e) => e.employeeNo === 'E001')
  assert(mgr, 'missing E001')
  const created = await api(h, 'POST', '/api/projects', {
    code: 'PRJ-TEST-001',
    name: '测试项目',
    description: 'API 冒烟测试',
    managerId: mgr.id,
    budget: 100000,
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    tasks: [
      { name: '需求分析', assigneeId: mgr.id },
      { name: '开发实施', assigneeId: mgr.id },
    ],
  })
  assert(created.ok, created.data?.message || `create ${created.status}`)
  assert(created.data.status === 'planning', 'new project should be planning')
  assert(created.data.tasks?.length === 2, 'expected 2 tasks')
  cleanup.projectId = created.data.id
})

await step('duplicate project code rejected', async () => {
  const dup = await api(h, 'POST', '/api/projects', {
    code: 'PRJ-TEST-001',
    name: '重复编号',
  })
  assert(!dup.ok, 'expected duplicate code to fail')
})

await step('activate planning → active', async () => {
  const r = await api(h, 'POST', `/api/projects/${cleanup.projectId}/activate`)
  assert(r.ok && r.data.status === 'active', 'activate failed')
})

await step('activate non-planning rejected', async () => {
  const r = await api(h, 'POST', `/api/projects/${cleanup.projectId}/activate`)
  assert(r.status === 400, `expected 400 got ${r.status}`)
  assert(String(r.data?.message || '').includes('规划'), 'expected planning error')
})

await step('update project progress', async () => {
  const r = await api(h, 'PATCH', `/api/projects/${cleanup.projectId}`, { progress: 60 })
  assert(r.ok && r.data.progress === 60, 'update progress failed')
})

await step('complete active → completed', async () => {
  const r = await api(h, 'POST', `/api/projects/${cleanup.projectId}/complete`)
  assert(r.ok && r.data.status === 'completed', 'complete failed')
  assert(r.data.progress === 100, `progress ${r.data.progress} != 100`)
})

await step('get project by id', async () => {
  const r = await api(h, 'GET', `/api/projects/${cleanup.projectId}`)
  assert(r.ok && r.data.code === 'PRJ-TEST-001', 'get by id failed')
})

await step('procurement_clerk denied project access', async () => {
  const clerkH = await login('procurement_clerk', demoPassword)
  const r = await api(clerkH, 'GET', '/api/projects')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

await step('report:center can list projects (read-only)', async () => {
  const prodH = await login('production_manager', demoPassword)
  const r = await api(prodH, 'GET', '/api/projects')
  assert(r.ok, `production_manager list ${r.status}`)
  const create = await api(prodH, 'POST', '/api/projects', { code: 'PRJ-DENY', name: 'deny' })
  assert(create.status === 403, `expected create 403 got ${create.status}`)
})

if (cleanup.projectId) await api(h, 'DELETE', `/api/projects/${cleanup.projectId}`)

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
