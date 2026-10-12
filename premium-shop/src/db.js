const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const databaseFile = process.env.DATABASE_FILE || './data/shop.sqlite';
if (databaseFile !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(databaseFile)), { recursive: true });
const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  image_url TEXT NOT NULL,
  badge TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 20 CHECK(stock >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash_on_delivery')),
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
  status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed','processing','shipped','delivered','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0)
);
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
if (count === 0) {
  const insert = db.prepare(`INSERT INTO products (name, category, description, price_cents, image_url, badge, stock)
    VALUES (@name, @category, @description, @price_cents, @image_url, @badge, @stock)`);
  const products = [
    { name: 'Studio Headphones', category: 'Technology', description: 'Immersive sound, considered materials, and all-day comfort for focused listening.', price_cents: 12900, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85', badge: 'BESTSELLER', stock: 18 },
    { name: 'Everyday Carry Pack', category: 'Accessories', description: 'A clean, durable everyday backpack with thoughtful storage and a water-resistant finish.', price_cents: 8900, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85', badge: 'NEW', stock: 14 },
    { name: 'Ceramic Pour-Over Set', category: 'Home', description: 'A tactile ceramic brewer and cup set for a slower, more intentional morning ritual.', price_cents: 4600, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85', badge: '', stock: 22 },
    { name: 'Minimal Analog Watch', category: 'Accessories', description: 'A timeless dial, brushed steel case, and versatile strap made for every day.', price_cents: 15900, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85', badge: 'EDITOR’S PICK', stock: 9 },
    { name: 'Soft Knit Throw', category: 'Home', description: 'A beautifully soft textured throw that brings warmth and quiet character to a room.', price_cents: 7200, image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85', badge: '', stock: 12 },
    { name: 'Performance Water Bottle', category: 'Lifestyle', description: 'A double-wall insulated bottle designed to keep drinks cold and daily routines simple.', price_cents: 2800, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=85', badge: 'POPULAR', stock: 30 },
    { name: 'Daily Leather Wallet', category: 'Accessories', description: 'A slim, understated wallet with useful card storage and a refined finish.', price_cents: 3900, image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=85', badge: '', stock: 16 },
    { name: 'Desk Light No. 02', category: 'Home', description: 'Warm, directional lighting and a sculptural silhouette for calmer workspaces.', price_cents: 9900, image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85', badge: 'LIMITED', stock: 7 }
  ];
  const seed = db.transaction(items => items.forEach(item => insert.run(item)));
  seed(products);
}

module.exports = db;
