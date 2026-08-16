import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserConversations } from "@/lib/chat";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Съобщения" };

function relativeTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "сега";
  if (mins < 60) return `преди ${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `преди ${hours} ч`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `преди ${days} дни`;
  return new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short" }).format(
    new Date(date),
  );
}

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/vhod?next=/sabshteniya");

  const conversations = await getUserConversations(session.user.id);

  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold sm:text-3xl">Съобщения</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Разговори с производители и купувачи.
        </p>

        {conversations.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
            <p className="text-lg font-medium">Все още нямате съобщения</p>
            <p className="mt-1 text-muted-foreground">
              Разгледайте каталога и се свържете с производител.
            </p>
            <Button href="/katalog" className="mt-5">
              Към каталога
            </Button>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/sabshteniya/${c.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-lg font-semibold text-primary">
                    {c.other.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.other.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      c.other.initial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">
                        {c.other.name}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {relativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {c.lastMessage ?? "Няма съобщения още"}
                    </p>
                  </div>
                  {c.unread > 0 ? (
                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                      {c.unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
