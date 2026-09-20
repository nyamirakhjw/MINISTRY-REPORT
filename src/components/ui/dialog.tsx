"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Bottom sheet on phones, centred dialog from 768px. The only elevated surface in the product (PRD §10.2 rule 3). */
export function DialogContent({ className, children, title, description, closeLabel }: {
  className?: string; children: React.ReactNode; title: string; description?: string; closeLabel: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay data-overlay className="fixed inset-0 z-50 bg-scrim" />
      <DialogPrimitive.Content data-sheet {...(description ? {} : { "aria-describedby": undefined })}
        className={cn("fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-lg border border-border bg-surface-raised p-5 shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg", className)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="text-xl font-semibold">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-1 text-muted-foreground">{description}</DialogPrimitive.Description> : null}
          </div>
          <DialogPrimitive.Close className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-tint" aria-label={closeLabel}>
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
