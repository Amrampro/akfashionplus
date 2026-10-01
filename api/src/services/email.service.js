import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text = "", html, replyTo }) {
  if (!process.env.SMTP_HOST) throw new Error("SMTP is not configured");
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 15000, socketTimeout: 20000,
  });
  return transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "support@akfashionplus.com",
    to, subject, text, html, replyTo,
  });
}

export default { sendEmail };
