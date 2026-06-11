import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public — header/footer için logo + logoText döner
export async function GET() {
  const s = await prisma.siteSettings.findUnique({
    where: { id: "site" },
    select: { logoUrl: true, logoText: true },
  });
  return NextResponse.json({ ok: true, logoUrl: s?.logoUrl ?? "", logoText: s?.logoText ?? "QONTAC" });
}
