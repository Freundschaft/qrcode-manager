import { handleRedirect } from "@/lib/redirect";

export async function GET(request: Request, { params }: { params: { code: string } }) {
  return handleRedirect({ code: params.code }, request);
}
