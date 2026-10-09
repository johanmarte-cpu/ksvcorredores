import { emailShell, BRAND_GREEN } from "./email";
import { formatCurrency, formatDate } from "./format";

export function paymentReminderEmail(params: {
  clientName: string;
  policyNumber: string;
  amount: number;
  dueDate: Date;
  companyName: string;
}) {
  const { clientName, policyNumber, amount, dueDate, companyName } = params;
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
    companyName,
  );
}

export function renewalNoticeEmail(params: {
  clientName: string;
  policyNumber: string;
  insurerName: string;
  endDate: Date;
  companyName: string;
}) {
  const { clientName, policyNumber, insurerName, endDate, companyName } = params;
  return emailShell(
    "Tu póliza está próxima a vencer",
    `
    <p>Hola ${clientName},</p>
    <p>Tu póliza <strong>${policyNumber}</strong> con <strong>${insurerName}</strong> vence el <strong>${formatDate(endDate)}</strong>.</p>
    <p>Nos pondremos en contacto contigo para gestionar la renovación. Si tienes alguna pregunta, escríbenos.</p>
    `,
    companyName,
  );
}

export function birthdayEmail(params: { clientName: string; companyName: string }) {
  const { clientName, companyName } = params;
  return emailShell(
    "¡Feliz cumpleaños! 🎉",
    `
    <p>Hola ${clientName},</p>
    <p>Todo el equipo de <strong>${companyName}</strong> te desea un muy feliz cumpleaños.</p>
    <p style="color:${BRAND_GREEN}; font-weight:bold;">¡Gracias por confiar en nosotros!</p>
    `,
    companyName,
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type DigestTask = { title: string; dueDate: Date | null; priority: string };

/** Resumen diario de la agenda para un usuario interno: tareas vencidas y tareas para hoy. */
export function taskDigestEmail(params: {
  userName: string;
  overdue: DigestTask[];
  today: DigestTask[];
  agendaUrl: string;
  companyName: string;
  priorityLabels: Record<string, string>;
}) {
  const { userName, overdue, today, agendaUrl, companyName, priorityLabels } = params;
  const list = (tasks: DigestTask[], showDate: boolean) => `
    <ul style="margin:8px 0 16px; padding-left:20px;">
      ${tasks
        .map(
          (t) =>
            `<li style="margin:4px 0;">${escapeHtml(t.title)} <span style="color:#5b6b7d;">· ${priorityLabels[t.priority] ?? t.priority}${
              showDate && t.dueDate ? ` · venció el ${formatDate(t.dueDate)}` : ""
            }</span></li>`,
        )
        .join("")}
    </ul>`;

  return emailShell(
    "Tu agenda de hoy",
    `
    <p>Hola ${escapeHtml(userName)},</p>
    ${overdue.length ? `<p style="color:#be123c; font-weight:bold; margin-bottom:0;">Tareas vencidas (${overdue.length})</p>${list(overdue, true)}` : ""}
    ${today.length ? `<p style="font-weight:bold; margin-bottom:0;">Para hoy (${today.length})</p>${list(today, false)}` : ""}
    <p><a href="${agendaUrl}" style="color:${BRAND_GREEN}; font-weight:bold;">Abrir la agenda</a></p>
    `,
    companyName,
  );
}
