import { cn } from "@/lib/utils";

/** Original artwork (PRD §11.2): rounded shield, gold keyline, geometric JW monogram. Not the official logo. */
export function Emblem({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={cn("h-10 w-auto", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      <path d="M60 4 L104 16 Q112 18 112 27 L112 68 Q112 104 60 134 Q8 104 8 68 L8 27 Q8 18 16 16 Z" fill="#0B2E6B" />
      <path d="M60 11 L100 22 Q106 23.5 106 30 L106 68 Q106 99 60 126 Q14 99 14 68 L14 30 Q14 23.5 20 22 Z" fill="none" stroke="#F2C14E" strokeWidth="1.6" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M45 42 V70 C45 80 39 86 30 86" />
        <path d="M55 42 L64 84 L76 54 L88 84 L97 42" />
      </g>
      <path d="M32 98 L46 94 M52 96 L68 92" stroke="#F2C14E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Shield with the congregation name beside it. Kept as live text so it follows the theme and language. */
export function Logo({ name = "JW NYAMIRA", sub, className }: { name?: string; sub?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Emblem />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-semibold tracking-wide text-foreground">{name}</span>
        {sub ? <span className="text-sm text-muted-foreground">{sub}</span> : null}
      </span>
    </span>
  );
}

/** Flat blue wave with a gold line: landing artwork (PRD §8.2). Decorative. */
export function BrandWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={cn("h-24 w-full", className)} aria-hidden="true" focusable="false">
      <path d="M0 70 C200 20 380 120 600 70 C820 20 1000 110 1200 60 L1200 160 L0 160 Z" fill="#0B2E6B" />
      <path d="M0 70 C200 20 380 120 600 70 C820 20 1000 110 1200 60" fill="none" stroke="#F2C14E" strokeWidth="4" />
    </svg>
  );
}
