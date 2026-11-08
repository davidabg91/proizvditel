import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { isBoosted } from "@/lib/boost-plans";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Icon, categoryIcon } from "@/components/ui/icons";

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice: number | null;
  unit: string;
  currency: string;
  isOffer: boolean;
  available: boolean;
  soldOut: boolean;
  boostedUntil?: Date | string | null;
  category: string | null;
  imageUrl: string | null;
  producer: {
    slug: string;
    farmName: string;
    town: string | null;
    region: string | null;
  };
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const href = `/p/${listing.producer.slug}/oferta/${listing.slug}`;
  const boosted = isBoosted(listing.boostedUntil);
  const buyable = listing.available && !listing.soldOut;
  const discount =
    listing.oldPrice && listing.oldPrice > listing.price
      ? Math.round((1 - listing.price / listing.oldPrice) * 100)
      : null;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        boosted ? "border-accent/50 ring-1 ring-accent/25" : "border-border hover:border-primary/30",
      )}
    >
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.title}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                listing.soldOut && "grayscale",
              )}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-soft to-accent-soft text-primary/60">
              <Icon name={categoryIcon(listing.category)} size={40} strokeWidth={1.3} />
              <span className="text-xs font-medium text-muted-foreground">Без снимка</span>
            </div>
          )}

          <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-start gap-1.5">
            {boosted ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
                title="Платено промотиране — обявата излиза най-отпред."
              >
                <Icon name="star" size={12} strokeWidth={2.2} />
                Подсилена
              </span>
            ) : null}
            {listing.isOffer ? (
              <span className="rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold text-accent shadow-sm">
                Оферта
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                −{discount}%
              </span>
            ) : null}
          </div>

          {listing.soldOut ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface/80 px-4 text-center backdrop-blur-[2px]">
              <span className="rounded-full bg-danger px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Изчерпан
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Не може да се купи в момента
              </span>
            </span>
          ) : !listing.available ? (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/70 text-sm font-semibold text-muted-foreground">
              В момента не е налично
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {listing.category ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              <Icon name={categoryIcon(listing.category)} size={13} />
              {listing.category}
            </span>
          ) : null}
          <h3 className="mt-1.5 line-clamp-2 text-[17px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {listing.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
            <Icon name="pin" size={14} className="text-muted-foreground/70" />
            <span className="truncate">
              {listing.producer.farmName}
              {listing.producer.town ? ` · ${listing.producer.town}` : ""}
            </span>
          </p>
          <div className="mt-auto flex items-baseline gap-1.5 pt-4">
            <span className="font-serif text-2xl font-semibold text-foreground">
              {formatPrice(listing.price)}
            </span>
            <span className="text-sm text-muted-foreground">/ {listing.unit}</span>
            {discount ? (
              <span className="ml-1 text-sm text-muted-foreground line-through">
                {formatPrice(listing.oldPrice!)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Действия */}
      <div className="flex items-center gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
        {buyable ? (
          <AddToCartButton
            block
            item={{
              listingId: listing.id,
              producerSlug: listing.producer.slug,
              producerName: listing.producer.farmName,
              title: listing.title,
              price: listing.price,
              unit: listing.unit,
              currency: listing.currency,
              imageUrl: listing.imageUrl,
            }}
          />
        ) : (
          <span className="flex h-9 flex-1 items-center justify-center rounded-full bg-surface-muted text-sm font-medium text-muted-foreground">
            {listing.soldOut ? "Изчерпан" : "Не е налично"}
          </span>
        )}
        <Link
          href={href}
          aria-label={`Виж повече за ${listing.title}`}
          title="Виж повече"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
        >
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </div>
  );
}
