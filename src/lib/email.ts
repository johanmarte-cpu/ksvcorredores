import { Resend } from "resend";

export async function sendEmail({
  to,
  subject,
  html,
  apiKey,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  apiKey: string | null;
  from: string;
}) {
  if (!apiKey) {
    console.warn("Resend API key no configurada — correo no enviado:", subject, "->", to);
    return { skipped: true };
  }
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, html });
  if (result.error) throw new Error(result.error.message);
  return result;
}

const BRAND_NAVY = "#06336c";
const BRAND_GREEN = "#2c8470";

/** Wraps inner HTML in a simple branded email shell. */
export function emailShell(title: string, bodyHtml: string, companyName: string = "KSV Corredores de Seguros") {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f6f8fa; padding:24px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0;">
      <div style="background:${BRAND_NAVY}; padding:20px 24px;">
        <span style="color:#ffffff; font-size:18px; font-weight:bold;">${companyName}</span>
      </div>
      <div style="padding:24px; color:#0f1b2a; font-size:14px; line-height:1.6;">
        <h1 style="font-size:18px; margin:0 0 16px; color:${BRAND_NAVY};">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px; background:#f6f8fa; color:#5b6b7d; font-size:12px;">
        Este es un mensaje automático de ${companyName}.
      </div>
    </div>
  </div>`;
}

export { BRAND_NAVY, BRAND_GREEN };
