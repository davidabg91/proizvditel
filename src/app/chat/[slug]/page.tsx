import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getOrCreateConversation } from "@/lib/chat";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Съобщение до производител" };

export default async function ChatStartPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { slug } = await params;
  const { msg } = await searchParams;
  const producer = await prisma.producer.findUnique({
    where: { slug },
    select: { farmName: true, userId: true, phone: true, contactEmail: true, slug: true },
  });
  if (!producer) notFound();

  const session = await auth();

  // Влязъл потребител, който не е собственикът → създаваме/отваряме разговор
  if (session?.user?.id && session.user.id !== producer.userId) {
    const res = await getOrCreateConversation(session.user.id, slug);
    if ("id" in res) {
      const draft = msg ? `?draft=${encodeURIComponent(msg)}` : "";
      redirect(`/sabshteniya/${res.id}${draft}`);
    }
  }

  // Собственикът се опитва да пише на себе си
  if (session?.user?.id && session.user.id === producer.userId) {
    redirect(`/p/${producer.slug}`);
  }

  // Нелогнат потребител — подкана за вход/регистрация (пазим черновата)
  const backPath = msg ? `/chat/${slug}?msg=${encodeURIComponent(msg)}` : `/chat/${slug}`;
  const next = encodeURIComponent(backPath);
  return (
    <main className="container-page py-20">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow">Съобщения</p>
        <h1 className="mt-3 text-3xl">Пишете на {producer.farmName}</h1>
        <p className="mt-4 text-muted-foreground">
          За да изпратите съобщение, влезте или създайте безплатен акаунт на
          купувач.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button href={`/registraciya/kupuvach?next=${next}`} size="lg">
            Създай акаунт на купувач
          </Button>
          <Button href={`/vhod?next=${next}`} variant="outline" size="lg">
            Вход
          </Button>
        </div>

        {producer.phone || producer.contactEmail ? (
          <div className="mt-10 border-t border-border pt-6 text-left">
            <p className="text-sm text-muted-foreground">
              Или се свържете директно:
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {producer.phone ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Телефон: </span>
                  <span className="font-medium">{producer.phone}</span>
                </p>
              ) : null}
              {producer.contactEmail ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Имейл: </span>
                  <span className="font-medium break-words">
                    {producer.contactEmail}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
