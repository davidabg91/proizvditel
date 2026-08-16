import { DELIVERY_PROVIDERS, parseProviders } from "@/lib/constants";

/**
 * Показва доставчиците, с които работи производителят, като брандирани
 * маркери в цветовете на съответния куриер.
 */
export function DeliveryBadges({
  providers,
  className,
}: {
  providers: string | null | undefined;
  className?: string;
}) {
  const codes = parseProviders(providers);
  if (codes.length === 0) return null;

  const items = DELIVERY_PROVIDERS.filter((p) => codes.includes(p.code));
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {items.map((p) => (
          <span
            key={p.code}
            className="inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold tracking-wide"
            style={{ backgroundColor: p.bg, color: p.fg }}
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
