import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RushHour — Finde den Creator, der dein Ziel trifft",
  description:
    "RushHour matcht lokale Geschäfte mit Content-Creators. Keine endlose Suche — die KI sagt voraus, welche Zusammenarbeit funktioniert.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-ink">
        <TopNav />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
