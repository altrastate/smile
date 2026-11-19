"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function SearchDialog() {
  const router = useRouter();
  const params = useSearchParams();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    setOpen(false);
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery(params.get("q") ?? "");
        }
      }}
    >
      <DialogTrigger className="inline-flex min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800">
        Search
      </DialogTrigger>
      <DialogContent title="Search" description="Search published products in the catalogue.">
        <form onSubmit={onSubmit}>
          <label htmlFor={inputId} className="text-sm font-semibold text-forest-800">
            Search products
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={inputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              autoComplete="off"
              className="min-h-11 w-full border border-beige-300 bg-ivory-50 px-3 text-base text-charcoal-900"
            />
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-11 shrink-0 border border-forest-800 px-3 text-sm font-semibold text-forest-800"
            >
              Clear
            </button>
          </div>
          <button type="submit" className="mt-4 min-h-11 border border-forest-800 bg-forest-800 px-4 font-semibold text-ivory-50">
            Search the catalogue
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
