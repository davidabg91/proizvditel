import { prepareImageForUpload } from "@/lib/image-processing";

export async function uploadFile(file: File): Promise<string> {
  // Автоматична подготовка (HEIC към JPEG, оптимизация на размера)
  const preparedFile = await prepareImageForUpload(file);

  const fd = new FormData();
  fd.append("file", preparedFile);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Сървърна грешка при качването. Моля, опитайте отново.");
  }

  if (!res.ok) {
    throw new Error(data?.error ?? "Грешка при качване на изображението.");
  }

  return data.url as string;
}
