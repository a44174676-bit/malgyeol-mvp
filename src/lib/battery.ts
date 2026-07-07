// 구음장애 선별 배터리 — 하위 과제 정의 및 결과 타입
// 모든 지표는 비진단 참고지표이며 최종 해석은 치료사가 수행합니다.

import type { VoiceMetrics } from "./metrics";

export type BatterySubtask = {
  key: string;
  title: string;
  target: string;
  hint: string;
  kind: VoiceMetrics["kind"];
  guide: string; // 치료사용 시행 안내
};

export const DYSARTHRIA_BATTERY: BatterySubtask[] = [
  {
    key: "mpt",
    title: '최대연장발성 "아——"',
    target: "아——",
    hint: "숨을 크게 들이쉬고 편안한 크기로 최대한 길게",
    kind: "MPT",
    guide: "3회 시행 가능 — 최고 기록 회차만 녹음·저장하세요.",
  },
  {
    key: "amr_pa",
    title: 'AMR "파파파"',
    target: "파파파파파…",
    hint: "5초 동안 최대한 빠르고 규칙적으로",
    kind: "DDK",
    guide: "시범을 먼저 보여준 뒤 시작하세요.",
  },
  {
    key: "amr_ta",
    title: 'AMR "타타타"',
    target: "타타타타타…",
    hint: "5초 동안 최대한 빠르고 규칙적으로",
    kind: "DDK",
    guide: "혀끝 운동 — 입술이 아닌 혀의 움직임을 관찰하세요.",
  },
  {
    key: "amr_ka",
    title: 'AMR "카카카"',
    target: "카카카카카…",
    hint: "5초 동안 최대한 빠르고 규칙적으로",
    kind: "DDK",
    guide: "혀뿌리 운동 — 연구개 접촉을 관찰하세요.",
  },
  {
    key: "smr",
    title: 'SMR "파타카"',
    target: "파타카파타카…",
    hint: "세 음절을 이어서 5초 동안 반복",
    kind: "DDK",
    guide: "순서 유지가 어려우면 '퍼터커'로 대체 가능 — 메모에 기록하세요.",
  },
  {
    key: "sentence",
    title: "문장 읽기 1",
    target: "수박이 시원해요",
    hint: "평소 말하듯 자연스럽게",
    kind: "READ",
    guide: "읽기가 어려우면 따라말하기로 대체 가능 — 메모에 기록하세요.",
  },
  {
    key: "sentence_2",
    title: "문장 읽기 2",
    target: "오늘 병원에 다녀왔습니다",
    hint: "문장 끝까지 편안하게 읽기",
    kind: "READ",
    guide: "목표 발화와 실제 발화의 차이는 치료사가 확인합니다.",
  },
  {
    key: "words",
    title: "단어 읽기",
    target: "사과, 수박, 병원, 전화, 라디오, 자동차",
    hint: "각 단어를 또박또박 한 번씩 읽기",
    kind: "READ",
    guide: "단어별 반응은 치료사 검수용 참고 후보로만 기록하세요.",
  },
  {
    key: "long_sentence",
    title: "긴 문장 읽기",
    target: "오늘 오후에는 가족과 함께 병원에 다녀온 뒤 집에서 편안하게 쉬었습니다.",
    hint: "중간에 쉬어도 되며 문장 끝까지 읽기",
    kind: "READ",
    guide: "발화 지속시간, 무음구간, 말끝 상대 강도 변화를 비진단 음성지표로 확인합니다.",
  },
  {
    key: "paragraph",
    title: "문단 읽기",
    target:
      "우리 동네에는 작은 시장이 있습니다. 아침마다 신선한 채소와 과일을 팝니다. 나는 시장에 가서 사과와 두부를 샀습니다.",
    hint: "중간에 편하게 쉬어도 됩니다",
    kind: "READ",
    guide: "말명료도 평정용 — 이 녹음을 기준으로 아래 평정을 입력합니다.",
  },
  {
    key: "free_speech",
    title: "자유발화",
    target: "오늘 있었던 일을 30초 정도 이야기해 주세요.",
    hint: "생각나는 내용을 자연스럽게 말하기",
    kind: "READ",
    guide: "내용의 좋고 나쁨을 평가하지 않고 홈 트레이닝 수행 이력과 비진단 음성지표만 참고합니다.",
  },
  {
    key: "dialogue_scenario",
    title: "대화 시나리오 과제",
    target: "병원 접수처에서 이름과 예약 시간을 말하는 상황을 연습해 주세요.",
    hint: "보호자가 접수 직원 역할로 짧게 질문하기",
    kind: "READ",
    guide: "보호자 관찰 데이터와 함께 치료사 검수에서 확인합니다.",
  },
];

export type BatteryResult = {
  key: string;
  title: string;
  kind: VoiceMetrics["kind"];
  metrics: VoiceMetrics | null; // null = 건너뜀
  audioPath?: string | null;
};

export function parseBatteryResults(json: string): BatteryResult[] {
  try {
    return JSON.parse(json) as BatteryResult[];
  } catch {
    return [];
  }
}

/** 배터리 핵심 지표 요약 (추이 비교용) */
export function batteryKeyIndicators(results: BatteryResult[]) {
  const get = (key: string) => results.find((r) => r.key === key)?.metrics ?? null;
  const mpt = get("mpt");
  const pa = get("amr_pa");
  const smr = get("smr");
  const para = get("paragraph");
  return {
    mptSec: mpt ? mpt.maxRunSec : null,
    paRate: pa ? pa.rate : null,
    smrRate: smr ? smr.rate : null,
    paraPauses: para ? para.pauses : null,
    paraEndDelta: para ? para.endDeltaDb : null,
  };
}
