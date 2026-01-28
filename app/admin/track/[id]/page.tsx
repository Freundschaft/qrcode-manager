import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getQRCodeForUser, getVisitCount, listRecentVisits } from "@/lib/qr-storage";

export default async function TrackPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth?callbackUrl=/admin/track/${id}`);
  }

  const found = await getQRCodeForUser(session.user.id, id);
  const qrCode = found?.record ?? null;

  if (!qrCode) {
    return (
      <main>
        <div className="card">
          <h1>Not found</h1>
          <Link className="button secondary" href="/admin">
            Back to admin
          </Link>
        </div>
      </main>
    );
  }

  const visits = await listRecentVisits(qrCode.id, 50);
  const totalVisits = await getVisitCount(qrCode.id);

  return (
    <main>
      <div className="stack">
        <div className="card">
          <h1>{qrCode.name}</h1>
          <p>Target: {qrCode.targetUrl}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span className="badge">Total visits: {totalVisits}</span>
            <span className="badge">Status: {qrCode.isActive ? "Active" : "Paused"}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link className="button secondary" href="/admin">
              Back to admin
            </Link>
          </div>
        </div>

        <div className="card" style={{ overflowX: "auto" }}>
          <h2>Recent visits</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Visited at</th>
                <th>User agent</th>
                <th>Referrer</th>
                <th>IP hash</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={4}>No visits recorded yet.</td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id}>
                    <td>{visit.visitedAt}</td>
                    <td>{visit.userAgent ?? "—"}</td>
                    <td>{visit.referrer ?? "—"}</td>
                    <td>{visit.ipHash ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
