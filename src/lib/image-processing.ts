/**
 * Помощни функции за автоматично преобразуване на HEIC/HEIF снимки (от iPhone/Mac)
 * и оразмеряване/компресиране на големи снимки в браузъра преди качване.
 */

export function isHeic(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const heic2anyModule = await import("heic2any");
    const heic2any = heic2anyModule.default || heic2anyModule;

    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });

    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob || (blob as Blob).size === 0) {
      throw new Error("Празен резултат от конверсията.");
    }
    const newName = file.name.replace(/\.hei[cf]$/i, ".jpg");
    return new File([blob as Blob], newName, { type: "image/jpeg" });
  } catch (error) {
    console.error("Неуспешно HEIC конвертиране:", error);
    // Не качваме оригиналния HEIC — браузърите не го показват.
    throw new Error(
      "HEIC снимката не можа да се обработи. Съвет: на iPhone включете " +
        "Настройки → Камера → Формати → Най-съвместим (снима в JPG), " +
        "или качете снимката като JPG/PNG.",
    );
  }
}

export async function compressAndResizeImage(
  file: File,
  maxDimension = 2400,
  quality = 0.85,
): Promise<File> {
  // Пропускаме GIF (за запазване на анимации) или ако файлът вече е малък JPEG/PNG/WEBP
  if (file.type === "image/gif") return file;
  if (file.size <= 1.2 * 1024 * 1024 && !isHeic(file)) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Изчисляваме новите размери при запазване на пропорциите
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const outputName = file.name.replace(/\.[^/.]+$/, ".jpg");
          const compressedFile = new File([blob], outputName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  let processed = file;

  // 1. Ако е Apple HEIC/HEIF от Mac или iPhone — конвертираме го до JPEG
  if (isHeic(file)) {
    processed = await convertHeicToJpeg(file);
  }

  // 2. Компресираме и оразмеряваме, за да не надвишава лимитите на сървъра
  processed = await compressAndResizeImage(processed, 2400, 0.85);

  return processed;
}
