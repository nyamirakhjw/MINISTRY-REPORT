import { cn } from "@/lib/utils";

/**
 * Brand mark (Nyamira congregation logo). A raster illustration, so it ships as two pre-sized WebP files
 * (public/brand/, generated from brand-src/mark-only.png) instead of the 467 KB PWA icon the header used before:
 * `small` for headers (128 px wide), `large` for the landing hero (394 px wide, the source resolution).
 * The congregation name stays live text in `Logo` so it follows language and theme.
 */
export function Emblem({
  className, title, size = "small", priority = false, plate = false,
}: { className?: string; title?: string; size?: "small" | "large"; priority?: boolean; plate?: boolean }) {
  const large = size === "large";
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed local asset, not a user photo; already optimised WebP
    <img
      src={large ? "/brand/mark-394.webp" : "/brand/mark-128.webp"}
      alt={title ?? ""}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      width={large ? 394 : 128}
      height={large ? 341 : 111}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn(large ? "object-contain" : "h-10 w-auto object-contain", className)}
    />
  );
  // In dark mode the navy figures need a light disc behind them (--plate is transparent in light mode).
  return plate ? <span className="inline-flex rounded-full p-1" style={{ background: "var(--plate)" }}>{img}</span> : img;
}

/** Mark with the congregation name beside it. Kept as live, translatable text so it follows theme and language. */
export function Logo({ name = "JW NYAMIRA", sub, className }: { name?: string; sub?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Emblem plate />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-semibold tracking-wide text-foreground">{name}</span>
        {sub ? <span className="text-sm text-muted-foreground">{sub}</span> : null}
      </span>
    </span>
  );
}

/**
 * Flat navy wave with a gold line (landing artwork). Colours come from tokens (--wave-fill, --accent) in landing.css,
 * so it follows the theme. With `animated`, the gold line draws on load and the back layer drifts on scroll.
 */
export function BrandWave({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={cn("lp-wave", className)} data-animated={animated ? "true" : undefined} aria-hidden="true" focusable="false">
      <path className="w-back" d="M-40 92 C180 40 400 132 620 82 C840 30 1040 122 1240 72 L1240 160 L-40 160 Z" />
      <path className="w-fill" d="M0 70 C200 20 380 120 600 70 C820 20 1000 110 1200 60 L1200 160 L0 160 Z" />
      <path className="w-line" d="M0 70 C200 20 380 120 600 70 C820 20 1000 110 1200 60" />
    </svg>
  );
}
