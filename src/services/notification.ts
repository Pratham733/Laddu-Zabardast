import nodemailer from "nodemailer";
import twilio from "twilio";

// Add types for the function arguments
interface SendOrderEmailArgs {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendOrderEmail({ to, subject, text, html }: SendOrderEmailArgs) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    });
    console.log(`[Email] Order confirmation sent to ${to}`);
    console.log('[Email] sendMail response:', info);
  } catch (err) {
    console.error(`[Email] Failed to send order confirmation to ${to}:`, err);
    throw err;
  }
}

interface SendOrderWhatsAppArgs {
  to: string; // e.g., +918826225551
  message: string;
}

export async function sendOrderWhatsApp({ to, message }: SendOrderWhatsAppArgs) {
  // Normalize and validate phone number (must be in E.164 format, e.g., +919999999999)
  if (!to || typeof to !== 'string' || !/^\+\d{10,15}$/.test(to.trim())) {
    console.warn(`[WhatsApp] No valid phone number provided ('${to}'), skipping WhatsApp notification.`);
    return;
  }
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID as string,
      process.env.TWILIO_AUTH_TOKEN as string
    );
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to.trim()}`,
      body: message,
    });
    console.log(`[WhatsApp] Message sent to ${to}:`, response.sid);
  } catch (err) {
    console.error(`[WhatsApp] Failed to send message to ${to}:`, err);
  }
}
