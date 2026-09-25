"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { selectQuoteOption } from "../actions";

export function SelectOptionButton({ quoteId, quoteOptionId }: { quoteId: string; quoteOptionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => selectQuoteOption(quoteId, quoteOptionId))}
    >
      Seleccionar
    </Button>
  );
}
