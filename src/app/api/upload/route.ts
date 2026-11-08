import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { allow } from "@/lib/rate-limit";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

type Detected = { ext: string; contentType: string };

/**
 * Определя вида на файла по първите му байтове („магически числа“), а не по
 * името или по типа, който казва браузърът — те са в ръцете на качващия.
 * Иначе HTML страница с име „snimka.png“ щеше да се запише и сервира като
 * HTML. Допускаме само снимки и PDF.
 */
function sniff(b: Uint8Array): Detected | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", contentType: "image/jpeg" };
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return { ext: "png", contentType: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", contentType: "image/webp" };
  if (ascii(0, 4) === "GIF8") return { ext: "gif", contentType: "image/gif" };
  if (ascii(0, 5) === "%PDF-") return { ext: "pdf", contentType: "application/pdf" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return { ext: "avif", contentType: "image/avif" };
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) {
      return { ext: "heic", contentType: "image/heic" };
    }
  }
  return null;
}

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
  return !!blobToken() || !!process.env.BLOB_STORE_ID;
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

    if (!allow(`upload:${session.user.id}`, 60, 60 * 60_000)) {
      return NextResponse.json(
        { error: "Качихте много файлове за кратко време. Опитайте след малко." },
        { status: 429 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Липсва файл." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файлът е твърде голям (макс. 12 MB)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = sniff(buffer.subarray(0, 16));
    if (!detected) {
      return NextResponse.json(
        { error: "Позволени са само изображения (JPG, PNG, WEBP, AVIF, HEIC) и PDF." },
        { status: 400 }
      );
    }

    const name = `${randomUUID()}.${detected.ext}`;

    // 1. Vercel Blob — така работи сайтът в production.
    const token = blobToken();
    if (blobConfigured()) {
      try {
        const blob = await put(`uploads/${name}`, buffer, {
          access: "public",
          // Типът идва от съдържанието, не от браузъра.
          contentType: detected.contentType,
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
