import Link from "next/link";
import { farmInitial } from "@/lib/utils";
import { RatingStars } from "@/components/ui/rating";
import { Icon } from "@/components/ui/icons";
import { FarmNameCover } from "@/components/brand/farm-name-cover";

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
      className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      {/* Корица */}
      <div className="relative h-36 w-full overflow-hidden bg-primary">
        {producer.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={producer.coverUrl}
            alt={producer.farmName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{
              objectPosition: `${producer.coverPositionX ?? 50}% ${producer.coverPosition ?? 50}%`,
              transform: `scale(${(producer.coverScale ?? 100) / 100})`,
              transformOrigin: `${producer.coverPositionX ?? 50}% ${producer.coverPosition ?? 50}%`,
            }}
          />
        ) : (
          <FarmNameCover farmName={producer.farmName} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-1.5">
          {producer.urnVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              <Icon name="check" size={12} strokeWidth={2.6} />
              Потвърден
            </span>
          ) : (
            <span />
          )}
          {producer.sharedDelivery ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-md">
              <Icon name="truck" size={13} />
              Съвместна доставка
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Лого, име и рейтинг — изцяло под корицата */}
        <div className="flex items-start gap-3.5">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-primary-soft shadow-sm">
            {producer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={producer.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-xl font-bold text-primary">
                {farmInitial(producer.farmName)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {producer.farmName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {producer.ownerName}
            </p>
            <div className="mt-1">
              <RatingStars value={producer.ratingAvg} count={producer.ratingCount} size="sm" />
            </div>
          </div>
        </div>

        {location ? (
          <p className="mt-3.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon name="pin" size={15} className="text-accent" />
            <span className="truncate">{location}</span>
          </p>
        ) : null}

        {producer.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {producer.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {producer.startedYear ? (
            <Chip icon="sprout">От {producer.startedYear} г.</Chip>
          ) : null}
          {producer.totalDecares ? <Chip icon="field">{producer.totalDecares} дка</Chip> : null}
          {producer.topCrops.map((crop) => (
            <span
              key={crop}
              className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {crop}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">
            {producer.listingsCount > 0 ? (
              <>
                <strong className="font-semibold text-foreground">{producer.listingsCount}</strong>{" "}
                {producer.listingsCount === 1 ? "наличен продукт" : "налични продукта"}
              </>
            ) : (
              "Профил на стопанството"
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            Разгледай
            <Icon
              name="arrow-right"
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Chip({ icon, children }: { icon: "sprout" | "field"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <Icon name={icon} size={13} />
      {children}
    </span>
  );
}
