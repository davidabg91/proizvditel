"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/upload";

export function ImageUploader({
  value,
  onChange,
  aspect = "video",
  shape = "rect",
  label = "Качи изображение",
  className,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  aspect?: "video" | "square" | "wide";
  shape?: "rect" | "circle";
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при качване.");
    } finally {
      setBusy(false);
    }
  }

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "wide"
        ? "aspect-[3/1]"
        : "aspect-video";

  return (
    <div className={className}>
      <div
        className={cn(
          "group relative flex items-center justify-center overflow-hidden border border-dashed border-border-strong bg-surface-muted transition-colors hover:border-primary",
          aspectClass,
          shape === "circle" ? "rounded-full" : "rounded-[var(--radius-lg)]",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-4 text-center text-sm text-muted-foreground">
            {busy ? "Качваме…" : label}
          </span>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute inset-0 flex items-center justify-center bg-foreground/0 text-sm font-semibold text-transparent transition-all hover:bg-foreground/45 hover:text-white"
        >
          {value ? "Смени" : busy ? "Качваме…" : "Избери файл"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-medium text-danger hover:underline"
          >
            Премахни
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WEBP или HEIC
          </span>
        )}
      </div>

      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.HEIC,.HEIF"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
