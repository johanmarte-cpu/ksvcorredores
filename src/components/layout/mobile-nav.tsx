"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

// Controlled so the drawer closes as soon as a nav link is tapped.
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 overflow-y-auto border-sidebar-border bg-sidebar p-0">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Image src="/logo-ksv.jpg" alt="KSV Corredores de Seguros" width={160} height={54} className="h-9 w-auto" />
        </div>
        <SidebarNav isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
