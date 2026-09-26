import Link from "next/link";
import { notFound } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatDate } from "@/lib/format";
import { NoteForm } from "./note-form";
import { UploadDocumentForm, DocumentList } from "./document-forms";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: true,
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      documents: { orderBy: { createdAt: "desc" }, include: { uploadedBy: true } },
      policies: { include: { insurer: true }, orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      knowledgeForm: true,
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{clientDisplayName(client)}</h1>
        <p className="text-sm text-muted-foreground">
          {client.taxId} · {client.email || "sin correo"} · {client.phone || "sin teléfono"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pólizas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.policies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Sin pólizas
                    </TableCell>
                  </TableRow>
                )}
                {client.policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/policies/${p.id}`} className="underline-offset-2 hover:underline">
                        {p.policyNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{p.insurer.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.endDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cotizaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ramo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.quotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Sin cotizaciones
                    </TableCell>
                  </TableRow>
                )}
                {client.quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link href={`/quotes/${q.id}`} className="underline-offset-2 hover:underline">
                        {q.lineOfBusiness}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(q.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {client.type === "COMPANY" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contactos empresariales</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {client.contacts.length === 0 ? "Sin contactos registrados." : null}
            <ul className="space-y-1">
              {client.contacts.map((c) => (
                <li key={c.id}>
                  {c.name} {c.position ? `· ${c.position}` : ""} {c.email ? `· ${c.email}` : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Formulario de Conocimiento</CardTitle>
              <p className="text-xs text-muted-foreground">Requerido por Ley 155-17 (prevención de lavado de activos)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={client.knowledgeForm ? "secondary" : "outline"}>
              {client.knowledgeForm ? "Completado" : "Pendiente"}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link href={`/clients/${client.id}/knowledge-form`}>{client.knowledgeForm ? "Editar" : "Completar"}</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos del expediente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadDocumentForm clientId={client.id} />
          <DocumentList clientId={client.id} documents={client.documents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NoteForm clientId={client.id} />
          <div className="space-y-3">
            {client.notes.map((note) => (
              <div key={note.id} className="rounded-md border p-3 text-sm">
                <p>{note.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.author?.name ?? "—"} · {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
