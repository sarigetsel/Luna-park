const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const {
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  emailFrom,
  nodeEnv,
} = require('../config/env');
const { generateBarcodePng } = require('./barcode');

const ticketsLogDir = path.join(__dirname, '../../logs/tickets');

function formatTicketType(order) {
  if (order.ticketType === 'full_day') {
    return 'יום שלם';
  }
  if (order.ticketType === 'hourly') {
    if (order.startHour != null && order.endHour != null) {
      const pad = (h) => String(h).padStart(2, '0');
      return `לפי שעה (${pad(order.startHour)}:00–${pad(order.endHour)}:00)`;
    }
    return `לפי שעה (${order.hoursAmount} שעות)`;
  }
  const rideName = order.rideId?.name || 'מתקן';
  return `מתקן: ${rideName}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildEmailHtml(userName, order) {
  const visitDate = formatDate(order.chosenDate);
  const ticketType = formatTicketType(order);
  const discountLine =
    order.discountApplied > 0
      ? `<p><strong>הנחה:</strong> ₪${order.discountApplied}</p>`
      : '';

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2>לונה פארק — אישור הזמנה</h2>
      <p>שלום ${userName},</p>
      <p>תודה על ההזמנה! הנה פרטי הכרטיס שלך:</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
        <p><strong>קוד כרטיס:</strong> ${order.ticketCode}</p>
        <p><strong>תאריך ביקור:</strong> ${visitDate}</p>
        <p><strong>סוג:</strong> ${ticketType}</p>
        <p><strong>מחיר בסיס:</strong> ₪${order.totalPrice}</p>
        ${discountLine}
        <p><strong>סה״כ שולם:</strong> ₪${order.finalPrice}</p>
        ${order.couponCode ? `<p><strong>קופון:</strong> ${order.couponCode}</p>` : ''}
        <p><strong>סטטוס:</strong> אושר</p>
      </div>
      <p>הציגו את הברקוד בכניסה לפארק:</p>
      <img src="cid:barcode" alt="ברקוד כניסה" style="max-width:100%;" />
      <p style="color:#666;font-size:14px;">שמרו על מייל זה או צלמו את הברקוד.</p>
    </div>
  `;
}

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

async function saveTicketLocally(userEmail, order, barcodeBuffer, html) {
  if (!fs.existsSync(ticketsLogDir)) {
    fs.mkdirSync(ticketsLogDir, { recursive: true });
  }
  const base = path.join(ticketsLogDir, order.ticketCode);
  fs.writeFileSync(`${base}.png`, barcodeBuffer);
  fs.writeFileSync(
    `${base}.html`,
    `<!DOCTYPE html><html lang="he" dir="rtl"><body>${html.replace('cid:barcode', `${order.ticketCode}.png`)}</body></html>`
  );
  console.log(`Ticket saved locally for ${userEmail}: server/logs/tickets/${order.ticketCode}.html`);
  return `logs/tickets/${order.ticketCode}.html`;
}

async function sendOrderConfirmationEmail(user, order) {
  if (!user?.email || !order?.ticketCode) {
    return { sent: false, reason: 'missing_data' };
  }

  const barcodeBuffer = await generateBarcodePng(order.ticketCode);
  const html = buildEmailHtml(user.name, order);
  const transporter = getTransporter();

  if (!transporter) {
    const localPath = await saveTicketLocally(user.email, order, barcodeBuffer, html);
    return {
      sent: false,
      reason: 'smtp_not_configured',
      localPath,
      hint: 'הוסיפי SMTP_HOST, SMTP_USER ו-SMTP_PASS לקובץ .env לשליחת אימייל אמיתי',
    };
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject: `לונה פארק — אישור הזמנה ${order.ticketCode}`,
      html,
      attachments: [
        {
          filename: `ticket-${order.ticketCode}.png`,
          content: barcodeBuffer,
          cid: 'barcode',
        },
      ],
    });
    console.log(`Order confirmation sent to ${user.email} (${order.ticketCode})`);
    return { sent: true };
  } catch (err) {
    console.error(`Failed to send order email to ${user.email}:`, err.message);
    const localPath = await saveTicketLocally(user.email, order, barcodeBuffer, html);
    return { sent: false, reason: 'smtp_error', error: err.message, localPath };
  }
}

module.exports = { sendOrderConfirmationEmail, generateBarcodePng };
