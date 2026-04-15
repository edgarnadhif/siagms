import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIAGMS",
  description: "Sistem Informasi Manajemen Proyek",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-jakarta antialiased"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
