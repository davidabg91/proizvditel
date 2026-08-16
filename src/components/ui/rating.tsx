import { cn } from "@/lib/utils";

/** Показва оценка със звезди (типографски символи). */
export function RatingStars({
  value,
  count,
  size = "md",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  const stars = [1, 2, 3, 4, 5].map((i) => {
    if (rounded >= i) return "full";
    if (rounded >= i - 0.5) return "half";
    return "empty";
  });

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex tracking-tight text-accent",
          size === "sm" ? "text-sm" : "text-base",
        )}
        aria-hidden
      >
        {stars.map((s, idx) => (
          <span key={idx} className={s === "empty" ? "text-border-strong" : ""}>
            {s === "half" ? "⯨" : "★"}
          </span>
        ))}
      </span>
      {count !== undefined ? (
        <span className="text-sm text-muted-foreground">
          {value > 0 ? value.toFixed(1) : "Нова"}
          {count > 0 ? ` (${count})` : ""}
        </span>
      ) : null}
    </span>
  );
}
