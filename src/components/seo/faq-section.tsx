import { FaqJsonLd } from "@/components/seo/json-ld";

/** Видими въпроси и отговори плюс техния FAQPage блок. */
export function FaqSection({
  title = "Често задавани въпроси",
  items,
}: {
  title?: string;
  items: { q: string; a: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-16">
      <FaqJsonLd items={items} />
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <div className="mt-6 divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface">
        {items.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.q}
                <span
                  aria-hidden
                  className="text-primary transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
