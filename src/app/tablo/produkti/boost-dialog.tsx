"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BOOST_PLANS,
  formatBoostPrice,
  isBoosted,
  type BoostPlanCode,
} from "@/lib/boost-plans";

/** Диалог за избор на период и плащане на подсилване. */
export function BoostDialog({
  listingId,
  listingTitle,
  boostedUntil,
  onClose,
}: {
  listingId: string;
  listingTitle: string;
  boostedUntil: string | null;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<BoostPlanCode>("days15");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUntil = isBoosted(boostedUntil) ? new Date(boostedUntil!) : null;

  async function pay() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/boost/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Грешка при създаване на плащането.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Няма връзка със сървъра. Опитайте отново.");
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-xl)] bg-surface p-6 shadow-lg sm:rounded-[var(--radius-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold">Подсили обявата</h2>
            <p className="mt-1 text-sm text-muted-foreground">{listingTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] px-2 py-1 text-lg leading-none text-muted-foreground hover:bg-surface-muted"
            aria-label="Затвори"
          >
            ✕
          </button>
        </div>

        {activeUntil ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-success-soft px-3 py-2 text-sm font-medium text-success">
            Обявата е подсилена до{" "}
            {new Intl.DateTimeFormat("bg-BG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(activeUntil)}
            . Ново плащане удължава периода.
          </p>
        ) : null}

        <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface-muted/50 p-4 text-sm leading-relaxed text-foreground/85">
          <p className="font-semibold text-foreground">Къде излиза продуктът?</p>
          <p className="mt-1">
            Подсилените обяви заемат първите места в раздел{" "}
            <strong>„Актуални предложения“</strong> на началната страница и се
            подреждат пред всички останали в <strong>каталога</strong>. Новите обяви
            се показват едва след платените. Върху снимката се появява знак{" "}
            <strong>„Подсилена“</strong>, който привлича вниманието на купувачите.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {BOOST_PLANS.map((p) => (
            <label
              key={p.code}
              className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors ${
                plan === p.code
                  ? "border-primary bg-primary-soft/40"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <input
                type="radio"
                name="boost-plan"
                value={p.code}
                checked={plan === p.code}
                onChange={() => setPlan(p.code)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              <span className="flex-1">
                <span className="block font-semibold">{p.label}</span>
                <span className="block text-sm text-muted-foreground">{p.hint}</span>
              </span>
              <span className="font-serif text-lg font-semibold text-primary">
                {formatBoostPrice(p.price)}
              </span>
            </label>
          ))}
        </div>

        {error ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Откажи
          </Button>
          <Button onClick={pay} disabled={pending}>
            {pending ? "Пренасочваме…" : "Плати и подсили"}
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Плащането е еднократно, с карта през защитената страница на Stripe.
        </p>
      </div>
    </div>
  );
}
