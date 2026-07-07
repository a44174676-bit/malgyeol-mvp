"use client";

import Link from "next/link";
import { DemoRecorder } from "@/components/DemoRecorder";
import { DemoShell, useDemoCopy } from "@/components/DemoShell";
import { Card, Eyebrow, Pill } from "@/components/ui";

const careMetrics = [
  ["발화 지속시간", "5.4초"],
  ["말속도", "3.1음절/초"],
  ["무음구간", "2회"],
  ["상대 음성강도", "0.68"],
  ["과제 수행 여부", "완료 예시"],
];

export function DemoCareContent() {
  return (
    <DemoShell>
      <DemoCareBody />
    </DemoShell>
  );
}

function DemoCareBody() {
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

      <section className="rounded-[28px] border border-[#7dd3fc]/30 bg-[linear-gradient(135deg,rgba(4,12,29,0.98),rgba(9,27,52,0.92)_54%,rgba(16,34,61,0.86))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
        <p className="inline-flex rounded-full border border-[#82b8d3]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#c9e7ff]">
          Malgyeol Care Mock Demo
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#fff8e7]">
          {t.careTitle}
        </h1>
        <p className="mt-4 rounded-2xl border border-[#f6d58f]/25 bg-[#f6d58f]/10 px-4 py-3 text-sm font-semibold text-[#fff2ce]">
          {t.careDemoNotice}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-white/95">
          <Eyebrow>{t.demoPatientCard}</Eyebrow>
          <h2 className="text-lg font-bold">{t.demoPatient}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{t.demoPatientDesc}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="teal">홈 트레이닝 수행 이력</Pill>
            <Pill tone="grey">더미 데이터</Pill>
          </div>
        </Card>

        <Card className="border-[#7dd3fc]/25 bg-white/95">
          <Eyebrow>{t.careTaskEyebrow}</Eyebrow>
          <h2 className="text-lg font-bold">{t.sentenceReading}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t.targetUtterance}</p>
          <p className="mt-1 text-sm text-ink-soft">{t.careCondition}</p>
        </Card>
      </div>

      <DemoRecorder
        label={t.careRecorder}
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
          <Eyebrow>{t.careMetricsTitle}</Eyebrow>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {careMetrics.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-ground px-3 py-2">
                <p className="text-xs text-ink-faint">{label}</p>
                <p className="mt-1 text-sm font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">{t.careMetricsDesc}</p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>{t.caregiverTitle}</Eyebrow>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>말을 알아듣기 쉬웠나요? <b className="text-ink">4/5</b></li>
            <li>다시 물어본 횟수가 늘었나요? <b className="text-ink">가끔</b></li>
            <li>전화 통화가 어려웠나요? <b className="text-ink">짧게 가능</b></li>
            <li>식사 중 사레/기침이 있었나요? <b className="text-ink">없음</b></li>
            <li>말한 후 피로해 보였나요? <b className="text-ink">조금</b></li>
          </ul>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>{t.reviewTitle}</Eyebrow>
          <div className="rounded-lg border border-accent-soft bg-accent-soft/60 px-3 py-3 text-sm">
            <p className="font-bold text-accent-deep">{t.reviewBeta}</p>
            <p className="mt-2 text-ink-soft">{t.reviewLine1}</p>
            <p className="mt-1 text-ink-soft">{t.reviewLine2}</p>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{t.reviewDesc}</p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>{t.reportTitle}</Eyebrow>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>홈 트레이닝 수행 이력: 4회 중 3회 완료</li>
            <li>비진단 음성지표 변화: 발화 지속시간 예시값 유지</li>
            <li>치료사 검수 의견: 천천히 읽는 과제 유지</li>
            <li>다음 권장 과제: 짧은 문장 읽기와 AMR 과제 병행</li>
          </ul>
        </Card>
      </div>
    </>
  );
}

