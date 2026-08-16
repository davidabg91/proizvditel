"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhoto, deletePhoto } from "./actions";
import { uploadFile } from "@/lib/upload";

export type PhotoRow = {
  id: string;
  url: string;
  type: string;
  caption: string | null;
};

export function PhotosManager({ photos = [] }: { photos?: PhotoRow[] }) {
  const safePhotos = Array.isArray(photos) ? photos : [];
  const field = safePhotos.filter((p) => p.type === "field");
  const product = safePhotos.filter((p) => p.type === "product");

  return (
    <div className="flex flex-col gap-10">
      <PhotoSection
        title="Снимки на площта"
        description="Показват как изглежда стопанството, градината или нивите ви."
        type="field"
        photos={field}
      />
      <PhotoSection
        title="Снимки на продукцията"
        description="Реколтата и продуктите в естествения им вид."
        type="product"
        photos={product}
      />
    </div>
  );
}

function PhotoSection({
  title,
  description,
  type,
  photos,
}: {
  title: string;
  description: string;
  type: string;
  photos: PhotoRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFiles(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of list) {
        const url = await uploadFile(file);
        const res = await addPhoto(url, type);
        if (!res.ok) throw new Error(res.error);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error("Грешка при качване на снимка:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Възникна грешка при качването. Моля, опитайте отново.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {photos.length} {photos.length === 1 ? "снимка" : "снимки"}
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-medium text-danger">
          ⚠️ {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted transition-all hover:border-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              onClick={() => setActivePhoto(photo.url)}
              className="h-full w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-105"
            />

            <div className="absolute inset-0 flex items-start justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none">
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation();
                  startTransition(async () => {
                    await deletePhoto(photo.id);
                    router.refresh();
                  });
                }}
                className="pointer-events-auto rounded bg-danger px-2 py-1 text-xs font-semibold text-white shadow hover:bg-danger/90 transition-colors"
              >
                Изтрий
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface text-sm font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary-soft/30 disabled:opacity-60"
        >
          <span className="text-2xl font-light leading-none">+</span>
          <span className="text-xs">{busy ? "Качваме…" : "Добави снимка"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*,.heic,.heif,.HEIC,.HEIF"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />

      {/* Преглед на голяма снимка (Lightbox) */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt=""
              className="max-h-[85vh] max-w-[85vw] rounded-[var(--radius-lg)] object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black font-bold shadow-lg hover:bg-surface-muted"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
