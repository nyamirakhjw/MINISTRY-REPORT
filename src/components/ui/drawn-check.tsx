/** A success check that draws itself once (CSS only). Decorative: the words next to it carry the meaning. */
export function DrawnCheck({ className = "size-8 text-success" }: { className?: string }) {
  return (
    <svg className={`m-draw ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" pathLength={1} />
    </svg>
  );
}
