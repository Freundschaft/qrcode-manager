import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateCode } from "@/lib/qrcode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qrCodes = await prisma.qRCode.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { visits: true } } }
  });

  return NextResponse.json(qrCodes);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const targetUrl = String(body.targetUrl ?? "").trim();
  const friendlySlug = body.friendlySlug ? String(body.friendlySlug).trim() : null;
  const code = body.code ? String(body.code).trim() : generateCode(10);

  if (!name || !targetUrl) {
    return NextResponse.json({ error: "Name and targetUrl are required" }, { status: 400 });
  }

  const created = await prisma.qRCode.create({
    data: {
      name,
      targetUrl,
      friendlySlug: friendlySlug || null,
      code,
      createdById: session.user.id
    },
    include: { _count: { select: { visits: true } } }
  });

  return NextResponse.json(created, { status: 201 });
}
