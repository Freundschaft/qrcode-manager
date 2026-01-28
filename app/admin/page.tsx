import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AdminClient from "@/app/admin/AdminClient";
import { authOptions } from "@/lib/auth";
import { listQRCodesForUser } from "@/lib/qr-storage";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const qrCodes = await listQRCodesForUser(session.user.id);
  return <AdminClient initialData={qrCodes} />;
}
