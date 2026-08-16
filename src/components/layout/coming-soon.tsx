import { Button } from "@/components/ui/button";

export function ComingSoon({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <main className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        {bullets && bullets.length > 0 ? (
          <ul className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-left">
            {bullets.map((b) => (
              <li
                key={b}
                className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground"
              >
                {b}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-10 flex justify-center gap-3">
          <Button href="/katalog">Разгледай каталога</Button>
          <Button href="/proizvoditeli" variant="outline">
            Производители
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Тази секция е в разработка и ще бъде достъпна скоро.
        </p>
      </div>
    </main>
  );
}
