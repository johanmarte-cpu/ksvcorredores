import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Percent,
  Building2,
  UserCog,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean };

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/quotes", label: "Cotizaciones", icon: FileText },
  { href: "/policies", label: "Pólizas", icon: ShieldCheck },
  { href: "/renewals", label: "Renovaciones", icon: RefreshCw },
  { href: "/claims", label: "Reclamaciones", icon: AlertTriangle },
  { href: "/commissions", label: "Comisiones", icon: Percent },
  { href: "/insurers", label: "Aseguradoras", icon: Building2 },
  { href: "/users", label: "Usuarios", icon: UserCog, adminOnly: true },
];
