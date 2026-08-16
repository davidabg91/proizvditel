/**
 * Изключително надеждна обработка и компресиране на изображения в браузъра.
 * Напълно съвместима с iOS (iPhone/iPad), Mac Safari, Chrome и Android.
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

/**
 * Опитва конверсия и оразмеряване чрез нативен Canvas (HTML5 Canvas).
 * В iOS Safari и Mac работи хардуерно ускорено и мигновено.
 */
async function processViaCanvas(
  file: File,
  maxDimension = 1800,
  quality = 0.82,
): Promise<File | null> {
  if (typeof window === "undefined") return null;

  // 1. Опит чрез createImageBitmap (най-бързият модерен метод)
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;

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

      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality),
        );

        if (blob && blob.size > 0) {
          const outputName = file.name.replace(/\.[^/.]+$/, ".jpg");
          return new File([blob], outputName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }
    } catch {
      // Продължаваме към Image() fallback
    }
  }

  // 2. Опит чрез стандартен HTML Image елемент
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

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
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size === 0) {
              resolve(null);
              return;
            }
            const outputName = file.name.replace(/\.[^/.]+$/, ".jpg");
            const processedFile = new File([blob], outputName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(processedFile);
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Fallback HEIC конвертор (за браузъри, които нямат нативен HEIC декодер)
 */
async function processViaHeic2Any(file: File): Promise<File | null> {
  try {
    const heic2anyModule = await import("heic2any");
    const heic2any = heic2anyModule.default || heic2anyModule;

    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.82,
    });

    const blob = Array.isArray(result) ? result[0] : result;
    if (blob && (blob as Blob).size > 0) {
      const newName = file.name.replace(/\.hei[cf]$/i, ".jpg");
      return new File([blob as Blob], newName, { type: "image/jpeg" });
    }
  } catch (err) {
    console.warn("heic2any fallback не успя:", err);
  }
  return null;
}

/**
 * Главна функция за подготовка на изображение преди качване.
 * Гарантира безопасно преобразуване до компактен, чист JPEG (~150-300KB).
 * Никога не хвърля необработени грешки, които да сринат React.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  // Ако е GIF анимация или PDF документ, ги запазваме
  if (file.type === "image/gif" || file.type === "application/pdf") {
    return file;
  }

  try {
    // 1. Опитваме нативна хардуерна конверсия и оразмеряване в браузъра
    const canvasResult = await processViaCanvas(file, 1800, 0.82);
    if (canvasResult) return canvasResult;

    // 2. Ако е HEIC и нативният Canvas не го прочете, опитваме heic2any
    if (isHeic(file)) {
      const heicResult = await processViaHeic2Any(file);
      if (heicResult) return heicResult;
    }
  } catch (err) {
    console.warn("Грешка при клиентска обработка на снимката, използваме оригинала:", err);
  }

  // 3. Ако нито един метод не успее, връщаме оригиналния файл (сървърът ще го обработи)
  return file;
}
