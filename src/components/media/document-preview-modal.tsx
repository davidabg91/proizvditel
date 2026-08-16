"use client";

import { useEffect, useState } from "react";

export function dataUrlToBlobUrl(dataUrl: string): string {
  try {
    if (!dataUrl.startsWith("data:")) return dataUrl;
    const parts = dataUrl.split(";base64,");
    const contentType = parts[0].replace("data:", "") || "application/octet-stream";
    const base64Data = parts[1] || "";
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Грешка при конвертиране на data URL към Blob URL:", err);
    return dataUrl;
  }
}

export function openDocumentSafely(url: string, filename = "registracionna-karta.pdf") {
  if (!url) return;

  if (url.startsWith("data:")) {
    const blobUrl = dataUrlToBlobUrl(url);
    const w = window.open(blobUrl, "_blank");
    if (!w) {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function DocumentPreviewModal({
  url,
  title = "Преглед на регистрационна карта",
  onClose,
  actions,
}: {
  url: string | null;
  title?: string;
  onClose: () => void;
  actions?: React.ReactNode;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    if (url.startsWith("data:")) {
      const bUrl = dataUrlToBlobUrl(url);
      setBlobUrl(bUrl);
      return () => {
        if (bUrl.startsWith("blob:")) {
          URL.revokeObjectURL(bUrl);
        }
      };
    } else {
      setBlobUrl(url);
    }
  }, [url]);

  if (!url || !blobUrl) return null;

  const isPdf =
    url.startsWith("data:application/pdf") ||
    url.toLowerCase().includes(".pdf") ||
    url.startsWith("data:pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-[var(--radius-xl)] bg-surface border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заглавна лента */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={blobUrl}
              download={isPdf ? "registracionna-karta.pdf" : "registracionna-karta.jpg"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors flex items-center gap-1.5"
            >
              <span>📥 Свали файла</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors font-bold text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Съдържание на документа */}
        <div className="flex-1 overflow-auto bg-surface-muted/30 p-2 sm:p-4 flex items-center justify-center min-h-[50vh] max-h-[75vh]">
          {isPdf ? (
            <iframe
              src={blobUrl}
              title={title}
              className="w-full h-[70vh] rounded-[var(--radius-md)] border border-border bg-white shadow-inner"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt={title}
              className="max-h-[70vh] w-auto max-w-full rounded-[var(--radius-md)] object-contain shadow-md"
            />
          )}
        </div>

        {/* Действия в долната част (ако има) */}
        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-3 bg-surface">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
