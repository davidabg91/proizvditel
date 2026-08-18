import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { activateBoost, BOOST_PLANS, formatBoostPrice } from "@/lib/boost";
import { ListingsManager } from "./listings-manager";

/**
 * Проверява дали плащането за подсилване е минало успешно при връщане от
 * Stripe. Дублира webhook-а, за да работи и когато той не е конфигуриран.
 */
async function confirmBoost(sessionId: string): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkout.payment_status !== "paid") return false;
    const res = await activateBoost(
      checkout.id,
      typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
    );
    return res.ok;
  } catch (e) {
    console.error("confirmBoost error:", e);
    return false;
  }
}

export default async function ManageListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ boost_session?: string; boost?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/vhod");

  const sp = await searchParams;
  let boostConfirmed = false;
  if (sp.boost_session) {
    boostConfirmed = await confirmBoost(sp.boost_session);
  }

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      listings: {
        orderBy: { createdAt: "desc" },
        include: { photos: { orderBy: { sort: "asc" } } },
      },
    },
  });
  if (!producer) redirect("/vhod");

  const rows = producer.listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    category: l.category,
    price: l.price,
    oldPrice: l.oldPrice,
    unit: l.unit,
    currency: l.currency,
    available: l.available,
    isOffer: l.isOffer,
    soldOut: l.soldOut,
    stockNote: l.stockNote,
    boostedUntil: l.boostedUntil ? l.boostedUntil.toISOString() : null,
    photos: l.photos.map((p) => p.url),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Обяви за продажба</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Вашият каталог. Добавяйте продукти със снимки, цени и оферти.
        </p>
      </div>

      {boostConfirmed ? (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          ✓ Плащането е успешно — обявата вече е подсилена и излиза най-отпред.
        </div>
      ) : null}
      {sp.boost === "cancel" ? (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
          Плащането за подсилване беше прекратено. Обявата остава без промяна.
        </div>
      ) : null}

      {/* Обяснение какво е подсилване */}
      <section className="mb-8 rounded-[var(--radius-lg)] border border-accent/30 bg-accent-soft/50 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <span aria-hidden>★</span> Подсилена обява — какво означава?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          Подсилените обяви излизат{" "}
          <strong>най-отгоре в „Актуални предложения“ на началната страница</strong> и
          пред всички останали в каталога. Новите обяви се показват едва след
          подсилените, така че вашият продукт се вижда пръв от всички посетители на
          сайта.
        </p>
        <ul className="mt-3 grid gap-1.5 text-sm text-foreground/80 sm:grid-cols-2">
          <li>• Челно място на началната страница и в каталога</li>
          <li>• Отличителен знак „Подсилена“ върху снимката</li>
          <li>• Многократно повече показвания и посещения на профила</li>
          <li>• Периодът се удължава, ако платите отново преди изтичане</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {BOOST_PLANS.map((p) => (
            <span
              key={p.code}
              className="rounded-full border border-border-strong bg-surface px-3 py-1 text-sm font-semibold"
            >
              {p.label} — {formatBoostPrice(p.price)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Таксата се плаща с карта към платформата. Натиснете „Подсили“ при избрана
          обява, за да изберете период.
        </p>
      </section>

      <ListingsManager listings={rows} />
    </div>
  );
}
