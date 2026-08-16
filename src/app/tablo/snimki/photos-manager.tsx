"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhoto, deletePhoto } from "./actions";

export type PhotoRow = {
  id: string;
  url: string;
  type: string;
  caption: string | null;
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Грешка при качване.");
  return data.url as string;
}

export function PhotosManager({ photos }: { photos: PhotoRow[] }) {
  const field = photos.filter((p) => p.type === "field");
  const product = photos.filter((p) => p.type === "product");

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
  const [pending, startTransition] = useTransition();

  async function onFiles(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of list) {
        const url = await uploadFile(file);
        await addPhoto(url, type);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при качване.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {error ? (
        <p className="mb-3 text-sm font-medium text-danger">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deletePhoto(photo.id);
                  router.refresh();
                })
              }
              className="absolute right-2 top-2 rounded-md bg-foreground/70 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
            >
              Изтрий
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <span className="text-2xl font-light leading-none">+</span>
          {busy ? "Качваме…" : "Добави снимка"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
    </section>
  );
}
