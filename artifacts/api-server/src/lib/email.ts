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

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const whatsappMsg = encodeURIComponent(
    `Hi! I just booked "${data.tourName}" on WavesOfEgypt.\n` +
    `📋 Booking Ref: ${data.bookingRef}\n` +
    `📅 Date: ${data.date}\n` +
    `👥 Travelers: ${data.participants}\n` +
    `💰 Total: $${data.totalPrice}\n\n` +
    `Looking forward to the experience!`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

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
