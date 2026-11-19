"use client";

import { useId, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function SearchDialog() {
  const inputId = useId();
  const [query, setQuery] = useState("");

  return (
    <Dialog>
      <DialogTrigger className="inline-flex min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800">
        Search
      </DialogTrigger>
      <DialogContent
        title="Search"
        description="Product search will be available when the catalogue launches. This field is not connected to a catalogue."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
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
              className="min-h-11 w-full border border-beige-300 bg-ivory-50 px-3 text-charcoal-900"
            />
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-11 shrink-0 border border-forest-800 px-3 text-sm font-semibold text-forest-800"
            >
              Clear
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-charcoal-700" role="status">
            Product search will be available when the catalogue launches. Nothing is searched or saved.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
