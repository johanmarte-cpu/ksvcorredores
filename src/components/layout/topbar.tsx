import Image from "next/image";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { auth, signOut } from "@/auth";
import { ROLE_LABELS } from "@/lib/labels";
import { SidebarNav } from "./sidebar-nav";

export async function Topbar() {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <div className="flex h-16 items-center border-b border-sidebar-border px-5">
              <Image src="/logo-ksv.jpg" alt="KSV Corredores de Seguros" width={160} height={54} className="h-9 w-auto" />
            </div>
            <SidebarNav isAdmin={isAdmin} />
          </SheetContent>
        </Sheet>
        <Image src="/logo-ksv.jpg" alt="KSV Corredores de Seguros" width={140} height={47} className="h-7 w-auto md:hidden" />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.role ? ROLE_LABELS[user.role] : ""}</p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
