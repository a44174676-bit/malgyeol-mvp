import OpenAI from "openai";
import { NextResponse } from "next/server";

const MODEL = "gpt-4o-transcribe";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
]);

type SpeechAnalysisResponse = {
  success: true;
  provider: "openai";
  model: string;
  transcript: string;
  taskId: string;
  taskType: string;
  expectedText: string | null;
  comparison: {
    normalizedExpectedText: string | null;
    normalizedTranscript: string;
    matchedTokenCount: number | null;
    expectedTokenCount: number | null;
    omittedTokens: string[];
    addedTokens: string[];
    referenceMatchPercent: number | null;
  };
  notices: string[];
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function transcriptionPrompt(taskId: string, taskType: string, expectedText: string) {
  if (taskId === "vowel") {
    return "한국어 음성 연습 녹음입니다. 사용자는 모음 '아'를 가능한 길게 발성합니다. 들리는 발화만 전사하고 추측하지 마세요.";
  }
  if (taskId === "amr") {
    return "한국어 구강운동 연습입니다. 사용자는 '퍼퍼퍼', '터터터', '커커커' 중 하나를 반복합니다. 들리는 반복 음절을 순서대로 전사하세요.";
  }
  if (taskId === "smr") {
    return "한국어 구강운동 연습입니다. 사용자는 '퍼터커'를 반복합니다. 들리는 음절 순서를 그대로 전사하세요.";
  }
  if (taskId === "reading") {
    return [
      "한국어 단어 또는 문장 읽기 녹음입니다.",
      `제시문: ${expectedText}`,
      "제시문을 그대로 복사하지 말고 실제로 들리는 말만 전사하세요.",
    ].join("\n");
  }
  if (taskId === "spontaneous") {
    return "화자가 그림 또는 상황을 자유롭게 설명합니다. 들리는 말만 한국어로 전사하세요.";
  }
  return `한국어 음성 과제 녹음입니다. 과제 유형: ${taskType}. 들리는 말만 전사하세요.`;
}

function normalizeForReference(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.,!?;:"'`~()[\]{}<>，。！？、]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return Array.from(normalizeForReference(text).replace(/\s/g, ""));
}

function compareExpected(expectedText: string | null, transcript: string, shouldCompare: boolean) {
  const normalizedTranscript = normalizeForReference(transcript);
  if (!shouldCompare || !expectedText) {
    return {
      normalizedExpectedText: expectedText ? normalizeForReference(expectedText) : null,
      normalizedTranscript,
      matchedTokenCount: null,
      expectedTokenCount: null,
      omittedTokens: [],
      addedTokens: [],
      referenceMatchPercent: null,
    };
  }

  const expectedTokens = tokenize(expectedText);
  const transcriptTokens = tokenize(transcript);
  const usedTranscript = new Set<number>();
  const omittedTokens: string[] = [];
  let matchedTokenCount = 0;

  for (const token of expectedTokens) {
    const matchIndex = transcriptTokens.findIndex(
      (candidate, index) => candidate === token && !usedTranscript.has(index),
    );
    if (matchIndex === -1) {
      omittedTokens.push(token);
    } else {
      usedTranscript.add(matchIndex);
      matchedTokenCount += 1;
    }
  }

  const addedTokens = transcriptTokens.filter((_, index) => !usedTranscript.has(index));
  const referenceMatchPercent = expectedTokens.length
    ? Math.round((matchedTokenCount / expectedTokens.length) * 100)
    : null;

  return {
    normalizedExpectedText: normalizeForReference(expectedText),
    normalizedTranscript,
    matchedTokenCount,
    expectedTokenCount: expectedTokens.length,
    omittedTokens,
    addedTokens,
    referenceMatchPercent,
  };
}

function safeOpenAIError(error: unknown) {
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status?: unknown }).status)
    : null;
  if (status === 401 || status === 403) return { message: "API 인증을 확인해 주세요.", status: 502 };
  if (status === 429) return { message: "API 사용량 또는 결제 상태를 확인해 주세요.", status: 502 };
  if (status && status >= 500) return { message: "API 응답이 지연되거나 실패했습니다. 잠시 후 다시 시도해 주세요.", status: 502 };
  return { message: "음성 인식 요청을 처리하지 못했습니다.", status: 502 };
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("요청 형식이 올바르지 않습니다.", 400);
  }
  const consent = cleanText(form.get("consent"));
  if (consent !== "true") {
    return jsonError("AI 분석 전송 동의가 필요합니다.", 400);
  }

  const audio = form.get("audio");
  const taskId = cleanText(form.get("taskId"));
  const taskType = cleanText(form.get("taskType"));
  const expectedTextValue = cleanText(form.get("expectedText"));
  const expectedText = expectedTextValue || null;

  if (!(audio instanceof File)) {
    return jsonError("녹음 파일이 없습니다.", 400);
  }
  if (!taskId || !taskType) {
    return jsonError("과제 정보가 없습니다.", 400);
  }
  if (audio.size === 0) {
    return jsonError("녹음 데이터가 없습니다.", 400);
  }
  if (audio.size > MAX_BYTES) {
    return jsonError("녹음 파일이 10MB를 초과했습니다.", 413);
  }
  if (!ALLOWED_TYPES.has(audio.type)) {
    return jsonError("지원하지 않는 녹음 파일 형식입니다.", 415);
  }
  if (!process.env.OPENAI_API_KEY) {
    return jsonError("서버에 AI API 키가 설정되어 있지 않습니다.", 503);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: MODEL,
      response_format: "json",
      prompt: transcriptionPrompt(taskId, taskType, expectedTextValue),
    });
    const transcript = transcription.text?.trim() ?? "";
    if (!transcript) {
      return jsonError("음성 인식 결과가 비어 있습니다.", 502);
    }

    const response: SpeechAnalysisResponse = {
      success: true,
      provider: "openai",
      model: MODEL,
      transcript,
      taskId,
      taskType,
      expectedText,
      comparison: compareExpected(expectedText, transcript, taskId === "reading"),
      notices: [
        "AI 음성인식 결과는 들린 말을 텍스트로 옮긴 참고 자료입니다.",
        "제시문 참고 일치율은 문장 읽기 과제에서만 단순 문자 비교로 계산됩니다.",
        "녹음 파일은 이 데모 API route에서 별도로 저장하지 않습니다.",
        "개인정보 처리방침 확인이 필요한 외부 API 전송 TODO가 남아 있습니다.",
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    const safeError = safeOpenAIError(error);
    return jsonError(safeError.message, safeError.status);
  }
}
