"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STAT_CARD_COLORS = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  violet: { bg: "bg-violet-100", text: "text-violet-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
} as const;

export function StatCard({
  label,
  value,
  href,
  icon,
  color,
  warn,
  hint,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: ReactNode;
  color: keyof typeof STAT_CARD_COLORS;
  warn?: boolean;
  hint?: string;
}) {
  const reduceMotion = useReducedMotion();
  const palette = STAT_CARD_COLORS[color];

  const card = (
    <motion.div whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Link href={href}>
        <Card className="transition-colors hover:border-primary">
          <CardContent className="flex items-start justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`mt-1 text-xl font-semibold ${warn ? "text-destructive" : ""}`}>{value}</p>
            </div>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
              {icon}
            </span>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  if (!hint) return card;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
