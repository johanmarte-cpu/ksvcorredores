import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clientDisplayName } from "@/lib/format";
import { KnowledgeForm } from "./knowledge-form";

export default async function KnowledgeFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { knowledgeForm: true },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/clients/${client.id}`} className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← {clientDisplayName(client)}
        </Link>
        <h1 className="text-2xl font-semibold">Formulario de Conocimiento</h1>
        <p className="text-sm text-muted-foreground">
          Requerido para el expediente de {clientDisplayName(client)} — cumplimiento de la Ley 155-17 contra el Lavado de Activos.
        </p>
      </div>

      <KnowledgeForm
        key={client.knowledgeForm?.updatedAt.toISOString() ?? "new"}
        clientId={client.id}
        data={
          client.knowledgeForm
            ? {
                ...client.knowledgeForm,
                otherIncomeAmount: client.knowledgeForm.otherIncomeAmount?.toString() ?? null,
              }
            : null
        }
      />
    </div>
  );
}
