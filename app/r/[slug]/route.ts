import { handleRedirect } from "@/lib/redirect";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRedirect({ friendlySlug: slug }, request);
}
