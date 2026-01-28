import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name ? String(body.name).trim() : undefined;
  const targetUrl = body.targetUrl ? String(body.targetUrl).trim() : undefined;
  const friendlySlug = body.friendlySlug === "" ? null : body.friendlySlug ? String(body.friendlySlug).trim() : undefined;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  const existing = await prisma.qRCode.findFirst({
    where: { id: params.id, createdById: session.user.id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.qRCode.update({
    where: { id: params.id },
    data: {
      name,
      targetUrl,
      friendlySlug,
      isActive
    },
    include: { _count: { select: { visits: true } } }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await prisma.qRCode.deleteMany({
    where: { id: params.id, createdById: session.user.id }
  });

  if (!deleted.count) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
