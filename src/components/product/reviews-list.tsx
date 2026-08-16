import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";
import { formatDate } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  createdAt: Date;
};

export function ReviewsList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-8 text-center text-muted-foreground">
        Все още няма оценки за този производител.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted font-serif text-sm font-semibold text-primary">
                {r.authorName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold">{r.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {r.verified ? <Badge tone="success">Потвърдена покупка</Badge> : null}
              <RatingStars value={r.rating} size="sm" />
            </div>
          </div>
          {r.comment ? (
            <p className="mt-3 leading-relaxed text-foreground/90">{r.comment}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
