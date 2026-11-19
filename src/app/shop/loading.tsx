import { LoadingState } from "@/components/ui/loading-state";

export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-16">
      <LoadingState label="Loading the catalogue" />
    </div>
  );
}
