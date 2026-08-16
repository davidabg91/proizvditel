import Link from "next/link";
import { RatingStars } from "@/components/ui/rating";

export type ProducerCardData = {
  slug: string;
  farmName: string;
  ownerName: string;
  description?: string | null;
  town: string | null;
  region: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  coverPosition?: number | null;
  coverPositionX?: number | null;
  coverScale?: number | null;
  urnVerified?: boolean;
  startedYear?: number | null;
  totalDecares?: number | null;
  ratingAvg: number;
  ratingCount: number;
  sharedDelivery: boolean;
  listingsCount: number;
  topCrops: string[];
};

export function ProducerCard({ producer }: { producer: ProducerCardData }) {
  const location = [producer.town, producer.region].filter(Boolean).join(", ");

  return (
    <Link
      href={`/p/${producer.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
    >
      {/* Корица и значки */}
      <div className="relative h-36 w-full overflow-hidden bg-primary-soft">
        {producer.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={producer.coverUrl}
            alt={producer.farmName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{
              objectPosition: `${producer.coverPositionX ?? 50}% ${producer.coverPosition ?? 50}%`,
              transform: `scale(${(producer.coverScale ?? 100) / 100})`,
              transformOrigin: `${producer.coverPositionX ?? 50}% ${producer.coverPosition ?? 50}%`,
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/15 to-surface-muted" />
        )}

        {/* Тъмен градиент в долната част за по-добра видимост на аватара */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Значки в горния десен и ляв ъгъл */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          {producer.urnVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
              <span>✓</span>
              <span>Потвърден</span>
            </span>
          ) : (
            <span />
          )}

          {producer.sharedDelivery ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-0.5 text-[11px] font-semibold text-success shadow-md backdrop-blur-xs border border-success/30">
              🤝 Съвместна доставка
            </span>
          ) : null}
        </div>
      </div>

      {/* Основно тяло */}
      <div className="flex flex-1 flex-col p-5">
        {/* Лого / Аватар, изнесен леко над съдържанието */}
        <div className="-mt-12 mb-3 flex items-end justify-between">
          <div className="h-16 w-16 overflow-hidden rounded-[var(--radius-lg)] border-2 border-surface bg-surface-muted shadow-md shrink-0">
            {producer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={producer.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-xl font-bold text-primary bg-primary-soft">
                {producer.farmName.charAt(0)}
              </div>
            )}
          </div>

          <div className="pb-1">
            <RatingStars value={producer.ratingAvg} count={producer.ratingCount} size="sm" />
          </div>
        </div>

        {/* Заглавие и стопанин */}
        <div>
          <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
            <span className="truncate">{producer.farmName}</span>
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>
              Стопанин: <strong className="font-medium text-foreground">{producer.ownerName}</strong>
            </span>
            {location && (
              <>
                <span>•</span>
                <span className="truncate">📍 {location}</span>
              </>
            )}
          </div>
        </div>

        {/* Описание на стопанството */}
        {producer.description ? (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {producer.description}
          </p>
        ) : null}

        {/* Характеристики на стопанството (години, площ, култури) */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {producer.startedYear ? (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
              🌱 От {producer.startedYear} г.
            </span>
          ) : null}

          {producer.totalDecares ? (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
              🚜 {producer.totalDecares} дка
            </span>
          ) : null}

          {producer.topCrops.map((crop) => (
            <span
              key={crop}
              className="inline-flex items-center rounded-[var(--radius-sm)] bg-primary-soft/40 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20"
            >
              {crop}
            </span>
          ))}
        </div>

        {/* Долна лента: обяви и бутон */}
        <div className="mt-auto pt-4 border-t border-border/70 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">
            {producer.listingsCount > 0 ? (
              <span className="text-foreground">
                <span className="text-primary font-bold">{producer.listingsCount}</span> налични{" "}
                {producer.listingsCount === 1 ? "продукт" : "продукта"}
              </span>
            ) : (
              <span>Профил на стопанството</span>
            )}
          </span>

          <span className="text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
            <span>Разгледай</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
