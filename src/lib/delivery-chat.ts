import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

/**
 * Общ чат между производителите по една съвместна поръчка.
 *
 * Когато купувач вземе продукти от две или повече стопанства с една доставка,
 * стопанствата трябва да се разберат помежду си кой какво праща и кога. Досега
 * нямаше къде — Conversation е строго двойка производител ↔ купувач.
 *
 * Купувачът не участва. Той има отделен разговор с всяко стопанство, а тук се
 * говори за логистика — кой поема куриера, как се делят разходите — неща, на
 * които клиентът не му е мястото.
 */

/** Готови отговори — натискат се и попълват полето, вместо да се пише. */
export const QUICK_REPLIES = [
  "Моята част е готова. Кога ви е удобно да я предам?",
  "Мога да поема изпращането — донесете при мен до утре вечер.",
  "Ще донеса моята част при вас. Кажете адрес и час.",
  "Кога най-рано можете да сте готови?",
  "Готов съм днес. Изпращам от моя офис на куриера.",
  "Да разделим ли доставката по равно между нас?",
] as const;

const HINT_MESSAGE = `💡 Как да я подготвите заедно

1. Кажете тук кога вашата част ще е готова — това е първото, което другите чакат.
2. Разберете се кой изпраща пратката. Обикновено е този, който е най-близо до куриерски офис или има повече продукти.
3. Уговорете как стигат нещата до него — вие ги носите или той минава.
4. Разделете разходите за доставка още сега, преди да е тръгнала пратката.
5. Когато я изпратите, всеки отбелязва своята поръчка в Табло → Поръчки, за да се знае докъде е.

Този разговор е само между стопанствата — купувачът не го вижда.`;

/** „ABC123“ от id на групата — къс номер за говорене. */
export function shortGroupCode(groupId: string): string {
  return groupId.slice(-6).toUpperCase();
}

/** Каквото трябва на обобщението — без връзка с Prisma, за да е проверимо. */
export type SummaryOrder = {
  amountTotal: number;
  customerName: string | null;
  shippingAddress: string | null;
  phone: string | null;
  items: { title: string; qty: number; unitPrice: number }[];
  producer: { farmName: string; town: string | null };
};

/**
 * Съобщението, което отваря нишката: кой какво е поръчал от кое стопанство.
 * Оставено чисто (без заявки), за да може да се провери самостоятелно.
 */
export function buildOrderSummary(
  groupId: string,
  orders: SummaryOrder[],
): string {
  const first = orders[0];
  const total = orders.reduce((sum, o) => sum + o.amountTotal, 0);

  const breakdown = orders
    .map((o) => {
      const lines = o.items
        .map(
          (it) =>
            `  • ${it.title} × ${it.qty} — ${formatPrice((it.unitPrice * it.qty) / 100)}`,
        )
        .join("\n");
      const where = o.producer.town ? ` (${o.producer.town})` : "";
      return `🌾 ${o.producer.farmName}${where}\n${lines}\n  Общо: ${formatPrice(o.amountTotal / 100)}`;
    })
    .join("\n\n");

  return [
    `📦 Нова съвместна поръчка № ${shortGroupCode(groupId)}`,
    "",
    first?.customerName ? `Клиент: ${first.customerName}` : null,
    first?.shippingAddress ? `Доставка до: ${first.shippingAddress}` : null,
    first?.phone ? `Телефон: ${first.phone}` : null,
    "",
    "Поръчано от всяко стопанство:",
    "",
    breakdown,
    "",
    `Обща сума: ${formatPrice(total / 100)}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/**
 * Създава чата за група поръчки, ако още го няма и ако стопанствата са две
 * или повече. Извиква се след като поръчките вече са записани.
 *
 * Идемпотентно — groupId е уникален, повторното извикване не прави нищо.
 */
export async function createDeliveryChat(groupId: string): Promise<string | null> {
  const existing = await prisma.deliveryChat.findUnique({
    where: { groupId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const orders = await prisma.order.findMany({
    where: { groupId },
    include: {
      items: true,
      producer: { select: { id: true, farmName: true, town: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const producerIds = [...new Set(orders.map((o) => o.producerId))];
  // Едно стопанство не е съвместна доставка — няма с кого да се уговаря.
  if (producerIds.length < 2) return null;

  const first = orders[0];
  const summary = buildOrderSummary(groupId, orders);

  const chat = await prisma.deliveryChat.create({
    data: {
      groupId,
      customerId: first.customerId,
      customerName: first.customerName,
      phone: first.phone,
      shippingAddress: first.shippingAddress,
      participants: {
        create: producerIds.map((producerId) => ({ producerId })),
      },
      messages: {
        create: [
          { body: summary, system: true },
          { body: HINT_MESSAGE, system: true },
        ],
      },
    },
    select: { id: true },
  });

  return chat.id;
}

/** Непрочетени съобщения в груповите чатове на потребителя. */
export async function countUnreadDeliveryMessages(userId: string): Promise<number> {
  const parts = await prisma.deliveryChatParticipant.findMany({
    where: { producer: { userId } },
    select: { chatId: true, lastReadAt: true, producerId: true },
  });
  if (parts.length === 0) return 0;

  const counts = await Promise.all(
    parts.map((p) =>
      prisma.deliveryChatMessage.count({
        where: unreadWhere(p.chatId, p.producerId, p.lastReadAt),
      }),
    ),
  );
  return counts.reduce((a, b) => a + b, 0);
}

/**
 * Непрочетени за един участник: чуждите съобщения плюс системните.
 *
 * Клонът `producerId: null` е задължителен — при системните съобщения полето е
 * празно, а `NOT (producerId = …)` в SQL не връща редовете с NULL. Без него
 * известието за нова съвместна поръчка не би се броило никъде.
 */
function unreadWhere(chatId: string, producerId: string, lastReadAt: Date | null) {
  return {
    chatId,
    OR: [{ producerId: null }, { producerId: { not: producerId } }],
    ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
  };
}

export type DeliveryChatSummary = {
  id: string;
  groupCode: string;
  partners: string[];
  lastMessage: string | null;
  lastMessageAt: Date;
  unread: number;
};

/** Груповите чатове на потребителя — за списъка със съобщения. */
export async function getUserDeliveryChats(
  userId: string,
): Promise<DeliveryChatSummary[]> {
  const parts = await prisma.deliveryChatParticipant.findMany({
    where: { producer: { userId } },
    select: {
      producerId: true,
      lastReadAt: true,
      chat: {
        select: {
          id: true,
          groupId: true,
          lastMessageAt: true,
          participants: {
            select: { producerId: true, producer: { select: { farmName: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true },
          },
        },
      },
    },
  });

  const rows = await Promise.all(
    parts.map(async (p) => ({
      id: p.chat.id,
      groupCode: shortGroupCode(p.chat.groupId),
      partners: p.chat.participants
        .filter((x) => x.producerId !== p.producerId)
        .map((x) => x.producer.farmName),
      lastMessage: p.chat.messages[0]?.body.split("\n")[0] ?? null,
      lastMessageAt: p.chat.lastMessageAt,
      unread: await prisma.deliveryChatMessage.count({
        where: unreadWhere(p.chat.id, p.producerId, p.lastReadAt),
      }),
    })),
  );

  return rows.sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
  );
}

export type DeliveryChatOrder = {
  producerId: string;
  farmName: string;
  town: string | null;
  logoUrl: string | null;
  slug: string;
  isMine: boolean;
  fulfillmentStatus: string;
  amountTotal: number;
  items: { title: string; qty: number; unitPrice: number }[];
};

export type DeliveryChatView = {
  id: string;
  groupCode: string;
  myProducerId: string;
  customerName: string | null;
  phone: string | null;
  shippingAddress: string | null;
  total: number;
  orders: DeliveryChatOrder[];
};

/**
 * Чатът с проверка за достъп. Връща null, ако потребителят не е производител
 * с поръчка в тази група — груповите нишки не се четат отстрани.
 */
export async function getDeliveryChatForUser(
  chatId: string,
  userId: string,
): Promise<DeliveryChatView | null> {
  const chat = await prisma.deliveryChat.findUnique({
    where: { id: chatId },
    select: {
      id: true,
      groupId: true,
      customerName: true,
      phone: true,
      shippingAddress: true,
      participants: {
        select: { producerId: true, producer: { select: { userId: true } } },
      },
    },
  });
  if (!chat) return null;

  const mine = chat.participants.find((p) => p.producer.userId === userId);
  if (!mine) return null;

  const orders = await prisma.order.findMany({
    where: { groupId: chat.groupId },
    include: {
      items: { select: { title: true, qty: true, unitPrice: true } },
      producer: {
        select: { id: true, farmName: true, town: true, logoUrl: true, slug: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: chat.id,
    groupCode: shortGroupCode(chat.groupId),
    myProducerId: mine.producerId,
    customerName: chat.customerName,
    phone: chat.phone,
    shippingAddress: chat.shippingAddress,
    total: orders.reduce((s, o) => s + o.amountTotal, 0),
    orders: orders.map((o) => ({
      producerId: o.producerId,
      farmName: o.producer.farmName,
      town: o.producer.town,
      logoUrl: o.producer.logoUrl,
      slug: o.producer.slug,
      isMine: o.producerId === mine.producerId,
      fulfillmentStatus: o.fulfillmentStatus,
      amountTotal: o.amountTotal,
      items: o.items,
    })),
  };
}

/** Производителят на потребителя в този чат, или null при липса на достъп. */
export async function participantFor(
  chatId: string,
  userId: string,
): Promise<{ producerId: string } | null> {
  const part = await prisma.deliveryChatParticipant.findFirst({
    where: { chatId, producer: { userId } },
    select: { producerId: true },
  });
  return part;
}

/** Отбелязва нишката като прочетена до момента. */
export async function markDeliveryChatRead(
  chatId: string,
  userId: string,
): Promise<void> {
  const part = await participantFor(chatId, userId);
  if (!part) return;
  await prisma.deliveryChatParticipant.updateMany({
    where: { chatId, producerId: part.producerId },
    data: { lastReadAt: new Date() },
  });
}
