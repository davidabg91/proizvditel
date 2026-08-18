"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/components/cart/cart-context";
import { OrderBox } from "@/components/cart/order-box";
import { PartnerSuggestions } from "@/components/cart/partner-suggestions";
import { CombinedPay } from "@/components/cart/combined-pay";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, ready, setQty, remove, clear, total } = useCart();

  if (ready && items.length === 0) {
    return (
      <main className="container-page py-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow">Кошница</p>
          <h1 className="mt-2 text-3xl">Кошницата е празна</h1>
          <p className="mt-3 text-muted-foreground">
            Разгледайте каталога и добавете продукти от любимите си стопанства.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/katalog">Към каталога</Button>
            <Button href="/savmestno" variant="outline">
              Съвместна доставка
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Групиране по производител
  const groups = new Map<string, { name: string; items: CartItem[] }>();
  for (const it of items) {
    if (!groups.has(it.producerSlug)) {
      groups.set(it.producerSlug, { name: it.producerName, items: [] });
    }
    groups.get(it.producerSlug)!.items.push(it);
  }
  const groupList = [...groups.entries()];

  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Кошница</p>
            <h1 className="mt-2 text-3xl">Вашата поръчка</h1>
          </div>
          {items.length > 0 ? (
            <button
              onClick={clear}
              className="text-sm font-medium text-muted-foreground hover:text-danger"
            >
              Изчисти
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Продуктите са групирани по стопанство. Плащането и доставката се
          уговарят директно с всеки производител.
        </p>

        {groupList.length >= 2 ? (
          <div className="mt-6">
            <CombinedPay
              producerCount={groupList.length}
              items={items.map((i) => ({ listingId: i.listingId, qty: i.qty }))}
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-6">
          {groupList.map(([slug, group]) => {
            const subtotal = group.items.reduce((s, i) => s + i.qty * i.price, 0);
            return (
              <section
                key={slug}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
              >
                <div className="flex items-center justify-between border-b border-border bg-surface-muted/50 px-5 py-3">
                  <Link href={`/p/${slug}`} className="font-semibold hover:text-primary">
                    {group.name}
                  </Link>
                  <Link
                    href={`/savmestno`}
                    className="text-xs font-medium text-muted-foreground hover:text-primary"
                  >
                    Съвместна доставка?
                  </Link>
                </div>

                <ul className="divide-y divide-border">
                  {group.items.map((it) => (
                    <li key={it.listingId} className="flex items-center gap-4 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
                        {it.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{it.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(it.price)} / {it.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <QtyButton onClick={() => setQty(it.listingId, it.qty - 1)}>
                          −
                        </QtyButton>
                        <span className="w-8 text-center text-sm font-semibold">
                          {it.qty}
                        </span>
                        <QtyButton onClick={() => setQty(it.listingId, it.qty + 1)}>
                          +
                        </QtyButton>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-semibold">
                          {formatPrice(it.qty * it.price)}
                        </p>
                        <button
                          onClick={() => remove(it.listingId)}
                          className="text-xs text-muted-foreground hover:text-danger"
                        >
                          Премахни
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 border-t border-border p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Междинна сума
                    </span>
                    <span className="font-serif text-lg font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <OrderBox
                    producerSlug={slug}
                    orderLines={group.items.map(
                      (i) => `${i.title} × ${i.qty} ${i.unit}`,
                    )}
                    items={group.items.map((i) => ({
                      listingId: i.listingId,
                      qty: i.qty,
                    }))}
                  />
                </div>

                <PartnerSuggestions producerSlug={slug} producerName={group.name} />
              </section>
            );
          })}
        </div>

        {/* Общо */}
        <div className="mt-8 flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <span className="text-lg font-semibold">Общо</span>
          <span className="font-serif text-2xl font-semibold text-primary">
            {formatPrice(total)}
          </span>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Сумата е ориентировъчна. Финалната цена и доставка се потвърждават от
          производителя.
        </p>
      </div>
    </main>
  );
}

function QtyButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border-strong text-lg font-medium text-foreground hover:border-primary hover:text-primary"
    >
      {children}
    </button>
  );
}
