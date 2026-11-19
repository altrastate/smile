import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { listCategories } from "@/features/catalogue/queries";
import { ProductForm } from "@/features/dashboard/product-form";
import { loadWorkspace } from "@/features/dashboard/queries";
import { WorkspaceNotice } from "@/features/dashboard/workspace-gate";

export const metadata: Metadata = { title: "New listing" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return null;
  }
  const categories = await listCategories();

  return (
    <section>
      <h1 className="font-serif text-4xl text-forest-900">New listing</h1>
      <div className="mt-4">
        <WorkspaceNotice code={params.error} />
      </div>
      <p className="mt-4 max-w-2xl text-charcoal-700">
        A new listing is saved as a draft. Publishing is a separate step and does not change the business approval.
      </p>
      {categories.status !== "ok" ? (
        <div className="mt-6">
          <Alert tone="warning" title={categories.message} />
        </div>
      ) : (
        <ProductForm categories={categories.categories} />
      )}
    </section>
  );
}
