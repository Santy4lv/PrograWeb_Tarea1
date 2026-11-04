import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const successfulRequests = new Counter('successful_requests');
const failureRate = new Rate('failure_rate');
const apiLatency = new Trend('api_latency');

const BASE_URL = __ENV.TARGET_URL || 'http://alb-monsters-2121642145.us-east-1.elb.amazonaws.com';

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp-up to 20 concurrent VUs
    { duration: '30s', target: 50 },  // Sustained load with 50 VUs
    { duration: '20s', target: 100 }, // Peak stress spike to 100 VUs
    { duration: '15s', target: 0 },   // Graceful cool-down
  ],
  thresholds: {
    // 95% of API requests must complete within 800ms
    http_req_duration: ['p(95)<800'],
    // Error rate must remain strictly below 1%
    http_req_failed: ['rate<0.01'],
    failure_rate: ['rate<0.01'],
  },
};

export default function () {
  // 1. Request main HTML
  const pageRes = http.get(BASE_URL);
  check(pageRes, {
    'page status is 200': (r) => r.status === 200,
    'page contains Umbrella title': (r) => r.body && r.body.includes('UMBRELLA ARCHIVES'),
  });

  sleep(0.2);

  // 2. Query REST API endpoint (/api/monsters)
  const apiRes = http.get(`${BASE_URL}/api/monsters`);
  const isOk = check(apiRes, {
    'api status is 200': (r) => r.status === 200,
    'api returns json array': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('json'),
  });

  if (isOk) {
    successfulRequests.add(1);
    failureRate.add(0);
  } else {
    failureRate.add(1);
  }

  apiLatency.add(apiRes.timings.duration);

  sleep(0.3);
}

