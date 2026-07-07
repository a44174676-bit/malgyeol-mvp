import Link from "next/link";
import { DemoRecorder } from "@/components/DemoRecorder";
import { Card, Eyebrow, Pill } from "@/components/ui";

const careMetrics = [
  ["발화 지속시간", "5.4초"],
  ["말속도", "3.1음절/초"],
  ["무음구간", "2회"],
  ["상대 음성강도", "0.68"],
  ["과제 수행 여부", "완료 예시"],
];

export default function CareDemoPage() {
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
            Malgyeol Care Mock Demo
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            말결 Care 공개 베타 체험
          </h1>
          <p className="mt-4 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
            이 데모는 공개 베타 테스트용 mock 화면입니다. 실제 환자 정보, 실제 검사 결과, 실제 음성파일은 저장하지 않습니다.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Eyebrow>데모 환자 카드</Eyebrow>
            <h2 className="text-lg font-bold">데모 환자</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              공개 베타 흐름 확인을 위한 더미 프로필입니다. 개인을 식별할 수 있는 정보는 포함하지 않습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="teal">홈 트레이닝 수행 이력</Pill>
              <Pill tone="grey">더미 데이터</Pill>
            </div>
          </Card>

          <Card>
            <Eyebrow>구음장애 홈 트레이닝 과제 예시</Eyebrow>
            <h2 className="text-lg font-bold">문장 읽기</h2>
            <p className="mt-2 text-sm text-ink-soft">
              목표 발화: “오늘 병원에 다녀왔습니다”
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              수행 조건: 문장을 천천히 1회 이상 읽고 녹음 미리보기
            </p>
          </Card>
        </div>

        <DemoRecorder label="Care 음성 녹음 미리보기" />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <Eyebrow>비진단 음성지표 예시</Eyebrow>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {careMetrics.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-ground px-3 py-2">
                  <p className="text-xs text-ink-faint">{label}</p>
                  <p className="mt-1 text-sm font-extrabold">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              수치는 mock 예시이며 실제 해석과 방향 결정은 담당 전문가가 수행합니다.
            </p>
          </Card>

          <Card>
            <Eyebrow>보호자 관찰 데이터 예시</Eyebrow>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>말을 알아듣기 쉬웠나요? <b className="text-ink">4/5</b></li>
              <li>다시 물어본 횟수가 늘었나요? <b className="text-ink">가끔</b></li>
              <li>전화 통화가 어려웠나요? <b className="text-ink">짧게 가능</b></li>
              <li>식사 중 사레/기침이 있었나요? <b className="text-ink">없음</b></li>
              <li>말한 후 피로해 보였나요? <b className="text-ink">조금</b></li>
            </ul>
          </Card>

          <Card>
            <Eyebrow>치료사 검수 예시</Eyebrow>
            <div className="rounded-lg border border-accent-soft bg-accent-soft/60 px-3 py-3 text-sm">
              <p className="font-bold text-accent-deep">AI 참고 분석 Beta</p>
              <p className="mt-2 text-ink-soft">불일치 후보: 목표 발화 끝부분 확인 필요</p>
              <p className="mt-1 text-ink-soft">치료사 확인 필요: 말끝 약화/쉼 증가 후보</p>
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              치료사 검수 결과 예시: 짧은 문장 읽기 재시도 권장, 보호자 관찰 데이터 유지.
            </p>
          </Card>

          <Card>
            <Eyebrow>경과보고서 예시</Eyebrow>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>홈 트레이닝 수행 이력: 4회 중 3회 완료</li>
              <li>비진단 음성지표 변화: 발화 지속시간 예시값 유지</li>
              <li>치료사 검수 의견: 천천히 읽는 과제 유지</li>
              <li>다음 권장 과제: 짧은 문장 읽기와 AMR 과제 병행</li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}

