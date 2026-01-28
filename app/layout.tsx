import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "QR Code Manager",
  description: "Admin backend for QR codes with Keycloak login"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
