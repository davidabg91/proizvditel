import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";

export type ProducerCardData = {
  slug: string;
  farmName: string;
  ownerName: string;
  town: string | null;
  region: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  coverPosition?: number | null;
  coverPositionX?: number | null;
  coverScale?: number | null;
  urnVerified?: boolean;
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
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-32 overflow-hidden bg-primary-soft">
        {producer.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={producer.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            style={{
              objectPosition: `${producer.coverPositionX ?? 50}% ${producer.coverPosition ?? 50}%`,
              transform: `scale(${(producer.coverScale ?? 100) / 100})`,
              transformOrigin: `${producer.coverPositionX ?? 50}% ${producer.coverPosition ?? 50}%`,
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
        )}
        {producer.sharedDelivery ? (
          <span className="absolute right-3 top-3">
            <Badge tone="success">Съвместна доставка</Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 h-14 w-14 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-muted">
          {producer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={producer.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-lg font-semibold text-primary">
              {producer.farmName.charAt(0)}
            </div>
          )}
        </div>

        <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary flex items-center gap-1.5">
          <span>{producer.farmName}</span>
          {producer.urnVerified ? (
            <span
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white shadow-xs"
              title="✓ Потвърден земеделски производител"
            >
              ✓
            </span>
          ) : null}
        </h3>
        {location ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>
        ) : null}

        <div className="mt-2">
          <RatingStars value={producer.ratingAvg} count={producer.ratingCount} size="sm" />
        </div>

        {producer.topCrops.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {producer.topCrops.slice(0, 3).map((c) => (
              <Badge key={c} tone="neutral">
                {c}
              </Badge>
            ))}
          </div>
        ) : null}

        <p className="mt-auto pt-4 text-sm font-medium text-primary">
          {producer.listingsCount > 0
            ? `${producer.listingsCount} обяви за продажба`
            : "Разгледай профила"}
        </p>
      </div>
    </Link>
  );
}
