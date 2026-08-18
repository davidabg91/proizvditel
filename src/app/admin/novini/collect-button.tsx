"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runNewsCollection, type CollectActionResult } from "./actions";

/**
 * Ръчно пускане на автоматичното събиране. Търсенето отнема до няколко
 * минути, затова бутонът остава зает през цялото време.
 */
export function CollectButton({ lastRun }: { lastRun: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CollectActionResult | null>(null);

  return (
    <div className="mb-6 rounded-[var(--radius-lg)] border border-primary/25 bg-primary-soft/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Автоматично събиране</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            Всеки понеделник сутрин ИИ търси в мрежата предстоящи земеделски
            събития, приеми по програми и новини за пазара, и добавя само това,
            което още го няма тук. Отминалите събития слизат сами.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastRun
              ? `Последно събрано: ${lastRun}`
              : "Още няма автоматично събрани новини."}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(null);
              setResult(await runNewsCollection());
              router.refresh();
            })
          }
        >
          {pending ? "Търсим…" : "Пусни сега"}
        </Button>
      </div>

      {pending ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Търсенето отнема до няколко минути — не затваряйте страницата.
        </p>
      ) : null}

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
