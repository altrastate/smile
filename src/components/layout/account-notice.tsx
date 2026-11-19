"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function AccountNotice() {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800">
        Account
      </DialogTrigger>
      <DialogContent
        title="Accounts are not open"
        description="Sign-in and registration are not part of this release. This button does not create an account."
      >
        <p className="text-base leading-relaxed text-charcoal-700">
          Business and buyer accounts will open in a later phase, after the application process is built.
        </p>
      </DialogContent>
    </Dialog>
  );
}
