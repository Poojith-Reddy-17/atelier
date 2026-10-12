require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
const app = require('./app');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (!existing) {
      const hash = await bcrypt.hash(password, 12);
      db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('Store Admin', ?, ?, 'admin')").run(email.toLowerCase(), hash);
      console.log(`Created admin account: ${email}`);
    }
  }
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Atelier Commerce running at http://localhost:${port}`));
}
main().catch(error => { console.error(error.message); process.exit(1); });
