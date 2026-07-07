import Link from "next/link";
import { Card, Eyebrow } from "@/components/ui";
import { DEMO_NOTICE } from "@/lib/demo";

export default function DemoEntryPage() {
  return (
    <main className="min-h-screen bg-ground px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
            Public Beta MVP
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            말결 공개 베타 MVP
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-soft">
            말결은 Care와 Korean 두 가지 흐름을 테스트할 수 있는 공개 베타 MVP입니다.
            모든 데이터는 데모용이며 실제 환자 정보나 실제 학습자 정보를 사용하지 않습니다.
          </p>
          <p className="mt-4 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
            {DEMO_NOTICE}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/demo/care"
              className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent-deep"
            >
              말결 Care 체험하기
            </Link>
            <Link
              href="/demo/korean"
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-accent-deep hover:border-accent"
            >
              말결 Korean 체험하기
            </Link>
            <a
              href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20MVP%20%ED%94%BC%EB%93%9C%EB%B0%B1"
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink-soft hover:border-accent hover:text-accent-deep"
            >
              피드백 보내기
            </a>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <Eyebrow>말결 Care</Eyebrow>
            <h2 className="text-lg font-bold">치료사 검수 기반 기록 지원 흐름</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              데모 환자 기준으로 과제 처방, 제출 이력, 비진단 음성지표, 치료사 검수,
              경과보고서 흐름을 확인합니다. 실제 진단과 치료를 대체하지 않습니다.
            </p>
          </Card>
          <Card>
            <Eyebrow>말결 Korean</Eyebrow>
            <h2 className="text-lg font-bold">한국어 생활문장 발음 연습 흐름</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              데모 학습자 기준으로 과제 확인, 녹음 제출, 발음 연습 참고지표,
              교사/튜터 피드백, 발음 연습 리포트 흐름을 확인합니다.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
