/**
 * Node 并发压测（无需安装 k6）
 *
 * 用法:
 *   node tests/perf/load-smoke.mjs
 *   SCENARIO=full node tests/perf/load-smoke.mjs
 *
 * 环境:
 *   API_BASE, CONCURRENCY, DURATION_SEC
 *   PERF_USER, PERF_PASSWORD, PERF_TENANT (full 场景)
 */

const BASE = process.env.API_BASE || 'http://localhost:3000';
const CONCURRENCY = Number(process.env.CONCURRENCY || 20);
const DURATION_SEC = Number(process.env.DURATION_SEC || 15);
const SCENARIO = process.env.SCENARIO || (process.argv.includes('--full') ? 'full' : 'health');
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 8000);

const LOGIN_BODY = {
  username: process.env.PERF_USER || 'admin',
  password: process.env.PERF_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'change-me-admin',
  tenantCode: process.env.PERF_TENANT || 'default',
};

const READ_PATHS = [
  '/api/dashboard/stats',
  '/api/inventory/stock',
  '/api/inventory/alerts',
  '/api/procurement/orders',
  '/api/procurement/requests',
  '/api/sales/orders',
];

let total = 0;
let failed = 0;
const latencies = [];
let sharedToken = null;
let tokenExpiresAt = 0;
let tokenPromise = null;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchToken() {
  if (sharedToken && Date.now() < tokenExpiresAt) return sharedToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = (async () => {
    const res = await fetchWithTimeout(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(LOGIN_BODY),
    });
    if (!res.ok) throw new Error(`login failed: ${res.status}`);
    const data = await res.json();
    sharedToken = data.access_token;
    tokenExpiresAt = Date.now() + 10 * 60 * 1000;
    return sharedToken;
  })();
  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

async function oneHealthRequest() {
  const start = performance.now();
  try {
    const res = await fetchWithTimeout(`${BASE}/api/health`);
    if (!res.ok) failed += 1;
  } catch {
    failed += 1;
  } finally {
    latencies.push(performance.now() - start);
    total += 1;
  }
}

async function oneFullRequest() {
  const start = performance.now();
  try {
    const token = await fetchToken();
    const path = READ_PATHS[total % READ_PATHS.length];
    const res = await fetchWithTimeout(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) failed += 1;
  } catch {
    failed += 1;
  } finally {
    latencies.push(performance.now() - start);
    total += 1;
  }
}

const oneRequest = SCENARIO === 'full' ? oneFullRequest : oneHealthRequest;

async function worker(until) {
  while (Date.now() < until) {
    await oneRequest();
  }
}

const until = Date.now() + DURATION_SEC * 1000;
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(until)));

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
const avg = latencies.reduce((s, v) => s + v, 0) / (latencies.length || 1);

console.log(JSON.stringify({
  base: BASE,
  scenario: SCENARIO,
  concurrency: CONCURRENCY,
  durationSec: DURATION_SEC,
  total,
  failed,
  failRate: total ? (failed / total).toFixed(4) : 0,
  avgMs: avg.toFixed(1),
  p95Ms: p95.toFixed(1),
  paths: SCENARIO === 'full' ? READ_PATHS : ['/api/health'],
}, null, 2));

if (total && failed / total > 0.05) process.exit(1);
