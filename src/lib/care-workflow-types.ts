export type AcousticMetrics = {
  totalDurationSecond: number;
  voicedDurationSecond: number;
  silenceRatioPercent: number;
  midSilenceCount: number;
  loudnessVariationDb: number | null;
  distortionPossible: boolean;
  segmentation: {
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
};

export type SpeechComparisonResult = {
  normalizedExpectedText: string | null;
  normalizedTranscript: string;
  matchedTokenCount: number | null;
  expectedTokenCount: number | null;
  omittedTokens: string[];
  addedTokens: string[];
  referenceMatchPercent: number | null;
};

export type AutoAnalysisPayload = {
  transcript: string | null;
  comparison: SpeechComparisonResult | null;
  acousticMetrics: AcousticMetrics | null;
  task: {
    taskType: "VOWEL" | "AMR" | "SMR" | "WORD" | "SENTENCE" | "PARAGRAPH" | "SPONTANEOUS" | "SCENARIO" | "OTHER";
    targetText: string | null;
  };
  model: {
    provider: "openai" | "browser" | "manual" | "unknown";
    name: string | null;
    version: string | null;
  };
  notices: string[];
};

export type ExpertReviewInput = {
  revisedTranscript: string | null;
  correctedRepetitionCount: number | null;
  validity: "NOT_REVIEWED" | "VALID" | "LIMITED" | "INVALID";
  resubmissionRequested: boolean;
  internalMemo: string | null;
  patientVisibleComment: string | null;
  reviewedReferenceVersion: string | null;
};

export type CaregiverObservationPayload = {
  fatigueLevel: number | null;
  selfIntelligibilityRating: number | null;
  caregiverIntelligibilityRating: number | null;
  repeatedQuestionFrequency: string | null;
  phoneCallDifficulty: string | null;
  coughOrSwallowingNote: string | null;
  memo: string | null;
};
