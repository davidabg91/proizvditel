import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Връща текущия потребител заедно със slug на профила му (ако е производител). */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      producer: { select: { id: true, slug: true } },
    },
  });

  return user;
}

/** Връща профила (Producer) на текущия потребител или null. */
export async function getCurrentProducer() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.producer.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { email: true } },
      crops: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { sort: "asc" } },
      payment: true,
      _count: { select: { listings: true, reviews: true } },
    },
  });
}

/**
 * Брой непрочетени съобщения за потребител (клиент или производител).
 * Включва и груповите чатове по съвместна доставка — иначе известието за
 * нова обща поръчка не би стигнало до звънчето в хедъра.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { countUnreadDeliveryMessages } = await import("@/lib/delivery-chat");
  const [direct, group] = await Promise.all([
    prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          OR: [{ customerId: userId }, { producer: { userId } }],
        },
      },
    }),
    countUnreadDeliveryMessages(userId).catch(() => 0),
  ]);
  return direct + group;
}

/** Удобен обект за header-а. */
export async function getHeaderUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, unread] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        producer: { select: { slug: true } },
      },
    }),
    getUnreadCount(session.user.id),
  ]);

  if (!user) return null;
  const admins = (process.env.ADMIN_EMAIL ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isAdmin = !!user.email && admins.includes(user.email.toLowerCase());
  return {
    name: user.name,
    slug: user.producer?.slug ?? "",
    role: user.role,
    unread,
    isAdmin,
  };
}
