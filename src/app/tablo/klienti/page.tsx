import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KlientiManager, type ClientRow } from "./klienti-manager";

export const metadata = { title: "Клиенти и оценки" };

export default async function KlientiPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/vhod");

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      conversations: {
        select: { customer: { select: { id: true, name: true } } },
        orderBy: { lastMessageAt: "desc" },
      },
      purchases: { select: { customerId: true } },
      reviews: {
        select: { authorId: true, rating: true, comment: true },
      },
    },
  });
  if (!producer) redirect("/vhod");

  const confirmed = new Set(producer.purchases.map((p) => p.customerId));
  const reviewMap = new Map(
    producer.reviews.map((r) => [r.authorId, { rating: r.rating, comment: r.comment }]),
  );

  // Уникални клиенти от разговорите + всички с потвърдена покупка
  const seen = new Map<string, ClientRow>();
  for (const c of producer.conversations) {
    if (!seen.has(c.customer.id)) {
      seen.set(c.customer.id, {
        customerId: c.customer.id,
        name: c.customer.name,
        confirmed: confirmed.has(c.customer.id),
        review: reviewMap.get(c.customer.id) ?? null,
      });
    }
  }
  // Клиенти с потвърдена покупка, но без разговор (рядко) — добавяме имената им
  const missing = [...confirmed].filter((id) => !seen.has(id));
  if (missing.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: missing } },
      select: { id: true, name: true },
    });
    for (const u of users) {
      seen.set(u.id, {
        customerId: u.id,
        name: u.name,
        confirmed: true,
        review: reviewMap.get(u.id) ?? null,
      });
    }
  }

  const clients = [...seen.values()];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Клиенти и оценки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Потвърдете покупка на клиент, за да може той да остави оценка на
          профила ви. Плащанията са извън платформата, затова потвърждението е от
          вас.
        </p>
      </div>
      <KlientiManager clients={clients} />
    </div>
  );
}
