const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const fromName = process.env.SMTP_FROM_NAME || "SALON HAIR SYSTEM";
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

function isConfigured(): boolean {
  return !!(smtpHost && smtpUser && smtpPass);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Đặt lại mật khẩu - SALON HAIR SYSTEM";
  console.log("─── EMAIL (disabled on Workers free plan) ───");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`URL: ${resetUrl}`);
  console.log("─────────────────────────────────────");
  return;
}
