"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleReferrerActive } from "./actions";

export function ToggleReferrerActiveButton({ referrerId, active }: { referrerId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => toggleReferrerActive(referrerId, !active))}
    >
      {active ? "Desactivar" : "Activar"}
    </Button>
  );
}
