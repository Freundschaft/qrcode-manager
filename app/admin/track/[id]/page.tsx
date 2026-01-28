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
      <div className="page">
        <section className="masthead">
          <div className="masthead-top">
            <div>
              <div className="kicker">Tracking log</div>
              <h1>{qrCode.name}</h1>
              <p>Target: {qrCode.targetUrl}</p>
            </div>
            <Link className="button secondary" href="/admin">
              Back to admin
            </Link>
          </div>
          <div className="stats">
            <div className="stat">
              <span>Total visits</span>
              <strong>{totalVisits}</strong>
            </div>
            <div className="stat">
              <span>Status</span>
              <strong>{qrCode.isActive ? "Active" : "Paused"}</strong>
            </div>
          </div>
        </section>

        <section className="card section" style={{ overflowX: "auto" }}>
          <div className="section-title">
            <h2>Recent visits</h2>
            <span className="kicker">Last 50</span>
          </div>
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
        </section>
      </div>
    </main>
  );
}
