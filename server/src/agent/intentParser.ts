export type Intent =
  | { type: 'help' }
  | { type: 'client'; action: string }
  | { type: 'unknown' }
  | { type: 'tool'; tool: string; params: Record<string, unknown> }
  | { type: 'missing'; tool: string; missing: string[]; partial?: Record<string, unknown> };

function normalize(text: string): string {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function parseDateToken(token: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!token || token === 'היום' || token === 'today') {
    return formatDate(today);
  }
  if (token === 'מחר' || token === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }

  const iso = token.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];

  const dmy = token.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractCouponCode(text: string): string | null {
  const quoted = text.match(/["']([A-Z0-9_-]{3,})["']/i);
  if (quoted) return quoted[1].toUpperCase();

  const afterKeyword = text.match(/(?:קופון|coupon)\s+([A-Z0-9_-]{3,})/i);
  if (afterKeyword) return afterKeyword[1].toUpperCase();

  const upper = text.match(/\b([A-Z]{3,}[A-Z0-9_-]*)\b/);
  return upper ? upper[1].toUpperCase() : null;
}

function extractTicketCode(text: string): string | null {
  const match = text.match(/(?:כרטיס|ticket|קוד)\s+([A-Z0-9-]{6,})/i);
  if (match) return match[1].toUpperCase();
  const code = text.match(/\b(LP-[A-Z0-9-]+)\b/i);
  return code ? code[1].toUpperCase() : null;
}

function extractObjectId(text: string): string | null {
  const match = text.match(/\b([a-f0-9]{24})\b/i);
  return match ? match[1] : null;
}

const GENERIC_RIDE_PLACEHOLDERS = new Set([
  'מתקן',
  'מתקנים',
  'משהו',
  'כלשהו',
  'אחד',
  'מתקן כלשהו',
  'מתקן אחד',
  'משהו לסל',
  'ride',
  'a ride',
  'something',
]);

export function isGenericRidePlaceholder(rideName: string | null | undefined): boolean {
  if (!rideName) return true;
  const norm = normalize(rideName);
  if (GENERIC_RIDE_PLACEHOLDERS.has(norm)) return true;
  if (/^מתקן(\s|$)/.test(norm) && norm.length <= 12) return true;
  if (/^(משהו|כלשהו|אחד)(\s|$)/.test(norm)) return true;
  return false;
}

export function isGenericAddToCartMessage(message: string): boolean {
  const text = normalize(message);
  return (
    /^(הוסף|תוסיף|הוסיפי|add)\s+(?:מתקן|מתקנים|משהו|כלשהו|אחד)?\s*(?:ל)?(?:סל|עגלה|cart)?$/.test(
      text,
    ) || /^(תוסיף|הוסף)\s+לסל$/.test(text)
  );
}

export function extractRideName(message: string): string | null {
  if (isGenericAddToCartMessage(message)) {
    return null;
  }

  const patterns = [
    /(?:הוסף|תוסיף|הוסיפי|add)\s+(?:את\s+)?(.+?)\s+(?:ל)?(?:סל|עגלה|cart)/i,
    /(?:הסר|תסיר|הורידי|הורד|remove)\s+(?:את\s+)?(.+?)\s+(?:מ)?(?:ה)?(?:סל|עגלה|cart)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim().replace(/^את\s+/i, '');
      if (!isGenericRidePlaceholder(name)) {
        return name;
      }
    }
  }
  return null;
}

export function parseMessage(message: string): Intent {
  const text = normalize(message);

  if (!text) {
    return { type: 'help' };
  }

  if (/^(עזרה|help|מה אתה יודע|מה אפשר|פקודות)/.test(text)) {
    return { type: 'help' };
  }

  if (/^(בריאות|health|סטטוס|status)/.test(text)) {
    return { type: 'tool', tool: 'health', params: {} };
  }

  if (/(מה בסל|מה יש בסל|הצג סל|הצג עגלה|כמה בסל|show cart|הסל שלי)/.test(text)) {
    return { type: 'client', action: 'cart_show' };
  }

  if (/(רוקן סל|נקה סל|clear cart|אפס סל)/.test(text)) {
    return { type: 'client', action: 'cart_clear' };
  }

  if (
    /(הוסף|תוסיף|הוסיפי|add).*(סל|עגלה|cart)/i.test(message) ||
    /(לסל|לעגלה)\s*$/i.test(message.trim())
  ) {
    const rideName = extractRideName(message);
    if (rideName) return { type: 'tool', tool: 'add_to_cart', params: { rideName } };
    return { type: 'tool', tool: 'pick_ride_for_cart', params: {} };
  }

  if (/(הסר|תסיר|הורד|remove).*(סל|עגלה|cart)/i.test(message)) {
    const rideName = extractRideName(message);
    if (rideName) return { type: 'tool', tool: 'remove_from_cart', params: { rideName } };
    return { type: 'missing', tool: 'remove_from_cart', missing: ['rideName'] };
  }

  if (/(המתקנים|מתקנים|רשימת מתקנים|list rides|rides)/.test(text)) {
    const status = text.includes('תחזוקה') || text.includes('maintenance') ? 'maintenance' : undefined;
    return { type: 'tool', tool: 'list_rides', params: status ? { status } : {} };
  }

  if (/(הזמנות שלי|my orders|ההזמנות שלי)/.test(text)) {
    return { type: 'tool', tool: 'my_orders', params: {} };
  }

  if (/(כל ההזמנות|list orders|הזמנות במערכת)/.test(text)) {
    return { type: 'tool', tool: 'list_orders', params: {} };
  }

  if (/(רשימת קופונים|קופונים|coupons)/.test(text) && !/(בדוק|validate)/.test(text)) {
    return { type: 'tool', tool: 'list_coupons', params: {} };
  }

  if (/(בדוק קופון|validate coupon|קופון)/.test(text)) {
    const code = extractCouponCode(message);
    if (code) return { type: 'tool', tool: 'validate_coupon', params: { code } };
    return { type: 'missing', tool: 'validate_coupon', missing: ['code'] };
  }

  if (/(אמת כרטיס|validate ticket|בדוק כרטיס)/.test(text)) {
    const code = extractTicketCode(message);
    if (code) return { type: 'tool', tool: 'validate_ticket', params: { code } };
    return { type: 'missing', tool: 'validate_ticket', missing: ['code'] };
  }

  if (/(ברקוד|barcode)/.test(text)) {
    const id = extractObjectId(message);
    if (id) return { type: 'tool', tool: 'order_barcode', params: { id } };
    return { type: 'missing', tool: 'order_barcode', missing: ['id'] };
  }

  if (/(התחבר|login|התחברות)/.test(text)) {
    const email = message.match(/[\w.+-]+@[\w.-]+\.\w+/i)?.[0];
    const password = message.match(/סיסמה\s+(\S+)/i)?.[1];
    if (email && password) return { type: 'tool', tool: 'login', params: { email, password } };
    return { type: 'missing', tool: 'login', missing: ['email', 'password'] };
  }

  if (/(הרשמה|register|להירשם)/.test(text)) {
    const email = message.match(/[\w.+-]+@[\w.-]+\.\w+/i)?.[0];
    const name = message.match(/שם\s+([^,]+?)(?:\s+אימייל|\s+סיסמה|$)/i)?.[1]?.trim();
    const password = message.match(/סיסמה\s+(\S+)/i)?.[1];
    if (name && email && password) {
      return { type: 'tool', tool: 'register', params: { name, email, password } };
    }
    return { type: 'missing', tool: 'register', missing: ['name', 'email', 'password'] };
  }

  if (/(הזמן כרטיס|הזמנת כרטיס|book ticket|להזמין)/.test(text)) {
    const params: Record<string, unknown> = {};

    if (/(יום מלא|full day|full_day)/.test(text)) {
      params.ticketType = 'full_day';
    } else if (/(שעתי|hourly)/.test(text)) {
      params.ticketType = 'hourly';
      const hours = text.match(/(\d+)\s*שעות?/);
      const range = text.match(/מ[-\s]?(\d{1,2})\s*(?:עד|ל|-)\s*(\d{1,2})/);
      if (range) {
        params.startHour = Number(range[1]);
        params.endHour = Number(range[2]);
      } else if (hours) {
        params.hoursAmount = Number(hours[1]);
      }
    } else if (/(מתקן|ride)/.test(text)) {
      params.ticketType = 'ride';
      const rideId = extractObjectId(message);
      if (rideId) params.rideId = rideId;
    } else {
      params.ticketType = 'full_day';
    }

    const dateMatch = message.match(/\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{4}|מחר|היום|today|tomorrow/i);
    if (dateMatch) {
      params.chosenDate = parseDateToken(dateMatch[0].toLowerCase());
    }

    const coupon = extractCouponCode(message);
    if (coupon) params.couponCode = coupon;

    const missing: string[] = [];
    if (!params.chosenDate) missing.push('chosenDate');
    if (
      params.ticketType === 'hourly' &&
      !params.hoursAmount &&
      (params.startHour == null || params.endHour == null)
    ) {
      missing.push('hoursAmount או startHour+endHour');
    }
    if (params.ticketType === 'ride' && !params.rideId) missing.push('rideId');

    if (missing.length) return { type: 'missing', tool: 'create_order', missing, partial: params };
    return { type: 'tool', tool: 'create_order', params };
  }

  if (/(מחק מתקן|delete ride)/.test(text)) {
    const id = extractObjectId(message);
    if (id) return { type: 'tool', tool: 'delete_ride', params: { id } };
    const rideMatch = message.match(/(?:מחק|delete)\s+(?:את\s+)?(?:ה)?מתקן\s+(.+)/i);
    if (rideMatch?.[1]) {
      return { type: 'tool', tool: 'delete_ride', params: { rideName: rideMatch[1].trim() } };
    }
    return { type: 'missing', tool: 'delete_ride', missing: ['rideName או id'] };
  }

  if (/(שנה|עדכן|תעדכן|תשנה|update ride|change ride)/.test(text) && /(מתקן|מחיר|שקל|ride)/.test(text)) {
    const params: Record<string, unknown> = {};
    const rideMatch = message.match(/(?:מתקן[:\s]+|את\s+)([^:\n]+?)(?:\s+(?:ל|ב-|ב)\s*(\d+)\s*שקל|\s*$)/i);
    if (rideMatch?.[1]) {
      params.rideName = rideMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    const priceMatch = message.match(/(?:ל|ב-|ב)\s*(\d+)\s*שקל/i);
    if (priceMatch) params.price = Number(priceMatch[1]);
    const statusMatch = text.match(/(active|maintenance|פעיל|תחזוקה)/);
    if (statusMatch) {
      params.status = statusMatch[1] === 'תחזוקה' || statusMatch[1] === 'maintenance' ? 'maintenance' : 'active';
    }
    if (!params.rideName) {
      return { type: 'missing', tool: 'update_ride', missing: ['rideName'], partial: params };
    }
    if (!Object.keys(params).some((k) => k !== 'rideName')) {
      return { type: 'missing', tool: 'update_ride', missing: ['price או שדה לעדכון'], partial: params };
    }
    return { type: 'tool', tool: 'update_ride', params };
  }

  if (/(צור מתקן|create ride|הוסף מתקן חדש)/.test(text)) {
    const nameMatch = message.match(/(?:שם|name)\s+([^,]+?)(?:\s+(?:מחיר|price)|$)/i);
    const priceMatch = message.match(/(?:מחיר|price)\s+(\d+)/i);
    if (nameMatch && priceMatch) {
      return {
        type: 'tool',
        tool: 'create_ride',
        params: { name: nameMatch[1].trim(), price: Number(priceMatch[1]) },
      };
    }
    return { type: 'missing', tool: 'create_ride', missing: ['name', 'price'] };
  }

  if (/(מחק קופון|delete coupon)/.test(text)) {
    const id = extractObjectId(message);
    if (id) return { type: 'tool', tool: 'delete_coupon', params: { id } };
    return { type: 'missing', tool: 'delete_coupon', missing: ['id'] };
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const payload = JSON.parse(message) as { tool?: string; params?: Record<string, unknown>; body?: Record<string, unknown> };
      if (payload.tool) {
        return { type: 'tool', tool: payload.tool, params: payload.params || payload.body || {} };
      }
    } catch {
      // fall through
    }
  }

  return { type: 'unknown' };
}
