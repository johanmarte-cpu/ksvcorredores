"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, createCommissionRate } from "../actions";

const LOB_LABELS: Record<string, string> = {
  AUTO: "Auto",
  LIFE: "Vida",
  HEALTH: "Salud",
  PROPERTY: "Incendio/Hogar",
  LIABILITY: "Responsabilidad civil",
  OTHER: "Otro",
};

export function NewProductForm({ insurerId }: { insurerId: string }) {
  const [state, formAction, pending] = useActionState(createProduct, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="insurerId" value={insurerId} />
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Nombre del producto</label>
        <Input name="name" placeholder="Auto Cobertura Amplia" required className="w-48" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Ramo</label>
        <Select name="lineOfBusiness" defaultValue="AUTO">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LOB_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        Agregar producto
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function NewCommissionForm({ insurerId, products }: { insurerId: string; products: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createCommissionRate, undefined);
  const hasProducts = products.length > 0;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="insurerId" value={insurerId} />
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Producto</label>
        <Select name="productId" required disabled={!hasProducts}>
          <SelectTrigger className="w-48">
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
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">% Comisión</label>
        <Input name="percentage" type="number" step="0.01" min="0" max="100" required className="w-24" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Vigente desde</label>
        <Input name="effectiveFrom" type="date" required />
      </div>
      <Button type="submit" size="sm" disabled={pending || !hasProducts}>
        Agregar tasa
      </Button>
      {!hasProducts && <p className="w-full text-sm text-muted-foreground">Agrega un producto primero.</p>}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
