import type { KoreanClinicalReference } from "@/lib/korean-clinical-reference";

export type ClinicalTaskType = "vowel" | "amr" | "smr" | "reading" | "spontaneous";

export type SpeechAnalysisForReference = {
  transcript: string;
  comparison: {
    omittedTokens: string[];
    addedTokens: string[];
  };
} | null;

export type TranscriptSummary = {
  transcript: string;
  counts: Record<string, number>;
  recognizedTargets: string[];
  targetStatus: string;
  repetitionText: string;
  orderStatus: string;
};

function countOccurrences(text: string, token: string) {
  if (!token) {
    return 0;
  }

  return text.split(token).length - 1;
}

export function getTargetSyllables(taskId: ClinicalTaskType) {
  if (taskId === "amr" || taskId === "smr") {
    return ["퍼", "터", "커"];
  }

  if (taskId === "vowel") {
    return ["아"];
  }

  return [];
}

export function getTranscriptSummary(result: SpeechAnalysisForReference, taskId: ClinicalTaskType): TranscriptSummary {
  const transcript = result?.transcript.trim() ?? "";
  const targets = getTargetSyllables(taskId);
  const counts = Object.fromEntries(targets.map((target) => [target, countOccurrences(transcript, target)]));
  const recognizedTargets = targets.filter((target) => (counts[target] ?? 0) > 0);
  const normalizedTranscript = transcript.replace(/\s+/g, "");
  const sequenceRecognized =
    taskId === "smr"
      ? normalizedTranscript.includes("퍼터커")
      : targets.length > 0 && recognizedTargets.length === targets.length;

  return {
    transcript,
    counts,
    recognizedTargets,
    targetStatus: targets.length
      ? targets.map((target) => `${target} ${recognizedTargets.includes(target) ? "확인" : "미확인"}`).join(" · ")
      : "제시 음절 과제가 아닌 항목입니다.",
    repetitionText: targets.length
      ? targets.map((target) => `${target} ${counts[target] ?? 0}회`).join(" · ")
      : "AI 전사 기준 반복 횟수 산정 대상이 아닙니다.",
    orderStatus: targets.length
      ? sequenceRecognized
        ? "AI 전사에서 제시 음절 흐름이 확인되었습니다."
        : "AI 전사만으로 제시 음절 순서를 확정하기 어렵습니다."
      : "순서 인식 대상 과제가 아닙니다.",
  };
}

export function buildReferenceNote({
  aiAnalysisReady,
  taskId,
  transcriptSummary,
}: {
  aiAnalysisReady: boolean;
  taskId: ClinicalTaskType;
  transcriptSummary: TranscriptSummary;
}) {
  if (aiAnalysisReady && transcriptSummary.recognizedTargets.length > 0) {
    return `제시된 ${getTargetSyllables(taskId).join("·")} 과제가 AI 전사에서 ${transcriptSummary.recognizedTargets.length}개 확인되었습니다. 현재 녹음은 자동 측정값을 참고의견 형식으로 정리한 단계이며, 연령별 참고범위와 직접 비교하려면 승인된 국내 기준표와 전문가 청취 검수가 필요합니다. 속도·규칙성 평가는 원음 자동분절과 전문가 확인을 함께 검토해야 합니다.`;
  }

  return "AI 전사와 원음 파형을 함께 검토하기 전 단계입니다. 현재 화면은 자동 정리 자료이며, 전문가 확인 전에는 검사 해석이나 판정으로 사용할 수 없습니다.";
}

export function getSelectedReferenceLabel({
  version,
  references,
}: {
  version: string;
  references: KoreanClinicalReference[];
}) {
  return references.length > 0
    ? `${version} (${references.length}개 기준)`
    : `${version} (전문가 승인 기준값 미등록)`;
}
