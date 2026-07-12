# Luna-park

A full-stack amusement park management and digital ticketing system.  
Hebrew UI (RTL), modern booking-platform-inspired design, Angular 21 on the client, and Node.js + MongoDB on the server.

**Luna-park** is a full-stack amusement park ticketing and management system — Hebrew UI, image-rich catalog, cart checkout, barcode confirmations, AI assistant, and admin tools.

![Luna Park Homepage Banner](https://github.com/user-attachments/assets/7e2c0a5c-598a-4e66-9aca-221b059a0339)


## Project overview

Visitors can browse a home page with a carousel of real park photos, explore a catalog of **16 rides**, add attractions to a cart and pay, or book an entry ticket (full day / hourly) with coupon codes. After checkout, they receive confirmation with a **digital barcode** (email or “My Orders”). A floating **AI agent** helps find rides and build a cart. Admins manage rides, coupons, and orders from a dedicated dashboard.

| Layer | Stack |
|-------|-------|
| Client | Angular 21, Angular Material, Signals, standalone components |
| Server | Node.js 20+, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | JWT, role-based (`customer`, `admin`) |

## Features

### Home & user experience

- Home page (`/`) with image carousel and a preview of 3 featured rides
- Rides catalog (`/rides`) — cards with images, prices, and status
- GetYourGuide-style layout — navigation, cards, and brand colors
- Real park images (Wikimedia Commons), stored locally under `/uploads`


![Rides Catalog](https://github.com/user-attachments/assets/06cc53bc-acc0-44be-8362-1a84fab9e112)

### AI agent

- Floating chat panel on every page
- Natural-language ride search and recommendations
- Add rides to cart via the agent
- Server-side tools: ride lookup, cart actions, order helpers


![AI Agent](https://github.com/user-attachments/assets/5714bf52-1879-4ffe-b2c4-8243f2d82f9b)



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
- Order history; barcode dialog with print and email options
- Email confirmation with embedded barcode (SMTP / local fallback)
- Shabbat and holiday blocking on order creation


![Digital Barcode Ticket](https://github.com/user-attachments/assets/130be162-6261-430a-9428-a1a42cbd00ba)

### Rides & coupons

- 16 rides seeded with park images
- Rides catalog with image cards and add-to-cart
- Admin dashboard: rides CRUD (FormData upload) + coupons CRUD
- Multer media uploads (`/uploads/images`, `/uploads/audio`)

![Admin Dashboard](https://github.com/user-attachments/assets/14c746ca-f50a-4e12-b784-eec22e5769ad)
![](https://github.com/user-attachments/assets/2c83ec15-4175-4924-8655-3b72ca09483e)

---

## Server (`server/`)

- **Models:** `User.js`, `Order.js`, `Ride.js`, `Coupon.js`
- **Routes:** `/api/auth`, `/api/orders`, `/api/rides`, `/api/coupons`, `/api/agent`
- **Utils:** `pricing.js`, `couponValidator.js`, `upload.js`, `barcode.js`, `orderEmail.js`
- **Agent:** `agentService.js`, `intentParser.js`, `rideMatcher.js`, `tools.js`
- **Middleware:** auth, admin, shabbat, logger, optionalAuth
- **Seed:** rides, coupons, admin user, image backfill from Wikimedia

## Client (`client/`)

- Home, Login / Register, Rides catalog, Cart checkout
- Ticket booking with hourly time range and coupons
- Order history with barcode view
- Admin dashboard for rides and coupons
- AI agent panel and chat components
- AuthService with Signals, route guards, JWT interceptor, CartService

---

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
