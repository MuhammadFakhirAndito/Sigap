import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SIGAP",
  description:
    "Portal informasi gempa bumi Indonesia: data resmi BMKG, riwayat gempa persisten, simulasi dampak fisik edukasi, dan asisten mitigasi bencana.",
  authors: [{ name: "SIGAP" }],
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
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] antialiased font-sans flex flex-col selection:bg-[var(--color-primary)] selection:text-[var(--color-on-primary)]">
        {children}
      </body>
    </html>
  );
}
