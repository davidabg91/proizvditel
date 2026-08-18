import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getDeliveryChatForUser, markDeliveryChatRead } from "@/lib/delivery-chat";
import { GroupThread } from "./group-thread";

export const metadata = { title: "Съвместна доставка" };

const STATUS: Record<string, { label: string; tone: "neutral" | "primary" | "success" }> =
  {
    new: { label: "Нова", tone: "neutral" },
    processing: { label: "Обработва се", tone: "primary" },
    shipped: { label: "Изпратена", tone: "primary" },
    delivered: { label: "Доставена", tone: "success" },
  };

export default async function DeliveryChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/vhod?next=/sabshteniya/grupa/${id}`);

  const chat = await getDeliveryChatForUser(id, session.user.id);
  if (!chat) notFound();

  await markDeliveryChatRead(id, session.user.id);

  const messages = await prisma.deliveryChatMessage.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      system: true,
      createdAt: true,
      producerId: true,
      producer: { select: { farmName: true, logoUrl: true } },
    },
  });

  const initialMessages = messages.map((m) => ({
    id: m.id,
    body: m.body,
    system: m.system,
    createdAt: m.createdAt.toISOString(),
    mine: !m.system && m.producerId === chat.myProducerId,
    author: m.producer?.farmName ?? null,
    logoUrl: m.producer?.logoUrl ?? null,
  }));

  return (
    <main className="container-page py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/sabshteniya"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Всички съобщения
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold sm:text-2xl">
            Съвместна доставка № {chat.groupCode}
          </h1>
          <Badge tone="success">{chat.orders.length} стопанства</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Разговор само между стопанствата по тази поръчка. Купувачът не го вижда.
        </p>

        {/* Какво е поръчано от кого */}
        <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="border-b border-border bg-surface-muted/50 px-5 py-3">
            <h2 className="font-semibold">Поръчката</h2>
          </div>

          <dl className="grid gap-3 border-b border-border px-5 py-4 text-sm sm:grid-cols-3">
            {chat.customerName ? (
              <div>
                <dt className="text-muted-foreground">Клиент</dt>
                <dd className="font-medium">{chat.customerName}</dd>
              </div>
            ) : null}
            {chat.phone ? (
              <div>
                <dt className="text-muted-foreground">Телефон</dt>
                <dd className="font-medium">
                  <a
                    href={`tel:${chat.phone.replace(/\s+/g, "")}`}
                    className="hover:text-primary hover:underline"
                  >
                    {chat.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {chat.shippingAddress ? (
              <div className="sm:col-span-3">
                <dt className="text-muted-foreground">Доставка до</dt>
                <dd className="whitespace-pre-line font-medium">
                  {chat.shippingAddress}
                </dd>
              </div>
            ) : null}
          </dl>

          <ul className="divide-y divide-border">
            {chat.orders.map((o) => {
              const st = STATUS[o.fulfillmentStatus] ?? STATUS.new;
              return (
                <li key={o.producerId} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-xs font-semibold text-primary">
                      {o.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={o.logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        o.farmName.charAt(0)
                      )}
                    </div>
                    <Link
                      href={`/p/${o.slug}`}
                      className="font-semibold hover:text-primary"
                    >
                      {o.farmName}
                    </Link>
                    {o.town ? (
                      <span className="text-sm text-muted-foreground">· {o.town}</span>
                    ) : null}
                    {o.isMine ? <Badge tone="primary">Вие</Badge> : null}
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>

                  <ul className="mt-2 ml-10 flex flex-col gap-0.5 text-sm">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span className="text-foreground/90">
                          {it.title} × {it.qty}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatPrice((it.unitPrice * it.qty) / 100)}
                        </span>
                      </li>
                    ))}
                    <li className="mt-1 flex justify-between gap-4 font-semibold">
                      <span>Общо</span>
                      <span>{formatPrice(o.amountTotal / 100)}</span>
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted/50 px-5 py-3">
            <span className="font-semibold">
              Обща сума: {formatPrice(chat.total / 100)}
            </span>
            <Button href="/tablo/porachki" variant="outline" size="sm">
              Моите поръчки
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <GroupThread chatId={id} initialMessages={initialMessages} />
        </div>
      </div>
    </main>
  );
}
