import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SIGAP Gempa — Informasi Gempa Bumi Terkini & Mitigasi Indonesia",
  description:
    "Portal informasi gempa bumi Indonesia: data resmi BMKG, riwayat gempa persisten, simulasi dampak fisik edukasi, dan asisten mitigasi bencana.",
  authors: [{ name: "SIGAP Gempa" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F6F4F1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] antialiased font-sans flex flex-col selection:bg-[var(--color-primary)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
