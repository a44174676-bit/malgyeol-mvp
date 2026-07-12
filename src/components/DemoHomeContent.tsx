import Link from "next/link";
import { DemoShell } from "@/components/DemoShell";
import { Card, Pill } from "@/components/ui";

const trainingSteps: Array<{ title: string; pending?: boolean }> = [
  { title: "과제 확인" },
  { title: "음성 녹음" },
  { title: "AI 참고자료 정리" },
  { title: "언어재활사 검수", pending: true },
  { title: "피드백과 다음 과제", pending: true },
];

const availableNow = [
  "과제 선택",
  "음성 녹음과 재생",
  "AI 음성인식",
  "자동 음향 참고지표",
  "전문가 검수용 화면",
];

const pilotInProgress = [
  "환자 계정",
  "전문가 계정",
  "녹음 제출",
  "전문가 피드백",
  "다음 과제",
  "경과 기록",
];

export function DemoHomeContent() {
  return (
    <DemoShell>
      <DemoHomeBody />
    </DemoShell>
  );
}

function DemoHomeBody() {
  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-[#7dd3fc]/30 bg-[linear-gradient(135deg,rgba(4,12,29,0.98),rgba(9,27,52,0.92)_54%,rgba(16,34,61,0.86))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.36)] sm:p-8">
        <p className="inline-flex rounded-full border border-[#82b8d3]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#c9e7ff]">
          MalGyeol Care
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#fff8e7] sm:text-5xl">
          집에서 녹음하고,
          <br />
          전문가에게 확인받는 음성 훈련
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#dbe8f5] sm:text-lg">
          말결 Care는 환자와 보호자가 가정에서 음성 과제를 녹음하고, AI가 정리한
          참고자료와 원음을 언어재활사가 검수하여 피드백과 다음 훈련 과제를 제공할
          수 있도록 설계된 구음장애 홈트레이닝 지원 서비스입니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/demo/care"
            className="rounded-xl bg-[#5cc8d5] px-4 py-3 text-sm font-extrabold text-[#051427] hover:bg-[#7dd3fc]"
          >
            Care 공개 베타 체험
          </Link>
          <Link
            href="/care/login"
            className="rounded-xl border border-[#7dd3fc]/50 px-4 py-3 text-sm font-extrabold text-[#e0f2fe] hover:border-[#7dd3fc]"
          >
            Care 로그인
          </Link>
        </div>
      </section>

      <section>
        <Card className="bg-white">
          <h2 className="text-base font-bold text-ink">이용 흐름</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {trainingSteps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-ink">{step.title}</span>
                {step.pending && <Pill tone="grey">전문가 연계 기능 준비 중</Pill>}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            현재 공개 베타
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {availableNow.map((item) => (
              <li key={item} className="text-sm font-semibold leading-6 text-ink-soft">
                • {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="bg-white">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            계정 기반 파일럿 준비 중
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {pilotInProgress.map((item) => (
              <li key={item} className="text-sm font-semibold leading-6 text-ink-soft">
                • {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="rounded-2xl border border-crit/20 bg-crit-soft px-4 py-3 text-sm font-bold leading-6 text-crit">
        현재 개발 테스트 버전입니다.
        <br />
        실제 환자정보, 진료기록 및 민감한 음성자료를 입력하지 마십시오.
      </p>
    </>
  );
}
