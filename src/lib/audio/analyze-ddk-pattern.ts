export type DdkPatternAnalysis = {
  status: "ready" | "needs-review" | "not-applicable" | "error";
  reason: string;
  peakCount: number;
  syllableCounts: Record<string, number>;
  syllablesPerTotalSecond: number | null;
  syllablesPerVoicedSecond: number | null;
  meanIntervalSecond: number | null;
  intervalStandardDeviationSecond: number | null;
  intervalCoefficientOfVariation: number | null;
  lateSpeedChangePercent: number | null;
};

export function mean(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]) {
  const average = mean(values);

  if (average === null || values.length < 2) {
    return null;
  }

  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function analyzeDdkPattern({
  taskId,
  peaks,
  totalDurationSecond,
  voicedDurationSecond,
  targetSyllables,
}: {
  taskId: string;
  peaks: number[];
  totalDurationSecond: number;
  voicedDurationSecond: number;
  targetSyllables: string[];
}): DdkPatternAnalysis {
  const intervals = peaks.slice(1).map((peak, index) => peak - peaks[index]);
  const meanIntervalSecond = mean(intervals);
  const intervalStandardDeviationSecond = standardDeviation(intervals);
  const intervalCoefficientOfVariation =
    meanIntervalSecond && intervalStandardDeviationSecond !== null
      ? intervalStandardDeviationSecond / meanIntervalSecond
      : null;
  const midpoint = totalDurationSecond / 2;
  const firstHalfPeaks = peaks.filter((peak) => peak < midpoint).length;
  const secondHalfPeaks = peaks.filter((peak) => peak >= midpoint).length;
  const firstHalfRate = midpoint > 0 ? firstHalfPeaks / midpoint : null;
  const secondHalfRate = midpoint > 0 ? secondHalfPeaks / Math.max(0.001, totalDurationSecond - midpoint) : null;
  const lateSpeedChangePercent =
    firstHalfRate && secondHalfRate !== null ? ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100 : null;
  const isSyllableTask = taskId === "amr" || taskId === "smr";
  const hasUsableSegmentation =
    isSyllableTask &&
    peaks.length >= 6 &&
    intervals.length >= 5 &&
    intervalCoefficientOfVariation !== null &&
    intervalCoefficientOfVariation <= 0.55;

  return {
    status: isSyllableTask ? (hasUsableSegmentation ? "ready" : "needs-review") : "not-applicable",
    reason: isSyllableTask
      ? hasUsableSegmentation
        ? "원음 에너지 피크 후보를 참고 지표로 표시합니다."
        : "자동 분절 확인 필요"
      : "음절 반복 과제가 아니므로 AMR/SMR 자동 분절 후보를 표시하지 않습니다.",
    peakCount: peaks.length,
    syllableCounts:
      isSyllableTask && targetSyllables.length > 0
        ? Object.fromEntries(
            targetSyllables.map((target, index) => [
              target,
              Math.floor((peaks.length + targetSyllables.length - 1 - index) / targetSyllables.length),
            ]),
          )
        : {},
    syllablesPerTotalSecond: hasUsableSegmentation && totalDurationSecond > 0 ? peaks.length / totalDurationSecond : null,
    syllablesPerVoicedSecond: hasUsableSegmentation && voicedDurationSecond > 0 ? peaks.length / voicedDurationSecond : null,
    meanIntervalSecond: hasUsableSegmentation ? meanIntervalSecond : null,
    intervalStandardDeviationSecond: hasUsableSegmentation ? intervalStandardDeviationSecond : null,
    intervalCoefficientOfVariation: hasUsableSegmentation ? intervalCoefficientOfVariation : null,
    lateSpeedChangePercent: hasUsableSegmentation ? lateSpeedChangePercent : null,
  };
}
