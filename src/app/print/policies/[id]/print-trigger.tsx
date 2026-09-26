"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintTrigger() {
  return (
    <div className="print:hidden fixed right-6 top-6">
      <Button onClick={() => window.print()}>
        <Printer className="mr-1 h-4 w-4" /> Imprimir / Guardar PDF
      </Button>
    </div>
  );
}
