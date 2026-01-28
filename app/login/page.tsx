import Link from "next/link";

import SignInButton from "./SignInButton";

export default function LoginPage() {
  return (
    <main>
      <div className="stack">
        <div className="card">
          <h1>Admin login</h1>
          <p>Sign in with your Keycloak account to manage QR codes.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SignInButton />
            <Link className="button secondary" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
