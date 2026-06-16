import { Request } from 'express';
import Ride, { type IRide } from '../models/Ride';
import Coupon from '../models/Coupon';
import { isShabbatOrHoliday } from '../middleware/shabbat';
import { findRideByName, findRideByNameAny, suggestRideNames } from './rideMatcher';
import { runHandler, type ExpressHandler } from './runHandler';
import { getToolById, getToolsForRole, getUserRole } from './tools';
import { geminiApiKey } from '../config/env';
import { runGeminiAgent } from './geminiAgent';
import { parseMessage } from './intentParser';
import type { Intent } from './intentParser';
import * as authController from '../controllers/authController';
import * as orderController from '../controllers/orderController';
import * as rideController from '../controllers/rideController';
import * as couponController from '../controllers/couponController';
import type { AuthUser } from '../types';

interface ToolResult {
  status: number;
  data: Record<string, unknown>;
  clientAction?: Record<string, unknown>;
}

export interface FormattedResult {
  success: boolean;
  message: string;
  status?: number;
  data?: unknown;
  clientAction?: Record<string, unknown>;
  tool?: string;
}

function buildReq(user: AuthUser | null, params: Record<string, unknown> = {}, body: Record<string, unknown> = {}): Request {
  const req = {
    user: user || null,
    params: {} as Record<string, string>,
    query: {} as Record<string, string>,
    body: { ...body },
    headers: {},
  } as Request;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'code' && ['validate_coupon'].includes(String(body._tool))) {
      req.query.code = String(value);
    } else if (['id', 'code'].includes(key)) {
      req.params[key] = String(value);
    } else if (key === 'status') {
      req.query.status = String(value);
    } else {
      req.body[key] = value;
    }
  }

  return req;
}

async function executeHealth(): Promise<ToolResult> {
  return { status: 200, data: { status: 'ok', service: 'luna-park-api' } };
}

const RIDE_UPDATE_FIELDS = [
  'name',
  'price',
  'description',
  'category',
  'capacity',
  'minimumHeight',
  'status',
  'imageUrl',
] as const;

function buildRideUpdatePayload(params: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of RIDE_UPDATE_FIELDS) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      payload[key] = key === 'price' || key === 'capacity' || key === 'minimumHeight'
        ? Number(params[key])
        : params[key];
    }
  }
  return payload;
}

async function resolveRideForAdmin(params: Record<string, unknown>): Promise<IRide | null> {
  if (params.id) {
    return Ride.findById(String(params.id));
  }
  if (params.rideName) {
    return findRideByNameAny(String(params.rideName));
  }
  return null;
}

async function resolveCouponForAdmin(params: Record<string, unknown>) {
  if (params.id) {
    return Coupon.findById(String(params.id));
  }
  if (params.code) {
    return Coupon.findOne({ code: String(params.code).trim().toUpperCase() });
  }
  return null;
}

export async function executeTool(
  toolId: string,
  params: Record<string, unknown>,
  user: AuthUser | null,
): Promise<ToolResult> {
  const tool = getToolById(toolId);
  if (!tool) {
    return { status: 400, data: { message: `פעולה לא מוכרת: ${toolId}` } };
  }

  const role = getUserRole(user);
  if (!tool.roles.includes(role)) {
    return {
      status: 403,
      data: {
        message:
          role === 'guest' ? 'נדרשת התחברות לפעולה זו' : 'אין לך הרשאה לפעולה זו',
      },
    };
  }

  if (toolId === 'health') {
    return executeHealth();
  }

  if (toolId === 'pick_ride_for_cart') {
    const rides = await Ride.find({ status: 'active' }).sort({ name: 1 }).select('name price status');
    const list = rides.map((ride) => ({
      _id: ride._id.toString(),
      name: ride.name,
      price: ride.price,
    }));
    return {
      status: 200,
      data: { rides: list },
      clientAction: { type: 'show_ride_picker', rides: list },
    };
  }

  if (toolId === 'add_to_cart') {
    const ride = await findRideByName(String(params.rideName || ''));
    if (!ride) {
      const suggestions = await suggestRideNames(6);
      return {
        status: 404,
        data: {
          message: `לא מצאתי מתקן בשם "${params.rideName}".\nאולי התכוונת ל: ${suggestions.join(', ')}`,
        },
      };
    }
    return {
      status: 200,
      data: { ride },
      clientAction: { type: 'cart_add', ride },
    };
  }

  if (toolId === 'remove_from_cart') {
    const ride = await findRideByName(String(params.rideName || ''));
    if (!ride) {
      return { status: 404, data: { message: `לא מצאתי מתקן בשם "${params.rideName}"` } };
    }
    return {
      status: 200,
      data: { ride },
      clientAction: { type: 'cart_remove', rideId: ride._id.toString(), rideName: ride.name },
    };
  }

  if (toolId === 'cart_show') {
    return {
      status: 200,
      data: {},
      clientAction: { type: 'cart_show' },
    };
  }

  if (toolId === 'cart_clear') {
    return {
      status: 200,
      data: { cleared: true },
      clientAction: { type: 'cart_clear' },
    };
  }

  if (['POST', 'PUT', 'DELETE'].includes(tool.method)) {
    const blocked = await isShabbatOrHoliday();
    if (blocked) {
      return {
        status: 403,
        data: { message: 'הפעולה אינה זמינה בשבת ובחגים. נסו שוב לאחר צאת השבת/ החג.' },
      };
    }
  }

  const bodyParams = { ...params };
  const pathParams: Record<string, unknown> = {};

  if (params.id) {
    pathParams.id = params.id;
    delete bodyParams.id;
  }
  if (params.code && ['validate_coupon', 'validate_ticket'].includes(toolId)) {
    pathParams.code = params.code;
    delete bodyParams.code;
  }

  const req = buildReq(user, pathParams, bodyParams);

  if (toolId === 'validate_coupon') {
    req.query.code = String(params.code);
  }

  const handlers: Record<string, ExpressHandler> = {
    register: authController.register,
    login: authController.login,
    create_order: orderController.createOrder,
    my_orders: orderController.getMyOrders,
    list_orders: orderController.getAllOrders,
    validate_ticket: orderController.validateTicket,
    order_barcode: orderController.getOrderBarcode,
    list_rides: rideController.getRides,
    get_ride: rideController.getRideById,
    validate_coupon: couponController.validateCouponCode,
    list_coupons: couponController.getCoupons,
    create_coupon: couponController.createCoupon,
    create_ride: rideController.createRide,
  };

  if (toolId === 'create_ride' && !req.files) {
    const ride = await Ride.create({
      name: String(params.name),
      description: String(params.description || ''),
      price: Number(params.price),
      category: (params.category as IRide['category']) || 'family',
      capacity: params.capacity ? Number(params.capacity) : 1,
      minimumHeight: params.minimumHeight ? Number(params.minimumHeight) : 0,
      imageUrl: String(params.imageUrl || ''),
      status: 'active',
    });
    return { status: 201, data: { ride, message: 'המתקן נוצר בהצלחה' } };
  }

  if (toolId === 'update_ride') {
    const ride = await resolveRideForAdmin(params);
    if (!ride) {
      const suggestions = await suggestRideNames(6, true);
      return {
        status: 404,
        data: {
          message: `לא מצאתי מתקן${params.rideName ? ` בשם "${params.rideName}"` : ''}.\nאולי התכוונת ל: ${suggestions.join(', ')}`,
        },
      };
    }
    const payload = buildRideUpdatePayload(params);
    if (!Object.keys(payload).length) {
      return {
        status: 400,
        data: { message: 'לא צוינו שדות לעדכון (למשל price, name, status, description)' },
      };
    }
    const updated = await Ride.findByIdAndUpdate(ride._id, payload, { new: true, runValidators: true });
    if (!updated) return { status: 404, data: { message: 'המתקן לא נמצא' } };
    return {
      status: 200,
      data: {
        ride: updated,
        message: `עודכן "${updated.name}" — מחיר ₪${updated.price}`,
      },
    };
  }

  if (toolId === 'delete_ride') {
    const ride = await resolveRideForAdmin(params);
    if (!ride) {
      return { status: 404, data: { message: `לא מצאתי מתקן${params.rideName ? ` בשם "${params.rideName}"` : ''}` } };
    }
    await Ride.findByIdAndDelete(ride._id);
    return { status: 200, data: { message: `המתקן "${ride.name}" נמחק`, rideName: ride.name } };
  }

  if (toolId === 'get_ride') {
    const ride = params.id
      ? await Ride.findById(String(params.id))
      : params.rideName
        ? await findRideByNameAny(String(params.rideName))
        : null;
    if (!ride) {
      return { status: 404, data: { message: 'המתקן לא נמצא' } };
    }
    return { status: 200, data: { ride } };
  }

  if (toolId === 'update_coupon') {
    const coupon = await resolveCouponForAdmin(params);
    if (!coupon) {
      return { status: 404, data: { message: 'הקופון לא נמצא' } };
    }
    const payload = { ...params };
    delete payload.id;
    delete payload.code;
    if (payload.discountPercent !== undefined) payload.discountPercent = Number(payload.discountPercent);
    if (payload.usageLimit !== undefined) payload.usageLimit = Number(payload.usageLimit);
    const updated = await Coupon.findByIdAndUpdate(coupon._id, payload, { new: true, runValidators: true });
    if (!updated) return { status: 404, data: { message: 'הקופון לא נמצא' } };
    return { status: 200, data: { coupon: updated, message: `הקופון ${updated.code} עודכן` } };
  }

  if (toolId === 'delete_coupon') {
    const coupon = await resolveCouponForAdmin(params);
    if (!coupon) {
      return { status: 404, data: { message: 'הקופון לא נמצא' } };
    }
    await Coupon.findByIdAndDelete(coupon._id);
    return { status: 200, data: { message: `הקופון ${coupon.code} נמחק` } };
  }

  const handler = handlers[toolId];
  if (!handler) {
    return { status: 400, data: { message: 'הפעולה לא ממומשת' } };
  }

  return runHandler(handler, req) as Promise<ToolResult>;
}

export function formatToolResult(toolId: string, result: ToolResult): FormattedResult {
  const { status, data, clientAction } = result;

  if (status >= 400) {
    return {
      success: false,
      message:
        (data?.message as string) || (data?.valid === false ? (data.message as string) : 'הפעולה נכשלה'),
      status,
      data,
    };
  }

  if (toolId === 'list_rides' && data?.rides) {
    const rides = data.rides as Array<{ name: string; price: number }>;
    const lines = rides.slice(0, 12).map((r) => `• ${r.name} — ₪${r.price}`);
    return {
      success: true,
      message: `נמצאו ${rides.length} מתקנים:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'my_orders' && data?.orders) {
    const orders = data.orders as Array<{ rideId?: { name?: string }; ticketType: string; finalPrice: number }>;
    if (!orders.length) {
      return { success: true, message: 'אין הזמנות עדיין.', status, data };
    }
    const lines = orders.map((o) => {
      const label = o.rideId?.name || o.ticketType;
      return `• ${label} — ₪${o.finalPrice}`;
    });
    return {
      success: true,
      message: `יש לך ${orders.length} הזמנות:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'create_order') {
    return {
      success: true,
      message: (data?.message as string) || 'ההזמנה נוצרה בהצלחה!',
      status,
      data,
    };
  }

  if (toolId === 'validate_coupon') {
    return {
      success: true,
      message: (data?.message as string) || 'הקופון תקין',
      status,
      data,
    };
  }

  if (toolId === 'login' || toolId === 'register') {
    return {
      success: true,
      message: toolId === 'login' ? 'התחברת בהצלחה! שמרי את ה-JWT מהתשובה.' : 'נרשמת בהצלחה!',
      status,
      data,
    };
  }

  if (toolId === 'health') {
    return { success: true, message: 'השרת פעיל ותקין ✓', status, data };
  }

  if (toolId === 'pick_ride_for_cart' && data?.rides) {
    return {
      success: true,
      message: 'בחרי מתקן להוספה לסל 👇',
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'add_to_cart' && data?.ride) {
    const ride = data.ride as { name: string; price: number };
    return {
      success: true,
      message: `הוספתי את "${ride.name}" לסל 🛒 (₪${ride.price})`,
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'remove_from_cart' && data?.ride) {
    const ride = data.ride as { name: string };
    return {
      success: true,
      message: `הסרתי את "${ride.name}" מהסל`,
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'cart_show') {
    return {
      success: true,
      message: 'מבצע פעולה מקומית...',
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'cart_clear') {
    return {
      success: true,
      message: 'מבצע פעולה מקומית...',
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'get_ride' && data?.ride) {
    const ride = data.ride as { name: string; price: number; status: string; category: string };
    return {
      success: true,
      message: `${ride.name}\nמחיר: ₪${ride.price} | סטטוס: ${ride.status} | קטגוריה: ${ride.category}`,
      status,
      data,
    };
  }

  if (toolId === 'create_ride' && data?.ride) {
    const ride = data.ride as { name: string; price: number };
    return {
      success: true,
      message: (data.message as string) || `המתקן "${ride.name}" נוצר (₪${ride.price})`,
      status,
      data,
    };
  }

  if (toolId === 'update_ride' && data?.ride) {
    const ride = data.ride as { name: string; price: number };
    return {
      success: true,
      message: (data.message as string) || `עודכן "${ride.name}" — ₪${ride.price}`,
      status,
      data,
    };
  }

  if (toolId === 'delete_ride') {
    return {
      success: true,
      message: (data?.message as string) || 'המתקן נמחק',
      status,
      data,
    };
  }

  if (toolId === 'list_coupons' && data?.coupons) {
    const coupons = data.coupons as Array<{ code: string; discountPercent: number }>;
    const lines = coupons.slice(0, 10).map((c) => `• ${c.code} — ${c.discountPercent}%`);
    return {
      success: true,
      message: `נמצאו ${coupons.length} קופונים:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'create_coupon' || toolId === 'update_coupon' || toolId === 'delete_coupon') {
    return {
      success: true,
      message: (data?.message as string) || 'הפעולה בוצעה בהצלחה',
      status,
      data,
    };
  }

  return {
    success: true,
    message: (data?.message as string) || 'הפעולה בוצעה בהצלחה',
    status,
    data,
    clientAction: result.clientAction,
  };
}

function buildHelpMessage(user: AuthUser | null): FormattedResult {
  const tools = getToolsForRole(user);
  const lines = tools.map((t) => `• ${t.id} (${t.method}) — ${t.description}`);
  return {
    success: true,
    message: `שלום! אני סוכן לונה פארק. אפשר לבקש בעברית או לשלוח JSON.\n\nדוגמאות:\n• "הצג מתקנים"\n• "הוסף מתקן לסל"\n• "מה בסל"\n• "ההזמנות שלי"\n• "הזמן כרטיס יום מלא ל-2026-06-15"\n• "בדוק קופון SUMMER20"\n\nפעולות זמינות לך:\n${lines.join('\n')}`,
    data: { tools },
  };
}

function buildMissingMessage(intent: Extract<Intent, { type: 'missing' }>): FormattedResult {
  const tool = getToolById(intent.tool);
  const names = intent.missing?.join(', ') || 'פרמטרים';
  let hint = `חסרים: ${names}.`;
  if (intent.tool === 'create_order') {
    hint += '\nדוגמה: הזמן כרטיס יום מלא ל-2026-06-15';
  }
  if (intent.tool === 'validate_coupon') {
    hint += '\nדוגמה: בדוק קופון SUMMER20';
  }
  if (intent.tool === 'add_to_cart') {
    hint += '\nדוגמה: הוסף אדרנלין לסל';
  }
  if (tool) {
    hint += `\nפעולה: ${tool.description}`;
  }
  return { success: false, message: hint, data: { partial: intent.partial || null } };
}

async function handleChatLegacy(message: string, user: AuthUser | null): Promise<FormattedResult> {
  const intent = parseMessage(message);

  if (intent.type === 'help') {
    return buildHelpMessage(user);
  }

  if (intent.type === 'client') {
    return {
      success: true,
      message: 'מבצע פעולה מקומית...',
      clientAction: { type: intent.action },
    };
  }

  if (intent.type === 'missing') {
    return buildMissingMessage(intent);
  }

  if (intent.type === 'unknown') {
    return {
      success: false,
      message: 'לא הבנתי. נסי: "הוסף אדרנלין לסל", "הצג מתקנים", או "עזרה"',
    };
  }

  const result = await executeTool(intent.tool, intent.params || {}, user);
  const formatted = formatToolResult(intent.tool, result);
  return { ...formatted, tool: intent.tool };
}

function isGeminiAuthError(err: unknown): boolean {
  const text = String(err);
  return text.includes('API_KEY_INVALID') || text.includes('API key not valid');
}

export async function handleChat(message: string, user: AuthUser | null): Promise<FormattedResult> {
  if (geminiApiKey) {
    try {
      return await runGeminiAgent(message, user);
    } catch (err) {
      if (isGeminiAuthError(err)) {
        console.error(
          'Gemini API key invalid — set a valid GEMINI_API_KEY in server/.env (https://aistudio.google.com/apikey). Using legacy parser.',
        );
      } else {
        console.error('Gemini agent error:', err);
      }
      return handleChatLegacy(message, user);
    }
  }

  return handleChatLegacy(message, user);
}

export async function handleExecute(
  tool: string,
  params: Record<string, unknown>,
  user: AuthUser | null,
): Promise<FormattedResult & { status?: number }> {
  const result = await executeTool(tool, params || {}, user);
  const formatted = formatToolResult(tool, result);
  return { ...formatted, tool, status: result.status };
}

export { getToolsForRole };
