"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  align?: "center" | "end";
};

export function DialogContent({ title, description, children, className, align = "center" }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-40 bg-forest-950/50" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 bg-ivory-50 p-6 shadow-soft",
          align === "center" && "top-1/2 left-1/2 w-[min(100%-2rem,32rem)] -translate-x-1/2 -translate-y-1/2",
          align === "end" &&
            "sheet-drawer top-0 right-0 h-full w-[min(100%,22rem)] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          className,
        )}
      >
        <DialogPrimitive.Title className="font-serif text-3xl text-forest-900">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-3 text-base leading-relaxed text-charcoal-700">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        <div className="mt-6">{children}</div>
        <DialogPrimitive.Close className="mt-6 min-h-11 border border-forest-800 px-4 font-semibold text-forest-800">
          Close
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
