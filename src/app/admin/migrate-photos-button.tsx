"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { migrateLegacyPhotos, type SeedActionResult } from "./actions";

/**
 * Пренася старите снимки, записани като data: адрес в базата, към Vercel Blob.
 *
 * Върви на порции, за да не опре в лимита за време на функцията. Затова при
 * остатък бутонът се натиска отново — броячът показва колко чакат.
 */
export function MigratePhotosButton({ pending: waiting }: { pending: number }) {
  const router = useRouter();
  const [running, startTransition] = useTransition();
  const [result, setResult] = useState<SeedActionResult | null>(null);

  if (waiting === 0 && !result) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-accent/40 bg-accent-soft/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="font-semibold">Стари снимки в базата</h2>
          <p className="mt-1 text-sm text-foreground/80">
            {waiting > 0 ? (
              <>
                <strong>{waiting}</strong> снимки още се пазят като текст в
                базата отпреди облачното качване. Заради тях страниците се
                зареждат бавно — началната тежи няколко мегабайта. Натиснете, за
                да ги преместите в Blob; върви на порции, затова при остатък
                натиснете пак.
              </>
            ) : (
              "Всички снимки са в облака. Няма какво да се пренася."
            )}
          </p>
        </div>
        {waiting > 0 ? (
          <Button
            variant="accent"
            disabled={running}
            onClick={() =>
              startTransition(async () => {
                setResult(null);
                setResult(await migrateLegacyPhotos());
                router.refresh();
              })
            }
          >
            {running ? "Пренасяме…" : "Пренеси снимките"}
          </Button>
        ) : null}
      </div>

      {result ? (
        <p
          className={
            result.ok
              ? "mt-3 rounded-[var(--radius-md)] bg-success-soft px-3 py-2 text-sm font-medium text-success"
              : "mt-3 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          }
        >
          {result.ok ? result.message : result.error}
        </p>
      ) : null}
    </div>
  );
}
