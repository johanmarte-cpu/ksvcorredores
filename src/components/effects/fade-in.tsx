import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades and slides content up into place on mount. Pure CSS (tw-animate-css) so content is
 * visible even if JavaScript is slow or fails to run (e.g. older mobile browsers) — a
 * JS-driven `initial={{ opacity: 0 }}` would leave the page blank in that case.
 */
export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500 ease-out motion-reduce:animate-none",
        className,
      )}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
