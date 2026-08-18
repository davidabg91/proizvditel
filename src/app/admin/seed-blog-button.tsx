"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishSeedBlogPosts, type SeedActionResult } from "./actions";

/**
 * Публикува началните статии от блога. Ползва се веднъж при пускане на
 * сайта; повторно натискане само обновява текстовете, без да ги дублира.
 */
export function SeedBlogButton({ existing }: { existing: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SeedActionResult | null>(null);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Начални статии в блога</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Четири готови статии по често търсени теми, с връзки към каталога и
            стопанствата. {existing > 0
              ? `Вече са публикувани ${existing} от тях — повторното натискане само обновява текстовете.`
              : "Още не са публикувани."}
          </p>
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(null);
              setResult(await publishSeedBlogPosts());
              router.refresh();
            })
          }
        >
          {pending
            ? "Публикуваме…"
            : existing > 0
              ? "Обнови статиите"
              : "Публикувай статиите"}
        </Button>
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

      <p className="mt-3 text-xs text-muted-foreground">
        Кориците се добавят след това от Табло → Блог за всяка статия.
      </p>
    </div>
  );
}
