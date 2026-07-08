import type { Metadata } from "next";
import { DemoCareContent } from "@/components/DemoCareContent";

export const metadata: Metadata = {
  title: "말결 Care 표준화 녹음 테스트 데모",
  description:
    "표준화 녹음 테스트, AI 보조 음성지표, 치료사 결과 입력, AI 과제 후보 제안, 치료사 승인, 홈트레이닝 수행, 치료사 검수 mock UI입니다.",
};

export default function CareDemoPage() {
  return <DemoCareContent />;
}
