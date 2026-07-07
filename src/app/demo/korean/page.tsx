import Link from "next/link";
import { DemoRecorder } from "@/components/DemoRecorder";
import { Card, Eyebrow, Pill } from "@/components/ui";

const koreanMetrics = [
  ["녹음 길이", "6.2초"],
  ["문장 말하기 속도", "3.0음절/초"],
  ["쉼 횟수", "1회"],
  ["연습 완료", "완료 예시"],
];

export default function KoreanDemoPage() {
  return (
    <main className="min-h-screen bg-ground px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/demo" className="text-sm font-bold text-accent-deep">
            ← 공개 베타 입구
          </Link>
          <a
            href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20MVP%20%ED%94%BC%EB%93%9C%EB%B0%B1"
            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink-soft hover:border-accent hover:text-accent-deep"
          >
            피드백 보내기
          </a>
        </div>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
            Malgyeol Korean Mock Demo
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            말결 Korean 공개 베타 체험
          </h1>
          <p className="mt-4 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
            이 데모는 공개 베타 테스트용 mock 화면입니다. 실제 학습자 정보나 실제 음성파일은 저장하지 않습니다.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Eyebrow>데모 학습자 카드</Eyebrow>
            <h2 className="text-lg font-bold">데모 학습자</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              한국어 생활문장 연습 흐름을 확인하기 위한 더미 프로필입니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="warm">학습자 자기평가</Pill>
              <Pill tone="grey">더미 데이터</Pill>
            </div>
          </Card>

          <Card>
            <Eyebrow>한국어 생활문장 과제 예시</Eyebrow>
            <h2 className="text-lg font-bold">병원·생활 문장</h2>
            <p className="mt-2 text-sm text-ink-soft">
              목표 문장: “병원 예약을 하고 싶습니다.”
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              연습 조건: 문장을 천천히 읽고 브라우저 안에서 녹음 미리보기
            </p>
          </Card>
        </div>

        <DemoRecorder label="Korean 음성 녹음 미리보기" />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <Eyebrow>발음 연습 참고지표 예시</Eyebrow>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {koreanMetrics.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-ground px-3 py-2">
                  <p className="text-xs text-ink-faint">{label}</p>
                  <p className="mt-1 text-sm font-extrabold">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              수치는 학습 참고용 mock 예시이며 최종 피드백은 한국어 교사 또는 튜터가 제공합니다.
            </p>
          </Card>

          <Card>
            <Eyebrow>학습자 자기평가 예시</Eyebrow>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>오늘 말하기 자신감 <b className="text-ink">4/5</b></li>
              <li>오늘 말하기 피로도 <b className="text-ink">3/10</b></li>
              <li>문장 난이도 <b className="text-ink">보통</b></li>
              <li>학습자 메모 <b className="text-ink">받침이 조금 어려웠습니다.</b></li>
            </ul>
          </Card>

          <Card>
            <Eyebrow>목표 문장과 다른 인식 후보 예시</Eyebrow>
            <div className="rounded-lg border border-accent-soft bg-accent-soft/60 px-3 py-3 text-sm">
              <p className="font-bold text-accent-deep">참고 후보</p>
              <p className="mt-2 text-ink-soft">목표 문장 끝부분 확인: “하고 싶습니다”</p>
              <p className="mt-1 text-ink-soft">교사/튜터 확인: 받침, 문장 리듬</p>
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              후보는 자동 확정되지 않으며, 교사/튜터 피드백을 위한 참고 정보로만 표시합니다.
            </p>
          </Card>

          <Card>
            <Eyebrow>교사/튜터 피드백과 발음 연습 리포트 예시</Eyebrow>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>교사/튜터 피드백: 문장 끝을 천천히 마무리해 보세요.</li>
              <li>발음 연습 리포트: 제출 3회, 피드백 2회</li>
              <li>다음 추천 연습: “천천히 말씀해 주세요.” 문장 다시 읽기</li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}

