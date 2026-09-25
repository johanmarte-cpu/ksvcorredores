"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateRenewalTask, markRenewalStatus } from "./actions";
import { RENEWAL_STATUS_LABELS } from "@/lib/labels";

export function GenerateTaskButton({ policyId }: { policyId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={() => startTransition(() => generateRenewalTask(policyId))}>
      Generar tarea
    </Button>
  );
}

export function RenewalStatusSelect({ renewalId, status }: { renewalId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(() => markRenewalStatus(renewalId, value as "IN_PROGRESS" | "OFFERED" | "RENEWED" | "LAPSED" | "DECLINED"))
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(RENEWAL_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
