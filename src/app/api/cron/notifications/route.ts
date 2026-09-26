import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { paymentReminderEmail, renewalNoticeEmail, birthdayEmail } from "@/lib/notification-templates";
import { clientDisplayName } from "@/lib/format";
import { getSettings } from "@/lib/settings";

// Policy/payment dates are date-only values stored as UTC midnight (see src/lib/format.ts).
// This must compute "N days from now" the same way — in UTC — or the match drifts by a
// day depending on which timezone the server process happens to run in.
function dayRange(daysFromNow: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow + 1));
  return { start, end };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  const results = { paymentReminders: 0, renewalNotices: 0, birthdays: 0, errors: [] as string[] };

  // ── Recordatorios de pago ──
  const paymentRange = dayRange(settings.paymentReminderDays);
  const duePayments = await prisma.policyPayment.findMany({
    where: {
      status: "PENDING",
      reminderSentAt: null,
      dueDate: { gte: paymentRange.start, lt: paymentRange.end },
    },
    include: { policy: { include: { client: true } } },
  });
  for (const payment of duePayments) {
    const { client } = payment.policy;
    if (!client.email) continue;
    try {
      await sendEmail({
        to: client.email,
        subject: `Recordatorio de pago — Póliza ${payment.policy.policyNumber}`,
        html: paymentReminderEmail({
          clientName: clientDisplayName(client),
          policyNumber: payment.policy.policyNumber,
          amount: Number(payment.amount),
          dueDate: payment.dueDate,
          companyName: settings.companyName,
        }),
      });
      await prisma.policyPayment.update({ where: { id: payment.id }, data: { reminderSentAt: new Date() } });
      results.paymentReminders++;
    } catch (e) {
      results.errors.push(`payment ${payment.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // ── Aviso de renovación ──
  const renewalRange = dayRange(settings.renewalNoticeDays);
  const expiringPolicies = await prisma.policy.findMany({
    where: {
      status: "ACTIVE",
      renewalNoticeSentAt: null,
      endDate: { gte: renewalRange.start, lt: renewalRange.end },
    },
    include: { client: true, insurer: true },
  });
  for (const policy of expiringPolicies) {
    if (!policy.client.email) continue;
    try {
      await sendEmail({
        to: policy.client.email,
        subject: `Tu póliza ${policy.policyNumber} está próxima a vencer`,
        html: renewalNoticeEmail({
          clientName: clientDisplayName(policy.client),
          policyNumber: policy.policyNumber,
          insurerName: policy.insurer.name,
          endDate: policy.endDate,
          companyName: settings.companyName,
        }),
      });
      await prisma.policy.update({ where: { id: policy.id }, data: { renewalNoticeSentAt: new Date() } });
      results.renewalNotices++;
    } catch (e) {
      results.errors.push(`policy ${policy.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // ── Cumpleaños ──
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const birthdayClients = await prisma.client.findMany({
    where: { type: "PERSON", birthDate: { not: null }, email: { not: null } },
  });
  for (const client of birthdayClients) {
    if (!client.birthDate || !client.email) continue;
    const sameDay = client.birthDate.getUTCMonth() === today.getUTCMonth() && client.birthDate.getUTCDate() === today.getUTCDate();
    if (!sameDay || client.lastBirthdayEmailYear === currentYear) continue;
    try {
      await sendEmail({
        to: client.email,
        subject: `¡Feliz cumpleaños de parte de ${settings.companyName}!`,
        html: birthdayEmail({ clientName: clientDisplayName(client), companyName: settings.companyName }),
      });
      await prisma.client.update({ where: { id: client.id }, data: { lastBirthdayEmailYear: currentYear } });
      results.birthdays++;
    } catch (e) {
      results.errors.push(`client ${client.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json(results);
}
