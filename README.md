# Luna-park — לונה פארק

מערכת Full-Stack לניהול פארק שעשועים והזמנת כרטיסים דיגיטלית ל**לונה פארק תל אביב**.  
ממשק בעברית (RTL), עיצוב מודרני בהשראת פלטפורמות הזמנה, עם Angular 21 בצד הלקוח ו-Node.js + MongoDB בשרת.

**Luna-park** is a full-stack amusement park ticketing and management system — Hebrew UI, image-rich catalog, cart checkout, barcode confirmations, and admin tools.

## תיאור הפרויקט

האפליקציה מאפשרת למבקרים לגלוש בדף בית עם קרוסלת תמונות אמיתיות מהפארק, לעיין בקטלוג **16 מתקנים**, להוסיף אטרקציות לסל ולשלם, או להזמין כרטיס כניסה (יום שלם / לפי שעות) עם קופונים. לאחר ההזמנה מתקבל אישור עם **ברקוד דיגיטלי** (אימייל או הצגה בהזמנות שלי). מנהלים יכולים לנהל מתקנים, קופונים והזמנות מלוח ניהול ייעודי.

| שכבה | טכנולוגיה |
|------|-----------|
| Client | Angular 21, Angular Material, Signals, standalone components |
| Server | Node.js 20+, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | JWT, role-based (`customer`, `admin`) |

## Features

### דף בית וחוויית משתמש

- דף בית (`/`) עם קרוסלת תמונות וטעימה מ-3 מתקנים מובילים
- קטלוג מתקנים (`/rides`) — כרטיסים עם תמונות, מחירים וסטטוס
- עיצוב GetYourGuide-style — ניווט, כרטיסים וצבעי מותג
- תמונות אמיתיות של לונה פארק תל אביב (Wikimedia Commons), נשמרות מקומית ב-`/uploads`

### Authentication & accounts

- User registration and login with JWT
- Role-based access (`customer`, `admin`)
- Password hashing via Mongoose hooks
- Admin user seeded/synced from `.env` on startup

### Ticketing & orders

- Book full-day or hourly tickets with live price preview
- Cart: add rides from catalog → checkout (demo payment flow)
- Coupon codes with server-side validation and discounts
- Server-side price calculation — never trust client totals
- Order history; barcode dialog per order
- Email confirmation with embedded barcode (SMTP / local fallback)
- Shabbat and holiday blocking on order creation

### Rides & coupons

- 16 rides seeded with Luna Park Tel Aviv images
- Rides catalog with image cards and add-to-cart
- Admin dashboard: rides CRUD (FormData upload) + coupons CRUD
- Multer media uploads (`/uploads/images`, `/uploads/audio`)

### Server (`server/`)

- **Models:** `User.js`, `Order.js`, `Ride.js`, `Coupon.js`
- **Routes:** `/api/auth`, `/api/orders`, `/api/rides`, `/api/coupons`
- **Utils:** `pricing.js`, `couponValidator.js`, `upload.js`, `barcode.js`, `orderEmail.js`
- **Middleware:** auth, admin, shabbat, logger
- **Seed:** rides, coupons, admin user, image backfill from Wikimedia

### Client (`client/`)

- Home, Login / Register, Rides catalog, Cart checkout
- Ticket booking with hourly time range and coupons
- Order history with barcode view
- Admin dashboard for rides and coupons
- AuthService with Signals, route guards, JWT interceptor, CartService

## Quick start

### Prerequisites

- Node.js 20+
- MongoDB running locally

### Server

```bash
cd server
cp .env.example .env   # if .env missing — set MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev
```

API: `http://localhost:3000/api`  
Static uploads: `http://localhost:3000/uploads`

On first run, seed downloads ride images from Wikimedia (requires network).

### Client

```bash
cd client
npm install
npm start
```

App: `http://localhost:4200`

### Default admin (from `.env`)

Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` before first startup.

## API

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/orders` | Customer (JWT; blocked on Shabbat/holidays) |
| GET | `/api/orders/my-orders` | Customer |
| GET | `/api/orders/my-orders/:id/barcode` | Customer |
| GET | `/api/orders` | Admin |
| GET | `/api/rides` | Public |
| GET | `/api/rides/:id` | Public |
| POST/PUT/DELETE | `/api/rides` | Admin (FormData; blocked on Shabbat/holidays) |
| GET | `/api/coupons/validate` | Public |
| GET/POST/PUT/DELETE | `/api/coupons` | Admin (mutations blocked on Shabbat/holidays) |

## Team ownership

| Area | Partner A | Partner B |
|------|-----------|-----------|
| Models | User, Order | Ride, Coupon |
| Routes | `/api/auth`, `/api/orders` | `/api/rides`, `/api/coupons` |
| Client | Login, Booking, Orders, Cart | Home, Rides catalog, Admin dashboard |
| Shared | Logger, Shabbat middleware, barcode/email | `upload.js`, static `/uploads`, seed |
