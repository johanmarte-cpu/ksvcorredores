"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markPaymentPaid } from "../policies/actions";

export function MarkPaidCell({ policyId, paymentId }: { policyId: string; paymentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => markPaymentPaid(policyId, paymentId))}>
      {pending ? "Guardando..." : "Marcar pagado"}
    </Button>
  );
}
