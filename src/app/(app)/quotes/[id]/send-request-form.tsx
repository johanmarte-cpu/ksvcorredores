"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendQuoteRequest } from "../actions";

type Insurer = { id: string; name: string; products: { id: string; name: string }[] };

export function SendRequestForm({ quoteId, insurers }: { quoteId: string; insurers: Insurer[] }) {
  const [state, formAction, pending] = useActionState(sendQuoteRequest, undefined);
  const [insurerId, setInsurerId] = useState<string>("");
  const products = insurers.find((i) => i.id === insurerId)?.products ?? [];

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="quoteId" value={quoteId} />
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Aseguradora</label>
        <Select name="insurerId" required onValueChange={setInsurerId}>
          <SelectTrigger className="w-48">
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
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Producto</label>
        <Select name="productId" disabled={products.length === 0}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Opcional" />
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
      <Button type="submit" size="sm" disabled={pending || !insurerId}>
        Enviar solicitud
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
