import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { deleteQRCode, getVisitCount, updateQRCode } from "@/lib/qr-storage";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name ? String(body.name).trim() : undefined;
  const targetUrl = body.targetUrl ? String(body.targetUrl).trim() : undefined;
  const friendlySlug =
    body.friendlySlug === "" ? null : body.friendlySlug ? String(body.friendlySlug).trim() : undefined;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  const updated = await updateQRCode({
    userId: session.user.id,
    id,
    name,
    targetUrl,
    friendlySlug,
    isActive
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if ("error" in updated) {
    return NextResponse.json({ error: updated.error }, { status: updated.status });
  }

  const visits = await getVisitCount(updated.id);
  return NextResponse.json({ ...updated, _count: { visits } });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteQRCode(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
