export type KoreanClinicalReference = {
  id: string;
  taskType: "vowel" | "amr" | "smr" | "reading" | "spontaneous";
  ageMin: number;
  ageMax: number;
  sex: "male" | "female" | "all";
  diagnosisGroup: string;
  metricName: string;
  mean: number | null;
  standardDeviation: number | null;
  lowerReference: number | null;
  upperReference: number | null;
  measurementProtocol: string;
  sourceTitle: string;
  sourceYear: number;
  verificationStatus: "draft" | "expert-reviewed" | "approved";
  reviewer: string | null;
};

export const KOREAN_CLINICAL_REFERENCE_VERSION = "kr-clinical-reference-draft-v0";

export const KOREAN_CLINICAL_REFERENCES: KoreanClinicalReference[] = [];
