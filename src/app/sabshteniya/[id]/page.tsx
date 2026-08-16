import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConversationForUser } from "@/lib/chat";
import { markConversationRead } from "../actions";
import { ChatThread } from "./chat-thread";

export const metadata = { title: "Разговор" };

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { id } = await params;
  const { draft } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/vhod?next=/sabshteniya/${id}`);

  const convo = await getConversationForUser(id, session.user.id);
  if (!convo) notFound();

  await markConversationRead(id);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, senderId: true },
  });

  const initialMessages = messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderId === session.user!.id,
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

        <div className="mt-4 mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-lg font-semibold text-primary">
            {convo.other.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={convo.other.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              convo.other.initial
            )}
          </div>
          <div>
            {convo.other.href ? (
              <Link href={convo.other.href} className="font-semibold hover:text-primary">
                {convo.other.name}
              </Link>
            ) : (
              <p className="font-semibold">{convo.other.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {convo.isCustomer ? "Производител" : "Купувач"}
            </p>
          </div>
        </div>

        <ChatThread
          conversationId={id}
          initialMessages={initialMessages}
          initialDraft={draft ?? ""}
        />
      </div>
    </main>
  );
}
