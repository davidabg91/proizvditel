import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type Author = {
  name: string;
  role: string;
  producer: { slug: string } | null;
};

export function AuthorLine({
  author,
  meta,
}: {
  author: Author;
  meta?: string;
}) {
  const isProducer = author.role === "producer" && author.producer;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted font-serif text-sm font-semibold text-primary">
        {author.name.charAt(0)}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-2">
          {isProducer ? (
            <Link
              href={`/p/${author.producer!.slug}`}
              className="text-sm font-semibold hover:text-primary"
            >
              {author.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold">{author.name}</span>
          )}
          <Badge tone={isProducer ? "primary" : "neutral"}>
            {isProducer ? "Производител" : "Купувач"}
          </Badge>
        </div>
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  );
}
