export async function sendEmail({ to, subject, text = "", html = "" }) {
  if (!process.env.SMTP_HOST) {
    return {
      skipped: true,
      to,
      subject,
      reason: "SMTP is not configured",
    };
  }

  return {
    queued: true,
    to,
    subject,
    text,
    html,
  };
}

export default { sendEmail };
