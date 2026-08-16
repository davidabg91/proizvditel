import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userCanAccessConversation } from "@/lib/chat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Изисква се вход." }, { status: 401 });
  }

  const canAccess = await userCanAccessConversation(id, session.user.id);
  if (!canAccess) {
    return NextResponse.json({ error: "Няма достъп." }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, senderId: true },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId === session.user!.id,
    })),
  });
}
