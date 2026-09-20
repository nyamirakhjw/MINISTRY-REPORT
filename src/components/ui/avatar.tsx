/* eslint-disable @next/next/no-img-element -- signed Supabase URLs are short-lived and not eligible for the image optimizer */
import { initials, cn } from "@/lib/utils";

export function Avatar({ name, src, size = 40, className, alt }: { name: string; src?: string | null; size?: number; className?: string; alt: string }) {
  return src ? (
    <img src={src} alt={alt} width={size} height={size} loading="lazy" decoding="async" className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span role="img" aria-label={alt} className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-tint font-heading text-sm font-semibold text-primary", className)} style={{ width: size, height: size }}>
      {initials(name)}
    </span>
  );
}
