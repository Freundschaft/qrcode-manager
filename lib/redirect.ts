import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { hashIp } from "@/lib/qrcode";

export async function handleRedirect(where: { friendlySlug?: string; code?: string }, request: Request) {
  const qr = await prisma.qRCode.findFirst({ where });

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

  await prisma.qRVisit.create({
    data: {
      qrCodeId: qr.id,
      userAgent,
      referrer,
      ipHash: hashIp(ip)
    }
  });

  return NextResponse.redirect(qr.targetUrl, { status: 302 });
}
