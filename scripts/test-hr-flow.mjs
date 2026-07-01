/**
 * HR module smoke test — full API lifecycle.
 * Usage: node scripts/test-hr-flow.mjs
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
const cleanup = { employeeId: null, deptId: null, posId: null, attendanceIds: [], salaryId: null, perfId: null }

await step('seed master data present', async () => {
  const [depts, positions, employees] = await Promise.all([
    api(h, 'GET', '/api/hr/departments'),
    api(h, 'GET', '/api/hr/positions'),
    api(h, 'GET', '/api/hr/employees'),
  ])
  assert(depts.ok, `departments ${depts.status}`)
  assert(positions.ok, `positions ${positions.status}`)
  assert(employees.ok, `employees ${employees.status}`)
  assert(depts.data.some((d) => d.code === 'D001'), 'missing D001')
  assert(positions.data.some((p) => p.code === 'P-MGR'), 'missing P-MGR')
  assert(employees.data.some((e) => e.employeeNo === 'E001'), 'missing E001')
})

await step('create department + position', async () => {
  const dept = await api(h, 'POST', '/api/hr/departments', {
    code: 'D-HR-TEST',
    name: '测试人事部',
  })
  assert(dept.ok, dept.data?.message || `dept ${dept.status}`)
  cleanup.deptId = dept.data.id

  const pos = await api(h, 'POST', '/api/hr/positions', {
    code: 'P-HR-TEST',
    name: '测试专员',
    description: 'HR test role',
  })
  assert(pos.ok, pos.data?.message || `pos ${pos.status}`)
  cleanup.posId = pos.data.id
})

await step('create + update employee', async () => {
  const emp = await api(h, 'POST', '/api/hr/employees', {
    employeeNo: 'E-HR-TEST',
    name: '测试员工',
    departmentId: cleanup.deptId,
    positionId: cleanup.posId,
    email: 'hr-test@erp.com',
    phone: '13800001111',
    hireDate: '2026-01-01',
  })
  assert(emp.ok, emp.data?.message || `emp ${emp.status}`)
  cleanup.employeeId = emp.data.id

  const upd = await api(h, 'PATCH', `/api/hr/employees/${cleanup.employeeId}`, {
    phone: '13800002222',
  })
  assert(upd.ok && upd.data.phone === '13800002222', 'update employee failed')
})

await step('duplicate employeeNo rejected', async () => {
  const dup = await api(h, 'POST', '/api/hr/employees', {
    employeeNo: 'E-HR-TEST',
    name: '重复工号',
  })
  assert(!dup.ok, 'expected duplicate employeeNo to fail')
})

await step('attendance present + checkout', async () => {
  const att = await api(h, 'POST', '/api/hr/attendance', {
    employeeId: cleanup.employeeId,
    date: '2026-06-30',
    status: 'present',
    remark: 'API test check-in',
  })
  assert(att.ok, att.data?.message || `attendance ${att.status}`)
  assert(att.data.checkIn, 'checkIn should be set for present')
  cleanup.attendanceIds.push(att.data.id)

  const out = await api(h, 'POST', `/api/hr/attendance/${att.data.id}/checkout`)
  assert(out.ok && out.data.checkOut, 'checkout failed')
})

await step('attendance leave record', async () => {
  const leave = await api(h, 'POST', '/api/hr/attendance', {
    employeeId: cleanup.employeeId,
    date: '2026-06-29',
    status: 'leave',
    remark: '年假',
  })
  assert(leave.ok, leave.data?.message || `leave ${leave.status}`)
  assert(!leave.data.checkIn, 'leave should not auto check-in')
  cleanup.attendanceIds.push(leave.data.id)
})

await step('salary create + pay + net calculation', async () => {
  const sal = await api(h, 'POST', '/api/hr/salary', {
    employeeId: cleanup.employeeId,
    yearMonth: '2026-06',
    baseSalary: 8000,
    bonus: 1000,
    deduction: 500,
  })
  assert(sal.ok, sal.data?.message || `salary ${sal.status}`)
  assert(Number(sal.data.netSalary) === 8500, `net ${sal.data.netSalary} != 8500`)
  assert(sal.data.status === 'draft', 'initial status should be draft')
  cleanup.salaryId = sal.data.id

  const paid = await api(h, 'POST', `/api/hr/salary/${cleanup.salaryId}/pay`)
  assert(paid.ok && paid.data.status === 'paid', 'pay salary failed')
})

await step('performance review + auto grade', async () => {
  const perf = await api(h, 'POST', '/api/hr/performance', {
    employeeId: cleanup.employeeId,
    period: '2026-Q2',
    score: 85,
    comment: '表现良好',
  })
  assert(perf.ok, perf.data?.message || `perf ${perf.status}`)
  assert(perf.data.grade === 'B', `grade ${perf.data.grade} != B`)
  assert(perf.data.reviewer?.name, 'reviewer missing')
  cleanup.perfId = perf.data.id
})

await step('employee role denied HR access', async () => {
  const empH = await login('employee', demoPassword)
  const r = await api(empH, 'GET', '/api/hr/employees')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

await step('hr_clerk role can access HR', async () => {
  const hrH = await login('hr_clerk', demoPassword)
  const r = await api(hrH, 'GET', '/api/hr/employees')
  assert(r.ok, `hr_clerk employees ${r.status}`)
})

// cleanup test data
if (cleanup.perfId) await api(h, 'DELETE', `/api/hr/performance/${cleanup.perfId}`)
if (cleanup.salaryId) await api(h, 'DELETE', `/api/hr/salary/${cleanup.salaryId}`)
for (const id of cleanup.attendanceIds) await api(h, 'DELETE', `/api/hr/attendance/${id}`)
if (cleanup.employeeId) await api(h, 'DELETE', `/api/hr/employees/${cleanup.employeeId}`)
if (cleanup.posId) await api(h, 'DELETE', `/api/hr/positions/${cleanup.posId}`)
if (cleanup.deptId) await api(h, 'DELETE', `/api/hr/departments/${cleanup.deptId}`)

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
