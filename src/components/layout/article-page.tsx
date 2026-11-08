import { PageHero } from "@/components/layout/page-hero";

export function ArticlePage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <PageHero eyebrow={eyebrow} title={title} breadcrumbs={[{ label: title }]} />
      <div className="container-page pb-16 pt-2 sm:pt-4">
        <article
          className="mx-auto flex max-w-3xl flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-surface p-6 leading-relaxed text-foreground/90 shadow-xs sm:p-10
            [&_h2]:mt-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground
            [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold
            [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:mt-1.5 [&_li]:marker:text-accent
            [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
            [&_a:hover]:text-primary-hover"
        >
          {children}
        </article>
      </div>
    </main>
  );
}
