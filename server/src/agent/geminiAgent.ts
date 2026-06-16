import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { geminiApiKey, geminiModel } from '../config/env';
import { executeTool, formatToolResult, type FormattedResult } from './agentService';
import { getUserRole } from './tools';
import { toGeminiFunctionDeclarations } from './geminiTools';
import type { AuthUser } from '../types';

const MAX_TOOL_ROUNDS = 5;

function buildSystemPrompt(user: AuthUser | null): string {
  const role = getUserRole(user);
  const userLine = user ? `המשתמש מחובר: ${user.email} (${role}).` : 'המשתמש אורח (לא מחובר).';

  const adminCrud =
    role === 'admin'
      ? `
CRUD מתקנים (admin בלבד):
- list_rides / get_ride — קריאה (get_ride עם rideName או id)
- create_ride — יצירה (name, price חובה)
- update_ride — עדכון לפי rideName (לא צריך id!): למשל { rideName: "מגלשת המים הכחולה", price: 40 }
- delete_ride — מחיקה לפי rideName או id

CRUD קופונים (admin):
- list_coupons, create_coupon, update_coupon (code + שדות), delete_coupon (code)
- list_orders, validate_ticket`
      : '';

  return `אתה סוכן לונה פארק תל אביב — עוזר בעברית.

${userLine}

כללים:
- ענה תמיד בעברית, בקצרה וידידותית.
- השתמש רק בכלים (functions) שסופקו.
- לסל: cart_show, cart_clear, pick_ride_for_cart, add_to_cart, remove_from_cart.
- add_to_cart דורש customer/admin.
- list_rides להצגת מתקנים.
- my_orders (customer), validate_coupon עם code.
- create_order: ticketType (full_day|hourly|ride) + chosenDate (YYYY-MM-DD).
${adminCrud}
- לעדכון מחיר מתקן: update_ride עם rideName + price — אל תבקש id מהמשתמש.
- אם חסר מידע — שאל בעברית.`;
}

function sanitizeArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!args) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
}

export async function runGeminiAgent(message: string, user: AuthUser | null): Promise<FormattedResult> {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const declarations = toGeminiFunctionDeclarations(user);

  const model = genAI.getGenerativeModel({
    model: geminiModel,
    systemInstruction: buildSystemPrompt(user),
    tools: [{ functionDeclarations: declarations }],
  });

  const chat = model.startChat();
  let response = (await chat.sendMessage(message)).response;

  let lastFormatted: FormattedResult | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = response.functionCalls();
    if (!calls?.length) break;

    const functionResponses: Part[] = [];

    for (const call of calls) {
      const toolId = call.name;
      const params = sanitizeArgs(call.args as Record<string, unknown>);
      const result = await executeTool(toolId, params, user);
      const formatted = formatToolResult(toolId, result);
      lastFormatted = { ...formatted, tool: toolId };

      functionResponses.push({
        functionResponse: {
          name: toolId,
          response: {
            success: result.status < 400,
            status: result.status,
            message: formatted.message,
            data: result.data,
          },
        },
      });
    }

    if (lastFormatted && (!lastFormatted.success || lastFormatted.clientAction)) {
      return lastFormatted;
    }

    response = (await chat.sendMessage(functionResponses)).response;
  }

  if (lastFormatted) {
    const finalText = response.text()?.trim();
    if (finalText) {
      return { ...lastFormatted, message: finalText };
    }
    return lastFormatted;
  }

  const text = response.text()?.trim();
  if (text) {
    return { success: true, message: text };
  }

  return {
    success: false,
    message: 'לא הבנתי. נסי: "הצג מתקנים", "הוסף לסל", או "עזרה"',
  };
}
