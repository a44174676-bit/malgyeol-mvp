import type { Metadata } from "next";
import { DemoHomeContent } from "@/components/DemoHomeContent";

export const metadata: Metadata = {
  title: "말결 Care - 표준화 녹음 테스트 기반 비진단 재활 지원",
  description:
    "표준화된 녹음 과제, 치료사 입력·검수, AI 보조 지표, 홈트레이닝 과제 후보 제안 흐름을 소개합니다.",
};

export default function DemoEntryPage() {
  return <DemoHomeContent />;
}
