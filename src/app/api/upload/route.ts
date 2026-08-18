import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/x-heic",
  "application/pdf",
  "application/octet-stream",
]);

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/x-png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "jpg",
  "image/heif": "jpg",
  "image/heic-sequence": "jpg",
  "image/heif-sequence": "jpg",
  "image/x-heic": "jpg",
  "application/pdf": "pdf",
};

/**
 * Явен токен за Vercel Blob, ако има такъв. При свързване през OIDC (както е
 * настроен проектът) токен НЕ се задава — SDK-то се удостоверява само с
 * VERCEL_OIDC_TOKEN + BLOB_STORE_ID. Затова тук не се изисква токен, а само
 * се подава, когато съществува.
 */
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find(
    (k) => k.endsWith("_READ_WRITE_TOKEN") && process.env[k],
  );
  return key ? process.env[key] : undefined;
}

/** Има ли изобщо как да пишем в Blob — през токен или през OIDC. */
function blobConfigured(): boolean {
  return (
    !!blobToken() ||
    (!!process.env.BLOB_STORE_ID && !!process.env.VERCEL_OIDC_TOKEN) ||
    !!process.env.BLOB_STORE_ID
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Изисква се вход в профила." },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Липсва файл." }, { status: 400 });
    }

    const mimeType = (file.type || "").toLowerCase();

    // Защита за разширение при липсващ или нетипичен mimeType
    let ext = EXT[mimeType];
    if (!ext && file.name) {
      const fileNameExt = file.name.split(".").pop()?.toLowerCase();
      if (
        fileNameExt &&
        ["jpg", "jpeg", "png", "webp", "avif", "gif", "heic", "heif"].includes(fileNameExt)
      ) {
        ext = ["jpeg", "heic", "heif"].includes(fileNameExt) ? "jpg" : fileNameExt;
      }
    }

    if (!ext && (!mimeType || !ALLOWED.has(mimeType))) {
      return NextResponse.json(
        { error: "Позволени са само изображения (JPG, PNG, WEBP, AVIF, HEIC)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файлът е твърде голям (макс. 12 MB)." },
        { status: 400 }
      );
    }

    const name = `${randomUUID()}.${ext || "jpg"}`;

    // 1. Vercel Blob — така работи сайтът в production.
    const token = blobToken();
    if (blobConfigured()) {
      try {
        const blob = await put(`uploads/${name}`, file, {
          access: "public",
          contentType: mimeType || "image/jpeg",
          // При OIDC не подаваме token — SDK-то си го намира само.
          ...(token ? { token } : {}),
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobError) {
        console.error("Грешка при качване във Vercel Blob:", blobError);
        return NextResponse.json(
          { error: "Хранилището за снимки не отговаря. Опитайте отново след малко." },
          { status: 502 },
        );
      }
    }

    // 2. Локална разработка — записваме във файловата система.
    if (process.env.NODE_ENV !== "production") {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, name), buffer);
        return NextResponse.json({ url: `/uploads/${name}` });
      } catch (fsError) {
        console.error("Грешка при запис във файловата система:", fsError);
      }
    }

    // Няма къде да запишем. Тук имаше fallback към base64 data URL — той
    // записваше цялата снимка като текст в базата, което надхвърляше лимита
    // от 1 MB на Server Actions (оттам неразбираемата грешка React #441) и
    // раздуваше профилните страници до няколко мегабайта. Затова е премахнат:
    // по-добре ясна грешка, отколкото тиха повреда.
    return NextResponse.json(
      {
        error:
          "Качването на снимки не е настроено на сървъра. Свържете Vercel Blob хранилище с проекта.",
      },
      { status: 500 },
    );
  } catch (error) {
    console.error("Грешка в /api/upload:", error);
    return NextResponse.json(
      { error: "Сървърна грешка при обработката на файла." },
      { status: 500 }
    );
  }
}

