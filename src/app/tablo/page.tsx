import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProducer } from "@/lib/session";
import { getIncomingPartnerRequestCount } from "@/lib/partners";
import { getNewOrdersCount } from "@/app/tablo/porachki/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardHome() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  const p = producer.payment;
  const hasCardPayment = !!producer.stripeChargesEnabled;
  const hasBankTransfer = !!p?.acceptsBankTransfer && !!p?.bankIban;
  const hasRevolut = !!p?.acceptsRevolut && !!p?.revolutLink;
  const hasCod = p?.acceptsCod !== false;
  const hasAnyPayment = hasCardPayment || hasBankTransfer || hasRevolut || hasCod;

  const hasDescription = !!producer.description && producer.description.trim().length > 10;
  const hasLocation = !!producer.region && !!producer.town;
  const hasPhone = !!producer.phone;
  const hasVisuals = !!producer.logoUrl && !!producer.coverUrl;
  const hasUrnDoc = !!producer.urnDocumentUrl;
  const isUrnVerified = producer.urnVerified;
  const hasCrops = producer.crops.length > 0;
  const hasPhotos = producer.photos.length > 0;
  const hasListings = producer._count.listings > 0;

  // Списък със задачи за попълване на профила
  const checklistItems = [
    {
      id: "card_payments",
      title: "Плащане с карта (Stripe)",
      description: "Свържете сметката си за директно получаване на картови плащания от купувачите.",
      href: "/tablo/plashtania",
      actionText: "Настрой Stripe",
      done: hasCardPayment,
      critical: true,
      icon: "💳",
    },
    {
      id: "listings",
      title: "Обяви за продажба",
      description: "Качете вашите пресни продукти с цени, мерни единици и наличности.",
      href: "/tablo/produkti",
      actionText: "Добави обява",
      done: hasListings,
      critical: true,
      icon: "📦",
    },
    {
      id: "urn_verification",
      title: "Верификация с Регистрационна карта",
      description: isUrnVerified
        ? "Профилът ви е официално потвърден със зелена значка."
        : hasUrnDoc
          ? "Регистрационната ви карта е качена и се преглежда от администратор."
          : "Качете карта по Наредба №3 за официална значка „✓ Потвърден производител“.",
      href: "/tablo/profil",
      actionText: hasUrnDoc ? "Преглед на карта" : "Качи регистрационна карта",
      done: isUrnVerified,
      pending: !isUrnVerified && hasUrnDoc,
      critical: false,
      icon: "✓",
    },
    {
      id: "photos",
      title: "Снимки на площта и продукцията",
      description: "Покажете как изглеждат нивите, градините и истинската реколта.",
      href: "/tablo/snimki",
      actionText: "Качи снимки",
      done: hasPhotos,
      critical: false,
      icon: "📸",
    },
    {
      id: "visuals",
      title: "Лого и Снимка на площта (корица)",
      description: "Оформете визуалната идентичност на вашето стопанство.",
      href: "/tablo/profil",
      actionText: "Оформи визията",
      done: hasVisuals,
      critical: false,
      icon: "🖼️",
    },
    {
      id: "details",
      title: "Представяне, локация и телефон",
      description: "Разкажете за себе си и въведете коректна област, град/село и телефон.",
      href: "/tablo/profil",
      actionText: "Попълни данни",
      done: hasDescription && hasLocation && hasPhone,
      critical: false,
      icon: "📍",
    },
    {
      id: "crops",
      title: "Култури и сортове",
      description: "Опишете видовете земеделска продукция, които отглеждате.",
      href: "/tablo/produkciya",
      actionText: "Добави култури",
      done: hasCrops,
      critical: false,
      icon: "🌾",
    },
  ];

  const totalTasks = checklistItems.length;
  const completedTasks = checklistItems.filter((t) => t.done).length;
  const pct = Math.round((completedTasks / totalTasks) * 100);

  const stats = [
    { label: "Посещения на профила", value: producer.visits },
    { label: "Активни обяви", value: producer._count.listings },
    { label: "Култури", value: producer.crops.length },
    {
      label: "Оценка",
      value: producer.ratingCount > 0 ? producer.ratingAvg.toFixed(1) : "—",
    },
  ];

  const partnerRequests = await getIncomingPartnerRequestCount(producer.id);
  const newOrders = await getNewOrdersCount(producer.id);

  return (
    <div className="space-y-6">
      {/* Заглавие на таблото */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl text-foreground">
            Здравейте, {producer.ownerName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Контролен панел на стопанство <strong>{producer.farmName}</strong>
          </p>
        </div>
        <Button href={`/p/${producer.slug}`} variant="outline" size="sm">
          Виж публичния профил
        </Button>
      </div>

      {/* Известие за нови поръчки */}
      {newOrders > 0 ? (
        <Link
          href="/tablo/porachki"
          className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-primary/40 bg-primary-soft p-5 transition-colors hover:bg-primary-soft/70 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-semibold text-primary">
                {newOrders}{" "}
                {newOrders === 1 ? "нова поръчка" : "нови поръчки"} за обработка
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-foreground/80">
                Вижте какво да изпратите, до кого и обновете статуса.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary">Виж поръчките →</span>
        </Link>
      ) : null}

      {/* Известие за заявка за партньорство */}
      {partnerRequests > 0 ? (
        <Link
          href="/tablo/partnyori"
          className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-accent/40 bg-accent-soft p-5 transition-colors hover:bg-accent-soft/70 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="font-semibold text-accent">
                {partnerRequests}{" "}
                {partnerRequests === 1
                  ? "производител иска да работи с вас"
                  : "производители искат да работят с вас"}
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-foreground/80">
                Прегледайте заявките и потвърдете, за да предлагате съвместна доставка.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-accent">Виж →</span>
        </Link>
      ) : null}

      {/* Важни приоритетни напомняния (Banners) */}
      {!hasCardPayment && (
        <div className="rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Активирайте получаване на плащания с банкови карти</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    Препоръчително
                  </span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Свържете се със Stripe за 1 минута, за да могат клиентите да плащат веднага с дебитна или кредитна карта онлайн. Парите постъпват директно във вашата сметка.
                </p>
              </div>
            </div>
            <Link
              href="/tablo/plashtania"
              className="shrink-0 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors shadow-xs"
            >
              Активирай плащания →
            </Link>
          </div>
        </div>
      )}

      {!hasListings && (
        <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-primary-soft/40 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  Все още нямате качени обяви за продажба
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  За да могат потребителите да пазаруват от вас през каталога и профила, добавете вашите пресни продукти с цени и наличност.
                </p>
              </div>
            </div>
            <Link
              href="/tablo/produkti"
              className="shrink-0 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors shadow-xs"
            >
              Добави първи продукт →
            </Link>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xs"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 font-serif text-3xl font-semibold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Контролен списък: Завършеност на профила и напомняния */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span>Какво остава да попълните</span>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                {completedTasks} от {totalTasks} завършени
              </span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Пълните и верифицирани профили изграждат доверие и привличат значително повече купувачи.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-serif text-2xl font-bold text-primary">{pct}%</span>
              <p className="text-[11px] text-muted-foreground">готовност</p>
            </div>
          </div>
        </div>

        {/* Прогрес лента */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted border border-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Списък със задачи и напомняния */}
        <div className="mt-6 divide-y divide-border/60">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={[
                        "text-sm font-semibold",
                        item.done ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground",
                      ].join(" ")}
                    >
                      {item.title}
                    </h4>

                    {item.done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                        ✓ Готово
                      </span>
                    ) : item.pending ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                        ⏳ В преглед
                      </span>
                    ) : item.critical ? (
                      <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        Важно
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
                        Непопълнено
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>

              {!item.done && (
                <Link
                  href={item.href}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline self-start sm:self-center"
                >
                  <span>{item.actionText}</span>
                  <span>→</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Бързи връзки към разделите */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Управление на профила
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="/tablo/profil"
            title="Профил и Верификация"
            text="Име, УРН, карта, лого и корица на площта."
            icon="👤"
          />
          <QuickLink
            href="/tablo/produkti"
            title="Обяви за продажба"
            text="Качване на продукти, цени и оферти."
            icon="📦"
          />
          <QuickLink
            href="/tablo/snimki"
            title="Снимки на площта"
            text="Галерия от стопанството и продукцията."
            icon="📸"
          />
          <QuickLink
            href="/tablo/plashtania"
            title="Начини на плащане"
            text="Плащания с карта, Stripe, банка и наложен платеж."
            icon="💳"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  text,
  icon,
}: {
  href: string;
  title: string;
  text: string;
  icon?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:bg-surface-muted hover:shadow-xs"
    >
      <div className="flex items-center gap-2">
        {icon ? <span className="text-base">{icon}</span> : null}
        <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
    </Link>
  );
}
