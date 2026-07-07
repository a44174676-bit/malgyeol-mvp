// 한국어 음운 분석 엔진 — 자모 분해 기반 조음 오류 자동 분류
// 표기 전사 기반의 근사 분석이며, 최종 판단은 치료사가 합니다.

const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

export type Syllable = { cho: string; jung: string; jong: string };

export function decompose(text: string): Syllable[] {
  const out: Syllable[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      out.push({
        cho: CHO[Math.floor(idx / 588)],
        jung: JUNG[Math.floor((idx % 588) / 28)],
        jong: JONG[idx % 28],
      });
    }
  }
  return out;
}

const MANNER: Record<string, string> = {
  ㄱ: "파열", ㄲ: "파열", ㅋ: "파열", ㄷ: "파열", ㄸ: "파열", ㅌ: "파열",
  ㅂ: "파열", ㅃ: "파열", ㅍ: "파열",
  ㅅ: "마찰", ㅆ: "마찰", ㅎ: "마찰",
  ㅈ: "파찰", ㅉ: "파찰", ㅊ: "파찰",
  ㄴ: "비음", ㅁ: "비음", ㅇ: "비음",
  ㄹ: "유음",
};

const PLACE: Record<string, string> = {
  ㅂ: "양순", ㅃ: "양순", ㅍ: "양순", ㅁ: "양순",
  ㄷ: "치조", ㄸ: "치조", ㅌ: "치조", ㄴ: "치조", ㄹ: "치조", ㅅ: "치조", ㅆ: "치조",
  ㅈ: "경구개", ㅉ: "경구개", ㅊ: "경구개",
  ㄱ: "연구개", ㄲ: "연구개", ㅋ: "연구개", ㅇ: "연구개",
  ㅎ: "성문",
};

/** 대치 오류의 음운변동 분류 */
export function classifySubstitution(t: string, r: string): string {
  const tm = MANNER[t], rm = MANNER[r];
  const tp = PLACE[t], rp = PLACE[r];
  if (!tm || !rm) return "기타 대치";

  if (tm !== rm) {
    if ((tm === "마찰" || tm === "파찰") && rm === "파열") return "파열음화";
    if (tm === "마찰" && rm === "파찰") return "파찰음화";
    if ((tm === "파열" || tm === "파찰") && rm === "마찰") return "마찰음화";
    if (tm === "유음") return "유음 오류";
    if (tm === "비음" && rm !== "비음") return "탈비음화";
    if (rm === "비음") return "비음화";
    return `${tm}음의 ${rm}음 대치`;
  }
  if (tp !== rp) {
    if (tp === "연구개" && (rp === "치조" || rp === "양순" || rp === "경구개"))
      return "연구개음 전방화";
    if ((tp === "치조" || tp === "양순" || tp === "경구개") && rp === "연구개")
      return "연구개음화(후방화)";
    if (tp === "경구개" && rp === "치조") return "경구개음 전방화";
    if (tp === "치조" && rp === "경구개") return "경구개음화";
    return "조음위치 대치";
  }
  // 조음위치·방법 동일 → 발성유형 오류
  if ("ㄲㄸㅃㅆㅉ".includes(r)) return "긴장음화(경음화)";
  if ("ㅋㅌㅍㅊ".includes(r)) return "기식음화(격음화)";
  if ("ㄱㄷㅂㅅㅈ".includes(r)) return "이완음화(평음화)";
  return "기타 대치";
}

export type ArtError = {
  word: string;
  position: "어두초성" | "어중초성" | "종성";
  target: string;
  response: string; // "∅" = 생략
  type: "생략" | "대치" | "첨가" | "왜곡";
  pattern: string;
};

/** 검사 문항 — distorted: 치료사가 왜곡으로 판정한 자음 위치 */
export type TestItem = {
  word: string;
  response: string;
  distorted?: { syl: number; part: "cho" | "jong" }[];
  audioPath?: string | null;
};

export type PositionStat = { total: number; correct: number };

export type ArtResult = {
  totalConsonants: number;
  correctConsonants: number;
  pcc: number; // 자음정확도 %
  totalVowels: number;
  correctVowels: number;
  pvc: number; // 모음정확도 %
  errors: ArtError[];
  patternCounts: { pattern: string; count: number }[];
  positionStats: Record<string, PositionStat>;
  noResponseWords: string[];
  summary: string;
};

export function analyzeTest(items: TestItem[]): ArtResult {
  let totalC = 0, correctC = 0, totalV = 0, correctV = 0;
  const errors: ArtError[] = [];
  const positionStats: Record<string, PositionStat> = {
    어두초성: { total: 0, correct: 0 },
    어중초성: { total: 0, correct: 0 },
    종성: { total: 0, correct: 0 },
  };
  const noResponseWords: string[] = [];

  for (const item of items) {
    const tSyls = decompose(item.word);
    const rSyls = decompose(item.response);
    const noResponse = rSyls.length === 0;
    if (noResponse) noResponseWords.push(item.word);
    const distSet = new Set(
      (item.distorted ?? []).map((d) => `${d.syl}:${d.part}`)
    );

    for (let i = 0; i < tSyls.length; i++) {
      const t = tSyls[i];
      const r = rSyls[i]; // 음절 수 부족 시 undefined → 생략 처리

      // 초성 (ㅇ은 무음가 자리표시)
      if (t.cho !== "ㅇ") {
        const pos = i === 0 ? "어두초성" : "어중초성";
        totalC++;
        positionStats[pos].total++;
        const rCho = r?.cho;
        if (distSet.has(`${i}:cho`)) {
          errors.push({ word: item.word, position: pos, target: t.cho, response: "왜곡", type: "왜곡", pattern: "왜곡" });
        } else if (rCho === t.cho) {
          correctC++;
          positionStats[pos].correct++;
        } else if (!rCho || rCho === "ㅇ") {
          errors.push({ word: item.word, position: pos, target: t.cho, response: "∅", type: "생략", pattern: `${pos} 생략` });
        } else {
          errors.push({ word: item.word, position: pos, target: t.cho, response: rCho, type: "대치", pattern: classifySubstitution(t.cho, rCho) });
        }
      } else if (r && r.cho !== "ㅇ") {
        errors.push({ word: item.word, position: i === 0 ? "어두초성" : "어중초성", target: "∅", response: r.cho, type: "첨가", pattern: "자음 첨가" });
      }

      // 종성
      if (t.jong !== "") {
        totalC++;
        positionStats["종성"].total++;
        const rJong = r?.jong ?? "";
        if (distSet.has(`${i}:jong`)) {
          errors.push({ word: item.word, position: "종성", target: t.jong, response: "왜곡", type: "왜곡", pattern: "왜곡" });
        } else if (rJong === t.jong) {
          correctC++;
          positionStats["종성"].correct++;
        } else if (rJong === "") {
          errors.push({ word: item.word, position: "종성", target: t.jong, response: "∅", type: "생략", pattern: "종성 생략" });
        } else {
          errors.push({ word: item.word, position: "종성", target: t.jong, response: rJong, type: "대치", pattern: classifySubstitution(t.jong, rJong) });
        }
      } else if (r && r.jong !== "") {
        errors.push({ word: item.word, position: "종성", target: "∅", response: r.jong, type: "첨가", pattern: "종성 첨가" });
      }

      // 모음
      totalV++;
      if (r && r.jung === t.jung) correctV++;
    }
  }

  const patternMap = new Map<string, number>();
  for (const e of errors) {
    patternMap.set(e.pattern, (patternMap.get(e.pattern) ?? 0) + 1);
  }
  const patternCounts = [...patternMap.entries()]
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);

  const pcc = totalC ? Math.round((correctC / totalC) * 1000) / 10 : 0;
  const pvc = totalV ? Math.round((correctV / totalV) * 1000) / 10 : 0;

  const result: ArtResult = {
    totalConsonants: totalC,
    correctConsonants: correctC,
    pcc,
    totalVowels: totalV,
    correctVowels: correctV,
    pvc,
    errors,
    patternCounts,
    positionStats,
    noResponseWords,
    summary: "",
  };
  result.summary = buildRuleSummary(result);
  return result;
}

/** 규칙 기반 자동 요약 (AI 미사용 시에도 제공) */
export function buildRuleSummary(r: ArtResult): string {
  const lines: string[] = [];
  lines.push(
    `자음정확도(PCC) ${r.pcc}% (${r.correctConsonants}/${r.totalConsonants}), 모음정확도 ${r.pvc}%.`
  );
  const pos = Object.entries(r.positionStats)
    .filter(([, s]) => s.total > 0)
    .map(([name, s]) => `${name} ${Math.round((s.correct / s.total) * 100)}%`)
    .join(", ");
  lines.push(`위치별 정확도: ${pos}.`);
  if (r.patternCounts.length > 0) {
    const top = r.patternCounts.slice(0, 3);
    const totalErr = r.errors.length;
    lines.push(
      `주요 오류 패턴: ${top
        .map((p) => `${p.pattern} ${p.count}회(${Math.round((p.count / totalErr) * 100)}%)`)
        .join(", ")}.`
    );
    lines.push(
      `빈도와 발달적 중요도를 고려할 때 '${top[0].pattern}' 감소를 우선 목표로 검토할 수 있습니다.`
    );
  } else {
    lines.push("뚜렷한 오류 패턴이 관찰되지 않았습니다.");
  }
  if (r.noResponseWords.length > 0) {
    lines.push(`무반응 낱말 ${r.noResponseWords.length}개: ${r.noResponseWords.join(", ")}.`);
  }
  return lines.join(" ");
}
