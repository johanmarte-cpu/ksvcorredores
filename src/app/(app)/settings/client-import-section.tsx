"use client";

import { useActionState, useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importClients } from "./import-actions";

export function ClientImportSection() {
  const [state, formAction, pending] = useActionState(importClients, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Carga masiva de clientes</CardTitle>
        <CardDescription>
          Descarga la plantilla de ejemplo, complétala con tus clientes y súbela para crearlos todos de una vez. Formatos aceptados:
          .xlsx, .xls y .csv.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <a href="/api/settings/client-import-template" download>
            <Download className="h-4 w-4" />
            Descargar plantilla de ejemplo
          </a>
        </Button>

        <form
          ref={formRef}
          action={(formData) => {
            formAction(formData);
            formRef.current?.reset();
          }}
          className="flex flex-wrap items-center gap-3 border-t pt-4"
        >
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            required
            className="max-w-xs text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/70"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <Upload className="h-4 w-4" />
            {pending ? "Importando..." : "Importar"}
          </Button>
        </form>

        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

        {state && "success" in state && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <p>
              <span className="font-medium text-emerald-600">{state.inserted}</span> cliente(s) importado(s)
              {state.skipped > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-amber-600">{state.skipped}</span> omitido(s)
                </>
              )}
            </p>
            {state.errors.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {state.errors.map((e, i) => (
                  <li key={i}>
                    Fila {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
