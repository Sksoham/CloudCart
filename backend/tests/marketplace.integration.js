// Isolated integration checks: never connects to the demo database.
// Run: node tests/marketplace.integration.js (from backend).
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('node:path');
const { once } = require('node:events');
const { existsSync } = require('node:fs');

(async () => {
  let mongo, server;
  const port = 15051;
  let serverLog = '';
  try {
    const cachedBinary = path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-6.0.14.exe');
    const binary = existsSync(cachedBinary) ? { systemBinary: cachedBinary, version: '6.0.14' } : { version: '7.0.14' };
    mongo = await MongoMemoryServer.create({ binary });
    const uri = mongo.getUri('cloudcart_marketplace_integration');
    server = spawn(process.execPath, ['server.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, MONGO_URI: uri, PORT: String(port), NODE_ENV: 'test', JWT_SECRET: 'isolated-marketplace-integration-only', RATE_LIMIT_MAX_REQUESTS: '1000' }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.on('error', e => { serverLog += e.stack; });
    server.stdout.on('data', d => { serverLog += d; }); server.stderr.on('data', d => { serverLog += d; });
    const api = async (method, endpoint, token, body, expected = 200) => {
      const response = await fetch(`http://127.0.0.1:${port}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${endpoint}: ${JSON.stringify(data)}`);
      return data;
    };
    let ready = false;
    for (let i = 0; i < 480; i++) {
      try { const r = await fetch(`http://127.0.0.1:${port}/api/health`); if (r.ok) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    assert(ready, 'Test API did not start');
    const register = async (name, role = 'user') => api('POST', '/auth/register', null, { name, email: `${name}@example.com`, password: 'TestOnly@1234', role }, 201);
    const [seller, otherSeller, buyer, otherBuyer] = await Promise.all([register('SellerOne'), register('SellerTwo'), register('BuyerOne', 'admin'), register('BuyerTwo')]);
    assert.equal(buyer.user.role, 'user', 'Cannot self-register as administrator');
    const shopData = { name: 'Test local shop', description: 'Integration fixture', address: 'Test address', area: 'Kothrud', city: 'Pune', phone: '0000000000', hours: '9 am to 6 pm' };
    const shop = (await api('PUT', '/shops/mine', seller.token, shopData)).shop;
    await api('PUT', '/shops/mine', otherSeller.token, { ...shopData, name: 'Other shop', area: 'Baner' });
    const productData = { title: 'Test basket', description: 'Test product', image: 'https://example.com/product.jpg', category: 'Grocery', price: 100, stock: 10 };
    await api('POST', '/products', buyer.token, productData, 403);
    const product = (await api('POST', '/products', seller.token, productData, 201)).product;
    const foreign = (await api('POST', '/products', otherSeller.token, { ...productData, title: 'Other product' }, 201)).product;
    await api('PUT', `/products/${product._id}`, otherSeller.token, { price: 1 }, 403);
    await api('DELETE', `/products/${product._id}`, otherSeller.token, null, 403);
    await api('PUT', `/products/${product._id}`, seller.token, { stock: 1.5 }, 400);
    await api('PUT', `/products/${product._id}`, seller.token, { discountPrice: 75 });
    const filtered = await api('GET', '/products?area=Kothrud&maxPrice=80&sort=price_asc');
    assert.equal(filtered.products.length, 1); assert.equal(filtered.products[0].shop._id, shop._id);
    await api('POST', '/cart', buyer.token, { productId: product._id, quantity: 1.5 }, 400);
    await api('POST', '/cart', buyer.token, { productId: product._id, quantity: 2 });
    await api('POST', '/cart', buyer.token, { productId: foreign._id, quantity: 1 }, 409);
    // Checkout re-reads seller prices and never trusts a claimed paid status.
    await api('PUT', `/products/${product._id}`, seller.token, { discountPrice: 65 });
    const pickup = { customerName: 'Test Customer', customerPhone: '0000000000', requestedDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), note: 'Integration check', paymentStatus: 'Paid', totalPrice: 1 };
    const order = (await api('POST', '/orders', buyer.token, pickup, 201)).order;
    assert.equal(order.totalPrice, 130); assert.equal(order.paymentStatus, 'Pending'); assert.equal(order.shippingPrice, 0);
    assert.equal((await api('GET', `/products/${product._id}`)).product.stock, 8);
    assert.equal((await api('GET', '/cart', buyer.token)).cart.items.length, 0);
    await api('POST', '/orders', buyer.token, pickup, 409);
    await api('GET', `/orders/${order._id}`, otherBuyer.token, null, 403);
    await api('PUT', `/orders/${order._id}/status`, otherSeller.token, { orderStatus: 'Confirmed' }, 403);
    await api('PUT', `/orders/${order._id}/status`, buyer.token, { orderStatus: 'Confirmed' }, 403);
    const sellerOrders = (await api('GET', '/shops/mine/orders', seller.token)).orders;
    assert.equal(sellerOrders[0].pickup.code, undefined, 'Seller must obtain the pickup code from customer');
    await api('PUT', `/orders/${order._id}/status`, seller.token, { orderStatus: 'Confirmed' });
    await api('PUT', `/orders/${order._id}/status`, seller.token, { orderStatus: 'Ready for pickup' });
    await api('PUT', `/orders/${order._id}/status`, seller.token, { orderStatus: 'Collected', pickupCode: 'wrong' }, 400);
    const collected = (await api('PUT', `/orders/${order._id}/status`, seller.token, { orderStatus: 'Collected', pickupCode: order.pickup.code })).order;
    assert.equal(collected.paymentStatus, 'Paid');
    await api('PUT', `/orders/${order._id}/status`, seller.token, { orderStatus: 'Cancelled' }, 409);
    await api('POST', '/cart', buyer.token, { productId: product._id, quantity: 1 });
    const cancelled = (await api('POST', '/orders', buyer.token, pickup, 201)).order;
    await api('PUT', `/orders/${cancelled._id}/status`, buyer.token, { orderStatus: 'Cancelled' });
    await api('PUT', `/orders/${cancelled._id}/status`, seller.token, { orderStatus: 'Cancelled' }, 409);
    assert.equal((await api('GET', `/products/${product._id}`)).product.stock, 8, 'Cancellation restores stock once');
    // Last-unit contention: only one customer can reserve it.
    await api('PUT', `/products/${product._id}`, seller.token, { stock: 1 });
    await api('POST', '/cart', buyer.token, { productId: product._id, quantity: 1 });
    await api('POST', '/cart', otherBuyer.token, { productId: product._id, quantity: 1 });
    const attempts = await Promise.all([buyer, otherBuyer].map(b => fetch(`http://127.0.0.1:${port}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${b.token}` }, body: JSON.stringify(pickup) })));
    assert.deepEqual(attempts.map(r => r.status).sort(), [201, 409]);
    assert.equal((await api('GET', `/products/${product._id}`)).product.stock, 0);
    console.log('PASS: seller onboarding, product ownership, discovery filters, single-shop basket, current pricing, payment integrity, pickup lifecycle, privacy, cancellation and concurrent stock reservation.');
  } catch (e) {
    console.error(e); console.error(serverLog.slice(-4000)); process.exitCode = 1;
  } finally {
    if (server) { const exited = once(server, 'exit'); server.kill(); await exited; }
    if (mongo) await mongo.stop();
  }
})();
