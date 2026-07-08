"use client";

import Link from "next/link";
import { DemoRecorder } from "@/components/DemoRecorder";
import { DemoShell, useDemoCopy } from "@/components/DemoShell";
import { Card, Eyebrow, Pill } from "@/components/ui";

const koreanMetrics = [
  ["녹음 길이", "6.2초"],
  ["문장 말하기 속도", "3.0음절/초"],
  ["쉼 횟수", "1회"],
  ["연습 완료", "완료 예시"],
];

export function DemoKoreanContent() {
  return (
    <DemoShell>
      <DemoKoreanBody />
    </DemoShell>
  );
}

function DemoKoreanBody() {
  const { t } = useDemoCopy();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/demo" className="text-sm font-bold text-[#7dd3fc]">
          ← Public Beta
        </Link>
        <a
          href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20MVP%20%ED%94%BC%EB%93%9C%EB%B0%B1"
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-[#dce9fb] hover:border-[#7dd3fc]"
        >
          {t.feedbackFull}
        </a>
      </div>

      <section className="rounded-[28px] border border-[#f6d58f]/35 bg-[linear-gradient(135deg,rgba(4,12,29,0.98),rgba(9,27,52,0.92)_54%,rgba(16,34,61,0.86))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
        <p className="inline-flex rounded-full border border-[#f6d58f]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#fff2ce]">
          MalGyeol Korean Mock Demo
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#fff8e7]">
          {t.koreanTitle}
        </h1>
        <p className="mt-4 rounded-2xl border border-[#f6d58f]/25 bg-[#f6d58f]/10 px-4 py-3 text-sm font-semibold text-[#fff2ce]">
          {t.koreanDemoNotice}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-white/95">
          <Eyebrow>{t.demoLearnerCard}</Eyebrow>
          <h2 className="text-lg font-bold">{t.demoLearner}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{t.demoLearnerDesc}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="warm">학습자 자기평가</Pill>
            <Pill tone="grey">더미 데이터</Pill>
          </div>
        </Card>

        <Card className="border-[#f6d58f]/40 bg-white/95">
          <Eyebrow>{t.koreanTaskEyebrow}</Eyebrow>
          <h2 className="text-lg font-bold">{t.lifeSentence}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t.targetSentence}</p>
          <p className="mt-1 text-sm text-ink-soft">{t.koreanCondition}</p>
        </Card>
      </div>

      <DemoRecorder
        label={t.koreanRecorder}
        copy={{
          storageNotice: t.recorderStorage,
          start: t.recorderStart,
          stop: t.recorderStop,
          reset: t.recorderReset,
          unsupported: t.recorderUnsupported,
          blocked: t.recorderBlocked,
          ready: t.recorderReady,
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-white/95">
          <Eyebrow>{t.koreanMetricsTitle}</Eyebrow>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {koreanMetrics.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-ground px-3 py-2">
                <p className="text-xs text-ink-faint">{label}</p>
                <p className="mt-1 text-sm font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">{t.koreanMetricsDesc}</p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>{t.selfCheckTitle}</Eyebrow>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>오늘 말하기 자신감 <b className="text-ink">4/5</b></li>
            <li>오늘 말하기 피로도 <b className="text-ink">3/10</b></li>
            <li>문장 난이도 <b className="text-ink">보통</b></li>
            <li>학습자 메모 <b className="text-ink">받침이 조금 어려웠습니다.</b></li>
          </ul>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>{t.recognitionTitle}</Eyebrow>
          <div className="rounded-lg border border-accent-soft bg-accent-soft/60 px-3 py-3 text-sm">
            <p className="font-bold text-accent-deep">{t.recognitionCandidate}</p>
            <p className="mt-2 text-ink-soft">{t.recognitionLine1}</p>
            <p className="mt-1 text-ink-soft">{t.recognitionLine2}</p>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{t.recognitionDesc}</p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>{t.tutorReportTitle}</Eyebrow>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>교사/튜터 피드백: 문장 끝을 천천히 마무리해 보세요.</li>
            <li>발음 연습 리포트: 제출 3회, 피드백 2회</li>
            <li>다음 추천 연습: “천천히 말씀해 주세요.” 문장 다시 읽기</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
