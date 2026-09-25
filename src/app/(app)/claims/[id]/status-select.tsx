"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateClaimStatus } from "../actions";
import { CLAIM_STATUS_LABELS } from "@/lib/labels";

export function StatusSelect({ claimId, status }: { claimId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(value) => startTransition(() => updateClaimStatus(claimId, value))}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CLAIM_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
