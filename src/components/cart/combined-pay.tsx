"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CombinedPay({
  items,
  producerCount,
}: {
  items: { listingId: string; qty: number }[];
  producerCount: number;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/checkout/combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Грешка при плащането.");
        setPaying(false);
      }
    } catch {
      setError("Грешка при плащането.");
      setPaying(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-primary-soft/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-primary">
            Плати всичко наведнъж с една доставка
          </p>
          <p className="mt-1 text-sm text-foreground/80">
            Продукти от {producerCount} стопанства — едно плащане с карта, а сумите
            се разпределят автоматично към всеки производител.
          </p>
        </div>
        <Button onClick={pay} disabled={paying} size="lg" className="shrink-0">
          {paying ? "Пренасочваме…" : "Плати всичко с карта"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}
