import { sleep } from 'k6';
import { checkHealth, login, runReadApis, CI_READ_NAMES } from './lib/scenarios.js';

/** Lighter profile for CI — short duration, modest concurrency */
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.10'],
    'http_req_duration{group:inventory}': ['p(95)<1800'],
    'http_req_duration{group:procurement}': ['p(95)<1800'],
  },
};

const BASE = __ENV.API_BASE || 'http://localhost:3000';

export default function () {
  checkHealth(BASE);

  const token = login(BASE);
  if (!token) {
    sleep(0.2);
    return;
  }

  // Parallel batch keeps CI fast while hitting inventory + procurement + sales
  runReadApis(BASE, token, { names: CI_READ_NAMES, parallel: true });
  sleep(0.2);
}
