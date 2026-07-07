export type HomeTrainingMemo = {
  speechCondition?: number | null;
  tiredAfterSpeaking?: string | null;
  caregiverMemo?: string | null;
  source?: "record-submit" | "portal-observation";
};

export type ReviewMeta = {
  aiReference?: {
    sttText: string;
    mismatches: string[];
    source: string;
  };
  errorReviews?: {
    candidate: string;
    errorType: string;
    action: "confirm" | "modify" | "delete";
  }[];
  therapistMemo?: string | null;
  nextTask?: {
    recommended: boolean;
    assigned: boolean;
    note: string | null;
  };
};

const ACTIONS = new Set(["confirm", "modify", "delete"]);

export function parseReviewMeta(json: string | null): ReviewMeta | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ReviewMeta;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function normalizeReviewAction(value: string): "confirm" | "modify" | "delete" {
  return ACTIONS.has(value) ? (value as "confirm" | "modify" | "delete") : "confirm";
}

export function parseObservationMemo(memo: string | null): HomeTrainingMemo {
  if (!memo) return {};
  try {
    const parsed = JSON.parse(memo) as HomeTrainingMemo;
    return parsed && typeof parsed === "object" ? parsed : { caregiverMemo: memo };
  } catch {
    return { caregiverMemo: memo };
  }
}

export function buildObservationMemo(input: HomeTrainingMemo): string | null {
  const clean: HomeTrainingMemo = {};
  if (input.speechCondition !== undefined && input.speechCondition !== null) {
    clean.speechCondition = input.speechCondition;
  }
  if (input.tiredAfterSpeaking) clean.tiredAfterSpeaking = input.tiredAfterSpeaking;
  if (input.caregiverMemo) clean.caregiverMemo = input.caregiverMemo;
  if (input.source) clean.source = input.source;
  return Object.keys(clean).length > 0 ? JSON.stringify(clean) : null;
}

export function avgNumber(values: (number | null | undefined)[]) {
  const nums = values.filter((v): v is number => typeof v === "number");
  return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
}
