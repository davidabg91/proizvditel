"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { allow, TOO_MANY } from "@/lib/rate-limit";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, producer: { select: { id: true, slug: true } } },
  });
}

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Изисква се вход." };
  if (!allow(`change-pw:${user.id}`, 5, 15 * 60_000)) return { ok: false, error: TOO_MANY };

  if (!(await bcrypt.compare(input.current, user.passwordHash)))
    return { ok: false, error: "Текущата парола не е вярна." };
  if (input.next.length < 8 || input.next.length > 200)
    return { ok: false, error: "Новата парола трябва да е поне 8 символа." };
  if (input.next === input.current)
    return { ok: false, error: "Новата парола съвпада с текущата." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(input.next, 12),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
  return { ok: true };
}

/**
 * Изтриване на профила по желание на потребителя (право на изтриване, GDPR).
 *
 * Личните данни се обезличават, а не се трият физически: поръчките са
 * счетоводни документи, които трябва да се пазят по закон, а съобщенията
 * принадлежат и на другата страна в разговора. Профилът на стопанството се
 * скрива, обявите спират, входът става невъзможен.
 */
export async function deleteAccount(input: { password: string }): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Изисква се вход." };
  if (!allow(`delete-acc:${user.id}`, 5, 15 * 60_000)) return { ok: false, error: TOO_MANY };

  if (!(await bcrypt.compare(input.password, user.passwordHash)))
    return { ok: false, error: "Паролата не е вярна." };

  if (user.producer) {
    const open = await prisma.order.count({
      where: {
        producerId: user.producer.id,
        fulfillmentStatus: { in: ["new", "processing", "shipped"] },
      },
    });
    if (open > 0)
      return {
        ok: false,
        error: `Имате ${open} неизпълнени поръчки. Приключете или откажете ги, преди да изтриете профила.`,
      };
  }

  const randomHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);

  await prisma.$transaction(async (tx) => {
    if (user.producer) {
      await tx.productListing.updateMany({
        where: { producerId: user.producer.id },
        data: { available: false },
      });
      await tx.producer.update({
        where: { id: user.producer.id },
        data: {
          published: false,
          phone: null,
          contactEmail: null,
          website: null,
          urnDocumentUrl: null,
          shopPhone: null,
          sharedDelivery: false,
        },
      });
    }
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@deleted.invalid`,
        name: "Изтрит потребител",
        passwordHash: randomHash,
        banned: true,
        deletedAt: new Date(),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
  });

  if (user.producer?.slug) revalidatePath(`/p/${user.producer.slug}`);
  revalidatePath("/");
  await signOut({ redirect: false });
  return { ok: true };
}
