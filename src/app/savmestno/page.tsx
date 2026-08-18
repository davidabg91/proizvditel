import type { Metadata } from "next";
import Link from "next/link";
import { getDeliveryGroups } from "@/lib/shared-delivery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Съвместно пазаруване",
  description:
    "Поръчайте от няколко производителя от един град с една обща доставка.",
};

export const revalidate = 60;

export default async function SharedDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const groups = await getDeliveryGroups(q);

  return (
    <main className="container-page py-12">
      <div className="max-w-2xl">
        <p className="eyebrow">Съвместно пазаруване</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Една доставка, няколко стопанства</h1>
        <p className="mt-3 text-muted-foreground">
          Производители от един град, които изпращат продукцията си заедно. Купете
          различни продукти от няколко стопанства — с една обща доставка и по-ниски
          разходи.
        </p>
      </div>

      {/* Търсене „търся това“ */}
      <form action="/savmestno" className="mt-8 flex max-w-xl gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Търся… напр. мед, ягоди, сирене"
          aria-label="Търсене"
        />
        <Button type="submit" className="shrink-0">
          Търси
        </Button>
      </form>

      {q ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Резултати за „{q}" · {groups.length}{" "}
          {groups.length === 1 ? "група" : "групи"} за съвместна доставка
        </p>
      ) : null}

      {groups.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">
            {q ? "Няма намерени групи за това търсене" : "Все още няма групи за съвместна доставка"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Групите се появяват, когато поне двама производители от един град
            включат съвместна доставка.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {groups.map((g) => (
            <section
              key={g.town}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{g.town}</h2>
                    <Badge tone="success">Съвместна доставка</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {g.producers.length} стопанства изпращат заедно
                    {g.region ? ` · ${g.region}` : ""}
                  </p>
                </div>
                <Button href={`/savmestno/${encodeURIComponent(g.town)}`} variant="outline" size="sm">
                  Виж групата
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.producers.map((p) => {
                  const shown = (q && p.matching.length > 0 ? p.matching : p.listings).slice(0, 3);
                  return (
                    <div
                      key={p.slug}
                      className="rounded-[var(--radius-md)] border border-border bg-background p-4"
                    >
                      <Link
                        href={`/p/${p.slug}`}
                        className="flex items-center gap-2.5"
                      >
                        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-sm font-semibold text-primary">
                          {p.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            p.farmName.charAt(0)
                          )}
                        </span>
                        <span className="truncate text-sm font-semibold hover:text-primary">
                          {p.farmName}
                        </span>
                      </Link>
                      {shown.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-1.5">
                          {shown.map((l) => (
                            <li key={l.id} className="flex justify-between gap-2 text-sm">
                              <Link
                                href={`/p/${p.slug}/oferta/${l.slug}`}
                                className="truncate text-foreground/90 hover:text-primary"
                              >
                                {l.title}
                              </Link>
                              <span className="shrink-0 font-medium text-muted-foreground">
                                {formatPrice(l.price)}/{l.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Разгледайте профила за продукция.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
