import Link from "next/link";

/**
 * Показва текста на статия с подзаглавия, списъци, удебеляване и връзки.
 *
 * Статиите се пишат от производителите, затова НЕ използваме HTML —
 * поддържаме малко подмножество на Markdown и връщаме готови React
 * елементи. Така е невъзможно през текста на статия да се вкара скрипт.
 *
 * Поддържа се:
 *   ## Подзаглавие
 *   - елемент от списък
 *   **удебелено**
 *   [текст на връзката](/katalog)
 */

/** Пропуска само безопасни адреси — вътрешни и http(s). */
function safeHref(href: string): { kind: "internal" | "external" } | null {
  if (href.startsWith("/")) return { kind: "internal" };
  if (/^https?:\/\//i.test(href)) return { kind: "external" };
  return null;
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string) {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const safe = safeHref(href);
      if (!safe) return <span key={key}>{label}</span>;
      const className =
        "font-medium text-primary underline underline-offset-2 hover:text-primary-hover";
      return safe.kind === "internal" ? (
        <Link key={key} href={href} className={className}>
          {label}
        </Link>
      ) : (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {label}
        </a>
      );
    }

    return part ? <span key={key}>{part}</span> : null;
  });
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/);

  return (
    <div className="mt-6 flex flex-col gap-5 text-base leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-4 font-serif text-2xl font-semibold text-foreground">
              {renderInline(trimmed.slice(3), `h${i}`)}
            </h2>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-2 text-lg font-semibold text-foreground">
              {renderInline(trimmed.slice(4), `h3${i}`)}
            </h3>
          );
        }

        const lines = trimmed.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="ml-5 list-disc space-y-1.5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.trim().slice(2), `li${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line">
            {renderInline(trimmed, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
}
