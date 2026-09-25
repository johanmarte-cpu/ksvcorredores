import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import { LOB_LABELS, QUOTE_STATUS_LABELS, QUOTE_REQUEST_STATUS_LABELS } from "@/lib/labels";
import { SendRequestForm } from "./send-request-form";
import { RegisterOptionDialog } from "./register-option-dialog";
import { SelectOptionButton } from "./select-option-button";
import { ConvertDialog } from "./convert-dialog";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      requests: {
        include: { insurer: true, product: true, option: true },
        orderBy: { sentAt: "asc" },
      },
    },
  });

  if (!quote) notFound();

  const insurers = await prisma.insurer.findMany({
    where: { active: true },
    include: { products: { where: { lineOfBusiness: quote.lineOfBusiness } } },
    orderBy: { name: "asc" },
  });

  const hasSelected = quote.requests.some((r) => r.option?.isSelected);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{clientDisplayName(quote.client)}</h1>
          <p className="text-sm text-muted-foreground">
            {LOB_LABELS[quote.lineOfBusiness]} · Creada el {formatDate(quote.createdAt)}
          </p>
        </div>
        <Badge variant="outline">{QUOTE_STATUS_LABELS[quote.status]}</Badge>
      </div>

      {quote.status !== "CONVERTED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enviar solicitud a aseguradora</CardTitle>
          </CardHeader>
          <CardContent>
            <SendRequestForm quoteId={quote.id} insurers={insurers} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {quote.requests.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no se ha enviado esta cotización a ninguna aseguradora.</p>
        )}
        {quote.requests.map((request) => (
          <Card key={request.id} className={request.option?.isSelected ? "border-primary" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{request.insurer.name}</CardTitle>
              <Badge variant="outline">{QUOTE_REQUEST_STATUS_LABELS[request.status]}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.product && <p className="text-sm text-muted-foreground">{request.product.name}</p>}
              {request.option ? (
                <div className="space-y-2 text-sm">
                  <p className="text-lg font-semibold">{formatCurrency(request.option.premium.toString())}</p>
                  {request.option.deductible && (
                    <p className="text-muted-foreground">Deducible: {formatCurrency(request.option.deductible.toString())}</p>
                  )}
                  {request.option.coverageSummary && <p>{request.option.coverageSummary}</p>}
                  <p className="text-muted-foreground">Vigencia: {request.option.termMonths} meses</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {request.option.isSelected ? (
                      <>
                        <Badge>Seleccionada</Badge>
                        <ConvertDialog quoteId={quote.id} quoteRequestId={request.id} />
                      </>
                    ) : (
                      !hasSelected && <SelectOptionButton quoteId={quote.id} quoteOptionId={request.option.id} />
                    )}
                  </div>
                </div>
              ) : (
                <RegisterOptionDialog quoteId={quote.id} quoteRequestId={request.id} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
