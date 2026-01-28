import { handleRedirect } from "@/lib/redirect";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  return handleRedirect({ code }, request);
}
