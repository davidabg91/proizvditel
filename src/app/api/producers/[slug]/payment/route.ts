import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const producer = await prisma.producer.findUnique({
    where: { slug },
    select: { farmName: true, phone: true, contactEmail: true, payment: true },
  });
  if (!producer) {
    return NextResponse.json({ error: "Не е намерен." }, { status: 404 });
  }

  const p = producer.payment;
  return NextResponse.json({
    farmName: producer.farmName,
    phone: producer.phone,
    contactEmail: producer.contactEmail,
    payment: {
      acceptsBankTransfer: p?.acceptsBankTransfer ?? false,
      bankName: p?.bankName ?? null,
      bankIban: p?.bankIban ?? null,
      bankHolder: p?.bankHolder ?? null,
      acceptsRevolut: p?.acceptsRevolut ?? false,
      revolutLink: p?.revolutLink ?? null,
      acceptsCod: p?.acceptsCod ?? false,
      codNote: p?.codNote ?? null,
    },
  });
}
