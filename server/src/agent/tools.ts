import type { AgentRole, AuthUser } from '../types';

export interface ToolParam {
  name: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
}

export interface ToolDefinition {
  id: string;
  method: string;
  path: string;
  roles: AgentRole[];
  description: string;
  params: ToolParam[];
}

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    roles: ['guest', 'customer', 'admin'],
    description: 'בדיקת תקינות השרת',
    params: [],
  },
  {
    id: 'list_rides',
    method: 'GET',
    path: '/api/rides',
    roles: ['guest', 'customer', 'admin'],
    description: 'רשימת כל המתקנים',
    params: [{ name: 'status', optional: true, description: 'active או maintenance' }],
  },
  {
    id: 'get_ride',
    method: 'GET',
    path: '/api/rides/:id',
    roles: ['guest', 'customer', 'admin'],
    description: 'פרטי מתקן לפי שם או מזהה',
    params: [
      { name: 'rideName', optional: true, description: 'שם המתקן בעברית' },
      { name: 'id', optional: true },
    ],
  },
  {
    id: 'pick_ride_for_cart',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'בחירת מתקן להוספה לסל מתוך רשימה',
    params: [],
  },
  {
    id: 'add_to_cart',
    method: 'CLIENT',
    path: 'cart',
    roles: ['customer', 'admin'],
    description: 'הוספת מתקן לסל לפי שם (לדוגמה: הוסף אדרנלין לסל)',
    params: [{ name: 'rideName', required: true }],
  },
  {
    id: 'remove_from_cart',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'הסרת מתקן מהסל לפי שם',
    params: [{ name: 'rideName', required: true }],
  },
  {
    id: 'cart_show',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'הצגת תוכן הסל (מה בסל)',
    params: [],
  },
  {
    id: 'cart_clear',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'ריקון הסל',
    params: [],
  },
  {
    id: 'validate_coupon',
    method: 'GET',
    path: '/api/coupons/validate',
    roles: ['guest', 'customer', 'admin'],
    description: 'בדיקת תקינות קופון',
    params: [{ name: 'code', required: true }],
  },
  {
    id: 'register',
    method: 'POST',
    path: '/api/auth/register',
    roles: ['guest'],
    description: 'הרשמת משתמש חדש',
    params: [
      { name: 'name', required: true },
      { name: 'email', required: true },
      { name: 'password', required: true },
    ],
  },
  {
    id: 'login',
    method: 'POST',
    path: '/api/auth/login',
    roles: ['guest'],
    description: 'התחברות (מחזיר JWT)',
    params: [
      { name: 'email', required: true },
      { name: 'password', required: true },
    ],
  },
  {
    id: 'create_order',
    method: 'POST',
    path: '/api/orders',
    roles: ['customer'],
    description: 'הזמנת כרטיס (יום מלא / שעתי / מתקן)',
    params: [
      { name: 'ticketType', required: true, description: 'full_day | hourly | ride' },
      { name: 'chosenDate', required: true, description: 'YYYY-MM-DD' },
      { name: 'hoursAmount', optional: true },
      { name: 'startHour', optional: true },
      { name: 'endHour', optional: true },
      { name: 'rideId', optional: true },
      { name: 'couponCode', optional: true },
    ],
  },
  {
    id: 'my_orders',
    method: 'GET',
    path: '/api/orders/my-orders',
    roles: ['customer'],
    description: 'ההזמנות שלי',
    params: [],
  },
  {
    id: 'order_barcode',
    method: 'GET',
    path: '/api/orders/my-orders/:id/barcode',
    roles: ['customer'],
    description: 'ברקוד כרטיס להזמנה',
    params: [{ name: 'id', required: true }],
  },
  {
    id: 'list_orders',
    method: 'GET',
    path: '/api/orders',
    roles: ['admin'],
    description: 'כל ההזמנות (אדמין)',
    params: [],
  },
  {
    id: 'validate_ticket',
    method: 'GET',
    path: '/api/orders/validate/:code',
    roles: ['admin'],
    description: 'אימות כרטיס בכניסה',
    params: [{ name: 'code', required: true }],
  },
  {
    id: 'list_coupons',
    method: 'GET',
    path: '/api/coupons',
    roles: ['admin'],
    description: 'רשימת קופונים',
    params: [],
  },
  {
    id: 'create_coupon',
    method: 'POST',
    path: '/api/coupons',
    roles: ['admin'],
    description: 'יצירת קופון',
    params: [
      { name: 'code', required: true },
      { name: 'discountPercent', required: true },
      { name: 'expiresAt', required: true },
      { name: 'description', optional: true },
      { name: 'usageLimit', optional: true },
    ],
  },
  {
    id: 'update_coupon',
    method: 'PUT',
    path: '/api/coupons/:id',
    roles: ['admin'],
    description: 'עדכון קופון לפי code או id',
    params: [
      { name: 'code', optional: true, description: 'קוד הקופון (למשל SUMMER20)' },
      { name: 'id', optional: true },
      { name: 'discountPercent', optional: true },
      { name: 'expiresAt', optional: true, description: 'YYYY-MM-DD' },
      { name: 'description', optional: true },
      { name: 'usageLimit', optional: true },
      { name: 'isActive', optional: true, description: 'true | false' },
    ],
  },
  {
    id: 'delete_coupon',
    method: 'DELETE',
    path: '/api/coupons/:id',
    roles: ['admin'],
    description: 'מחיקת קופון לפי code או id',
    params: [
      { name: 'code', optional: true, description: 'קוד הקופון' },
      { name: 'id', optional: true },
    ],
  },
  {
    id: 'create_ride',
    method: 'POST',
    path: '/api/rides',
    roles: ['admin'],
    description: 'יצירת מתקן חדש',
    params: [
      { name: 'name', required: true },
      { name: 'price', required: true },
      { name: 'description', optional: true },
      { name: 'category', optional: true, description: 'thrill | family | kids | water | show' },
      { name: 'capacity', optional: true },
      { name: 'minimumHeight', optional: true },
      { name: 'imageUrl', optional: true },
      { name: 'status', optional: true, description: 'active | maintenance' },
    ],
  },
  {
    id: 'update_ride',
    method: 'PUT',
    path: '/api/rides/:id',
    roles: ['admin'],
    description: 'עדכון מתקן לפי שם או id (מחיר, שם, סטטוס, תיאור וכו)',
    params: [
      { name: 'rideName', optional: true, description: 'שם המתקן בעברית (למשל מגלשת המים הכחולה)' },
      { name: 'id', optional: true },
      { name: 'price', optional: true },
      { name: 'name', optional: true },
      { name: 'description', optional: true },
      { name: 'category', optional: true },
      { name: 'capacity', optional: true },
      { name: 'minimumHeight', optional: true },
      { name: 'status', optional: true, description: 'active | maintenance' },
      { name: 'imageUrl', optional: true },
    ],
  },
  {
    id: 'delete_ride',
    method: 'DELETE',
    path: '/api/rides/:id',
    roles: ['admin'],
    description: 'מחיקת מתקן לפי שם או id',
    params: [
      { name: 'rideName', optional: true, description: 'שם המתקן בעברית' },
      { name: 'id', optional: true },
    ],
  },
];

export function getUserRole(user: AuthUser | null): AgentRole {
  if (!user) return 'guest';
  return user.role === 'admin' ? 'admin' : 'customer';
}

export function getToolsForRole(user: AuthUser | null): ToolDefinition[] {
  const role = getUserRole(user);
  return TOOL_CATALOG.filter((tool) => tool.roles.includes(role));
}

export function getToolById(id: string): ToolDefinition | null {
  return TOOL_CATALOG.find((tool) => tool.id === id) || null;
}
