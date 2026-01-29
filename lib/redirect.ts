import { NextResponse } from "next/server";

import { findQRCodeByCodeOrSlug, recordVisit } from "@/lib/qr-storage";

export async function handleRedirect(where: { friendlySlug?: string; code?: string }, request: Request) {
  const qr = await findQRCodeByCodeOrSlug({
    slug: where.friendlySlug,
    code: where.code
  });

  if (!qr) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!qr.isActive) {
    return NextResponse.json({ error: "Inactive" }, { status: 410 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  await recordVisit({
    qrCodeId: qr.id,
    userAgent,
    referrer,
    ip
  });

  const response = NextResponse.redirect(qr.targetUrl, { status: 302 });
  response.headers.set(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=300"
  );
  return response;
}
