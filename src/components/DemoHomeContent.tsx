import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";

const CONTAINER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6";

const trustMarkers = [
  "치료사 검수 구조",
  "비진단 AI 참고분석",
  "개인정보 최소화",
  "특허 출원 중",
];

const trainingSteps = [
  "과제 확인",
  "음성 녹음",
  "AI 참고자료 정리",
  "언어재활사 검수",
  "피드백과 다음 과제",
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
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="bg-[linear-gradient(135deg,#040c1d_0%,#091b34_54%,#10223d_100%)]">
        <div className={`${CONTAINER} py-14 sm:py-20`}>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#f6d58f]/50 bg-[#f6d58f]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#ffe7a8]">
            PATENT PENDING · 특허 출원 중
          </p>
          <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            집에서 녹음하고,
            <br />
            언어재활사에게 확인받는 음성 훈련
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#c7d7ea] sm:text-lg">
            말결 Care는 환자와 보호자가 가정에서 음성 과제를 수행하고, AI가 정리한
            비진단 참고자료와 원음을 언어재활사가 검수하여 피드백과 다음 훈련 과제를
            제공할 수 있도록 설계된 구음장애 홈트레이닝 지원 서비스입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo/care"
              className="rounded-xl bg-[#5cc8d5] px-5 py-3 text-sm font-extrabold text-[#051427] hover:bg-[#7dd3fc]"
            >
              Care 공개 베타 체험
            </Link>
            <Link
              href="/care/login"
              className="rounded-xl border border-white/30 px-5 py-3 text-sm font-extrabold text-white hover:border-[#7dd3fc] hover:text-[#7dd3fc]"
            >
              Care 로그인
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs font-bold text-[#a9c2d9] sm:text-sm">
            {trustMarkers.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-[#5cc8d5]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className={`${CONTAINER} py-14`}>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-accent-deep">
            이용 흐름
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {trainingSteps.map((step, index) => (
              <li key={step} className="flex flex-col items-start gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-bold leading-6 text-ink">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#071326]">
        <div className={`${CONTAINER} py-14`}>
          <p className="inline-flex rounded-full border border-[#f6d58f]/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#ffe7a8]">
            특허 출원 중
          </p>
          <h2 className="mt-4 max-w-2xl text-xl font-extrabold leading-snug text-white sm:text-2xl">
            치료사 검수 기반 구음장애 홈 트레이닝 시스템 및 방법
          </h2>
          <p className="mt-3 text-sm font-bold text-[#bcd7ea]">
            출원번호 10-2026-0124177 · 상태 특허 출원 중
          </p>
          <p className="mt-4 max-w-2xl text-xs leading-6 text-[#8fa6bd]">
            특허 출원 사실은 특허 등록, 의료적 성능 또는 임상적 효과의 인증을
            의미하지 않습니다.
          </p>
        </div>
      </section>

      <section className="bg-ground">
        <div className={`${CONTAINER} py-14`}>
          <Card className="bg-white">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-ink">
                  현재 공개 베타
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {availableNow.map((item) => (
                    <li key={item} className="text-sm font-semibold leading-6 text-ink-soft">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-ink">
                  계정 기반 파일럿 준비 중
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {pilotInProgress.map((item) => (
                    <li key={item} className="text-sm font-semibold leading-6 text-ink-soft">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <p className="mt-6 rounded-2xl border border-crit/20 bg-crit-soft px-4 py-3 text-sm font-bold leading-6 text-crit">
            현재 개발 테스트 버전입니다.
            <br />
            실제 환자정보, 진료기록 및 민감한 음성자료를 입력하지 마십시오.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-4 py-4`}>
        <Link href="/demo" className="flex min-w-0 items-center gap-3">
          <Image
            src="/demo-brand/logo.jpg"
            alt="말결 Care logo"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
          <span className="min-w-0">
            <span className="block text-sm font-extrabold leading-tight text-ink">
              말결 Care
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
              VR MEDI TOUR &amp; HOME
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <a
            href="https://vr-meditour.com/malgyeol/"
            className="rounded-full px-3 py-2 text-ink-soft hover:text-accent-deep"
          >
            공식 홈페이지
          </a>
          <Link href="/demo/care" className="rounded-full px-3 py-2 text-ink-soft hover:text-accent-deep">
            베타 체험
          </Link>
          <Link
            href="/care/login"
            className="rounded-full bg-accent px-4 py-2 text-white hover:bg-accent-deep"
          >
            Care 로그인
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-[#050b15] text-[#9fb4c9]">
      <div className={`${CONTAINER} py-10 text-sm`}>
        <p className="font-extrabold text-white">VR MEDI TOUR &amp; HOME · 말결 Care</p>
        <p className="mt-2 leading-6">
          구음장애 홈트레이닝 지원 서비스 · 비진단 AI 참고분석 · 치료사 검수 기반
        </p>
        <p className="mt-1">문의: info@vr-meditour.com</p>
      </div>
    </footer>
  );
}
