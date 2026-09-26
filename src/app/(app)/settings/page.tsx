import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";
import { DomainSection } from "./domain-section";
import { getDomainStatus } from "./domain-actions";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [settings, domain] = await Promise.all([getSettings(), getDomainStatus()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Parámetros generales del sistema.</p>
      </div>

      <SettingsForm
        itbisRate={Number(settings.itbisRate)}
        downPaymentRate={Number(settings.downPaymentRate)}
        paymentReminderDays={settings.paymentReminderDays}
        renewalNoticeDays={settings.renewalNoticeDays}
        companyName={settings.companyName}
        companyTaxId={settings.companyTaxId ?? ""}
        companyPhone={settings.companyPhone ?? ""}
        companyEmail={settings.companyEmail ?? ""}
        companyAddress={settings.companyAddress ?? ""}
        emailFromName={settings.emailFromName ?? ""}
        emailFromAddress={settings.emailFromAddress ?? ""}
        hasResendApiKey={!!settings.resendApiKey || !!process.env.RESEND_API_KEY}
        notifyPaymentReminders={settings.notifyPaymentReminders}
        notifyRenewalNotices={settings.notifyRenewalNotices}
        notifyBirthdays={settings.notifyBirthdays}
      />

      <DomainSection domain={domain} />
    </div>
  );
}
