require('dotenv').config();
const express = require('express');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('In production, SESSION_SECRET must be set to at least 32 characters.');
}
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.dirname(path.resolve(process.env.DATABASE_FILE || './data/shop.sqlite')) }),
  name: 'atelier.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(express.static(path.join(__dirname, '..', 'public')));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } });
const safeUser = user => user && ({ id: user.id, name: user.name, email: user.email, role: user.role });
const requireAuth = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: 'Please sign in to continue.' });
const requireAdmin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please sign in.' });
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  req.user = user; next();
};
const productShape = row => ({ ...row, price: row.price_cents / 100, price_cents: undefined, active: Boolean(row.active) });

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/products', (req, res) => {
  const { category, q } = req.query;
  let sql = 'SELECT * FROM products WHERE active = 1'; const params = [];
  if (category && category !== 'All') { sql += ' AND category = ?'; params.push(String(category).slice(0, 60)); }
  if (q) { sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)'; const term = `%${String(q).slice(0, 80)}%`; params.push(term, term, term); }
  sql += ' ORDER BY id';
  res.json(db.prepare(sql).all(...params).map(productShape));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.session.userId);
  if (!user) { req.session.destroy(() => {}); return res.json({ user: null }); }
  res.json({ user: safeUser(user) });
});
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 10 || password.length > 100) return res.status(400).json({ error: 'Password must be at least 10 characters.' });
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const hash = await bcrypt.hash(password, 12);
  try {
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
    req.session.userId = result.lastInsertRowid;
    res.status(201).json({ user: { id: Number(result.lastInsertRowid), name, email, role: 'customer' } });
  } catch (error) { res.status(500).json({ error: 'Could not create account.' }); }
});
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Could not start a session.' });
    req.session.userId = user.id;
    req.session.save(saveErr => saveErr ? res.status(500).json({ error: 'Could not save session.' }) : res.json({ user: safeUser(user) }));
  });
});
app.post('/api/auth/logout', (req, res) => req.session.destroy(err => {
  res.clearCookie('atelier.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  if (err) return res.status(500).json({ error: 'Could not sign out.' });
  res.json({ ok: true });
}));

app.post('/api/orders', requireAuth, (req, res) => {
  const { items, customerName, email, address, city, postalCode, paymentMethod } = req.body || {};
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) return res.status(400).json({ error: 'Your cart is empty or contains too many items.' });
  if (![customerName, email, address, city, postalCode].every(v => typeof v === 'string' && v.trim().length > 0) || customerName.length > 100 || email.length > 160 || address.length > 300 || city.length > 100 || postalCode.length > 20) return res.status(400).json({ error: 'Please complete all shipping details.' });
  if (paymentMethod !== 'cash_on_delivery') return res.status(400).json({ error: 'This demo supports cash on delivery only.' });
  const quantities = new Map();
  for (const item of items) {
    const id = Number(item.productId); const qty = Number(item.quantity);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ error: 'Invalid cart item.' });
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }
  const createOrder = db.transaction(() => {
    let total = 0; const rows = [];
    for (const [id, qty] of quantities) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id);
      if (!product) throw new Error('A product in your cart is no longer available.');
      if (qty > product.stock) throw new Error(`${product.name} does not have enough stock.`);
      total += product.price_cents * qty; rows.push({ product, qty });
    }
    const result = db.prepare(`INSERT INTO orders (user_id, customer_name, email, address, city, postal_code, payment_method, total_cents)
      VALUES (?, ?, ?, ?, ?, ?, 'cash_on_delivery', ?)`).run(req.session.userId, customerName.trim(), email.trim(), address.trim(), city.trim(), postalCode.trim(), total);
    const itemInsert = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)');
    const stockUpdate = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    for (const { product, qty } of rows) { itemInsert.run(result.lastInsertRowid, product.id, product.name, product.price_cents, qty); stockUpdate.run(qty, product.id); }
    return { id: Number(result.lastInsertRowid), total: total / 100 };
  });
  try { res.status(201).json({ order: createOrder() }); }
  catch (error) { res.status(400).json({ error: error.message || 'Could not place order.' }); }
});
app.get('/api/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.session.userId);
  const itemQuery = db.prepare('SELECT product_name AS name, unit_price_cents / 100.0 AS price, quantity FROM order_items WHERE order_id = ?');
  res.json(orders.map(o => ({ ...o, total: o.total_cents / 100, items: itemQuery.all(o.id) })));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, category, description, price, imageUrl, stock = 10, badge = '' } = req.body || {};
  if (![name, category, description, imageUrl].every(v => typeof v === 'string' && v.trim()) || name.length > 120 || category.length > 60 || description.length > 1000) return res.status(400).json({ error: 'Please provide valid product details.' });
  const priceCents = Math.round(Number(price) * 100);
  if (!Number.isSafeInteger(priceCents) || priceCents < 0 || priceCents > 100000000 || !Number.isInteger(Number(stock)) || Number(stock) < 0 || Number(stock) > 100000) return res.status(400).json({ error: 'Price or stock is invalid.' });
  if (!/^https:\/\//i.test(imageUrl) && !/^\/images\//i.test(imageUrl)) return res.status(400).json({ error: 'Image URL must use HTTPS or a local /images path.' });
  const result = db.prepare('INSERT INTO products (name, category, description, price_cents, image_url, badge, stock) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name.trim(), category.trim(), description.trim(), priceCents, imageUrl.trim(), String(badge).slice(0, 40), Number(stock));
  res.status(201).json(productShape(db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)));
});
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  res.json(db.prepare(`SELECT o.*, u.name AS account_name FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC`).all().map(o => ({ ...o, total: o.total_cents / 100 })));
});
app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid order status.' });
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Order not found.' });
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error.' }); });
module.exports = app;
