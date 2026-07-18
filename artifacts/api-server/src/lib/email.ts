import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured — booking confirmation emails will be skipped");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM_ADDRESS = process.env.SMTP_FROM ?? "bookings@wavesofegypt.com";
const WHATSAPP_NUMBER = "201001234567";

export interface BookingEmailData {
  travelerName: string;
  travelerEmail: string;
  bookingRef: string;
  tourName: string;
  date: string;       // formatted string e.g. "August 15, 2025"
  participants: number;
  totalPrice: number;
}

// ── Shared email-content builders ─────────────────────────────────────────────

function buildWhatsappUrl(data: BookingEmailData): string {
  const msg = encodeURIComponent(
    `Hi! I just booked "${data.tourName}" on WavesOfEgypt.\n` +
    `📋 Booking Ref: ${data.bookingRef}\n` +
    `📅 Date: ${data.date}\n` +
    `👥 Travelers: ${data.participants}\n` +
    `💰 Total: $${data.totalPrice}\n\n` +
    `Looking forward to the experience!`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function buildEmailContent(data: BookingEmailData): { html: string; text: string } {
  const whatsappUrl = buildWhatsappUrl(data);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed — WavesOfEgypt</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .hero { background: linear-gradient(135deg, #16a34a, #15803d); padding: 48px 40px 40px; text-align: center; }
    .hero-icon { width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .hero h1 { margin: 0 0 8px; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .hero p { margin: 0; color: #bbf7d0; font-size: 15px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; margin-bottom: 24px; color: #3f3f46; }
    .ref-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .ref-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 4px; }
    .ref-code { font-size: 26px; font-weight: 800; font-family: 'Courier New', monospace; color: #16a34a; letter-spacing: 2px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .detail-cell { background: #f4f4f5; border-radius: 10px; padding: 16px; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 4px; }
    .detail-value { font-size: 15px; font-weight: 600; color: #18181b; }
    .tour-name-row { background: #f4f4f5; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .whatsapp-box { background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .whatsapp-box h3 { margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700; }
    .whatsapp-box p { margin: 0 0 16px; color: #bbf7d0; font-size: 14px; }
    .whatsapp-btn { display: inline-block; background: #ffffff; color: #16a34a; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; }
    .steps { margin-bottom: 28px; }
    .steps h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .step { display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start; }
    .step-num { min-width: 28px; height: 28px; background: #16a34a; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
    .step-text strong { display: block; font-size: 14px; margin-bottom: 2px; }
    .step-text span { font-size: 13px; color: #6b7280; }
    .footer { background: #f4f4f5; padding: 24px 40px; text-align: center; font-size: 13px; color: #a1a1aa; }
    .footer a { color: #16a34a; text-decoration: none; }
    @media (max-width: 480px) {
      .body { padding: 24px 20px; }
      .hero { padding: 32px 20px; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="hero">
      <div class="hero-icon">
        <svg width="36" height="36" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h1>Booking Confirmed!</h1>
      <p>Your adventure is locked in. We can't wait to welcome you to Egypt.</p>
    </div>

    <div class="body">
      <p class="greeting">Hi ${data.travelerName},</p>

      <div class="ref-box">
        <div class="ref-label">Booking Reference</div>
        <div class="ref-code">${data.bookingRef}</div>
      </div>

      <div class="tour-name-row">
        <div class="detail-label">Your Tour</div>
        <div class="detail-value">${data.tourName}</div>
      </div>

      <div class="details-grid">
        <div class="detail-cell">
          <div class="detail-label">📅 Date</div>
          <div class="detail-value">${data.date}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">👥 Travelers</div>
          <div class="detail-value">${data.participants} ${data.participants === 1 ? "person" : "people"}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">💰 Total Paid</div>
          <div class="detail-value">$${data.totalPrice}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">📋 Status</div>
          <div class="detail-value" style="color:#16a34a;">Confirmed</div>
        </div>
      </div>

      <div class="whatsapp-box">
        <h3>Connect with your guide</h3>
        <p>Message us on WhatsApp with your booking reference and we'll send you full trip details, meeting point, and preparation tips.</p>
        <a href="${whatsappUrl}" class="whatsapp-btn">💬 Open WhatsApp Chat</a>
      </div>

      <div class="steps">
        <h3>What happens next?</h3>
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">
            <strong>WhatsApp briefing</strong>
            <span>Our team will message you with the meeting point, timing, and what to bring.</span>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">
            <strong>Day of experience</strong>
            <span>Arrive at the meeting point on time. Show your booking reference to your guide.</span>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">
            <strong>Enjoy the adventure</strong>
            <span>Sit back and let our expert guides show you the best of Egypt.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>This confirmation was sent to <strong>${data.travelerEmail}</strong>.</p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} WavesOfEgypt · <a href="https://wa.me/${WHATSAPP_NUMBER}">Contact us on WhatsApp</a></p>
    </div>
  </div>
</body>
</html>`;

  const text =
    `Booking Confirmed — WavesOfEgypt\n\n` +
    `Hi ${data.travelerName},\n\n` +
    `Your booking is confirmed!\n\n` +
    `Booking Reference: ${data.bookingRef}\n` +
    `Tour: ${data.tourName}\n` +
    `Date: ${data.date}\n` +
    `Travelers: ${data.participants}\n` +
    `Total Paid: $${data.totalPrice}\n\n` +
    `Connect with your guide on WhatsApp: ${whatsappUrl}\n\n` +
    `— The WavesOfEgypt Team`;

  return { html, text };
}

// ── Cancellation email ────────────────────────────────────────────────────────

function buildCancellationEmailContent(data: BookingEmailData): { html: string; text: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Cancelled — WavesOfEgypt</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .hero { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 48px 40px 40px; text-align: center; }
    .hero-icon { width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .hero h1 { margin: 0 0 8px; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .hero p { margin: 0; color: #fecaca; font-size: 15px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; margin-bottom: 24px; color: #3f3f46; }
    .ref-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .ref-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 4px; }
    .ref-code { font-size: 26px; font-weight: 800; font-family: 'Courier New', monospace; color: #dc2626; letter-spacing: 2px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .detail-cell { background: #f4f4f5; border-radius: 10px; padding: 16px; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 4px; }
    .detail-value { font-size: 15px; font-weight: 600; color: #18181b; }
    .tour-name-row { background: #f4f4f5; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .message-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .message-box p { margin: 0; font-size: 15px; color: #3f3f46; line-height: 1.6; }
    .contact-box { background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .contact-box h3 { margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700; }
    .contact-box p { margin: 0 0 16px; color: #fed7aa; font-size: 14px; }
    .contact-btn { display: inline-block; background: #ffffff; color: #ea580c; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; }
    .footer { background: #f4f4f5; padding: 24px 40px; text-align: center; font-size: 13px; color: #a1a1aa; }
    .footer a { color: #dc2626; text-decoration: none; }
    @media (max-width: 480px) {
      .body { padding: 24px 20px; }
      .hero { padding: 32px 20px; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="hero">
      <div class="hero-icon">
        <svg width="36" height="36" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h1>Booking Cancelled</h1>
      <p>We're sorry to let you know your booking has been cancelled.</p>
    </div>

    <div class="body">
      <p class="greeting">Hi ${data.travelerName},</p>

      <div class="message-box">
        <p>Your booking for <strong>${data.tourName}</strong> on <strong>${data.date}</strong> has been cancelled. If you believe this was a mistake or would like to rebook, please contact us.</p>
      </div>

      <div class="ref-box">
        <div class="ref-label">Cancelled Booking Reference</div>
        <div class="ref-code">${data.bookingRef}</div>
      </div>

      <div class="tour-name-row">
        <div class="detail-label">Tour</div>
        <div class="detail-value">${data.tourName}</div>
      </div>

      <div class="details-grid">
        <div class="detail-cell">
          <div class="detail-label">📅 Date</div>
          <div class="detail-value">${data.date}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">👥 Travelers</div>
          <div class="detail-value">${data.participants} ${data.participants === 1 ? "person" : "people"}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">💰 Total</div>
          <div class="detail-value">${data.totalPrice}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">📋 Status</div>
          <div class="detail-value" style="color:#dc2626;">Cancelled</div>
        </div>
      </div>

      <div class="contact-box">
        <h3>Need help or want to rebook?</h3>
        <p>Our team is here to assist you. Reach out on WhatsApp and we'll be happy to help you plan your next adventure.</p>
        <a href="https://wa.me/${WHATSAPP_NUMBER}" class="contact-btn">💬 Contact Us on WhatsApp</a>
      </div>
    </div>

    <div class="footer">
      <p>This notification was sent to <strong>${data.travelerEmail}</strong>.</p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} WavesOfEgypt · <a href="https://wa.me/${WHATSAPP_NUMBER}">Contact us on WhatsApp</a></p>
    </div>
  </div>
</body>
</html>`;

  const text =
    `Booking Cancelled — WavesOfEgypt\n\n` +
    `Hi ${data.travelerName},\n\n` +
    `We're sorry to let you know that your booking has been cancelled.\n\n` +
    `Cancelled Booking Reference: ${data.bookingRef}\n` +
    `Tour: ${data.tourName}\n` +
    `Date: ${data.date}\n` +
    `Travelers: ${data.participants}\n` +
    `Total: ${data.totalPrice}\n\n` +
    `If you believe this was a mistake or would like to rebook, please contact us on WhatsApp: https://wa.me/${WHATSAPP_NUMBER}\n\n` +
    `— The WavesOfEgypt Team`;

  return { html, text };
}

// ── Status update email ───────────────────────────────────────────────────────

export interface BookingStatusUpdateEmailData extends BookingEmailData {
  newStatus: string;
}

function statusLabel(status: string): string {
  switch (status) {
    case "confirmed": return "Confirmed ✅";
    case "completed": return "Completed 🎉";
    case "pending":   return "Pending ⏳";
    default:          return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "confirmed": return "#16a34a";
    case "completed": return "#7c3aed";
    case "pending":   return "#d97706";
    default:          return "#3f3f46";
  }
}

function buildStatusUpdateEmailContent(data: BookingStatusUpdateEmailData): { html: string; text: string } {
  const label = statusLabel(data.newStatus);
  const color = statusColor(data.newStatus);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Updated — WavesOfEgypt</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .hero { background: linear-gradient(135deg, #0369a1, #0284c7); padding: 48px 40px 40px; text-align: center; }
    .hero-icon { width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .hero h1 { margin: 0 0 8px; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .hero p { margin: 0; color: #bae6fd; font-size: 15px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; margin-bottom: 24px; color: #3f3f46; }
    .ref-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .ref-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 4px; }
    .ref-code { font-size: 26px; font-weight: 800; font-family: 'Courier New', monospace; color: #0369a1; letter-spacing: 2px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .detail-cell { background: #f4f4f5; border-radius: 10px; padding: 16px; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 4px; }
    .detail-value { font-size: 15px; font-weight: 600; color: #18181b; }
    .tour-name-row { background: #f4f4f5; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .whatsapp-box { background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .whatsapp-box h3 { margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700; }
    .whatsapp-box p { margin: 0 0 16px; color: #bbf7d0; font-size: 14px; }
    .whatsapp-btn { display: inline-block; background: #ffffff; color: #16a34a; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; }
    .footer { background: #f4f4f5; padding: 24px 40px; text-align: center; font-size: 13px; color: #a1a1aa; }
    .footer a { color: #0369a1; text-decoration: none; }
    @media (max-width: 480px) {
      .body { padding: 24px 20px; }
      .hero { padding: 32px 20px; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="hero">
      <div class="hero-icon">
        <svg width="36" height="36" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
      <h1>Booking Updated</h1>
      <p>Your booking status has been updated by our team.</p>
    </div>

    <div class="body">
      <p class="greeting">Hi ${data.travelerName},</p>

      <div class="ref-box">
        <div class="ref-label">Booking Reference</div>
        <div class="ref-code">${data.bookingRef}</div>
      </div>

      <div class="tour-name-row">
        <div class="detail-label">Your Tour</div>
        <div class="detail-value">${data.tourName}</div>
      </div>

      <div class="details-grid">
        <div class="detail-cell">
          <div class="detail-label">📅 Date</div>
          <div class="detail-value">${data.date}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">👥 Travelers</div>
          <div class="detail-value">${data.participants} ${data.participants === 1 ? "person" : "people"}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">💰 Total</div>
          <div class="detail-value">${data.totalPrice}</div>
        </div>
        <div class="detail-cell">
          <div class="detail-label">📋 New Status</div>
          <div class="detail-value" style="color:${color};">${label}</div>
        </div>
      </div>

      <div class="whatsapp-box">
        <h3>Have questions about your booking?</h3>
        <p>Our team is ready to help. Message us on WhatsApp with your booking reference for any queries.</p>
        <a href="https://wa.me/${WHATSAPP_NUMBER}" class="whatsapp-btn">💬 Open WhatsApp Chat</a>
      </div>
    </div>

    <div class="footer">
      <p>This notification was sent to <strong>${data.travelerEmail}</strong>.</p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} WavesOfEgypt · <a href="https://wa.me/${WHATSAPP_NUMBER}">Contact us on WhatsApp</a></p>
    </div>
  </div>
</body>
</html>`;

  const text =
    `Booking Updated — WavesOfEgypt\n\n` +
    `Hi ${data.travelerName},\n\n` +
    `Your booking status has been updated.\n\n` +
    `Booking Reference: ${data.bookingRef}\n` +
    `Tour: ${data.tourName}\n` +
    `Date: ${data.date}\n` +
    `Travelers: ${data.participants}\n` +
    `Total: ${data.totalPrice}\n` +
    `New Status: ${data.newStatus}\n\n` +
    `For any questions, contact us on WhatsApp: https://wa.me/${WHATSAPP_NUMBER}\n\n` +
    `— The WavesOfEgypt Team`;

  return { html, text };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sends a booking cancellation email.
 * Non-blocking — silently skips when SMTP is not configured.
 */
export async function sendBookingCancelledEmail(data: BookingEmailData): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const { html, text } = buildCancellationEmailContent(data);
  try {
    await transport.sendMail({
      from: `"WavesOfEgypt Bookings" <${FROM_ADDRESS}>`,
      to: data.travelerEmail,
      subject: `❌ Booking Cancelled — ${data.bookingRef}`,
      text,
      html,
    });
    logger.info({ bookingRef: data.bookingRef, to: data.travelerEmail }, "Booking cancellation email sent");
  } catch (err) {
    logger.error({ err, bookingRef: data.bookingRef }, "Failed to send booking cancellation email");
  }
}

/**
 * Sends a booking status-update email (for non-cancellation status changes).
 * Non-blocking — silently skips when SMTP is not configured.
 */
export async function sendBookingStatusUpdateEmail(data: BookingStatusUpdateEmailData): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const { html, text } = buildStatusUpdateEmailContent(data);
  try {
    await transport.sendMail({
      from: `"WavesOfEgypt Bookings" <${FROM_ADDRESS}>`,
      to: data.travelerEmail,
      subject: `📋 Booking Update — ${data.bookingRef}`,
      text,
      html,
    });
    logger.info({ bookingRef: data.bookingRef, to: data.travelerEmail, newStatus: data.newStatus }, "Booking status-update email sent");
  } catch (err) {
    logger.error({ err, bookingRef: data.bookingRef }, "Failed to send booking status-update email");
  }
}

/**
 * Sends a booking confirmation email.
 * Silently skips when SMTP is not configured and swallows transport errors so
 * that email failures never break the booking API response.
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const { html, text } = buildEmailContent(data);
  try {
    await transport.sendMail({
      from: `"WavesOfEgypt Bookings" <${FROM_ADDRESS}>`,
      to: data.travelerEmail,
      subject: `✅ Booking Confirmed — ${data.bookingRef}`,
      text,
      html,
    });
    logger.info({ bookingRef: data.bookingRef, to: data.travelerEmail }, "Booking confirmation email sent");
  } catch (err) {
    logger.error({ err, bookingRef: data.bookingRef }, "Failed to send booking confirmation email");
    // Don't rethrow — email failure should not break the booking response
  }
}

/**
 * Sends a booking confirmation email and THROWS on any failure.
 *
 * Use this when the caller must know whether delivery actually succeeded —
 * for example the admin test-email endpoint. Unlike sendBookingConfirmationEmail:
 * - Throws if SMTP is not configured
 * - Re-throws transport errors so the caller receives the real failure reason
 */
export async function sendBookingConfirmationEmailStrict(data: BookingEmailData): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    throw new Error("SMTP not configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS");
  }

  const { html, text } = buildEmailContent(data);

  // Intentionally let transport errors propagate to the caller
  await transport.sendMail({
    from: `"WavesOfEgypt Bookings" <${FROM_ADDRESS}>`,
    to: data.travelerEmail,
    subject: `✅ Booking Confirmed — ${data.bookingRef}`,
    text,
    html,
  });
  logger.info({ bookingRef: data.bookingRef, to: data.travelerEmail }, "Booking confirmation email sent (strict)");
}
