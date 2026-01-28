"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function AuthClient({ callbackUrl }: { callbackUrl: string }) {
  useEffect(() => {
    signIn("keycloak", { callbackUrl });
  }, [callbackUrl]);

  return null;
}
