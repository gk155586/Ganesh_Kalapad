export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="flex items-center justify-between mt-2">
          <div className="h-5 skeleton rounded w-16" />
          <div className="w-8 h-8 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
