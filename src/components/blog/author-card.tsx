import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating";
import { formatPrice } from "@/lib/utils";

/**
 * Визитка на стопанството под статията.
 *
 * Читателят стига дотук, след като е прочел нещо полезно от този човек —
 * това е моментът с най-високо доверие в целия сайт. Затова показваме кой
 * е, какво отглежда и какво продава в момента, вместо само името му.
 */

export type ArticleAuthor = {
  farmName: string;
  slug: string;
  ownerName: string;
  description: string | null;
  logoUrl: string | null;
  town: string | null;
  region: string | null;
  startedYear: number | null;
  urnVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  crops: string[];
  listings: {
    id: string;
    slug: string;
    title: string;
    price: number;
    unit: string;
    imageUrl: string | null;
  }[];
};

export function ArticleAuthorCard({ author }: { author: ArticleAuthor }) {
  const location = [author.town, author.region].filter(Boolean).join(", ");

  return (
    <section className="mt-12 overflow-hidden rounded-[var(--radius-lg)] border border-primary/25 bg-primary-soft/30">
      <div className="p-6">
        <p className="eyebrow">Статията е от</p>

        <div className="mt-3 flex flex-wrap items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            {author.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.logoUrl}
                alt={author.farmName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-semibold text-primary">
                {author.farmName.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/p/${author.slug}`}
                className="font-serif text-xl font-semibold hover:text-primary"
              >
                {author.farmName}
              </Link>
              {author.urnVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                  ✓ Потвърден производител
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {author.ownerName}
              {location ? ` · ${location}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {author.ratingCount > 0 ? (
                <RatingStars value={author.ratingAvg} count={author.ratingCount} />
              ) : null}
              {author.startedYear ? (
                <Badge tone="outline">Стопанисва от {author.startedYear} г.</Badge>
              ) : null}
            </div>
          </div>
        </div>

        {author.description ? (
          <p className="mt-4 line-clamp-3 leading-relaxed text-foreground/85">
            {author.description}
          </p>
        ) : null}

        {author.crops.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Отглеждат</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {author.crops.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border-strong bg-surface px-2.5 py-0.5 text-xs font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button href={`/p/${author.slug}`}>Виж стопанството</Button>
          <Button href={`/chat/${author.slug}`} variant="outline">
            Пиши им
          </Button>
        </div>
      </div>

      {/* Какво продават в момента — читателят е точно в настроение да купи */}
      {author.listings.length > 0 ? (
        <div className="border-t border-primary/20 bg-surface/60 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold">В момента предлагат</h3>
            <Link
              href={`/p/${author.slug}#produkti`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Всички обяви →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {author.listings.map((l) => (
              <Link
                key={l.id}
                href={`/p/${author.slug}/oferta/${l.slug}`}
                className="group overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                  {l.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.imageUrl}
                      alt={l.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Без снимка
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                    {l.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {formatPrice(l.price)}{" "}
                    <span className="font-normal text-muted-foreground">/ {l.unit}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
