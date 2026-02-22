import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const productListLatency = new Trend('product_list_latency');

export const options = {
  scenarios: {
    browse_catalog: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.01'],
    product_list_latency: ['p(95)<1500'],
  },
};

const BASE_URL = __ENV.API_ENDPOINT || 'https://api.epicweave.com';

export default function () {
  // Browse product catalog
  const listRes = http.get(`${BASE_URL}/products`, {
    tags: { name: 'GET /products' },
  });
  productListLatency.add(listRes.timings.duration);
  errorRate.add(listRes.status !== 200);
  check(listRes, {
    'product list status 200': (r) => r.status === 200,
    'product list has items': (r) => JSON.parse(r.body).products?.length > 0,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 2 + 1);

  // Filter by mythology
  const filterRes = http.get(`${BASE_URL}/products?mythology=hindu`, {
    tags: { name: 'GET /products?mythology' },
  });
  errorRate.add(filterRes.status !== 200);
  check(filterRes, {
    'filter status 200': (r) => r.status === 200,
    'filter response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 2 + 1);

  // View product detail
  const detailRes = http.get(`${BASE_URL}/products/PROD001`, {
    tags: { name: 'GET /products/:id' },
  });
  errorRate.add(detailRes.status !== 200);
  check(detailRes, {
    'detail status 200': (r) => r.status === 200,
    'detail response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 3 + 1);
}
