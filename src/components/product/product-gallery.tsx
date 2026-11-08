"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export function ProductGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border bg-gradient-to-br from-primary-soft to-accent-soft text-primary/60">
        <Icon name="leaf" size={44} strokeWidth={1.3} />
        <span className="text-sm text-muted-foreground">Без снимка</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-muted shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]}
          alt={photos.length > 1 ? `${alt} — снимка ${active + 1}` : alt}
          className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto">
          {photos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border-2 transition-all",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
