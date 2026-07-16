import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const fromName = process.env.SMTP_FROM_NAME || "SALON HAIR SYSTEM";
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

function isConfigured(): boolean {
  return !!(smtpHost && smtpUser && smtpPass);
}

function getTransport() {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Đặt lại mật khẩu - SALON HAIR SYSTEM";
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#a8763e;margin-bottom:16px">Đặt lại mật khẩu</h2>
      <p style="color:#555;line-height:1.6">
        Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}"
           style="display:inline-block;background:#a8763e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.5">
        Liên kết này có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#aaa;font-size:12px">SALON HAIR SYSTEM — Đào tạo • Mỹ phẩm • Cộng đồng</p>
    </div>
  `;

  if (!isConfigured()) {
    console.log("─── EMAIL (SMTP not configured) ───");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`URL: ${resetUrl}`);
    console.log("─────────────────────────────────────");
    return;
  }

  try {
    const transporter = getTransport();
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err);
    throw new Error("Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP.");
  }
}
