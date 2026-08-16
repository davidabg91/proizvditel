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
    <main className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{title}</h1>
        <div className="mt-8 flex flex-col gap-5 leading-relaxed text-foreground/90 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold">
          {children}
        </div>
      </div>
    </main>
  );
}
