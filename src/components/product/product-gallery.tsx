"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface-muted text-muted-foreground">
        Без снимка
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[active]} alt="" className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-colors",
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
