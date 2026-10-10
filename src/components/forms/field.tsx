"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Visible label above, hint below, error next to the field (PRD §10.9). */
export function Field({ id, label, hint, error, optional, optionalLabel, children, className }: {
  id: string; label: string; hint?: string; error?: string; optional?: boolean; optionalLabel?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}{optional ? <span className="ml-2 font-normal text-muted-foreground">{optionalLabel}</span> : null}</Label>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}

export function describedBy(id: string, hint?: string, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}
