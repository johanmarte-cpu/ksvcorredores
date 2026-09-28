import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CardFooter } from "@/components/ui/card";

/** Prev/next pager for a server-rendered table, driven entirely by a `?<paramName>=N` query param. */
export function ListPagination({
  page,
  totalPages,
  basePath,
  searchParams,
  paramName = "page",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  paramName?: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (key === paramName) continue;
      if (value) params.set(key, value);
    }
    params.set(paramName, String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <CardFooter className="justify-between">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
          }`}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"
          }`}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </CardFooter>
  );
}
