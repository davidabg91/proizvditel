import { FaqJsonLd } from "@/components/seo/json-ld";
import { Icon } from "@/components/ui/icons";

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
      <div className="mt-6 flex flex-col gap-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4 shadow-xs transition-colors open:border-primary/30 open:shadow-sm sm:px-6"
          >
            <summary className="cursor-pointer list-none font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-transform duration-200 group-open:rotate-180"
                >
                  <Icon name="chevron-down" size={16} />
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
