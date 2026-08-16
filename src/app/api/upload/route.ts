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
};

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

    // 1. Опит за запазване във Vercel Blob storage (ако има настроен BLOB_READ_WRITE_TOKEN)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`uploads/${name}`, file, {
          access: "public",
          contentType: mimeType || "image/jpeg",
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobError) {
        console.error("Грешка при качване във Vercel Blob:", blobError);
      }
    }

    // 2. Опит за запазване в локалната файлова система (при локална разработка)
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, name), buffer);

      return NextResponse.json({ url: `/uploads/${name}` });
    } catch (fsError) {
      console.error("Грешка при запис във файловата система:", fsError);

      // 3. Fallback към Base64 Data URL (при облачни среди с read-only файлова система)
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64}`;
        return NextResponse.json({ url: dataUrl });
      } catch (fallbackError) {
        console.error("Грешка при Base64 обработка:", fallbackError);
        return NextResponse.json(
          { error: "Не успя да се запази изображението на сървъра." },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Грешка в /api/upload:", error);
    return NextResponse.json(
      { error: "Сървърна грешка при обработката на файла." },
      { status: 500 }
    );
  }
}

