import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMutualPartners } from "@/lib/partners";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const producer = await prisma.producer.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!producer) {
    return NextResponse.json({ partners: [] });
  }

  const partners = await getMutualPartners(producer.id);

  return NextResponse.json({
    partners: partners.map((p) => ({
      slug: p.slug,
      farmName: p.farmName,
      town: p.town,
      listings: p.listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: l.price,
        unit: l.unit,
        currency: l.currency,
        imageUrl: l.photos[0]?.url ?? null,
      })),
    })),
  });
}
