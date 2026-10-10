import { cn } from "@/lib/utils";

/**
 * Brand mark (Nyamira congregation logo, replacing the original hand-drawn shield). This is a raster image —
 * not redrawable as crisp vector paths — so every size variant is pre-generated (see brand-src/ for the source
 * and scripts/build-icons for how the set was produced) rather than scaled from one inline SVG at runtime.
 */
export function Emblem({ className, title }: { className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed local asset, not a user photo; no optimizer needed for a small fixed-size mark
    <img
      src="/icons/icon-512.png"
      alt={title ?? ""}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      width={512}
      height={512}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}

/** Mark with the congregation name beside it. Kept as live, translatable text so it follows theme and language. */
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

/** Flat blue wave with a gold line: landing artwork (PRD §8.2). Decorative; unrelated to the photo mark above. */
export function BrandWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={cn("h-24 w-full", className)} aria-hidden="true" focusable="false">
      <path d="M0 70 C200 20 380 120 600 70 C820 20 1000 110 1200 60 L1200 160 L0 160 Z" fill="#0B2E6B" />
      <path d="M0 70 C200 20 380 120 600 70 C820 20 1000 110 1200 60" fill="none" stroke="#F2C14E" strokeWidth="4" />
    </svg>
  );
}
