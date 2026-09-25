import { auth } from "@/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4 font-semibold">Corredor Pro</div>
        <SidebarNav isAdmin={isAdmin} />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
