import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/auth";
import { ROLE_LABELS } from "@/lib/labels";
import { MobileNav } from "./mobile-nav";

export async function Topbar() {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <MobileNav isAdmin={isAdmin} />
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
