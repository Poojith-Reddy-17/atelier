const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-test-'));
process.env.DATABASE_FILE = path.join(dir, 'test.sqlite');
process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough';
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const agent = request.agent(app);

before(async () => {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('AdminPassword123!', 4);
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('Test Admin','admin@test.example',?,'admin')").run(hash);
});
after(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('health endpoint responds', async () => {
  const res = await request(app).get('/api/health').expect(200);
  assert.equal(res.body.status, 'ok');
});
test('product catalog returns seeded products and prices', async () => {
  const res = await request(app).get('/api/products').expect(200);
  assert.ok(res.body.length >= 5);
  assert.ok(res.body.every(p => typeof p.price === 'number' && p.price >= 0));
});
test('registration validates password length', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'Test Buyer', email: 'buyer@test.example', password: 'short' }).expect(400);
  assert.match(res.body.error, /10 characters/);
});
test('customer can register and place a COD order using server-side prices', async () => {
  await agent.post('/api/auth/register').send({ name: 'Test Buyer', email: 'buyer@test.example', password: 'StrongPassword123!' }).expect(201);
  const products = (await request(app).get('/api/products').expect(200)).body;
  const product = products[0];
  const orderRes = await agent.post('/api/orders').send({
    customerName: 'Test Buyer', email: 'buyer@test.example', address: '12 Test Street', city: 'Puttur', postalCode: '517583', paymentMethod: 'cash_on_delivery', items: [{ productId: product.id, quantity: 1 }]
  }).expect(201);
  assert.equal(orderRes.body.order.total, product.price);
  const orders = await agent.get('/api/orders').expect(200);
  assert.equal(orders.body.length, 1);
  assert.equal(orders.body[0].items[0].name, product.name);
});
test('non-admin cannot access admin endpoint', async () => {
  await agent.get('/api/admin/orders').expect(403);
});
test('admin can sign in and add a product', async () => {
  const adminAgent = request.agent(app);
  await adminAgent.post('/api/auth/login').send({ email: 'admin@test.example', password: 'AdminPassword123!' }).expect(200);
  const res = await adminAgent.post('/api/admin/products').send({ name: 'Test Product', category: 'Test', description: 'A product for testing.', price: 12.5, imageUrl: 'https://example.com/image.jpg', stock: 5 }).expect(201);
  assert.equal(res.body.name, 'Test Product');
  assert.equal(res.body.price, 12.5);
});
