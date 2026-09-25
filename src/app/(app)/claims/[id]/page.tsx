import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatDate } from "@/lib/format";
import { CLAIM_EVENT_TYPE_LABELS } from "@/lib/labels";
import { StatusSelect } from "./status-select";
import { EventForm } from "./event-form";

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      policy: { include: { client: true, insurer: true } },
      events: { orderBy: { createdAt: "desc" }, include: { author: true } },
    },
  });

  if (!claim) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Caso {claim.caseNumber}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/policies/${claim.policyId}`} className="underline-offset-2 hover:underline">
              {claim.policy.policyNumber}
            </Link>{" "}
            · {clientDisplayName(claim.policy.client)} · {claim.policy.insurer.name}
          </p>
        </div>
        <StatusSelect claimId={claim.id} status={claim.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tipo de siniestro</p>
            <p className="mt-1 text-sm font-semibold">{claim.claimType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Fecha del siniestro</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(claim.incidentDate)}</p>
          </CardContent>
        </Card>
      </div>

      {claim.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{claim.description}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventForm claimId={claim.id} />
          <div className="space-y-3">
            {claim.events.map((event) => (
              <div key={event.id} className="rounded-md border p-3 text-sm">
                <p>{event.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {CLAIM_EVENT_TYPE_LABELS[event.type]} · {event.author?.name ?? "Sistema"} · {formatDate(event.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
