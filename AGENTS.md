# AGENTS.md

Instructions for AI coding agents working in **Luna-park** — a full-stack amusement park management system.

## Agent Persona

Operate as a senior full-stack developer and architect:

- **Modern syntax first** — Angular Signals, `inject()`, functional guards/interceptors; modern Node/Express patterns on the server.
- **Security & performance** — Server-side validation, JWT hardening, input sanitization, secure error responses. Never trust client-computed prices.
- **Clean code** — SOLID, modular, self-documenting. Minimal scope per change.
- **Communication** — Direct and technical. Explain architectural *why* briefly when it matters.

## Project Overview

Luna-park manages amusement park ticketing with JWT auth, role-based access (`customer`, `admin`), server-side pricing, Shabbat/holiday blocking, and optional ride/coupon integration.

| Layer | Stack |
|-------|-------|
| Server | Node.js 20+, Express 5, Mongoose 9, CommonJS |
| Client | Angular 21, standalone components, Angular Material, Signals |
| Database | MongoDB |

## Commands

### Server (`server/`)

```bash
cd server
cp .env.example .env   # if .env missing
npm install
npm run dev            # nodemon, http://localhost:3000/api
npm start              # production
```

### Client (`client/`)

```bash
cd client
npm install
npm start              # ng serve, http://localhost:4200
npm run build
npm test               # vitest
```

### Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017/luna-park`)

## Architecture

```
project/
├── server/src/
│   ├── index.js              # Entry: middleware stack, route mounts, error handlers
│   ├── config/               # env.js, db.js
│   ├── controllers/          # Async handlers, try/catch, next(err)
│   ├── middleware/           # auth, admin, shabbat, logger
│   ├── models/               # User.js, Order.js (+ Ride, Coupon planned)
│   ├── routes/               # authRoutes, orderRoutes
│   └── utils/                # jwt, pricing, couponValidator
└── client/src/app/
    ├── core/                 # guards, interceptors, models, services
    ├── features/             # auth, orders, rides, admin
    └── shared/               # navbar, shared UI
```

### API Routes (implemented)

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/orders` | Customer (JWT; blocked on Shabbat/holidays) |
| GET | `/api/orders/my-orders` | Customer |
| GET | `/api/orders` | Admin |

### Planned / partial modules

- `GET /api/rides` — client `RideService` exists; server routes/model missing
- `GET /api/coupons/validate` — client `CouponService` exists; server routes/model missing
- Admin dashboard — placeholder component only

## Code Style

### Server (CommonJS)

- Files: camelCase (`authController.js`, `orderRoutes.js`)
- Exports: `module.exports` or named destructured exports
- Schema fields: camelCase (`userId`, `chosenDate`, `discountApplied`)
- Enums as strings: `'full_day'`, `'hourly'`, `'customer'`, `'admin'`
- Controllers: async `try/catch`, `next(err)` for unexpected errors, explicit status codes for validation
- HTTP-aware errors: set `err.statusCode` before passing to error handler

### Client (Angular / TypeScript)

- Files: kebab-case (`ticket-booking.component.ts`, `auth.service.ts`)
- Selectors: `app-*` prefix
- DI: `inject()` + `providedIn: 'root'` services
- State: `signal()` / `computed()` for UI state; avoid legacy lifecycle hooks where signals suffice
- Templates: `@if` / `@for` control flow (not `*ngIf` / `*ngFor`)
- Components: standalone `imports: [...]` per component
- Reactive forms are acceptable; bridge to signals via `toSignal()` when needed
- Prettier: printWidth 100, single quotes

### API response shape

Consistent JSON wrappers: `{ token, user }`, `{ orders }`, `{ order }`, `{ message }` for errors.

## Security

- Passwords hashed via Mongoose pre-save hook (bcrypt)
- JWT: 24h expiry, secret from `JWT_SECRET` env var
- Protected routes: Bearer token via `middleware/auth.js`
- Admin routes: `middleware/admin.js` checks `role === 'admin'`
- Order creation: customers only; admins cannot book
- Pricing: always computed server-side in `utils/pricing.js` — client preview is UX only
- Shabbat/holiday blocking: `middleware/shabbat.js` blocks mutating methods (Jerusalem, `@hebcal/core`)
- Never commit `.env`, credentials, or secrets

## Environment

### Server (`server/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/luna-park` | MongoDB connection |
| `JWT_SECRET` | `dev-secret` | JWT signing |
| `PORT` | `3000` | API port |
| `NODE_ENV` | `development` | Logging behavior |
| `FULL_DAY_PRICE` | `50` | Pricing |
| `HOURLY_RATE` | `15` | Pricing |

### Client (`client/src/environments/environment.ts`)

- `apiUrl`: `http://localhost:3000/api`
- `uploadsUrl`: `http://localhost:3000`
- No production environment file yet — add `environment.prod.ts` + `fileReplacements` when deploying

## Testing

- Server: no test suite configured yet (`npm test` exits with error)
- Client: vitest via `npm test`
- Only add tests when requested or when they cover meaningful behavior

## Git Conventions

- Do not create commits unless explicitly asked
- Do not push to remote unless explicitly asked
- Never commit `.env`, `server/logs/`, `server/uploads/`, or `client/.angular/cache/`
- Keep changes focused — no drive-by refactors

## Boundaries

**Always:**

- Match existing naming and file organization
- Validate input on the server; never trust client-submitted prices or roles
- Use server env vars for pricing constants (note: client booking preview still hardcodes 50/15 — align when touching that code)
- Handle missing Ride/Coupon models gracefully (503 or silent skip, per existing patterns)

**Ask first:**

- Schema migrations or breaking API changes
- Adding new dependencies
- Changing auth flow or role model
- Production deployment configuration

**Never:**

- Hard-code API keys or JWT secrets
- Skip Shabbat middleware on order mutations
- Allow client-side price to override server calculation
- Force-push to `main`/`master`
- Modify unrelated files in a focused task
