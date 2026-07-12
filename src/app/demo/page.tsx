import type { Metadata } from "next";
import { DemoHomeContent } from "@/components/DemoHomeContent";

export const metadata: Metadata = {
  title: "말결 Care - 집에서 녹음하고, 언어재활사에게 확인받는 음성 훈련",
  description:
    "말결 Care는 환자와 보호자가 가정에서 음성 과제를 수행하고, AI가 정리한 비진단 참고자료와 원음을 언어재활사가 검수하여 피드백과 다음 훈련 과제를 제공할 수 있도록 설계된 구음장애 홈트레이닝 지원 서비스입니다.",
};

export default function DemoEntryPage() {
  return <DemoHomeContent />;
}
