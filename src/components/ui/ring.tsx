/** A small progress ring for work in flight (PRD v1.1 EM-08). Decorative: pair it with a text or aria-busy state. */
export function Ring({ className = "size-4 text-primary" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" opacity="0.25" /><path className="m-ring" d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}
