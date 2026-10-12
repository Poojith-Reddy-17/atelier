require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
(async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env first.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES ('Store Admin', ?, ?, 'admin')
    ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin'`).run(email.toLowerCase(), hash);
  console.log(`Admin account ready: ${email}`);
})();
