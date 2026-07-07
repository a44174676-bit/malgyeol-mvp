// 비진단 음성지표 — 공용 타입·표시·우선순위 헬퍼
// 지표는 단말(브라우저)에서 산출되어 제출됩니다 (온디바이스 산출).
// 모든 값은 진단·판정이 아닌 치료사 검수용 참고 정보입니다.

export type VoiceMetrics = {
  kind: "MPT" | "DDK" | "READ";
  totalSec: number; // 총 녹음 길이
  voicedSec: number; // 발화 지속시간 (첫 발성~마지막 발성)
  maxRunSec: number; // 최장 연속 발성 (MPT)
  pauses: number; // 무음구간(>0.3초) 횟수
  meanDb: number; // 평균 상대 강도
  endDeltaDb: number; // 말끝 상대 강도 변화 (뒤1/3 - 앞1/3)
  f0Mean: number; // 기본주파수 평균 (0=미검출)
  f0Sd: number; // 기본주파수 변동
  onsets: number; // 반복 횟수 (DDK)
  rate: number; // 초당 반복수 (DDK)
};

export type FrameSample = { t: number; db: number; hz: number };

export const VOICED_DB = 30; // 상대 dB 발성 문턱값
export const PAUSE_SEC = 0.3; // 무음구간 임계
export const MIN_VOICED_SEC = 0.5; // 품질 조건: 최소 유효 발성 길이 (청구항 10)
export const ONSET_GAP_SEC = 0.06; // DDK 온셋 최소 간격 (청구항 15)

/** 녹음 프레임 → 비진단 음성지표 (브라우저·서버 공용 순수 함수) */
export function computeVoiceMetrics(
  frames: FrameSample[],
  kind: VoiceMetrics["kind"]
): VoiceMetrics {
  const empty: VoiceMetrics = {
    kind, totalSec: 0, voicedSec: 0, maxRunSec: 0, pauses: 0,
    meanDb: 0, endDeltaDb: 0, f0Mean: 0, f0Sd: 0, onsets: 0, rate: 0,
  };
  if (frames.length === 0) return empty;
  const totalSec = frames[frames.length - 1].t;
  const voiced = frames.filter((f) => f.db > VOICED_DB);
  if (voiced.length === 0) return { ...empty, totalSec };

  const vStart = voiced[0].t;
  const vEnd = voiced[voiced.length - 1].t;
  const meanDb = Math.round(voiced.reduce((s, f) => s + f.db, 0) / voiced.length);

  let pauses = 0, onsets = 0, maxRun = 0;
  let lastVoicedT: number | null = null;
  let runStart: number | null = null;
  for (const f of frames) {
    const v = f.db > VOICED_DB;
    if (v) {
      if (lastVoicedT !== null && f.t - lastVoicedT > PAUSE_SEC && f.t > vStart && f.t < vEnd) pauses++;
      if (lastVoicedT === null || f.t - lastVoicedT > ONSET_GAP_SEC) onsets++;
      if (runStart === null) runStart = f.t;
      maxRun = Math.max(maxRun, f.t - runStart);
      lastVoicedT = f.t;
    } else if (runStart !== null && lastVoicedT !== null && f.t - lastVoicedT > 0.25) {
      runStart = null;
    }
  }

  const f0s = voiced.filter((f) => f.hz > 50).map((f) => f.hz);
  const f0Mean = f0s.length ? Math.round(f0s.reduce((a, b) => a + b, 0) / f0s.length) : 0;
  const f0Sd = f0s.length > 3
    ? Math.round(Math.sqrt(f0s.reduce((s, v) => s + (v - f0Mean) ** 2, 0) / f0s.length) * 10) / 10
    : 0;

  const third = Math.floor(voiced.length / 3) || 1;
  const head = voiced.slice(0, third).reduce((s, f) => s + f.db, 0) / third;
  const tail = voiced.slice(-third).reduce((s, f) => s + f.db, 0) / third;

  const span = Math.max(0.5, vEnd - vStart);
  return {
    kind,
    totalSec: round1(totalSec),
    voicedSec: round1(vEnd - vStart),
    maxRunSec: round1(maxRun),
    pauses,
    meanDb,
    endDeltaDb: Math.round(tail - head),
    f0Mean,
    f0Sd,
    onsets,
    rate: round1(onsets / span),
  };
}

function round1(v: number) { return Math.round(v * 10) / 10; }

/** 품질 조건 검사 (청구항 10) — 미충족 사유 반환, 충족 시 null */
export function qualityIssue(m: VoiceMetrics): string | null {
  if (m.voicedSec < MIN_VOICED_SEC) return "발성이 감지되지 않았거나 너무 짧습니다";
  if (m.totalSec < 1) return "녹음이 너무 짧습니다";
  return null;
}

/** 검수 화면 표시용 지표 행 */
export function metricRows(m: VoiceMetrics): [string, string][] {
  const rows: [string, string][] = [];
  if (m.kind === "MPT") {
    rows.push(["발화 지속시간(최장 연속)", m.maxRunSec + "초"]);
    rows.push(["평균 상대 강도", m.meanDb + " dB(상대)"]);
    if (m.f0Mean) rows.push(["기본주파수 평균/변동", `${m.f0Mean} Hz / ±${m.f0Sd}`]);
  } else if (m.kind === "DDK") {
    rows.push(["반복 횟수", m.onsets + "회"]);
    rows.push(["초당 반복수", m.rate + "회/초"]);
    rows.push(["무음구간(>0.3초)", m.pauses + "회"]);
  } else {
    rows.push(["발화 지속시간", m.voicedSec + "초"]);
    rows.push(["무음구간(>0.3초)", m.pauses + "회"]);
    rows.push(["말끝 상대 강도 변화", (m.endDeltaDb > 0 ? "+" : "") + m.endDeltaDb + " dB"]);
    if (m.f0Mean) rows.push(["기본주파수 평균", m.f0Mean + " Hz"]);
  }
  rows.push(["총 녹음 길이", m.totalSec + "초"]);
  return rows;
}

/** 과제 유형별 대표 지표 (기준값 정규화·추이용 — 청구항 11) */
export function primaryMetric(m: VoiceMetrics): { label: string; value: number; unit: string } {
  if (m.kind === "MPT") return { label: "발화 지속시간", value: m.maxRunSec, unit: "초" };
  if (m.kind === "DDK") return { label: "초당 반복수", value: m.rate, unit: "회/초" };
  return { label: "무음구간", value: m.pauses, unit: "회" };
}

export function parseMetrics(json: string | null): VoiceMetrics | null {
  if (!json) return null;
  try { return JSON.parse(json) as VoiceMetrics; } catch { return null; }
}

/** 검수 우선순위 (청구항 12) — 위험 관찰·지표 변화·마감·미검수 경과 가중 결합 */
export function priorityScore(opts: {
  riskObs: boolean; // 최근 사레/기침 위험 응답
  changeRatio: number | null; // 기준값 대비 변화율 절대값 (0~)
  hoursSinceSubmit: number;
  lowQuality: boolean;
}): number {
  let s = 0;
  if (opts.riskObs) s += 3;
  if (opts.changeRatio !== null) s += Math.min(2, Math.abs(opts.changeRatio) * 4);
  s += Math.min(2, opts.hoursSinceSubmit / 24);
  if (opts.lowQuality) s += 0.5;
  return Math.round(s * 10) / 10;
}

/** 검수 의견 유형 (청구항 7) */
export const REVIEW_OPINIONS = [
  "수행 적절",
  "재제출 필요",
  "과제 난이도 조정 필요",
  "보호자 관찰 필요",
  "대면 상담 권고",
  "의료진 상담 권고",
] as const;

/** 보호자 관찰 항목 정의 (특허 단계 ①·② 공용) */
export const OBS_ITEMS = [
  { key: "fatigue", label: "말하기 피로도 (0–10)", type: "scale11" },
  { key: "selfIntel", label: "자가 전달 정도 (1–5)", type: "scale5" },
  { key: "famIntel", label: "보호자 이해도 (1–5)", type: "scale5" },
  { key: "repeatQ", label: "반복 질문 여부", type: "choice", opts: ["없음", "가끔", "자주"] },
  { key: "phoneCall", label: "전화 통화 가능 여부", type: "choice", opts: ["가능", "짧게 가능", "어려움"] },
  { key: "cough", label: "식사 중 사레/기침", type: "choice", opts: ["없음", "1-2회", "자주"] },
] as const;

export const DISCLAIMER =
  "본 서비스는 의료진 또는 언어재활사의 진단과 치료를 대체하지 않습니다. 음성 및 발화 분석 결과는 참고용이며, 최종 해석과 치료 방향 결정은 담당 전문가가 수행합니다.";
