import { LoadingState } from "@/components/ui/loading-state";

export default function CategoriesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-16">
      <LoadingState label="Loading categories" />
    </div>
  );
}
