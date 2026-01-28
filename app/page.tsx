import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="stack">
        <div className="card">
          <h1>QR Code Manager</h1>
          <p>Admin backend for QR codes with Keycloak login, tracking, and friendly URLs.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="button" href="/admin">
              Go to admin
            </Link>
            <Link className="button secondary" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
