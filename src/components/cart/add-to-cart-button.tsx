"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  item,
  className,
  size = "sm",
  block = false,
}: {
  item: Omit<CartItem, "qty">;
  className?: string;
  size?: "sm" | "md";
  block?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function onAdd() {
    add(item);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-semibold transition-colors",
        size === "sm" ? "h-9 px-3.5 text-sm" : "h-11 px-5 text-sm",
        block && "w-full",
        added
          ? "bg-success-soft text-success"
          : "bg-primary text-primary-foreground hover:bg-primary-hover",
        className,
      )}
    >
      {added ? "Добавено ✓" : "Добави"}
    </button>
  );
}
