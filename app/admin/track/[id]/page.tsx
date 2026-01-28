import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function TrackPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const qrCode = await prisma.qRCode.findFirst({
    where: { id: params.id, createdById: session.user.id },
    include: {
      visits: {
        orderBy: { visitedAt: "desc" },
        take: 50
      },
      _count: { select: { visits: true } }
    }
  });

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

  return (
    <main>
      <div className="stack">
        <div className="card">
          <h1>{qrCode.name}</h1>
          <p>Target: {qrCode.targetUrl}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span className="badge">Total visits: {qrCode._count.visits}</span>
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
              {qrCode.visits.length === 0 ? (
                <tr>
                  <td colSpan={4}>No visits recorded yet.</td>
                </tr>
              ) : (
                qrCode.visits.map((visit) => (
                  <tr key={visit.id}>
                    <td>{visit.visitedAt.toISOString()}</td>
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
