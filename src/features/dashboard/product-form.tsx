import { SubmitButton } from "@/components/auth/submit-button";
import { Field, Input, controlClass } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogueCategory } from "@/features/catalogue/queries";
import { createProduct, updateProduct } from "@/features/dashboard/actions";
import { producerCountries } from "@/features/dashboard/validation";
import type { ManagedProduct } from "@/features/dashboard/queries";

export function ProductForm({
  categories,
  product,
}: {
  categories: CatalogueCategory[];
  product?: ManagedProduct;
}) {
  return (
    <form action={product ? updateProduct : createProduct} className="mt-8 grid max-w-3xl gap-5">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <Input name="name" label="Product name" required minLength={2} maxLength={160} defaultValue={product?.name} />
      <Input
        name="slug"
        label="Slug"
        hint="Leave this blank to generate a new slug from the name. A published listing keeps its current address unless you change it."
        defaultValue={product?.slug}
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
      />
      <Field label="Category" hint="The public catalogue shows a listing only when this category is active.">
        {({ id, describedBy }) => (
          <select
            id={id}
            name="categoryId"
            aria-describedby={describedBy}
            className={controlClass}
            defaultValue={product?.categoryId}
            required
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Input name="shortDescription" label="Short description" maxLength={280} defaultValue={product?.summary} />
      <Textarea name="description" label="Description" maxLength={4000} defaultValue={product?.description} />
      <Input name="brandName" label="Brand" maxLength={120} defaultValue={product?.brandName} />
      <Input name="manufacturerName" label="Manufacturer" maxLength={120} defaultValue={product?.manufacturerName} />
      <Input name="productType" label="Product type" maxLength={80} defaultValue={product?.productType} />
      <Field label="Origin country">
        {({ id, describedBy }) => (
          <select
            id={id}
            name="originCountryCode"
            aria-describedby={describedBy}
            className={controlClass}
            defaultValue={product?.originCountryCode ?? ""}
          >
            <option value="">Not stated</option>
            {producerCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Textarea name="ingredients" label="Ingredients" maxLength={2000} defaultValue={product?.ingredients} />
      <SubmitButton pendingLabel="Saving">{product ? "Save listing" : "Create draft"}</SubmitButton>
    </form>
  );
}
