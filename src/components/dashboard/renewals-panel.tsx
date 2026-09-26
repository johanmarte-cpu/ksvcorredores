"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { toneClass } from "@/lib/status-colors";

export type RenewalRow = {
  id: string;
  policyNumber: string;
  clientName: string;
  insurerName: string;
  endDate: Date;
  daysLeft: number;
};

type SortKey = "urgency" | "client" | "insurer";

const SORT_LABELS: Record<SortKey, string> = {
  urgency: "Vence pronto",
  client: "Cliente (A-Z)",
  insurer: "Aseguradora (A-Z)",
};

export function RenewalsPanel({ renewals }: { renewals: RenewalRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("urgency");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = renewals.filter((r) => {
      if (urgentOnly && r.daysLeft > 7) return false;
      if (!q) return true;
      return (
        r.clientName.toLowerCase().includes(q) ||
        r.policyNumber.toLowerCase().includes(q) ||
        r.insurerName.toLowerCase().includes(q)
      );
    });
    return rows.sort((a, b) => {
      if (sort === "client") return a.clientName.localeCompare(b.clientName);
      if (sort === "insurer") return a.insurerName.localeCompare(b.insurerName);
      return a.daysLeft - b.daysLeft;
    });
  }, [renewals, query, sort, urgentOnly]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar cliente, póliza o aseguradora..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 max-w-56"
        />
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setUrgentOnly((v) => !v)}
          className={`h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
            urgentOnly
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-input text-muted-foreground hover:bg-muted"
          }`}
        >
          Solo urgentes (≤7d)
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} de {renewals.length}
        </span>
      </div>

      {renewals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay pólizas por vencer en los próximos 30 días.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguna póliza coincide con el filtro.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Póliza</TableHead>
              <TableHead>Aseguradora</TableHead>
              <TableHead>Vence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const urgent = p.daysLeft <= 7;
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.clientName}</TableCell>
                  <TableCell>
                    <Link href={`/policies/${p.id}`} className="underline underline-offset-2">
                      {p.policyNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{p.insurerName}</TableCell>
                  <TableCell>
                    <Badge className={toneClass(urgent ? "rose" : "amber")}>{formatDate(p.endDate)}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
