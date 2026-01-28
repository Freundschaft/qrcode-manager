import { handleRedirect } from "@/lib/redirect";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  return handleRedirect({ friendlySlug: params.slug }, request);
}
