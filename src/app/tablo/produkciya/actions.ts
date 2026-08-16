"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cropSchema, type CropInput } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentProducer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
}

function toData(d: CropInput) {
  return {
    name: d.name.trim(),
    category: d.category || null,
    varieties: d.varieties || null,
    sinceYear: d.sinceYear ?? null,
    decares: d.decares ?? null,
    annualYield: d.annualYield ?? null,
    yieldUnit: d.yieldUnit || null,
  };
}

export async function createCrop(input: CropInput): Promise<ActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };

  const parsed = cropSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  await prisma.crop.create({
    data: { producerId: producer.id, ...toData(parsed.data) },
  });
  revalidatePath("/tablo/produkciya");
  revalidatePath(`/p/${producer.slug}`);
  return { ok: true };
}

export async function updateCrop(
  id: string,
  input: CropInput,
): Promise<ActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };

  const parsed = cropSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const crop = await prisma.crop.findUnique({ where: { id }, select: { producerId: true } });
  if (!crop || crop.producerId !== producer.id)
    return { ok: false, error: "Няма достъп." };

  await prisma.crop.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath("/tablo/produkciya");
  revalidatePath(`/p/${producer.slug}`);
  return { ok: true };
}

export async function deleteCrop(id: string): Promise<ActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };

  const crop = await prisma.crop.findUnique({ where: { id }, select: { producerId: true } });
  if (!crop || crop.producerId !== producer.id)
    return { ok: false, error: "Няма достъп." };

  await prisma.crop.delete({ where: { id } });
  revalidatePath("/tablo/produkciya");
  revalidatePath(`/p/${producer.slug}`);
  return { ok: true };
}
