import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "말결 — 언어치료 지원 플랫폼",
  description: "치료사 주도형 하이브리드 언어치료 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
