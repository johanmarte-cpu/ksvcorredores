"use client";

import { useActionState, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { registerDomain, verifyDomain, removeDomain } from "./domain-actions";
import { statusClass, DOMAIN_STATUS_TONE } from "@/lib/status-colors";
import { DOMAIN_STATUS_LABELS } from "@/lib/labels";

type DomainRecord = {
  record: string;
  name: string;
  type: string;
  value: string;
  ttl: string;
  status: string;
  priority?: number;
};

type DomainInfo = { name: string; status: string; records: DomainRecord[] };

export function DomainSection({ domain }: { domain: DomainInfo | { error: string } | null }) {
  const [state, formAction, pending] = useActionState(registerDomain, undefined);
  const [verifyPending, startVerify] = useTransition();
  const [removePending, startRemove] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  if (!domain || "error" in domain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dominio de envío</CardTitle>
          <CardDescription>
            Verifica tu propio dominio en Resend para enviar correos desde una dirección como notificaciones@tudominio.com en lugar de
            un dominio genérico, y evitar que lleguen marcados como spam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {domain && "error" in domain && <p className="text-sm text-destructive">{domain.error}</p>}
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="domain">Dominio</Label>
              <Input id="domain" name="domain" placeholder="ksvcorredores.com" required />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando..." : "Registrar dominio"}
            </Button>
          </form>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">Dominio registrado. Agrega los registros DNS que aparecen abajo.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Dominio de envío</CardTitle>
          <CardDescription>{domain.name}</CardDescription>
        </div>
        <Badge className={statusClass(DOMAIN_STATUS_TONE, domain.status)}>{DOMAIN_STATUS_LABELS[domain.status] ?? domain.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Agrega estos registros en el proveedor DNS de tu dominio (donde lo compraste: GoDaddy, Namecheap, Cloudflare, etc.). Una vez
          propagados —puede tardar hasta 48 horas— pulsa &quot;Verificar ahora&quot;.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nombre (host)</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domain.records.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap">
                    {r.record} ({r.type})
                  </TableCell>
                  <TableCell className="font-mono text-xs break-all">{r.name}</TableCell>
                  <TableCell className="max-w-sm font-mono text-xs break-all">
                    {r.value}
                    {r.priority !== undefined && <span className="ml-1 text-muted-foreground">(prioridad {r.priority})</span>}
                  </TableCell>
                  <TableCell>{r.ttl}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(DOMAIN_STATUS_TONE, r.status)}>{DOMAIN_STATUS_LABELS[r.status] ?? r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" disabled={verifyPending} onClick={() => startVerify(() => verifyDomain())}>
            {verifyPending ? "Verificando..." : "Verificar ahora"}
          </Button>
          {confirmingRemove ? (
            <>
              <span className="text-sm text-muted-foreground">¿Quitar este dominio?</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={removePending}
                onClick={() => startRemove(() => removeDomain())}
              >
                Confirmar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingRemove(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setConfirmingRemove(true)}>
              Quitar dominio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
