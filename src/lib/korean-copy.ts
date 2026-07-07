import type { VoiceMetrics } from "./metrics";

export const KOREAN_SERVICE_LINE = "KOREAN";

export const KOREAN_NOTICE =
  "말결 Korean은 한국어 학습자의 발음 연습을 돕는 교육용 MVP입니다. 음성 분석 결과는 학습 참고용이며, 최종 피드백은 한국어 교사 또는 튜터가 제공합니다.";

export const KOREAN_REVIEW_ACTIONS = ["확인", "수정", "제외"] as const;

export type KoreanReviewMeta = {
  reference?: {
    heardText: string;
    differences: string[];
    source: string;
  };
  pronunciationReviews?: {
    candidate: string;
    focus: string;
    action: "confirm" | "modify" | "delete";
  }[];
  tutorMemo?: string | null;
  nextPractice?: {
    recommended: boolean;
    assigned: boolean;
    note: string | null;
  };
};

export function koreanMetricRows(m: VoiceMetrics): [string, string][] {
  const rows: [string, string][] = [
    ["녹음 길이", `${m.totalSec}초`],
    ["말한 시간", `${m.voicedSec}초`],
    ["쉬어 말한 구간", `${m.pauses}회`],
    ["상대 음성 크기", `${m.meanDb} dB`],
  ];
  if (m.kind === "DDK") rows.push(["반복 속도", `${m.rate}회/초`]);
  if (m.f0Mean) rows.push(["목소리 높낮이 참고값", `${m.f0Mean} Hz`]);
  return rows;
}

export function parseKoreanJson<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function koreanActionLabel(action: string) {
  if (action === "modify") return "수정";
  if (action === "delete") return "제외";
  return "확인";
}

