"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button className="button" onClick={() => signIn("keycloak")}>Sign in with Keycloak</button>
  );
}
