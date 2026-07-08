import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "말결 Care - 비진단 재활 지원 시스템",
  description:
    "말결 Care는 표준화된 녹음 과제, 치료사 입력·검수, AI 보조 지표, 홈트레이닝 과제 후보 제안을 결합한 비진단 재활 지원 시스템입니다.",
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
