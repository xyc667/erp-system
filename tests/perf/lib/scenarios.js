import http from 'k6/http';
import { check } from 'k6';

export const DEFAULT_LOGIN = {
  username: __ENV.PERF_USER || 'admin',
  password: __ENV.PERF_PASSWORD || __ENV.SEED_ADMIN_PASSWORD || 'change-me-admin',
  tenantCode: __ENV.PERF_TENANT || 'default',
};

/** Read-only API endpoints exercised under admin credentials */
export const READ_ENDPOINTS = [
  { name: 'dashboard_stats', path: '/api/dashboard/stats', tags: { group: 'report' } },
  { name: 'inventory_stock', path: '/api/inventory/stock', tags: { group: 'inventory' } },
  { name: 'inventory_movements', path: '/api/inventory/movements', tags: { group: 'inventory' } },
  { name: 'inventory_alerts', path: '/api/inventory/alerts', tags: { group: 'inventory' } },
  { name: 'inventory_products', path: '/api/inventory/products', tags: { group: 'inventory' } },
  { name: 'procurement_requests', path: '/api/procurement/requests', tags: { group: 'procurement' } },
  { name: 'procurement_orders', path: '/api/procurement/orders', tags: { group: 'procurement' } },
  { name: 'procurement_vendors', path: '/api/procurement/vendors', tags: { group: 'procurement' } },
  { name: 'sales_orders', path: '/api/sales/orders', tags: { group: 'sales' } },
  { name: 'notifications', path: '/api/notifications', tags: { group: 'system' } },
];

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function checkHealth(base) {
  const res = http.get(`${base}/api/health`, { tags: { name: 'health' } });
  check(res, { 'health 200': (r) => r.status === 200 });
  return res;
}

export function login(base, credentials = DEFAULT_LOGIN) {
  const res = http.post(
    `${base}/api/auth/login`,
    JSON.stringify(credentials),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_login' } },
  );
  const ok = check(res, { 'login ok': (r) => r.status === 200 || r.status === 201 });
  if (!ok) return null;
  const body = res.json();
  return body.access_token || null;
}

/**
 * @param {string} base
 * @param {string} token
 * @param {{ names?: string[], parallel?: boolean }} opts
 */
export function runReadApis(base, token, opts = {}) {
  const { parallel = false } = opts;
  const names = opts.names;
  const endpoints = names
    ? READ_ENDPOINTS.filter((e) => names.includes(e.name))
    : READ_ENDPOINTS;

  if (parallel) {
    const batchReqs = endpoints.map((e) => [
      'GET',
      `${base}${e.path}`,
      null,
      { headers: authHeaders(token), tags: { name: e.name, ...e.tags } },
    ]);
    const responses = http.batch(batchReqs);
    endpoints.forEach((e, i) => {
      check(responses[i], { [`${e.name} 200`]: (r) => r.status === 200 });
    });
    return responses;
  }

  const responses = [];
  for (const e of endpoints) {
    const res = http.get(`${base}${e.path}`, {
      headers: authHeaders(token),
      tags: { name: e.name, ...e.tags },
    });
    check(res, { [`${e.name} 200`]: (r) => r.status === 200 });
    responses.push(res);
  }
  return responses;
}

/** CI subset — covers each domain without every endpoint */
export const CI_READ_NAMES = [
  'dashboard_stats',
  'inventory_stock',
  'inventory_alerts',
  'procurement_orders',
  'procurement_requests',
  'sales_orders',
];
