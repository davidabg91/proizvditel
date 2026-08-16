import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

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
  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Без снимка
            </div>
          )}
          {listing.isOffer ? (
            <span className="absolute left-3 top-3">
              <Badge tone="accent">Оферта</Badge>
            </span>
          ) : null}
          {!listing.available ? (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/70 text-sm font-semibold text-muted-foreground">
              В момента не е налично
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {listing.category ? (
            <span className="text-xs font-medium uppercase tracking-wide text-accent">
              {listing.category}
            </span>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary">
            {listing.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {listing.producer.farmName}
            {listing.producer.town ? ` · ${listing.producer.town}` : ""}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold text-foreground">
              {formatPrice(listing.price, listing.currency as "BGN" | "EUR")}
            </span>
            <span className="text-sm text-muted-foreground">/ {listing.unit}</span>
            {listing.oldPrice && listing.oldPrice > listing.price ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(listing.oldPrice, listing.currency as "BGN" | "EUR")}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Действия */}
      <div className="flex items-center gap-2 border-t border-border p-3">
        {listing.available ? (
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
          <span className="flex-1 text-center text-sm text-muted-foreground">
            Не е налично
          </span>
        )}
        <Link
          href={href}
          className="shrink-0 rounded-[var(--radius-sm)] border border-border-strong px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
        >
          Виж повече
        </Link>
      </div>
    </div>
  );
}
