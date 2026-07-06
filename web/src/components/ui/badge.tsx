import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-[var(--color-secondary)] px-2 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}
