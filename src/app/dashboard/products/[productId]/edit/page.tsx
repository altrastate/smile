import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { ProductPhoto } from "@/features/catalogue/components";
import { listCategories } from "@/features/catalogue/queries";
import { removeProductImage, setProductStatus, uploadProductImage } from "@/features/dashboard/actions";
import { canSetPublication, listingLabel, type PublicationStatus } from "@/features/dashboard/eligibility";
import { ProductForm } from "@/features/dashboard/product-form";
import { getManagedProduct, loadWorkspace } from "@/features/dashboard/queries";
import { WorkspaceNotice } from "@/features/dashboard/workspace-gate";

type EditPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
};

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const { productId } = await params;
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return { title: "Edit listing" };
  }
  const product = await getManagedProduct(workspace.business.id, productId);
  return { title: product ? `Edit ${product.name}` : "Edit listing" };
}

export default async function EditProductPage({ params, searchParams }: EditPageProps) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return null;
  }
  const product = await getManagedProduct(workspace.business.id, productId);
  if (!product) {
    notFound();
  }
  const categories = await listCategories();
  const status = product.status as PublicationStatus;
  const editPath = `/dashboard/products/${product.id}/edit`;

  return (
    <section>
      <p className="text-sm font-semibold text-forest-800">
        <Link href="/dashboard/products">Listings</Link>
      </p>
      <h1 className="mt-2 font-serif text-4xl text-forest-900">{product.name}</h1>
      <p className="mt-2 text-charcoal-700">Status: {listingLabel(product.status, product.publishedAt)}</p>
      <div className="mt-4">
        <WorkspaceNotice code={query.error ?? query.status} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {product.status === "published" ? (
          <Link href={`/shop/${product.slug}`} className="inline-flex min-h-11 items-center border border-forest-800 px-4 font-semibold text-forest-800">
            View public listing
          </Link>
        ) : null}
        {canSetPublication(status, "published") ? (
          <form action={setProductStatus}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="status" value="published" />
            <input type="hidden" name="returnTo" value={editPath} />
            <SubmitButton pendingLabel="Publishing">Publish</SubmitButton>
          </form>
        ) : null}
        {canSetPublication(status, "draft") ? (
          <form action={setProductStatus}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="status" value="draft" />
            <input type="hidden" name="returnTo" value={editPath} />
            <SubmitButton variant="secondary" pendingLabel="Saving">
              {status === "published" ? "Unpublish" : "Restore to draft"}
            </SubmitButton>
          </form>
        ) : null}
      </div>
      {canSetPublication(status, "archived") ? (
        <form action={setProductStatus} className="mt-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="status" value="archived" />
          <input type="hidden" name="returnTo" value={editPath} />
          <label className="flex min-h-11 items-center gap-2 text-sm text-charcoal-700">
            <input type="checkbox" name="confirm" />
            Confirm archive
          </label>
          <SubmitButton variant="danger" pendingLabel="Archiving">
            Archive
          </SubmitButton>
        </form>
      ) : null}
      <h2 className="mt-10 font-serif text-2xl text-forest-900">Photographs</h2>
      <p className="mt-2 max-w-2xl text-charcoal-700">JPEG, PNG, or WebP up to 5 MB. The file contents must match the format.</p>
      {product.images.length === 0 ? <p className="mt-4 text-charcoal-700">No photographs yet.</p> : null}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {product.images.map((image) => (
          <li key={image.id} className="border border-beige-300 p-3">
            <ProductPhoto name={product.name} src={image.src} alt={image.alt} />
            <form action={removeProductImage} className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="imageId" value={image.id} />
              <label className="flex min-h-11 items-center gap-2 text-sm text-charcoal-700">
                <input type="checkbox" name="confirm" />
                Confirm removal
              </label>
              <SubmitButton variant="danger" pendingLabel="Removing">
                Remove
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
      <form action={uploadProductImage} className="mt-6 grid max-w-xl gap-3">
        <input type="hidden" name="productId" value={product.id} />
        <label htmlFor="product-image" className="text-sm font-semibold text-charcoal-900">
          Add a photograph
        </label>
        <input id="product-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
        <SubmitButton pendingLabel="Uploading">Upload</SubmitButton>
      </form>
      <h2 className="mt-10 font-serif text-2xl text-forest-900">Details</h2>
      {categories.status !== "ok" ? (
        <div className="mt-4">
          <Alert tone="warning" title={categories.message} />
        </div>
      ) : (
        <ProductForm categories={categories.categories} product={product} />
      )}
    </section>
  );
}
