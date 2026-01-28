import "./globals.css";

import type { ReactNode } from "react";

import Providers from "./Providers";

export const metadata = {
  title: "QR Code Manager",
  description: "Admin backend for QR codes with Keycloak login"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
