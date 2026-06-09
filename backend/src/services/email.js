const nodemailer = require('nodemailer');

let cachedTransport = null;
let transportResolved = false;

const appBase = () =>
  process.env.PUBLIC_APP_URL || process.env.PUBLIC_URL || 'http://localhost:8081';

function gmailAppPassword() {
  return (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
}

function isEmailConfigured() {
  if (process.env.EMAIL_ENABLED === 'false') return false;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = gmailAppPassword();
  if (gmailUser && gmailPass) return true;
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function resetTransport() {
  cachedTransport = null;
  transportResolved = false;
}

function getTransport() {
  if (!isEmailConfigured()) {
    transportResolved = true;
    cachedTransport = null;
    return null;
  }

  if (transportResolved) return cachedTransport;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = gmailAppPassword();

  if (gmailUser && gmailPass) {
    cachedTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    transportResolved = true;
    return cachedTransport;
  }

  if (process.env.SMTP_HOST) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    transportResolved = true;
    return cachedTransport;
  }

  cachedTransport = null;
  transportResolved = true;
  return null;
}

function mailFrom() {
  if (process.env.GMAIL_USER) {
    return `"MaltaStart" <${process.env.GMAIL_USER}>`;
  }
  return process.env.SMTP_FROM || 'MaltaStart <noreply@maltstart.com>';
}

function emailShell({ title, heading, bodyHtml, footerNote }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8ec;box-shadow:0 8px 24px rgba(10,110,138,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0A6E8A 0%,#084d63 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#7dd3e8;">MaltaStart</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
              <hr style="border:none;border-top:1px solid #e2e8ec;margin:28px 0;" />
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9a9ab0;">${footerNote}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafbfc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8ec;">
              <p style="margin:0;font-size:11px;color:#9a9ab0;">© ${year} MaltaStart</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function logEmailFailure(err) {
  console.error('[email] gönderilemedi:', err.message);
  if (err.code === 'EAUTH') {
    console.error(
      '[email] Gmail reddetti. Google hesabında 2 adımlı doğrulama açık olmalı; normal şifre yerine "Uygulama şifresi" kullanın.'
    );
    console.error('[email] https://support.google.com/mail/?p=BadCredentials');
  }
}

/** Sunucu açılışında bilgi; hata olsa bile process çökmez */
async function logEmailStatus() {
  if (process.env.EMAIL_ENABLED === 'false') {
    console.warn('[email] EMAIL_ENABLED=false – e-posta gönderimi kapalı (dev linkleri API yanıtında).');
    return;
  }
  if (!isEmailConfigured()) {
    console.warn(
      '[email] GMAIL_USER + GMAIL_APP_PASSWORD (veya SMTP_*) tanımlı değil – development modunda doğrulama linkleri API yanıtında döner.'
    );
    return;
  }

  const label = process.env.GMAIL_USER
    ? `Gmail (${process.env.GMAIL_USER})`
    : `SMTP (${process.env.SMTP_HOST})`;
  console.log(`[email] Yapılandırıldı: ${label}`);

  const transport = getTransport();
  if (!transport?.verify) return;

  try {
    await transport.verify();
    console.log('[email] SMTP bağlantısı doğrulandı.');
  } catch (err) {
    logEmailFailure(err);
    resetTransport();
  }
}

async function sendMail({ to, subject, html, text }) {
  const transport = getTransport();

  if (!transport) {
    console.warn('[email] yapılandırılmadı (konsol):', { to, subject });
    return { dev: true, skipped: true };
  }

  try {
    await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html,
    });
    console.log('[email] sent', { to, subject });
    return { sent: true };
  } catch (err) {
    logEmailFailure(err);
    resetTransport();
    return { dev: true, sent: false, error: err.message };
  }
}

async function sendVerificationEmail(user, token) {
  const link = `${appBase()}/verify-email?token=${token}`;
  const ttlHours = 24;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3a3a4a;">Merhaba <strong>${user.name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a3a4a;">
      MaltaStart hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayın veya kodu uygulamaya yapıştırın.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:0 0 20px;">
          <a href="${link}" style="display:inline-block;background-color:#0A6E8A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">E-postamı doğrula</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="background-color:#f0f9fb;border:1px solid #cce8f0;border-radius:12px;padding:16px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6e6e80;">Bağlantı</p>
          <p style="margin:0;font-size:12px;word-break:break-all;color:#0A6E8A;">${link}</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6e6e80;text-align:center;">
      Bu bağlantı ${ttlHours} saat geçerlidir.
    </p>`;

  const html = emailShell({
    title: 'E-posta doğrulama',
    heading: 'E-postanızı doğrulayın',
    bodyHtml,
    footerNote: 'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
  });

  const text = `Merhaba ${user.name},\n\nHesabınızı doğrulamak için: ${link}\n\nBu bağlantı ${ttlHours} saat geçerlidir.`;

  return sendMail({
    to: user.email,
    subject: 'MaltaStart – E-posta doğrulama',
    text,
    html,
  });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${appBase()}/reset-password?token=${token}`;
  const ttlHours = 1;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3a3a4a;">Merhaba <strong>${user.name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a3a4a;">
      Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:0 0 20px;">
          <a href="${link}" style="display:inline-block;background-color:#0A6E8A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">Şifremi sıfırla</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="background-color:#f0f9fb;border:1px solid #cce8f0;border-radius:12px;padding:16px;">
          <p style="margin:0;font-size:12px;word-break:break-all;color:#0A6E8A;">${link}</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6e6e80;text-align:center;">
      Bu bağlantı ${ttlHours} saat geçerlidir.
    </p>`;

  const html = emailShell({
    title: 'Şifre sıfırlama',
    heading: 'Şifre sıfırlama',
    bodyHtml,
    footerNote: 'Şifre sıfırlama talebinde bulunmadıysanız bu e-postayı yok sayın.',
  });

  const text = `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için: ${link}\n\nBu bağlantı ${ttlHours} saat geçerlidir.`;

  return sendMail({
    to: user.email,
    subject: 'MaltaStart – Şifre sıfırlama',
    text,
    html,
  });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  appBase,
  logEmailStatus,
  isEmailConfigured,
};
