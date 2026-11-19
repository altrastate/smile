import type { Metadata } from "next";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, controlClass } from "@/components/ui/input";
import { updateStorefront } from "@/features/dashboard/actions";
import { loadWorkspace } from "@/features/dashboard/queries";
import { producerCountries } from "@/features/dashboard/validation";
import { WorkspaceNotice } from "@/features/dashboard/workspace-gate";

export const metadata: Metadata = { title: "Storefront" };

export default async function StorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return null;
  }
  const business = workspace.business;

  return (
    <section>
      <h1 className="font-serif text-4xl text-forest-900">Storefront</h1>
      <div className="mt-4">
        <WorkspaceNotice code={params.error ?? params.status} />
      </div>
      <p className="mt-4 max-w-2xl text-charcoal-700">
        The public page shows the name, description, place, and website. Email and telephone stay in this workspace.
        Approval status cannot be changed here.
      </p>
      <form action={updateStorefront} className="mt-8 grid max-w-3xl gap-5">
        <input type="hidden" name="businessId" value={business.id} />
        <Input name="displayName" label="Business name" required minLength={2} maxLength={120} defaultValue={business.name} />
        <Textarea
          name="description"
          label="Description"
          hint="This is the public description of the business."
          maxLength={2000}
          defaultValue={business.description}
        />
        <Field label="Country">
          {({ id, describedBy }) => (
            <select id={id} name="countryCode" aria-describedby={describedBy} className={controlClass} defaultValue={business.countryCode ?? ""}>
              <option value="">Not stated</option>
              {producerCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Input name="city" label="City" maxLength={80} defaultValue={business.city ?? ""} />
        <Input name="district" label="District" maxLength={80} defaultValue={business.district ?? ""} />
        <Input
          name="website"
          label="Website"
          hint="Use a full https address, or leave this blank."
          maxLength={200}
          defaultValue={business.website ?? ""}
        />
        <Input
          name="contactEmail"
          label="Contact email"
          hint="Shown only to members of this business."
          type="email"
          maxLength={160}
          defaultValue={business.contactEmail ?? ""}
        />
        <Input
          name="contactPhone"
          label="Telephone"
          hint="Shown only to members of this business."
          maxLength={20}
          defaultValue={business.contactPhone ?? ""}
        />
        <SubmitButton pendingLabel="Saving">Save storefront</SubmitButton>
      </form>
    </section>
  );
}
