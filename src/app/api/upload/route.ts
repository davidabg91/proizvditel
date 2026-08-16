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
]);

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/x-png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
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
        ["jpg", "jpeg", "png", "webp", "avif", "gif", "heic"].includes(fileNameExt)
      ) {
        ext = fileNameExt === "jpeg" ? "jpg" : fileNameExt;
      }
    }

    if (!ext && (!mimeType || !ALLOWED.has(mimeType))) {
      return NextResponse.json(
        { error: "Позволени са само изображения (JPG, PNG, WEBP, AVIF, GIF)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файлът е твърде голям (макс. 6 MB)." },
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

