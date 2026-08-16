import { ArticlePage } from "@/components/layout/article-page";

export const metadata = { title: "Контакти" };

export default function ContactsPage() {
  return (
    <ArticlePage eyebrow="Контакти" title="Свържете се с нас">
      <p>
        Имате въпрос, предложение или се нуждаете от помощ? Ще се радваме да ви
        чуем.
      </p>
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-5 py-4">
        <p className="text-sm text-muted-foreground">Имейл</p>
        <p className="font-medium">info@proizvoditel.net</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Отговаряме в рамките на един работен ден.
      </p>
    </ArticlePage>
  );
}
