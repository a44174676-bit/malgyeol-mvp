"use client";

import Link from "next/link";
import { DemoShell, useDemoCopy } from "@/components/DemoShell";
import { Card, Eyebrow } from "@/components/ui";
import { DISCLAIMER } from "@/lib/metrics";

const productFlow = [
  "표준화 녹음 테스트",
  "AI 보조 음성지표 산출",
  "치료사 결과 입력",
  "AI 홈트레이닝 과제 후보 제안",
  "치료사 승인 또는 수정",
  "환자·보호자 홈트레이닝 수행",
  "치료사 검수",
  "경과보고서 초안 생성",
];

const problemPoints = [
  "병원 밖 말하기 상태는 반복적으로 기록되기 어렵다.",
  "환자와 보호자는 변화를 느껴도 표준화해 제출하기 어렵다.",
  "치료사는 대면 세션 사이의 수행 이력을 확인하기 어렵다.",
  "AI 자동 판정만으로는 음성인식 오류와 실제 발화 문제를 구분하기 어렵다.",
];

const recordingTasks = [
  ["모음 연장 발성", "예: “아-”를 가능한 길게 발성", "참고 지표: 발화 지속시간, 음성 안정성 참고값"],
  ["교대운동속도 AMR", "예: “퍼퍼퍼”, “터터터”, “커커커”", "참고 지표: 반복 횟수, 초당 반복수, 규칙성 참고값"],
  ["일련운동속도 SMR", "예: “퍼터커 퍼터커”", "참고 지표: 반복 횟수, 초당 반복수, 끊김 참고값"],
  ["단어·문장 읽기", "예: 정해진 단어와 짧은 문장 읽기", "참고 지표: 말속도, 무음구간, 불일치 후보"],
  ["자발화·상황 설명", "예: 그림 설명 또는 오늘 있었던 일 말하기", "참고 지표: 발화 길이, 말속도, 멈춤 구간, 보호자 관찰 메모"],
];

const aiDoes = [
  "녹음 품질 확인",
  "비진단 음성지표 산출",
  "인식 불확실 구간 표시",
  "목표 발화와 인식 결과의 불일치 후보 표시",
  "치료사 입력값 요약",
  "이전 기록과 비교",
  "홈트레이닝 과제 후보 제안",
  "경과보고서 초안 작성",
];

const aiDoesNot = [
  "구음장애 진단",
  "장애 정도 판정",
  "치료 효과 판정",
  "발음 오류 자동 확정",
  "치료사 승인 없는 과제 배포",
  "의료 상담 또는 의료 처방",
];

const therapistInputs = [
  "말명료도 관찰",
  "발화 지속시간 참고",
  "반복 발화 양상",
  "무음구간 증가 여부",
  "피로도 관찰",
  "오류 유형 입력",
  "권장 과제 선택",
  "재검사 또는 대면상담 필요 여부",
];

const privacyPoints = [
  "공개 데모는 실제 저장 없음",
  "실제 서비스는 동의 기반으로만 운영",
  "음성 원본 저장은 기본 비활성화",
  "향후 실제 서비스에서는 음성 원본 미전송 또는 지표 중심 처리 옵션 고려",
  "환자 민감정보 입력 금지",
  "삭제 요청 가능 구조 예정",
];

export function DemoHomeContent() {
  return (
    <DemoShell>
      <DemoHomeBody />
    </DemoShell>
  );
}

function DemoHomeBody() {
  const { t } = useDemoCopy();

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-[#7dd3fc]/30 bg-[linear-gradient(135deg,rgba(4,12,29,0.98),rgba(9,27,52,0.92)_54%,rgba(16,34,61,0.86))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.36)] sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-[#82b8d3]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#c9e7ff]">
              MalGyeol Care
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#fff8e7] sm:text-5xl">
              {t.homeTitle}
            </h1>
            <p className="mt-3 text-xl font-bold leading-8 text-[#dff7ff]">
              표준화 녹음 테스트 기반 구음장애 홈트레이닝 보조 시스템
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#afc3d9]">
              표준화된 말하기 과제를 녹음하고, 치료사가 결과를 입력·검수하며, AI는 비진단 지표 정리와 홈트레이닝 과제 후보 제안을 보조합니다.
            </p>
            <p className="mt-3 max-w-3xl rounded-2xl border border-[#f6d58f]/25 bg-[#f6d58f]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#fff2ce]">
              {t.homeData}
            </p>
            <p className="mt-3 text-sm font-bold text-[#91e7f2]">
              AI가 판단하지 않습니다. 치료사의 평가와 홈트레이닝 설계를 보조합니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/demo/care"
                className="rounded-xl bg-[#5cc8d5] px-4 py-3 text-sm font-extrabold text-[#051427] hover:bg-[#7dd3fc]"
              >
                표준 녹음 테스트 데모 보기
              </Link>
              <a
                href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20Care%20%EC%A0%84%EB%AC%B8%EA%B0%80%20%ED%98%91%EC%97%85%20%EB%AC%B8%EC%9D%98"
                className="rounded-xl border border-[#7dd3fc]/40 px-4 py-3 text-sm font-extrabold text-[#e0f2fe] hover:border-[#7dd3fc]"
              >
                전문가 협업 문의
              </a>
              <a
                href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20Care%20%EB%B2%A0%ED%83%80%20%EC%B0%B8%EC%97%AC%20%EC%9D%98%ED%96%A5"
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-extrabold text-[#dce9fb] hover:border-[#7dd3fc]"
              >
                베타 참여 의향 남기기
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-[#f6d58f]/35 bg-white/10 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
            <Eyebrow>제품 흐름</Eyebrow>
            <div className="grid gap-2">
              {productFlow.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-[#edf5ff]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7dd3fc] text-xs text-[#051427]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <Eyebrow>문제 제기</Eyebrow>
        <div className="grid gap-3 md:grid-cols-2">
          {problemPoints.map((item) => (
            <Card key={item} className="bg-white/95">
              <p className="text-sm font-semibold leading-6 text-ink-soft">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>표준화된 녹음 과제</Eyebrow>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {recordingTasks.map(([title, example, metric]) => (
            <Card key={title} className="bg-white/95">
              <h2 className="text-base font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{example}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-ink-faint">{metric}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white/95">
          <Eyebrow>AI가 하는 일</Eyebrow>
          <ul className="grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            {aiDoes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
        <Card className="bg-white/95">
          <Eyebrow>AI가 하지 않는 일</Eyebrow>
          <ul className="grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            {aiDoesNot.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/95">
          <Eyebrow>치료사 검수</Eyebrow>
          <h2 className="text-lg font-bold">결과는 치료사가 입력하고 검수합니다.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            AI 보조 지표와 불일치 후보는 치료사 검수 참고자료로만 표시되며, 홈트레이닝 과제는 치료사 승인 또는 수정 후 배포되는 흐름으로 설계합니다.
          </p>
        </Card>
        <Card className="bg-white/95">
          <Eyebrow>치료사 입력 예시</Eyebrow>
          <div className="grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            {therapistInputs.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#7dd3fc]/25 bg-white/95">
          <Eyebrow>/demo/care 안내</Eyebrow>
          <h2 className="text-lg font-bold">표준화 녹음 테스트 데모</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            단순 홈트레이닝 화면이 아니라 표준화 녹음 테스트, AI 보조 음성지표, 치료사 결과 입력, AI 과제 후보 제안, 치료사 승인, 홈트레이닝 과제 수행, 치료사 검수 순서로 mock UI를 확인합니다.
          </p>
          <Link href="/demo/care" className="mt-4 inline-flex rounded-xl bg-[#5cc8d5] px-4 py-3 text-sm font-extrabold text-[#051427] hover:bg-[#7dd3fc]">
            /demo/care 열기
          </Link>
        </Card>
        <Card className="bg-white/95">
          <Eyebrow>개인정보 보호 및 비저장 데모 고지</Eyebrow>
          <ul className="grid gap-2 text-sm text-ink-soft">
            {privacyPoints.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="rounded-2xl border border-[#f6d58f]/35 bg-[#fff8e7] px-4 py-3 text-sm font-bold leading-6 text-[#6b4a0b]">
        {DISCLAIMER}
      </p>
    </>
  );
}
