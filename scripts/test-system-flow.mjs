/**
 * System management smoke test — users, roles, config, audit, tenants, integration, files, leads import.
 * Usage: node scripts/test-system-flow.mjs
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
const cleanup = { userId: null, roleId: null, tenantCode: null, configId: null, dictId: null, dictItemId: null }

await step('users list + seed admin present', async () => {
  const r = await api(h, 'GET', '/api/users')
  assert(r.ok && Array.isArray(r.data), 'users list failed')
  assert(r.data.some((u) => u.username === 'admin'), 'admin user missing')
})

await step('create + update + delete test user', async () => {
  const roles = (await api(h, 'GET', '/api/roles')).data
  const role = roles.find((r) => r.name === '普通员工') || roles[0]
  assert(role, 'no role for test user')
  const created = await api(h, 'POST', '/api/users', {
    username: 'sys_test_user',
    password: 'Test1234!',
    name: '系统测试用户',
    email: 'sys-test@erp.com',
    roleId: role.id,
  })
  assert(created.ok, created.data?.message || `create user ${created.status}`)
  cleanup.userId = created.data.id

  const upd = await api(h, 'PATCH', `/api/users/${cleanup.userId}`, { name: '系统测试用户-改' })
  assert(upd.ok && upd.data.name.includes('改'), 'update user failed')

  const dup = await api(h, 'POST', '/api/users', {
    username: 'sys_test_user',
    password: 'x',
    name: 'dup',
    roleId: role.id,
  })
  assert(!dup.ok, 'duplicate username should fail')
})

await step('roles list + permissions assign', async () => {
  const roles = (await api(h, 'GET', '/api/roles')).data
  assert(roles.length > 0, 'no roles')
  const perms = (await api(h, 'GET', '/api/permissions')).data
  assert(perms.length > 0, 'no permissions')

  const created = await api(h, 'POST', '/api/roles', {
    name: 'SYS-TEST-ROLE',
    description: '系统测试角色',
  })
  assert(created.ok, created.data?.message || 'create role failed')
  cleanup.roleId = created.data.id

  const assign = await api(h, 'POST', `/api/roles/${cleanup.roleId}/permissions`, {
    permissionIds: [perms[0].id, perms[1].id],
  })
  assert(assign.ok, 'assign permissions failed')
  const detail = (await api(h, 'GET', `/api/roles/${cleanup.roleId}`)).data
  assert(detail.rolePermissions?.length >= 2, 'permissions not assigned')
})

await step('system config list + CRUD', async () => {
  const list = (await api(h, 'GET', '/api/system/config')).data
  assert(Array.isArray(list) && list.some((c) => c.key === 'company.name'), 'seed config missing')

  const created = await api(h, 'POST', '/api/system/config', {
    key: 'test.manual.key',
    value: 'demo',
    description: '手册测试',
    group: 'test',
  })
  assert(created.ok, created.data?.message || 'create config failed')
  cleanup.configId = created.data.id

  const upd = await api(h, 'PATCH', `/api/system/config/${cleanup.configId}`, { value: 'demo2' })
  assert(upd.ok && upd.data.value === 'demo2', 'update config failed')
})

await step('dictionary list + item add', async () => {
  const dicts = (await api(h, 'GET', '/api/system/dictionaries')).data
  assert(dicts.some((d) => d.code === 'order_status'), 'order_status dict missing')

  const created = await api(h, 'POST', '/api/system/dictionaries', {
    code: 'sys_test_dict',
    name: '测试字典',
  })
  assert(created.ok, created.data?.message || 'create dict failed')
  cleanup.dictId = created.data.id

  const item = await api(h, 'POST', `/api/system/dictionaries/${cleanup.dictId}/items`, {
    label: '测试项',
    value: 'test_val',
    sortOrder: 1,
  })
  assert(item.ok, item.data?.message || 'add dict item failed')
  cleanup.dictItemId = item.data.id
})

await step('audit logs list + category filter', async () => {
  const all = await api(h, 'GET', '/api/system/audit-logs')
  assert(all.ok && Array.isArray(all.data.items ?? all.data), 'audit logs failed')
  const items = all.data.items ?? all.data
  assert(items.length > 0, 'no audit logs')

  const auth = await api(h, 'GET', '/api/system/audit-logs?category=auth')
  assert(auth.ok, 'auth filter failed')
  const authItems = auth.data.items ?? auth.data
  assert(authItems.every((l) => l.category === 'auth'), 'auth filter incorrect')
})

await step('tenants public + admin create', async () => {
  const pub = await fetch(`${apiURL}/api/system/tenants/public`)
  const pubData = await pub.json()
  assert(pub.ok && pubData.some((t) => t.code === 'default'), 'public tenants missing default')

  cleanup.tenantCode = `T-SYS-${Date.now().toString(36).slice(-6)}`
  const created = await api(h, 'POST', '/api/system/tenants', {
    code: cleanup.tenantCode,
    name: '测试租户',
  })
  assert(created.ok, created.data?.message || `create tenant ${created.status}`)
})

await step('integration export APIs', async () => {
  const master = await api(h, 'GET', '/api/integration/master-data')
  assert(master.ok && master.data.products?.length > 0, 'master-data failed')
  const orders = await api(h, 'GET', '/api/integration/orders?type=sales')
  assert(orders.ok && Array.isArray(orders.data.salesOrders), 'orders export failed')
  const inv = await api(h, 'GET', '/api/integration/inventory')
  assert(inv.ok && Array.isArray(inv.data.inventory), 'inventory export failed')
})

await step('files list API', async () => {
  const r = await api(h, 'GET', '/api/files')
  assert(r.ok && Array.isArray(r.data), `files list ${r.status}`)
})

await step('leads import API', async () => {
  const r = await api(h, 'POST', '/api/leads/import', {
    items: [
      {
        name: '系统测试线索',
        phone: '13900009999',
        source: 'manual_test',
        address: '测试地址',
      },
    ],
  })
  assert(r.ok, r.data?.message || `import ${r.status}`)
  assert(r.data.created >= 1 || r.data.skipped >= 0, 'import response shape')
})

await step('employee denied system config', async () => {
  const empH = await login('employee', demoPassword)
  const r = await api(empH, 'GET', '/api/system/config')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

await step('employee denied role management', async () => {
  const empH = await login('employee', demoPassword)
  const r = await api(empH, 'GET', '/api/roles')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

await step('employee denied audit logs', async () => {
  const empH = await login('employee', demoPassword)
  const r = await api(empH, 'GET', '/api/system/audit-logs')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

// cleanup
if (cleanup.userId) await api(h, 'DELETE', `/api/users/${cleanup.userId}`)
if (cleanup.roleId) await api(h, 'DELETE', `/api/roles/${cleanup.roleId}`)
if (cleanup.configId) await api(h, 'DELETE', `/api/system/config/${cleanup.configId}`)
if (cleanup.dictItemId) await api(h, 'DELETE', `/api/system/dictionary-items/${cleanup.dictItemId}`)
if (cleanup.dictId) await api(h, 'DELETE', `/api/system/dictionaries/${cleanup.dictId}`)

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
