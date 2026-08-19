import type { Metadata } from "next";
import Link from "next/link";
import { getDeliveryBoard, type DeliveryGroup } from "@/lib/shared-delivery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/savmestno" },
  title: "Съвместно пазаруване",
  description:
    "Поръчайте от няколко производителя от една област с една обща доставка.",
};

export const revalidate = 60;

export default async function SharedDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { confirmed, potential } = await getDeliveryBoard(q);
  const total = confirmed.length + potential.length;

  return (
    <main className="container-page py-12">
      <div className="max-w-2xl">
        <p className="eyebrow">Съвместно пазаруване</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Една доставка, няколко стопанства</h1>
        <p className="mt-3 text-muted-foreground">
          Стопанства от една област, които изпращат продукцията си заедно. Купете
          различни продукти от няколко стопанства с една обща доставка и по-ниски
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
          Резултати за „{q}“ · {total} {total === 1 ? "група" : "групи"}
        </p>
      ) : null}

      {total === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">
            {q
              ? "Няма намерени групи за това търсене"
              : "Все още няма групи за съвместна доставка"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Групата се появява, когато две стопанства от една област включат
            съвместна доставка.
          </p>
        </div>
      ) : null}

      {confirmed.length > 0 ? (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-success">
            <span aria-hidden>✓</span> Изпращат заедно
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Тези стопанства са се уговорили помежду си. Поръчайте от няколко —
            продукцията пътува с една обща доставка.
          </p>
          <div className="mt-5 flex flex-col gap-6">
            {confirmed.map((g) => (
              <GroupSection key={`c-${g.key}`} group={g} q={q} />
            ))}
          </div>
        </div>
      ) : null}

      {potential.length > 0 ? (
        <div className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden className="text-muted-foreground">
              ○
            </span>{" "}
            Могат да изпращат заедно
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Стопанства от една област, които приемат съвместна доставка, но още
            не са се уговаряли. Попитайте ги дали ще обединят пратка — пишете им
            през платформата.
          </p>
          <div className="mt-5 flex flex-col gap-6">
            {potential.map((g) => (
              <GroupSection key={`p-${g.key}`} group={g} q={q} />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}

/** Една група — потвърдена или възможна. */
function GroupSection({
  group: g,
  q,
}: {
  group: DeliveryGroup;
  q?: string;
}) {
  return (
    <section
      className={
        g.confirmed
          ? "rounded-[var(--radius-lg)] border border-success/30 bg-success-soft/30 p-6"
          : "rounded-[var(--radius-lg)] border border-border bg-surface p-6"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{g.title}</h3>
            {g.confirmed ? (
              <Badge tone="success">Свързани партньори</Badge>
            ) : (
              <Badge tone="outline">Възможна група</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {g.producers.length}{" "}
            {g.confirmed ? "стопанства изпращат заедно" : "стопанства в областта"}
            {g.towns.length > 0 ? ` · ${g.towns.join(", ")}` : ""}
          </p>
        </div>
        {g.confirmed ? (
          <Button
            href={`/savmestno/${encodeURIComponent(g.key)}`}
            variant="outline"
            size="sm"
          >
            Виж групата
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {g.producers.map((p) => {
          const shown = (q && p.matching.length > 0 ? p.matching : p.listings).slice(
            0,
            3,
          );
          return (
            <div
              key={p.slug}
              className="rounded-[var(--radius-md)] border border-border bg-background p-4"
            >
              <Link href={`/p/${p.slug}`} className="flex items-center gap-2.5">
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
              {!g.confirmed ? (
                <Link
                  href={`/chat/${p.slug}`}
                  className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Попитай за обща доставка →
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
