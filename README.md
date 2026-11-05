# Bharath Delight Foods — React, Node.js and MongoDB

The frontend uses React 19, React Router and Vite. The backend uses Node.js/Express and the native MongoDB driver. The application runs without Next.js, Python or Redis.

The existing page/component markup, Tailwind styles, text, navigation and available assets were reused. All 106 original registered HTTP routes have native Node handlers. API paths and MongoDB collection names follow the uploaded application.

## Source assets requiring attention

The uploaded ZIP does not contain 24 local image files referenced by its pages, including banners and product/category artwork. The `/images/logo.png` reference was restored from the supplied root `logo.png`, leaving 23 image files to supply. Copy the original `public/images` directory into `frontend/public/images`. The exact missing paths are listed in `MISSING_SOURCE_ASSETS.txt`. This prevents complete artwork/visual parity verification. The supplied files have not been replaced with invented artwork.

## Run on Windows

Install Node.js 22 LTS or later. Use your existing MongoDB Atlas connection, database name and provider credentials. Atlas supports the transactions used by checkout and stock operations.

Open a terminal in `backend` and run

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Before starting, edit `backend/.env` and set `MONGODB_URI`, `DATABASE_NAME` and `SECRET_KEY`. Reuse the existing actual secret if you want existing signed tokens to remain valid. Set your real frontend/API origins. Copy existing provider configuration values into the corresponding named settings for Google, Brevo and Cloudinary/R2.

Open another terminal in `frontend` and run

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The API defaults to port 8000. Set `VITE_API_URL` to the backend origin, without `/api/v1`. For Google sign-in, set `VITE_GOOGLE_CLIENT_ID` to the same application configured in backend `GOOGLE_CLIENT_ID`.

No test accounts or fake products are seeded into your database. Existing administrator accounts retain their role. For a new empty database, create a user through registration and assign the intended administrator's `auth.role` in MongoDB using your existing administration process.

### Local MongoDB

A replica set is required because checkout, stock holds, payment verification and order creation use transactions. A standalone MongoDB server cannot run those operations.

For a local installation, start MongoDB with your existing data directory and replica-set configuration. For a new local test directory, an example is

```powershell
mongod --dbpath C:\data\bharath-delight --replSet rs0 --bind_ip localhost
mongosh --eval "rs.initiate()"
```

Use `mongodb://localhost:27017/?replicaSet=rs0` as the URI. The directory must exist. Use your established deployment procedure for an existing production database.

Alternatively, the provided Docker Compose file creates a local replica set and runs the app. Configure `backend/.env` first, then run `docker compose up --build`. Open http://localhost:8000. The Compose database is a new local database, separate from an existing Atlas deployment.

## Production build and hosting

Build the frontend

```powershell
cd frontend
npm ci
npm run typecheck
npm run build
```

For Node to serve the built frontend, set the following in `backend/.env`

```dotenv
SERVE_FRONTEND=true
FRONTEND_DIST=../frontend/dist
FRONTEND_ORIGIN=https://your-domain.com
PUBLIC_API_URL=https://your-domain.com
NODE_ENV=production
```

Build with an empty `VITE_API_URL` to use same-origin API requests. Set `VITE_APP_URL` to the public website origin before building. In `backend`, run `npm ci --omit=dev` and `npm start`.

The Node server serves the React application, route-specific HTML metadata/social tags, robots.txt and a database-backed sitemap. Product metadata is read from MongoDB. React renders the page body in the browser.

For separate static frontend hosting, deploy `frontend/dist`, configure SPA rewrites to `index.html`, and set `VITE_API_URL` before building. Configure backend CORS and cookie settings for the actual origins. Server-generated metadata/robots/sitemap are available when using the included Node frontend-serving mode.

Local uploads require durable storage. Configure Cloudinary or R2, or mount a persistent directory for `STATIC_DIR`. Copy any existing backend `static` uploads to that directory. Existing stored media URLs are retained.

## Data compatibility

- Existing ObjectIds, product documents, customers and BSON Decimal128 money fields are read directly.
- Existing bcrypt password hashes remain supported.
- Product edits retain variant identifiers by SKU.
- New money values are stored as Decimal128. Calculations use decimal arithmetic.
- New documents contain an additional `node_version` marker used by partial unique indexes.
- Startup creates/reuses indexes. Legacy unique customer phone/email indexes that treated null as one shared value are replaced by partial unique indexes for actual strings. Customer document contents are preserved.
- Startup stops on incompatible duplicate data instead of deleting or reseeding existing records.
- Stock reservations and checkout/order/payment writes use MongoDB transactions. Repeated checkout/order/payment operations are handled without double reservations or duplicate orders.
- Expired unused checkout reservations are released by a background worker.
- Redis-dependent OTP state and token revocation are stored in MongoDB with TTL indexes.

The uploaded implementation uses manual UPI payments with screenshot proof and staff verification. This flow is carried over. Gateway-based online payments are outside the source application's implemented payment flow.

The original flat shipping-fee rule and WELCOME10 calculation were retained. The original `free_shipping_threshold` setting is stored but is not applied by that source rule.

The original settings defaults are retained for compatibility. On a new database, configure actual business, tax, UPI and compliance details in admin settings before using the store.

## Providers

- Brevo uses a persistent email outbox with retries. Order confirmations can attach the generated invoice.
- Google sign-in verifies the Google credential against configured `GOOGLE_CLIENT_ID`.
- OTP delivery uses `OTP_WEBHOOK_URL` and optional bearer token. The webhook receives JSON with `phone` and `code`. Development-only console delivery can be enabled with `DEV_OTP_LOG=true`. The uploaded Python source only logged OTP codes and did not implement a live SMS provider.
- Cloudinary and R2 are selected from configured credentials. Local file storage is supported.

These live providers were not called with your production credentials. Their delivery, CORS, account configuration and permissions require checks in your configured deployment.

## Verification performed

Run backend tests with

```powershell
cd backend
npm ci
npm test
```

Tests use a disposable MongoDB replica set and synthetic fixtures. They never connect to the user's database. The first run downloads a MongoDB test binary.

14 automated tests passed, including all 106 route registrations, existing bcrypt login, refresh rotation, permissions, catalog identifiers, guest cart merge, checkout ownership/pricing/coupons, duplicate order prevention, media upload/proof verification, invoice/report file generation, shipments/reviews, settings/addresses/notifications, concurrent last-stock checkout, full rollback after a later line fails, and legacy index compatibility and warehouse dashboard permissions.

Frontend TypeScript checks and production build passed. Browser smoke checks covered 15 routes at 1440px and 390px widths, with zero JavaScript page errors and no horizontal page overflow. A seeded product page, sign-in redirect and Add to Cart interaction were also exercised in the browser. These checks do not establish exact screenshot parity with the original deployed site.

Performance changes include route splitting, lazy admin/account code, cached client queries, batched media/product resolution, pooled MongoDB connections, indexed catalog queries, compression and long-lived caching for hashed static assets. The production entry JavaScript is about 134 KB gzip. The old deployed site was not benchmarked, so no speed percentage or latency guarantee is claimed.

PDF invoices/reports and transactional emails were ported to Node libraries. Their content and brand colours are carried over. Their exact typography, pagination and email layout have not been matched against original production output.

## Remaining verification

Restore the 23 remaining missing image assets, verify real MongoDB data in a staging deployment, test configured external providers, compare original/migrated desktop and mobile screenshots, and measure production performance on the target host. The provided migration is ready for those deployment checks, with the above limitations documented.
