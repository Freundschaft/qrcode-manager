import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AdminClient from "@/app/admin/AdminClient";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const qrCodes = await prisma.qRCode.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { visits: true } } }
  });

  const initialData = qrCodes.map((qr) => ({
    ...qr,
    createdAt: qr.createdAt.toISOString(),
    updatedAt: qr.updatedAt.toISOString()
  }));

  return <AdminClient initialData={initialData} />;
}
