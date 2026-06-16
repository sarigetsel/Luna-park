import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const port = Number(process.env.PORT) || 3000;
export const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luna-park';
export const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
export const nodeEnv = process.env.NODE_ENV || 'development';
export const fullDayPrice = Number(process.env.FULL_DAY_PRICE) || 50;
export const hourlyRate = Number(process.env.HOURLY_RATE) || 15;
export const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
export const adminName = process.env.ADMIN_NAME || 'מנהל לונה פארק';
export const adminEmail =
  (process.env.ADMIN_EMAIL || '').trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'admin@luna-park.local');
export const adminPassword =
  (process.env.ADMIN_PASSWORD || '').trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'change-me-admin');
export const smtpHost = (process.env.SMTP_HOST || '').trim();
export const smtpPort = Number(process.env.SMTP_PORT) || 587;
export const smtpUser = (process.env.SMTP_USER || '').trim();
export const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
export const emailFrom = process.env.EMAIL_FROM || 'לונה פארק <noreply@luna-park.local>';
export const clientOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
export const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
export const geminiModel = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
