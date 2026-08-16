"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { submitReview, deleteReview } from "@/app/p/[slug]/review-actions";

export function ReviewForm({
  slug,
  initial,
}: {
  slug: string;
  initial: { rating: number; comment: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    if (rating < 1) {
      setError("Изберете оценка от 1 до 5 звезди.");
      return;
    }
    startTransition(async () => {
      const res = await submitReview(slug, { rating, comment: comment.trim() });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteReview(slug);
      setRating(0);
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h3 className="font-semibold">
        {initial ? "Вашата оценка" : "Оставете оценка"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Споделете опита си с този производител.
      </p>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} звезди`}
            className={cn(
              "text-2xl leading-none transition-colors",
              (hover || rating) >= i ? "text-accent" : "text-border-strong",
            )}
          >
            ★
          </button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Как беше продукцията и обслужването? (по избор)"
        className="mt-4 min-h-24"
      />

      {error ? <p className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
      {saved ? (
        <p className="mt-2 text-sm font-medium text-success">Оценката е запазена. Благодарим!</p>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Запазваме…" : initial ? "Обнови оценката" : "Публикувай оценка"}
        </Button>
        {initial ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-sm font-medium text-muted-foreground hover:text-danger disabled:opacity-50"
          >
            Изтрий
          </button>
        ) : null}
      </div>
    </div>
  );
}
