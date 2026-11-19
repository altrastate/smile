"use client";

import Image from "next/image";
import { useId, useState, type FormEvent } from "react";
import { site } from "@/config/site";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SectionHeading } from "@/components/ui/section-heading";
import { RadioGroup } from "@/components/ui/radio-group";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { countries, foundationCheckSchema } from "@/validation/foundation";

const swatches = [
  { name: "Forest", hex: "#1B4332", className: "bg-forest-800" },
  { name: "Botanical", hex: "#1F6B3A", className: "bg-botanical-700" },
  { name: "Ivory", hex: "#F7F4EE", className: "bg-ivory-50" },
  { name: "Beige", hex: "#E6DCCB", className: "bg-beige-200" },
  { name: "Charcoal", hex: "#1C1916", className: "bg-charcoal-900" },
  { name: "Clay", hex: "#7A4632", className: "bg-clay-700" },
] as const;

const notes = [
  "Charcoal on ivory is the reading colour. Green is not used for paragraphs.",
  "Forest green is the action colour: primary buttons, the wordmark, and focus.",
  "Botanical green is for large labels. Small text stays charcoal or forest.",
] as const;

const emptyForm = {
  displayName: "",
  country: "",
  interest: "",
  note: "",
  acknowledged: false,
};

export function FoundationPanel() {
  const nameId = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<"valid" | null>(null);

  function clearForm() {
    setForm(emptyForm);
    setErrors({});
    setResult(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = foundationCheckSchema.safeParse({
      displayName: form.displayName,
      country: form.country,
      interest: form.interest,
      acknowledged: form.acknowledged,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      setResult(null);
      return;
    }

    setErrors({});
    setResult("valid");
  }

  return (
    <TooltipProvider>
      <section className="border-t border-beige-300 bg-ivory-100">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHeading
            eyebrow="Design system"
            title="Interface foundations"
            description="These controls are part of the design system. The form checks input on this page and does not create an account, send a message, or search a catalogue."
          />

          <Tabs defaultValue="colour" className="mt-10">
            <TabsList aria-label="Foundation sections">
              <TabsTrigger value="colour">Colour</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>

            <TabsContent value="colour">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {swatches.map((swatch) => (
                  <li key={swatch.name} className="border border-beige-300 bg-ivory-50">
                    <div className={`h-16 border-b border-beige-300 ${swatch.className}`} />
                    <p className="px-4 py-3 text-sm">
                      <span className="font-semibold">{swatch.name}</span>
                      <span className="mt-1 block text-charcoal-700">{swatch.hex}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <p className="text-base text-charcoal-900">{notes[page - 1]}</p>
                <div className="mt-4">
                  <Pagination page={page} pageCount={notes.length} onPageChange={setPage} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="type">
              <div className="max-w-2xl">
                <p className="font-serif text-4xl text-forest-900 md:text-5xl">Fraunces for headings</p>
                <p className="mt-6 text-lg leading-relaxed text-charcoal-700">
                  Source Sans 3 carries the interface and body text. Headings stay in the serif so product names and
                  section titles can be quiet without becoming thin or decorative.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="controls">
              <div className="grid gap-10 lg:grid-cols-12">
                <form className="flex flex-col gap-5 lg:col-span-7" onSubmit={onSubmit} noValidate>
                  {result === "valid" ? (
                    <Alert tone="success" title="The input is valid.">
                      Nothing was saved or sent.
                    </Alert>
                  ) : null}
                  <Input
                    id={nameId}
                    label="Display name"
                    name="displayName"
                    value={form.displayName}
                    error={errors.displayName}
                    onChange={(event) => {
                      const displayName = event.target.value;
                      setForm((current) => ({ ...current, displayName }));
                    }}
                  />
                  <Select
                    label="Country"
                    hint="Not saved."
                    name="country"
                    value={form.country}
                    error={errors.country}
                    placeholder="Select a country"
                    options={countries.map((country) => ({ value: country, label: country }))}
                    onChange={(event) => {
                      const country = event.target.value;
                      setForm((current) => ({ ...current, country }));
                    }}
                  />
                  <RadioGroup
                    name="interest"
                    legend="You are"
                    value={form.interest}
                    error={errors.interest}
                    options={[
                      { value: "buyer", label: "A buyer" },
                      { value: "business", label: "Representing a business" },
                    ]}
                    onChange={(interest) => setForm((current) => ({ ...current, interest }))}
                  />
                  <Textarea
                    label="Note"
                    hint="Optional. It stays in this form."
                    name="note"
                    value={form.note}
                    onChange={(event) => {
                      const note = event.target.value;
                      setForm((current) => ({ ...current, note }));
                    }}
                  />
                  <Checkbox
                    label="I understand this check does not create an account."
                    checked={form.acknowledged}
                    error={errors.acknowledged}
                    onChange={(event) => {
                      const acknowledged = event.target.checked;
                      setForm((current) => ({ ...current, acknowledged }));
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">Check input</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary">Form actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={clearForm}>Clear the form</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </form>

                <div className="flex flex-col gap-6 lg:col-span-5">
                  <SearchField
                    label="Search field"
                    hint="This does not search a catalogue."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <p aria-live="polite" className="text-sm text-charcoal-700">
                    {query ? `Typed: ${query}` : "Nothing typed."}
                  </p>
                  <div className="flex items-center gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary">View brand mark</Button>
                      </DialogTrigger>
                      <DialogContent title={site.name} description={site.tagline}>
                        <Image
                          src="/brand/logo.svg"
                          alt=""
                          width={355}
                          height={320}
                          unoptimized
                          className="mx-auto h-auto w-full max-w-xs"
                        />
                      </DialogContent>
                    </Dialog>
                    <Tooltip label="Moves focus to the display name">
                      <IconButton label="Focus display name" onClick={() => document.getElementById(nameId)?.focus()}>
                        <span aria-hidden="true">Aa</span>
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </TooltipProvider>
  );
}
