import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { participantFor } from "@/lib/delivery-chat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Изисква се вход." }, { status: 401 });
  }

  const part = await participantFor(id, session.user.id);
  if (!part) {
    return NextResponse.json({ error: "Няма достъп." }, { status: 403 });
  }

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

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      system: m.system,
      createdAt: m.createdAt,
      mine: !m.system && m.producerId === part.producerId,
      author: m.producer?.farmName ?? null,
      logoUrl: m.producer?.logoUrl ?? null,
    })),
  });
}
