import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function requireCsrf(request: Request) {
  const token = await getToken({ req: request as any });
  const csrfHeader = request.headers.get("x-csrf-token");

  if (!token?.csrf || !csrfHeader || csrfHeader !== token.csrf) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  return null;
}
