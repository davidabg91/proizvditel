"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatPrice } from "@/lib/utils";

type PartnerListing = {
  id: string;
  slug: string;
  title: string;
  price: number;
  unit: string;
  currency: string;
  imageUrl: string | null;
};
type Partner = {
  slug: string;
  farmName: string;
  town: string | null;
  listings: PartnerListing[];
};

export function PartnerSuggestions({
  producerSlug,
  producerName,
}: {
  producerSlug: string;
  producerName: string;
}) {
  const [partners, setPartners] = useState<Partner[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/producers/${producerSlug}/partners`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setPartners(d.partners ?? []);
      })
      .catch(() => setPartners([]));
    return () => {
      active = false;
    };
  }, [producerSlug]);

  const withProducts = (partners ?? []).filter((p) => p.listings.length > 0);
  if (withProducts.length === 0) return null;

  const names = withProducts.map((p) => p.farmName).join(", ");

  return (
    <div className="border-t border-border bg-success-soft/40 p-5">
      <p className="text-sm font-semibold text-success">
        Изпраща се заедно с {names}
      </p>
      <p className="mt-1 text-sm text-foreground/80">
        {producerName} работи съвместно с тези стопанства. Добавете и техни
        продукти — ще пристигнат с <strong>една обща доставка</strong>.
      </p>

      <div className="mt-4 flex flex-col gap-5">
        {withProducts.map((p) => (
          <div key={p.slug}>
            <div className="mb-2 flex items-center justify-between">
              <Link href={`/p/${p.slug}`} className="text-sm font-semibold hover:text-primary">
                {p.farmName}
                {p.town ? (
                  <span className="font-normal text-muted-foreground"> · {p.town}</span>
                ) : null}
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {p.listings.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface"
                >
                  <Link href={`/p/${p.slug}/oferta/${l.slug}`} className="flex items-center gap-3 p-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted">
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {l.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(l.price)} / {l.unit}
                      </span>
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 border-t border-border p-2">
                    <AddToCartButton
                      block
                      item={{
                        listingId: l.id,
                        producerSlug: p.slug,
                        producerName: p.farmName,
                        title: l.title,
                        price: l.price,
                        unit: l.unit,
                        currency: l.currency,
                        imageUrl: l.imageUrl,
                      }}
                    />
                    <Link
                      href={`/p/${p.slug}/oferta/${l.slug}`}
                      className="shrink-0 rounded-[var(--radius-sm)] border border-border-strong px-2.5 py-2 text-xs font-medium hover:border-primary hover:text-primary"
                    >
                      Виж повече
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
