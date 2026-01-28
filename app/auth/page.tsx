import AuthClient from "./AuthClient";

export const dynamic = "force-dynamic";

export default function AuthRedirectPage({
  searchParams
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/admin";
  return <AuthClient callbackUrl={callbackUrl} />;
}
