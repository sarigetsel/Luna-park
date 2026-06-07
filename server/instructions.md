# Luna-park — Server Instructions

מדריך הפעלה ופיתוח לצד השרת (`server/`).

## דרישות מקדימות

- **Node.js** 20 ומעלה
- **MongoDB** רץ מקומית (ברירת מחדל: `mongodb://127.0.0.1:27017/luna-park`)
- **npm** מותקן

## התקנה והרצה

```bash
cd server
cp .env.example .env    # אם אין קובץ .env
npm install
npm run dev             # פיתוח — nodemon, טעינה מחדש אוטומטית
```

```bash
npm start               # production — node ללא nodemon
```

| כתובת | תיאור |
|-------|--------|
| `http://localhost:3000/api` | REST API |
| `http://localhost:3000/api/health` | בדיקת תקינות |
| `http://localhost:3000/uploads` | קבצי מדיה סטטיים |

## משתני סביבה (`.env`)

| משתנה | ברירת מחדל | תיאור |
|--------|------------|--------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/luna-park` | חיבור MongoDB |
| `JWT_SECRET` | `change-me-in-production` | מפתח חתימת JWT |
| `PORT` | `3000` | פורט השרת |
| `NODE_ENV` | `development` | `development` / `production` |
| `FULL_DAY_PRICE` | `50` | מחיר כרטיס יום שלם |
| `HOURLY_RATE` | `15` | מחיר לשעה |
| `UPLOAD_DIR` | `uploads` | תיקיית העלאות (יחסית ל-`server/`) |

## מבנה תיקיות

```
server/
├── uploads/              # runtime — images/ + audio/ (ב-gitignore)
├── logs/                 # runtime — errors.log ב-production (ב-gitignore)
├── .env.example
├── package.json
└── src/
    ├── index.js          # כניסה: middleware, routes, error handler, seed
    ├── config/
    │   ├── db.js         # חיבור MongoDB
    │   └── env.js        # משתני סביבה
    ├── models/
    │   ├── User.js       # Partner A — hooks, findByCredentials
    │   ├── Order.js      # Partner A
    │   ├── Ride.js       # Partner B — imageUrl, audioUrl
    │   └── Coupon.js     # Partner B
    ├── middleware/
    │   ├── logger.js     # לוג בקשות (dev) + שגיאות (prod → logs/errors.log)
    │   ├── shabbat.js    # חסימת mutations בשבת וחגים
    │   ├── auth.js       # JWT Bearer
    │   └── admin.js      # role === admin
    ├── controllers/
    │   ├── authController.js
    │   ├── orderController.js
    │   ├── rideController.js   # Partner B — multipart, קבצים
    │   └── couponController.js
    ├── routes/
    │   ├── authRoutes.js         # ללא shabbat
    │   ├── orderRoutes.js        # shabbat על POST
    │   ├── rideRoutes.js         # shabbat + multer על POST/PUT/DELETE
    │   └── couponRoutes.js       # shabbat על POST/PUT/DELETE
    ├── utils/
    │   ├── jwt.js
    │   ├── pricing.js
    │   ├── couponValidator.js
    │   └── upload.js             # multer — תמונה/אודיו, עד 10MB
    └── seed/
        ├── seedData.js           # 6 מתקנים + 4 קופונים (ריצה ראשונה בלבד)
        └── downloadMedia.js      # הורדת תמונות seed מ-Unsplash
```

## סדר Middleware

ב-`index.js`:

```
requestLogger → cors → express.json() → static /uploads → routes → 404 → errorLogger → JSON error
```

על routes של mutations (orders, rides, coupons):

```
shabbat → auth → admin? → handler
```

**חריגים:** `/api/auth` (login/register תמיד זמין), כל ה-GET.

## API — סיכום

### Auth (`/api/auth`) — Partner A

| Method | Path | גישה |
|--------|------|------|
| POST | `/register` | ציבורי |
| POST | `/login` | ציבורי |

### Orders (`/api/orders`) — Partner A

| Method | Path | Middleware | גישה |
|--------|------|------------|------|
| POST | `/` | auth → shabbat | customer |
| GET | `/my-orders` | auth | customer |
| GET | `/` | auth → admin | admin |

### Rides (`/api/rides`) — Partner B

| Method | Path | Middleware | גישה |
|--------|------|------------|------|
| GET | `/` | — | ציבורי |
| GET | `/:id` | — | ציבורי |
| POST | `/` | shabbat → auth → admin → upload | admin, `multipart/form-data` |
| PUT | `/:id` | shabbat → auth → admin → upload | admin, `multipart/form-data` |
| DELETE | `/:id` | shabbat → auth → admin | admin |

**שדות FormData (POST/PUT):**

| שדה | סוג | חובה |
|-----|-----|------|
| name, description, capacity, minimumHeight, category, status | text | name חובה |
| image | file | אופציונלי (jpeg/png/webp) |
| audio | file | אופציונלי (mpeg/wav/ogg) |

נתיבים נשמרים ב-DB כ-`/uploads/images/...` או `/uploads/audio/...`.

### Coupons (`/api/coupons`) — Partner B

| Method | Path | Middleware | גישה |
|--------|------|------------|------|
| GET | `/validate?code=` | — | ציבורי |
| GET | `/` | auth → admin | admin |
| POST | `/` | shabbat → auth → admin | admin |
| PUT | `/:id` | shabbat → auth → admin | admin |
| DELETE | `/:id` | shabbat → auth → admin | admin |

## Shabbat

- חוסם: `POST`, `PUT`, `DELETE`, `PATCH` בשבת וחגים (לוח עברי, ירושלים)
- תשובה: `403` + הודעה בעברית
- לא חוסם: auth, כל ה-GET

## העלאות (Multer)

- מקסימום **10MB** לקובץ
- תמונות → `uploads/images/`
- אודיו → `uploads/audio/`
- בינארי **לא** נשמר ב-MongoDB — רק URL יחסי

## Seed

בהפעלה ראשונה (DB ריק):

- 6 מתקנים עם תמונות (הורדה מ-Unsplash)
- 4 קופונים: `LUNA10`, `SUMMER20`, `FAMILY15`, `VIP25`

אם כבר יש רשומות — ה-seed מדלג.

## יצירת משתמש Admin (ידני)

הרשמה רגילה יוצרת `customer`. ל-admin, עדכני ב-MongoDB:

```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

## בדיקות ידניות (Checklist)

- [ ] `GET /api/health` מחזיר `{ status: "ok" }`
- [ ] Register/Login — סיסמה לא מופיעה ב-JSON
- [ ] `GET /api/rides` מחזיר רשימת מתקנים
- [ ] Admin יוצר מתקן עם FormData (תמונה) → קובץ ב-`uploads/` + URL ב-DB
- [ ] `GET /uploads/images/...` מגיש את הקובץ
- [ ] POST order/ride/coupon נחסם ב-403 בשבת
- [ ] GET routes עובדים בשבת
- [ ] Login/register עובדים בשבת
- [ ] קובץ >10MB נדחה עם הודעת שגיאה

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| `MongoDB connection failed` | ודאי ש-MongoDB רץ (`mongod` או MongoDB Compass) |
| `EADDRINUSE :3000` | שרת כבר רץ — עצרי תהליך קודם או שנהי `PORT` |
| תמונות seed לא ירדו | חיבור אינטרנט / URL ישן — אפשר להעלות ידנית דרך admin |
| `Authentication required` | שלחי `Authorization: Bearer <token>` |

## בעלות קבצים (Team)

| אזור | בעלים |
|------|--------|
| User, Order, auth, pricing | Partner A |
| Ride, Coupon, upload, seed | Partner B |
| logger, shabbat | Shared |
