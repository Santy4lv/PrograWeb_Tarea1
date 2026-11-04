import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const successfulRequests = new Counter('successful_requests');
const failureRate = new Rate('failure_rate');
const pageLatency = new Trend('page_latency');

const BASE_URL = __ENV.TARGET_URL || 'http://alb-pokeapi-930605592.us-east-1.elb.amazonaws.com';

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp-up to 20 concurrent VUs
    { duration: '30s', target: 50 },  // Sustained load with 50 VUs
    { duration: '20s', target: 100 }, // Peak stress spike to 100 VUs
    { duration: '15s', target: 0 },   // Graceful cool-down
  ],
  thresholds: {
    // 95% of HTTP requests must complete within 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate must remain strictly below 1%
    http_req_failed: ['rate<0.01'],
    failure_rate: ['rate<0.01'],
  },
};

export default function () {
  // 1. Request main HTML
  const res = http.get(BASE_URL);

  const isOk = check(res, {
    'status is 200': (r) => r.status === 200,
    'page contains Pokédex title': (r) => r.body && r.body.includes('POKÉDEX ARCHIVES'),
  });

  if (isOk) {
    successfulRequests.add(1);
    failureRate.add(0);
  } else {
    failureRate.add(1);
  }

  pageLatency.add(res.timings.duration);

  // Simulate realistic user browsing pause (100ms - 500ms)
  sleep(0.3);
}

