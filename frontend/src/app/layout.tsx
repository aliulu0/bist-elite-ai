import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "BIST Elite AI - Professional AI Stock Analysis Platform",
  description: "Professional AI Stock Analysis Platform for Borsa Istanbul",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
