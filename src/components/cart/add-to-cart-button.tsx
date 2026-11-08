"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, MAX_QTY, type CartItem } from "@/components/cart/cart-context";
import { cn, formatPrice } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

/**
 * Бутон „Добави в кошницата“. С `withQty` до него има избор на количество
 * (кг, бр., буркани… според мерната единица на обявата), а с `showTotal` —
 * и сумата за избраното количество.
 */
export function AddToCartButton({
  item,
  className,
  size = "sm",
  block = false,
  withQty = false,
  showTotal = false,
}: {
  item: Omit<CartItem, "qty">;
  className?: string;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  withQty?: boolean;
  showTotal?: boolean;
}) {
  const { add, items, ready } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<number | null>(null);

  const inCart = ready ? (items.find((i) => i.listingId === item.listingId)?.qty ?? 0) : 0;

  function onAdd() {
    add(item, qty);
    setAdded(qty);
    window.setTimeout(() => setAdded(null), 1800);
  }

  const height = size === "lg" ? "h-12" : size === "md" ? "h-11" : "h-9";

  return (
    <div className={cn("flex flex-col gap-2", block && "w-full")}>
      <div className="flex items-center gap-2">
        {withQty ? (
          <QtyStepper value={qty} onChange={setQty} unit={item.unit} size={size} />
        ) : null}
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
            height,
            size === "lg" && "px-6 text-base",
            (block || withQty) && "flex-1",
            added
              ? "bg-success-soft text-success"
              : "bg-primary text-primary-foreground hover:bg-primary-hover",
            className,
          )}
        >
          <Icon name={added ? "check" : "basket"} size={size === "lg" ? 18 : 16} />
          {added ? "Добавено" : size === "lg" ? "Добави в кошницата" : "Добави"}
        </button>
      </div>

      {showTotal ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {qty} {item.unit} ×{" "}
            {formatPrice(item.price)} ={" "}
            <strong className="text-base font-semibold text-foreground">
              {formatPrice(item.price * qty)}
            </strong>
          </span>
          {inCart > 0 ? (
            <Link
              href="/koshnitsa"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              В кошницата: {inCart} {item.unit}
              <Icon name="arrow-right" size={14} />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** − 1 + с поле, в което може да се напише количество. */
export function QtyStepper({
  value,
  onChange,
  unit,
  size = "sm",
}: {
  value: number;
  onChange: (qty: number) => void;
  unit?: string;
  size?: "sm" | "md" | "lg";
}) {
  const clamp = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n) || 1));
  // Докато се пише, полето може да е празно — нормализира се при напускане.
  const [draft, setDraft] = useState<string | null>(null);
  const height = size === "lg" ? "h-12" : size === "md" ? "h-11" : "h-9";
  const btn = size === "sm" ? "w-8" : "w-10";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-border-strong bg-surface",
        height,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label="Намали количеството"
        className={cn(
          "flex h-full items-center justify-center rounded-l-full text-lg font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-35",
          btn,
        )}
      >
        −
      </button>
      <label className="flex items-baseline gap-0.5 px-0.5">
        <span className="sr-only">Количество{unit ? ` (${unit})` : ""}</span>
        <input
          type="text"
          inputMode="numeric"
          value={draft ?? String(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
            setDraft(raw);
            if (raw) onChange(clamp(Number(raw)));
          }}
          onBlur={() => setDraft(null)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "bg-transparent text-center font-semibold tabular-nums text-foreground focus:outline-none",
            size === "sm" ? "w-6 text-sm" : "w-8 text-base",
          )}
        />
        {unit && size !== "sm" ? (
          <span className="text-xs text-muted-foreground">{unit}</span>
        ) : null}
      </label>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= MAX_QTY}
        aria-label="Увеличи количеството"
        className={cn(
          "flex h-full items-center justify-center rounded-r-full text-lg font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-35",
          btn,
        )}
      >
        +
      </button>
    </div>
  );
}
