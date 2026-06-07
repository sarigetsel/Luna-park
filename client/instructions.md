# Luna-park — Client Instructions

מדריך הפעלה ופיתוח לצד הלקוח (`client/`).

## דרישות מקדימות

- **Node.js** 20 ומעלה
- **npm** מותקן
- **שרת** רץ על `http://localhost:3000` (ראי `server/instructions.md`)
- **MongoDB** רץ (דרך השרת)

## התקנה והרצה

```bash
cd client
npm install
npm start
```

| כתובת | תיאור |
|-------|--------|
| `http://localhost:4200` | אפליקציית Angular |
| `http://localhost:4200/rides` | דף ברירת מחדל — קטלוג מתקנים |

```bash
npm run build    # בניית production → dist/
npm test         # בדיקות (vitest)
```

## הגדרות סביבה

קובץ: `src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  uploadsUrl: 'http://localhost:3000',
};
```

- `apiUrl` — כל קריאות ה-HTTP ל-API
- `uploadsUrl` — בסיס לתמונות/אודיו (`uploadsUrl + ride.imageUrl`)

## מבנה תיקיות

```
client/src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts       # authGuard, roleGuard('customer'|'admin')
│   ├── interceptors/
│   │   └── auth.interceptor.ts # מוסיף Authorization: Bearer
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── order.model.ts
│   │   ├── ride.model.ts       # imageUrl?, audioUrl?
│   │   └── coupon.model.ts
│   └── services/
│       ├── auth.service.ts     # Signals: user, token, login/logout
│       ├── order.service.ts    # Partner A
│       ├── ride.service.ts     # Partner B — FormData
│       └── coupon.service.ts   # Partner B
├── features/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── orders/
│   │   ├── ticket-booking/     # Partner A
│   │   └── order-history/      # Partner A
│   ├── rides/
│   │   └── rides-catalog/      # Partner B — כרטיסים + טבלה + אודיו
│   └── admin/
│       └── admin-dashboard/    # Partner B — טבלאות מתקנים וקופונים
├── shared/
│   └── components/navbar/
├── app.routes.ts
├── app.config.ts               # HttpClient, router, Material animations
└── app.ts
```

## ניתוב (Routes)

| Path | קומפוננטה | גישה |
|------|-----------|------|
| `/` | → redirect ל-`/rides` | כולם |
| `/rides` | RidesCatalogComponent | כולם |
| `/login` | LoginComponent | כולם |
| `/register` | RegisterComponent | כולם |
| `/book` | TicketBookingComponent | customer (מחובר) |
| `/my-orders` | OrderHistoryComponent | customer (מחובר) |
| `/admin` | AdminDashboardComponent | admin (מחובר) |

## זרימת משתמש

### אורח
1. נכנס ל-`/rides` — רואה קטלוג מתקנים (כרטיסים + טבלה)
2. יכול להירשם / להתחבר

### Customer
1. Login → Navbar מציג "Book Ticket" ו-"My Orders"
2. `/book` — בחירת סוג כרטיס, מתקן, קופון, תצוגת מחיר
3. `/my-orders` — היסטוריית הזמנות

### Admin
1. Login כ-admin → Navbar מציג "Admin"
2. `/admin` — שני טאבים:
   - **מתקנים** — הוספה (FormData: תמונה + אודיו), טבלה, מחיקה
   - **קופונים** — הוספה, טבלה, הפעלה/כיבוי, מחיקה

## שירותים עיקריים

### AuthService
- `login()`, `register()`, `logout()`
- Signals: `user()`, `token()`, `isAuthenticated()`, `isAdmin()`, `isCustomer()`
- JWT נשמר ב-`localStorage`

### RideService (Partner B)
```ts
getRides()                          // GET /api/rides
createRide(formData: FormData)      // POST — אל תגדירי Content-Type ידנית
updateRide(id, formData)            // PUT
deleteRide(id)                      // DELETE
buildRideFormData(values, image?, audio?)  // בניית FormData
```

### CouponService (Partner B)
```ts
validateCode(code)    // GET /api/coupons/validate — לשימוש בהזמנה
getCoupons()          // GET — admin בלבד
createCoupon(data)    // POST — admin
updateCoupon(id, data)
deleteCoupon(id)
```

### OrderService (Partner A)
```ts
createOrder(...)      // POST /api/orders
getMyOrders()         // GET /api/orders/my-orders
```

## תצוגת מדיה (Rides Catalog)

```html
<img [src]="mediaUrl(ride.imageUrl)" />
<audio controls [src]="mediaUrl(ride.audioUrl)"></audio>
```

`mediaUrl()` מטפל ב:
- נתיב יחסי (`/uploads/images/...`) → מוסיף `uploadsUrl`
- URL מלא (`https://...`) → מחזיר כמו שהוא
- חסר → placeholder

## Admin — העלאת מתקן

1. מלאי שדות טקסט בטופס
2. בחרי קובץ תמונה (`accept="image/*"`) — תצוגה מקדימה עם `URL.createObjectURL()`
3. אופציונלי: קובץ אודיו (`accept="audio/*"`)
4. Submit → `RideService.createRide(formData)`

**חשוב:** FormData שולח `multipart/form-data` — הדפדפן מגדיר את ה-boundary אוטומטית.

## Angular Material

הפרויקט משתמש ב-Material:
- Cards, Tables, Tabs, Form Fields, Buttons, Snackbar, Toolbar

סגנון גלובלי: `src/styles.scss`

## שגיאת Shabbat (403)

כשהשרת מחזיר 403 עם הודעה בעברית בשבת/חג:
- מוצגת ב-Snackbar (בפעולות admin ו-booking)
- השרת הוא הסמכות — אין לסמוך על בדיקה בצד לקוח בלבד

## בדיקות ידניות (Checklist)

- [ ] `/rides` — כרטיסים עם תמונות + טבלת מתקנים
- [ ] אודיו מוצג למתקנים שיש להם `audioUrl`
- [ ] Register → Login → token ב-localStorage
- [ ] Customer: הזמנת כרטיס עם מתקן וקופון
- [ ] Customer: היסטוריית הזמנות
- [ ] Admin: הוספת מתקן עם תמונה → מופיע בקטלוג
- [ ] Admin: טבלת קופונים — הוספה, מחיקה, toggle פעיל
- [ ] Route guards — `/admin` חוסם customer, `/book` חוסם אורח
- [ ] שגיאת 403 בשבת מוצגת ב-Snackbar

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| `לא ניתן לטעון מתקנים` | ודאי שהשרת רץ על פורט 3000 |
| תמונות לא נטענות | בדקי `uploadsUrl` + שהקובץ קיים ב-`server/uploads/` |
| 401 על פעולות admin | התחברי מחדש; ודאי `role: admin` ב-DB |
| CORS error | השרת מוגדר ל-`http://localhost:4200` בלבד |
| Material לא נטען | הריצי `npm install` בתיקיית client |

## Tech Stack

| טכנולוגיה | שימוש |
|-----------|--------|
| Angular 21 | Framework |
| Standalone Components | ללא NgModules |
| Signals | state ב-AuthService וקומפוננטות |
| Reactive Forms | טפסים ב-admin ו-auth |
| HttpClient + Interceptor | API + JWT |
| Angular Material | UI |

## בעלות קבצים (Team)

| אזור | בעלים |
|------|--------|
| auth, orders, booking, order-history | Partner A |
| rides-catalog, admin-dashboard, ride/coupon services | Partner B |
| navbar, guards, interceptor, app.routes | Shared |

## הרצה מלאה (שני טרמינלים)

**טרמינל 1 — Server:**
```bash
cd server && npm run dev
```

**טרמינל 2 — Client:**
```bash
cd client && npm start
```

פתחי: **http://localhost:4200**
