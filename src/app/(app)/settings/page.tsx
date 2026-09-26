import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const settings = await getSettings();

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
      />
    </div>
  );
}
