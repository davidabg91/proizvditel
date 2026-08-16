import { prisma } from "@/lib/prisma";

export type ChatParty = {
  name: string;
  href: string | null;
  logoUrl: string | null;
  initial: string;
};

/** Намира или създава разговор между купувач и производител (по slug). */
export async function getOrCreateConversation(
  customerId: string,
  producerSlug: string,
): Promise<{ id: string } | { error: string }> {
  const producer = await prisma.producer.findUnique({
    where: { slug: producerSlug },
    select: { id: true, userId: true },
  });
  if (!producer) return { error: "Производителят не е намерен." };
  if (producer.userId === customerId)
    return { error: "Не можете да пишете на собствения си профил." };

  const convo = await prisma.conversation.upsert({
    where: {
      producerId_customerId: { producerId: producer.id, customerId },
    },
    create: { producerId: producer.id, customerId },
    update: {},
    select: { id: true },
  });
  return convo;
}

/** Списък с разговорите на потребителя (като купувач или като производител). */
export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ customerId: userId }, { producer: { userId } }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      customer: { select: { id: true, name: true } },
      producer: {
        select: { id: true, userId: true, slug: true, farmName: true, logoUrl: true },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Непрочетени по разговор
  const unreadRows = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      readAt: null,
      senderId: { not: userId },
      conversationId: { in: conversations.map((c) => c.id) },
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, r._count._all]));

  return conversations.map((c) => {
    const isCustomer = c.customerId === userId;
    const other: ChatParty = isCustomer
      ? {
          name: c.producer.farmName,
          href: `/p/${c.producer.slug}`,
          logoUrl: c.producer.logoUrl,
          initial: c.producer.farmName.charAt(0),
        }
      : {
          name: c.customer.name,
          href: null,
          logoUrl: null,
          initial: c.customer.name.charAt(0),
        };
    return {
      id: c.id,
      other,
      lastMessage: c.messages[0]?.body ?? null,
      lastMessageAt: c.lastMessageAt,
      unread: unreadMap.get(c.id) ?? 0,
    };
  });
}

/** Връща разговор с проверка за достъп + участник отсреща. */
export async function getConversationForUser(conversationId: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: { select: { id: true, name: true } },
      producer: {
        select: { id: true, userId: true, slug: true, farmName: true, logoUrl: true },
      },
    },
  });
  if (!convo) return null;

  const isCustomer = convo.customerId === userId;
  const isProducer = convo.producer.userId === userId;
  if (!isCustomer && !isProducer) return null;

  const other: ChatParty = isCustomer
    ? {
        name: convo.producer.farmName,
        href: `/p/${convo.producer.slug}`,
        logoUrl: convo.producer.logoUrl,
        initial: convo.producer.farmName.charAt(0),
      }
    : {
        name: convo.customer.name,
        href: null,
        logoUrl: null,
        initial: convo.customer.name.charAt(0),
      };

  return { id: convo.id, other, isCustomer };
}

/** Помощна проверка: има ли достъп потребителят до разговора. */
export async function userCanAccessConversation(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { customerId: true, producer: { select: { userId: true } } },
  });
  if (!c) return false;
  return c.customerId === userId || c.producer.userId === userId;
}
