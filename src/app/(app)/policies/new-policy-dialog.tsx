"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPolicy } from "./actions";
import { PAYMENT_FREQUENCY_LABELS } from "@/lib/labels";
import { calculateItbis } from "@/lib/tax";
import { formatCurrency } from "@/lib/format";

type Insurer = { id: string; name: string; products: { id: string; name: string }[] };

export function NewPolicyDialog({
  clients,
  insurers,
}: {
  clients: { id: string; name: string }[];
  insurers: Insurer[];
}) {
  const [open, setOpen] = useState(false);
  const [insurerId, setInsurerId] = useState("");
  const [premium, setPremium] = useState("");
  const [state, formAction, pending] = useActionState(createPolicy, undefined);
  const products = insurers.find((i) => i.id === insurerId)?.products ?? [];
  const insurerHasNoProducts = insurerId !== "" && products.length === 0;
  const { itbisAmount, totalAmount } = calculateItbis(Number(premium) || 0);

  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextYear] = useState(() => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nueva póliza
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva póliza</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select name="clientId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Aseguradora</Label>
              <Select name="insurerId" required onValueChange={setInsurerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {insurers.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select name="productId" required disabled={products.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {insurerHasNoProducts && (
            <p className="text-sm text-destructive">
              Esta aseguradora no tiene productos registrados. Agrega uno en su ficha antes de crear la póliza.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="policyNumber">Número de póliza</Label>
            <Input id="policyNumber" name="policyNumber" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="premium">Prima</Label>
              <Input
                id="premium"
                name="premium"
                type="number"
                step="0.01"
                min="0"
                required
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionPercentage">% Comisión</Label>
              <Input id="commissionPercentage" name="commissionPercentage" type="number" step="0.01" min="0" max="100" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Prima</p>
              <p className="font-medium">{formatCurrency(Number(premium) || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ITBIS (16%)</p>
              <p className="font-medium">{formatCurrency(itbisAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Forma de pago</Label>
            <Select name="paymentFrequency" defaultValue="ANNUAL">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio de vigencia</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fin de vigencia</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={nextYear} required />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || insurerHasNoProducts}>
              {pending ? "Creando..." : "Crear póliza"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
