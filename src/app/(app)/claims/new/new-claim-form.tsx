"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClaim } from "../actions";

type Policy = { id: string; policyNumber: string; clientName: string };

export function NewClaimForm({ policies, defaultPolicyId }: { policies: Policy[]; defaultPolicyId?: string }) {
  const [state, formAction, pending] = useActionState(createClaim, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Póliza relacionada</Label>
        <Select name="policyId" defaultValue={defaultPolicyId} required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una póliza" />
          </SelectTrigger>
          <SelectContent>
            {policies.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.policyNumber} — {p.clientName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="caseNumber">Número de caso</Label>
        <Input id="caseNumber" name="caseNumber" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="claimType">Tipo de siniestro</Label>
          <Input id="claimType" name="claimType" placeholder="Colisión, robo, incendio..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incidentDate">Fecha del siniestro</Label>
          <Input id="incidentDate" name="incidentDate" type="date" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear reclamación"}
      </Button>
    </form>
  );
}
