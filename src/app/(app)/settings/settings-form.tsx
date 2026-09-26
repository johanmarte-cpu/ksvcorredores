"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "./actions";

export function SettingsForm(props: {
  itbisRate: number;
  downPaymentRate: number;
  paymentReminderDays: number;
  renewalNoticeDays: number;
  companyName: string;
  companyTaxId: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
}) {
  const [state, formAction, pending] = useActionState(updateSettings, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pólizas y pagos</CardTitle>
          <CardDescription>Aplican a las pólizas creadas a partir de ahora.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="itbisRate">ITBIS (%)</Label>
            <Input id="itbisRate" name="itbisRate" type="number" step="0.01" min="0" max="100" defaultValue={props.itbisRate} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="downPaymentRate">Inicial (%)</Label>
            <Input
              id="downPaymentRate"
              name="downPaymentRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={props.downPaymentRate}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentReminderDays">Aviso de pago (días antes)</Label>
            <Input
              id="paymentReminderDays"
              name="paymentReminderDays"
              type="number"
              step="1"
              min="0"
              max="90"
              defaultValue={props.paymentReminderDays}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renewalNoticeDays">Aviso de renovación (días antes)</Label>
            <Input
              id="renewalNoticeDays"
              name="renewalNoticeDays"
              type="number"
              step="1"
              min="0"
              max="180"
              defaultValue={props.renewalNoticeDays}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la empresa</CardTitle>
          <CardDescription>Se muestran en correos y documentos impresos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre</Label>
            <Input id="companyName" name="companyName" defaultValue={props.companyName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyTaxId">RNC</Label>
            <Input id="companyTaxId" name="companyTaxId" defaultValue={props.companyTaxId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Teléfono</Label>
            <Input id="companyPhone" name="companyPhone" defaultValue={props.companyPhone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Correo</Label>
            <Input id="companyEmail" name="companyEmail" type="email" defaultValue={props.companyEmail} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="companyAddress">Dirección</Label>
            <Input id="companyAddress" name="companyAddress" defaultValue={props.companyAddress} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">Configuración actualizada</p>}
      </div>
    </form>
  );
}
