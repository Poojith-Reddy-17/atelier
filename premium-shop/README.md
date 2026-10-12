# Atelier Commerce — premium full-stack e-commerce starter

A responsive storefront and working Express/SQLite backend. Includes product search and category filters, persistent browser cart, customer accounts, password hashing, server-side order totals, inventory checks, order history, admin product creation, admin order management, and automated API tests.

> **Payment note:** this starter intentionally supports **cash on delivery only**. It does not collect card details or pretend to process online payments. To accept online payments, integrate a provider such as Stripe or Razorpay in test mode first, verify payment webhooks on the server, and only mark orders paid after a verified provider event.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

1. Extract this folder and open a terminal inside it.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   **macOS/Linux**
   ```bash
   cp .env.example .env
   ```
   **Windows PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

4. Edit `.env`. Replace `SESSION_SECRET` with a long random value. Change `ADMIN_EMAIL` and `ADMIN_PASSWORD`; the admin password must be at least 12 characters.
5. Start the app:

   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000).

The database and session database are created automatically in `data/`. The first run seeds eight sample products. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, startup creates an admin account if that email does not already exist. To set/reset the admin role and password deliberately, run `npm run seed` after editing `.env`.

For automatic restarts during development, use `npm run dev`.

## Test

```bash
npm test
```

The tests cover health, catalog responses, registration validation, customer registration, server-priced order placement, admin access control, and admin product creation. Tests use a temporary product database; the session store uses the local `data/sessions.sqlite` file.

## Main features

- **Storefront:** responsive premium design, product cards, category filters, search, stock hints, cart quantity controls, and local cart persistence.
- **Accounts:** customer registration/login/logout; passwords hashed with bcrypt; server-side sessions stored in SQLite.
- **Checkout:** authenticated checkout with address validation; server recalculates prices, checks stock, writes order/items transactionally, and decrements inventory. Cash on delivery only.
- **Customer orders:** order history and statuses.
- **Admin:** sign in with the configured admin account, click Account → Open admin studio to add products and update order statuses.
- **Security basics:** Helmet headers, HttpOnly/SameSite cookies, session ID regeneration at login, login/register rate limiting, input validation, parameterized SQL, server-side authorization, and server-calculated prices.

## Project layout

```text
premium-shop/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── app.js       # API routes and middleware
│   ├── db.js        # schema and sample products
│   ├── seed.js      # create/reset admin credentials
│   └── server.js    # startup
├── test/app.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Deployment checklist

1. Choose a Node.js host that supports a persistent disk/volume (for example, a small VPS or a platform with persistent storage). SQLite needs persistent writable storage; ephemeral filesystems can lose orders on redeploy.
2. Set the start command to `npm start`, Node version to 20+, and install dependencies with `npm install`.
3. Configure environment variables through the host's secret manager, not source control:
   - `NODE_ENV=production`
   - `PORT` (use the port supplied by the host)
   - `SESSION_SECRET` (long, random, private)
   - `DATABASE_FILE` pointing to a persistent mounted path, e.g. `/var/data/shop.sqlite`
   - `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`
   - `TRUST_PROXY=true` only when the app is behind a trusted HTTPS reverse proxy and the host requires it
4. Enable HTTPS. The session cookie is marked `Secure` in production.
5. Keep the database on a persistent disk, back it up, and test restore procedures. For larger traffic/multiple app instances, move to managed PostgreSQL and a shared production session store.
6. Run `npm test` in CI before deploy.
7. Configure a real transactional email provider if you need order emails, and an email marketing service for the newsletter form.
8. Before accepting real customers, add CSRF/origin protections appropriate to your deployment, stricter content security policy, request logging/monitoring, database backups, privacy/terms/returns pages, tax/shipping rules, accessibility review, and security review. This starter is a solid learning foundation, not a compliance-certified commerce platform.

### Online payments

Do not store card numbers or CVVs. For Razorpay/Stripe, create an order or checkout session on the server, use the provider's hosted checkout, verify the provider signature/webhook server-side, make webhook handling idempotent, and only then set a payment state to paid. Never trust a browser redirect as proof of payment.

## Customization

- Product seed data lives in `src/db.js`.
- Branding, content, and storefront structure live in `public/index.html`.
- Visual design lives in `public/styles.css`.
- Browser behavior lives in `public/app.js`.
- API and validation live in `src/app.js`.

Product photos are sample Unsplash URLs. Replace them with images you own or have permission to use before launch. The newsletter signup is explicitly a front-end demo and does not store addresses.
