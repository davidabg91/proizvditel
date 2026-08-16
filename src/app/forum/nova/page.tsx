import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { NewTopicForm } from "./new-topic-form";

export const metadata: Metadata = { title: "Нова тема" };

export default async function NewTopicPage() {
  const session = await auth();
  if (!session?.user) redirect("/vhod?next=/forum/nova");

  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/forum"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Към форума
        </Link>
        <h1 className="mt-4 text-3xl">Нова тема</h1>
        <p className="mt-2 text-muted-foreground">
          Споделете въпрос или тема с общността.
        </p>
        <div className="mt-8">
          <NewTopicForm />
        </div>
      </div>
    </main>
  );
}
