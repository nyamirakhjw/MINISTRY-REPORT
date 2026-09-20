import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-9 w-2/3" /><Skeleton className="h-36 w-full" /><Skeleton className="h-24 w-full" />
    </div>
  );
}
