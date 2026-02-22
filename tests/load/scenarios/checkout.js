import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const checkoutLatency = new Trend('checkout_latency');
const ordersCreated = new Counter('orders_created');

export const options = {
  scenarios: {
    checkout_flow: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    errors: ['rate<0.01'],
    checkout_latency: ['p(95)<5000'],
    orders_created: ['count>0'],
  },
};

const BASE_URL = __ENV.API_ENDPOINT || 'https://api.epicweave.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

export default function () {
  group('Checkout Flow', function () {
    // Step 1: Add item to cart
    const addRes = http.post(`${BASE_URL}/cart/items`, JSON.stringify({
      productId: 'PROD001',
      variantId: 'VAR001-L-NAVY',
      size: 'L',
      color: 'Navy',
      quantity: 1,
      type: 'pre-designed',
    }), { headers, tags: { name: 'POST /cart/items' } });
    errorRate.add(addRes.status !== 201 && addRes.status !== 200);

    sleep(0.5);

    // Step 2: Get cart
    const cartRes = http.get(`${BASE_URL}/cart`, {
      headers,
      tags: { name: 'GET /cart' },
    });
    errorRate.add(cartRes.status !== 200);

    sleep(0.5);

    // Step 3: Create order (checkout)
    const orderStart = Date.now();
    const orderRes = http.post(`${BASE_URL}/orders`, JSON.stringify({
      shippingAddress: {
        street: '123 Test St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      paymentMethodId: 'pm_test_visa',
    }), { headers, tags: { name: 'POST /orders' } });

    const orderDuration = Date.now() - orderStart;
    checkoutLatency.add(orderDuration);
    errorRate.add(orderRes.status !== 201 && orderRes.status !== 200);

    if (orderRes.status === 201 || orderRes.status === 200) {
      ordersCreated.add(1);
    }

    check(orderRes, {
      'order created': (r) => r.status === 201 || r.status === 200,
      'checkout < 5s': () => orderDuration < 5000,
      'has orderId': (r) => {
        try { return JSON.parse(r.body).orderId !== undefined; }
        catch { return false; }
      },
    });
  });

  sleep(1);
}
