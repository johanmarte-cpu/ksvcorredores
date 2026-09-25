"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserActive } from "./actions";

export function ToggleActiveButton({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => toggleUserActive(userId, !active))}
    >
      {active ? "Desactivar" : "Activar"}
    </Button>
  );
}
