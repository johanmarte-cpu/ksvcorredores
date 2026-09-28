"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated gradient-blob backdrop (Aceternity-style "Aurora Background"), tuned to the
 * brand palette. Decorative only — content renders in a separate layer above it, and the
 * blob motion is skipped under prefers-reduced-motion.
 */
export function AuroraBackground({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-[var(--brand-navy)]", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/5 -left-1/4 h-[60vh] w-[60vh] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand-blue) 0%, transparent 70%)" }}
          animate={reduceMotion ? undefined : { x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[10%] -right-1/6 h-[50vh] w-[50vh] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand-green) 0%, transparent 70%)" }}
          animate={reduceMotion ? undefined : { x: [0, -50, 30, 0], y: [0, 60, -30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/4 left-[20%] h-[55vh] w-[55vh] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #0a4a8f 0%, transparent 70%)" }}
          animate={reduceMotion ? undefined : { x: [0, 40, -60, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--brand-navy)]/40" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
