import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { createQRCode, listQRCodesForUser } from "@/lib/qr-storage";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qrCodes = await listQRCodesForUser(session.user.id);
  return NextResponse.json(qrCodes);
}

export async function POST(request: Request) {
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const targetUrl = String(body.targetUrl ?? "").trim();
  const friendlySlug = body.friendlySlug ? String(body.friendlySlug).trim() : null;
  const code = body.code ? String(body.code).trim() : null;

  if (!name || !targetUrl) {
    return NextResponse.json({ error: "Name and targetUrl are required" }, { status: 400 });
  }

  const result = await createQRCode({
    userId: session.user.id,
    name,
    targetUrl,
    friendlySlug,
    code
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      ...result.record,
      _count: { visits: result.stats.visits }
    },
    { status: 201 }
  );
}
