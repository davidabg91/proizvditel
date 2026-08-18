"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userCanAccessConversation } from "@/lib/chat";

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<SendResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const text = body.trim();
  if (!text) return { ok: false, error: "Съобщението е празно." };
  if (text.length > 2000) return { ok: false, error: "Съобщението е твърде дълго." };

  const canAccess = await userCanAccessConversation(conversationId, session.user.id);
  if (!canAccess) return { ok: false, error: "Няма достъп." };

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: session.user.id, body: text },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  revalidatePath(`/sabshteniya/${conversationId}`);
  revalidatePath("/sabshteniya");
  return { ok: true };
}

/** Маркира като прочетени съобщенията, изпратени от отсрещната страна. */
export async function markConversationRead(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const canAccess = await userCanAccessConversation(conversationId, session.user.id);
  if (!canAccess) return;

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

/** Изпраща съобщение в общия чат по съвместна доставка. */
export async function sendDeliveryMessage(
  chatId: string,
  body: string,
): Promise<SendResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const text = body.trim();
  if (!text) return { ok: false, error: "Съобщението е празно." };
  if (text.length > 2000) return { ok: false, error: "Съобщението е твърде дълго." };

  const { participantFor } = await import("@/lib/delivery-chat");
  const part = await participantFor(chatId, session.user.id);
  if (!part) return { ok: false, error: "Няма достъп." };

  await prisma.$transaction([
    prisma.deliveryChatMessage.create({
      data: {
        chatId,
        senderId: session.user.id,
        producerId: part.producerId,
        body: text,
      },
    }),
    prisma.deliveryChat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    }),
    // Собственото съобщение не бива да си стои като непрочетено.
    prisma.deliveryChatParticipant.updateMany({
      where: { chatId, producerId: part.producerId },
      data: { lastReadAt: new Date() },
    }),
  ]);

  revalidatePath(`/sabshteniya/grupa/${chatId}`);
  revalidatePath("/sabshteniya");
  return { ok: true };
}

/** Маркира груповия чат като прочетен. */
export async function markDeliveryRead(chatId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const { markDeliveryChatRead } = await import("@/lib/delivery-chat");
  await markDeliveryChatRead(chatId, session.user.id);
}
