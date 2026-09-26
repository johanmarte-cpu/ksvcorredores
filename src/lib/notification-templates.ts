import { emailShell, BRAND_GREEN } from "./email";
import { formatCurrency, formatDate } from "./format";

export function paymentReminderEmail(params: {
  clientName: string;
  policyNumber: string;
  amount: number;
  dueDate: Date;
}) {
  const { clientName, policyNumber, amount, dueDate } = params;
  return emailShell(
    "Recordatorio de pago",
    `
    <p>Hola ${clientName},</p>
    <p>Te recordamos que tienes una cuota pendiente de tu póliza <strong>${policyNumber}</strong>:</p>
    <table style="width:100%; margin:16px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0; color:#5b6b7d;">Monto</td>
        <td style="padding:8px 0; text-align:right; font-weight:bold;">${formatCurrency(amount)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#5b6b7d;">Fecha de vencimiento</td>
        <td style="padding:8px 0; text-align:right; font-weight:bold;">${formatDate(dueDate)}</td>
      </tr>
    </table>
    <p>Si ya realizaste este pago, puedes ignorar este mensaje. Cualquier duda, contáctanos.</p>
    `,
  );
}

export function renewalNoticeEmail(params: {
  clientName: string;
  policyNumber: string;
  insurerName: string;
  endDate: Date;
}) {
  const { clientName, policyNumber, insurerName, endDate } = params;
  return emailShell(
    "Tu póliza está próxima a vencer",
    `
    <p>Hola ${clientName},</p>
    <p>Tu póliza <strong>${policyNumber}</strong> con <strong>${insurerName}</strong> vence el <strong>${formatDate(endDate)}</strong>.</p>
    <p>Nos pondremos en contacto contigo para gestionar la renovación. Si tienes alguna pregunta, escríbenos.</p>
    `,
  );
}

export function birthdayEmail(params: { clientName: string }) {
  const { clientName } = params;
  return emailShell(
    "¡Feliz cumpleaños! 🎉",
    `
    <p>Hola ${clientName},</p>
    <p>Todo el equipo de <strong>KSV Corredores de Seguros</strong> te desea un muy feliz cumpleaños.</p>
    <p style="color:${BRAND_GREEN}; font-weight:bold;">¡Gracias por confiar en nosotros!</p>
    `,
  );
}
