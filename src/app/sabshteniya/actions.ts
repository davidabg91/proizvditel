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
