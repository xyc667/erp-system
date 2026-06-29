import { sleep } from 'k6';
import { checkHealth, login, runReadApis } from './lib/scenarios.js';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
    'http_req_duration{group:inventory}': ['p(95)<900'],
    'http_req_duration{group:procurement}': ['p(95)<900'],
    'http_req_duration{group:sales}': ['p(95)<900'],
  },
};

const BASE = __ENV.API_BASE || 'http://localhost:3000';

export default function () {
  checkHealth(BASE);

  const token = login(BASE);
  if (!token) {
    sleep(0.3);
    return;
  }

  // Sequential read APIs — clearer per-endpoint metrics
  runReadApis(BASE, token);
  sleep(0.3);
}
