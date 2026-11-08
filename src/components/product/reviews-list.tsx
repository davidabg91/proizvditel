import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  createdAt: Date;
};

export function ReviewsList({
  reviews,
  empty,
}: {
  reviews: ReviewItem[];
  /** Текст, когато още няма оценки — различен за профил и за обява. */
  empty?: string;
}) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface/60 p-8 text-center text-muted-foreground">
        <Icon name="star" size={28} strokeWidth={1.4} className="text-accent/60" />
        <p>{empty ?? "Все още няма оценки за този производител."}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-xs"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-serif text-sm font-semibold text-primary">
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
