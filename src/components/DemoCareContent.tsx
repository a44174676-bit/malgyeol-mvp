"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DemoShell } from "@/components/DemoShell";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { analyzeRecordingBlob, type AcousticAnalysis } from "@/lib/audio/analyze-audio-signal";
import {
  buildReferenceNote,
  getSelectedReferenceLabel,
  getTranscriptSummary,
} from "@/lib/clinical/build-reference-note";
import {
  KOREAN_CLINICAL_REFERENCE_VERSION,
  KOREAN_CLINICAL_REFERENCES,
} from "@/lib/korean-clinical-reference";

const TOP_NOTICE =
  "이 데모는 실제 저장되지 않는 공개 베타 미리보기입니다. 실제 환자 정보, 실제 검사 결과, 실제 음성파일은 저장하지 않습니다.";
const AUTOMATIC_RESULT_NOTICE =
  "이 결과는 국내 임상평가 항목을 참고해 자동 정리한 전문가 검수 전 자료입니다. 의료 진단, 장애 정도 또는 치료 효과 판정을 의미하지 않습니다.";

const tasks = [
  {
    id: "vowel",
    title: "모음 연장 발성",
    guide: "“아—”를 가능한 길게 발성해 주세요.",
    metrics: ["발화 지속시간", "음성 안정성 참고값"],
    prompt: "아—",
    voiceGuide: "아 소리를 가능한 길게 내 주세요.",
    icon: "👄",
    iconLabel: "입 모양 또는 발성 아이콘 placeholder",
  },
  {
    id: "amr",
    title: "교대운동속도 AMR",
    guide: "“퍼퍼퍼”, “터터터”, “커커커” 중 하나를 반복해 주세요.",
    metrics: ["반복 횟수", "초당 반복수", "규칙성 참고값"],
    prompt: "퍼퍼퍼 / 터터터 / 커커커",
    voiceGuide: "퍼퍼퍼, 터터터, 커커커 중 하나를 골라 반복해 주세요.",
    icon: "🗣️",
    iconLabel: "입술과 혀 움직임 아이콘 placeholder",
  },
  {
    id: "smr",
    title: "일련운동속도 SMR",
    guide: "“퍼터커 퍼터커”를 반복해 주세요.",
    metrics: ["반복 횟수", "초당 반복수", "끊김 참고값"],
    prompt: "퍼터커 퍼터커",
    voiceGuide: "퍼, 터, 커 순서로 이어서 반복해 주세요.",
    icon: "🔁",
    iconLabel: "3단계 소리 순서 placeholder",
    soundSteps: ["퍼", "터", "커"],
  },
  {
    id: "reading",
    title: "단어·문장 읽기",
    guide: "화면에 제시된 단어와 짧은 문장을 읽어 주세요.",
    metrics: ["말속도", "무음구간", "불일치 후보"],
    prompt: "바다, 전화, 학교, 병원, 물, 밥, 엄마, 버스",
    voiceGuide: "화면의 단어 또는 그림 카드를 보고 천천히 말해 주세요.",
    icon: "📖",
    iconLabel: "읽기 과제 아이콘 placeholder",
    words: ["바다", "전화", "학교", "병원", "물", "밥", "엄마", "버스"],
    sentences: [
      "오늘은 천천히 문장을 읽습니다.",
      "병원에 다녀왔습니다.",
      "물을 마시고 싶습니다.",
    ],
    pictureCards: [
      ["물 컵", "🥤"],
      ["전화기", "☎️"],
      ["병원", "🏥"],
      ["버스", "🚌"],
      ["밥그릇", "🍚"],
    ],
  },
  {
    id: "spontaneous",
    title: "자발화·상황 설명",
    guide: "그림을 보고 무슨 일이 일어나고 있는지 자유롭게 설명해 주세요.",
    metrics: ["발화 길이", "말속도", "멈춤 구간", "보호자 관찰 메모"],
    prompt: "그림 기반 설명 과제",
    voiceGuide: "그림을 보고 무슨 일이 일어나고 있는지 자유롭게 설명해 주세요.",
    icon: "🖼️",
    iconLabel: "상황 그림 placeholder",
    situationCards: [
      ["아이가 물을 마시는 장면", "🧒🥤"],
      ["사람이 병원 접수대에 있는 장면", "🧍🏥"],
      ["가족이 식사하는 장면", "👨‍👩‍👧🍚"],
      ["버스를 기다리는 장면", "🚏🚌"],
    ],
  },
] as const;

type TaskId = (typeof tasks)[number]["id"];
type PromptMode = "text" | "picture";
type AiAnalysisStatus = "idle" | "uploading" | "success" | "error";
type AcousticAnalysisStatus = "idle" | "analyzing" | "ready" | "error";
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

const therapistFields = [
  "적용 기준 선택",
  "자동 음절 분절 확인",
  "반복 횟수 수정",
  "말명료도 관찰",
  "리듬 규칙성 관찰",
  "조음 붕괴 여부",
  "검사 유효성",
  "최종 참고의견",
  "전문가 승인",
];

function createEmptyExpertReviewValues() {
  return Object.fromEntries(therapistFields.map((field) => [field, ""]));
}

const homeTrainingCandidates = [
  "모음 연장 발성 3회",
  "짧은 문장 천천히 읽기 5문장",
  "보호자와 하루 1회 상황 설명 연습",
  "녹음 후 보호자 관찰 메모 입력",
];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatSeconds(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "자동 분절 확인 필요";
  }

  return `${value.toFixed(2)}초`;
}

function formatRate(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "자동 분절 확인 필요";
  }

  return `${value.toFixed(2)}음절/초`;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "자동 분절 확인 필요";
  }

  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) {
    return "자동 분절 확인 필요";
  }

  return `${value.toFixed(2)}${suffix}`;
}

export function DemoCareContent() {
  return (
    <DemoShell>
      <DemoCareBody />
    </DemoShell>
  );
}


function DemoCareBody() {
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId>("vowel");
  const [promptMode, setPromptMode] = useState<PromptMode>("text");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aiConsent, setAiConsent] = useState(false);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<AiAnalysisStatus>("idle");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<SpeechAnalysisResponse | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState("");
  const [acousticAnalysisStatus, setAcousticAnalysisStatus] = useState<AcousticAnalysisStatus>("idle");
  const [acousticAnalysis, setAcousticAnalysis] = useState<AcousticAnalysis | null>(null);
  const [acousticAnalysisError, setAcousticAnalysisError] = useState("");
  const [expertReviewValues, setExpertReviewValues] = useState<Record<string, string>>(() => createEmptyExpertReviewValues());
  const [distributionStatus, setDistributionStatus] = useState<"draft" | "approved" | "edited" | "distributed">("draft");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const dataAvailableCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const acousticAnalysisRequestRef = useRef(0);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId],
  );
  const hasRecording = playbackReady && Boolean(audioUrl) && Boolean(recordedBlob);
  const canRequestAiAnalysis = Boolean(recordedBlob) && playbackReady && aiConsent && aiAnalysisStatus !== "uploading";
  const transcriptSummary = useMemo(
    () => getTranscriptSummary(aiAnalysisResult, selectedTaskId),
    [aiAnalysisResult, selectedTaskId],
  );

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !audioUrl) {
      return;
    }

    setPlaybackReady(false);
    audio.pause();
    audio.currentTime = 0;
    audio.load();

    const handleLoadedMetadata = () => {
      console.log("[Malgyeol] audio metadata loaded", {
        duration: audio.duration,
        readyState: audio.readyState,
      });
      stopStream();
    };

    const handleCanPlay = () => {
      console.log("[Malgyeol] audio can play");
      setPlaybackReady(true);
      stopStream();
    };

    const handleError = () => {
      console.error("[Malgyeol] audio playback error", audio.error);
      setPlaybackReady(false);
      setErrorMessage("녹음 파일을 재생할 수 없습니다. 브라우저가 이 오디오 형식을 지원하는지 확인한 뒤 다시 녹음해 주세요.");
      stopStream();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function runAcousticAnalysis(blob: Blob, taskId: TaskId) {
    const requestId = acousticAnalysisRequestRef.current + 1;
    acousticAnalysisRequestRef.current = requestId;
    setAcousticAnalysisStatus("analyzing");
    setAcousticAnalysis(null);
    setAcousticAnalysisError("");

    void analyzeRecordingBlob(blob, taskId)
      .then((analysis) => {
        if (acousticAnalysisRequestRef.current !== requestId) {
          return;
        }

        setAcousticAnalysis(analysis);
        setAcousticAnalysisStatus("ready");
      })
      .catch((error: unknown) => {
        if (acousticAnalysisRequestRef.current !== requestId) {
          return;
        }

        console.error("[Malgyeol] acoustic analysis failed", error);
        setAcousticAnalysis(null);
        setAcousticAnalysisStatus("error");
        setAcousticAnalysisError("브라우저에서 원음 파형을 해석하지 못했습니다. 임상 전문가 청취 검수가 필요합니다.");
      });
  }

  function resetDerivedResults() {
    acousticAnalysisRequestRef.current += 1;
    setAiConsent(false);
    setAiAnalysisStatus("idle");
    setAiAnalysisResult(null);
    setAiAnalysisError("");
    setAcousticAnalysisStatus("idle");
    setAcousticAnalysis(null);
    setAcousticAnalysisError("");
    setExpertReviewValues(createEmptyExpertReviewValues());
    setDistributionStatus("draft");
  }

  function resetRecording(nextTaskId?: TaskId) {
    stopTimer();
    stopStream();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    dataAvailableCountRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current.currentTime = 0;
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setPlaybackReady(false);
    setElapsedSeconds(0);
    setIsRecording(false);
    setErrorMessage("");
    resetDerivedResults();
    if (nextTaskId) setSelectedTaskId(nextTaskId);
  }

  function getSupportedMimeType() {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
    ];
    return candidates.find((type) => window.MediaRecorder.isTypeSupported(type));
  }

  async function startRecording() {
    if (typeof window === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setErrorMessage("현재 브라우저에서는 녹음 기능을 지원하지 않습니다. Chrome 또는 Edge 최신 버전에서 다시 시도해 주세요.");
      return;
    }

    try {
      setErrorMessage("");
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      setRecordedBlob(null);
      setAudioUrl(null);
      setPlaybackReady(false);
      chunksRef.current = [];
      dataAvailableCountRef.current = 0;
      setElapsedSeconds(0);
      resetDerivedResults();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("mic stream acquired");
      console.log("[Malgyeol] microphone stream created");
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      console.log("[Malgyeol] selected recorder mime type:", mimeType ?? "browser default");
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      console.log("[Malgyeol] recorder state:", recorder.state);
      recorder.ondataavailable = (event) => {
        dataAvailableCountRef.current += 1;
        console.log("dataavailable", event.data.size);
        console.log("[Malgyeol] dataavailable", {
          count: dataAvailableCountRef.current,
          size: event.data.size,
          type: event.data.type,
        });
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        console.log("recorder stopped");
        stopTimer();
        setIsRecording(false);
        console.log("chunks length", chunksRef.current.length);
        console.log("[Malgyeol] dataavailable count:", dataAvailableCountRef.current);
        if (chunksRef.current.length === 0) {
          setErrorMessage("녹음 데이터가 생성되지 않았습니다. 마이크 입력 장치와 브라우저 녹음 지원 여부를 확인한 뒤 다시 시도해 주세요.");
          setRecordedBlob(null);
          setAudioUrl(null);
          setPlaybackReady(false);
          setAcousticAnalysisStatus("idle");
          setAcousticAnalysis(null);
          setAcousticAnalysisError("");
          stopStream();
          mediaRecorderRef.current = null;
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        console.log("blob size", blob.size);
        console.log("blob type", blob.type);
        console.log("[Malgyeol] final blob", {
          size: blob.size,
          type: blob.type,
        });
        if (blob.size === 0) {
          setErrorMessage("녹음 데이터가 생성되지 않았습니다. 마이크 입력 장치와 브라우저 녹음 지원 여부를 확인한 뒤 다시 시도해 주세요.");
          setRecordedBlob(null);
          setAudioUrl(null);
          setPlaybackReady(false);
          setAcousticAnalysisStatus("idle");
          setAcousticAnalysis(null);
          setAcousticAnalysisError("");
          stopStream();
          mediaRecorderRef.current = null;
          return;
        }

        const url = URL.createObjectURL(blob);
        console.log("audio url created", url);
        console.log("[Malgyeol] recording stopped summary", {
          chunksLength: chunksRef.current.length,
          blobSize: blob.size,
          blobType: blob.type,
          audioUrl: url,
        });
        console.log("[Malgyeol] audio object URL:", url);
        audioUrlRef.current = url;
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
          audioRef.current.currentTime = 0;
        }
        setRecordedBlob(blob);
        setAudioUrl(url);
        setPlaybackReady(false);
        setErrorMessage("");
        mediaRecorderRef.current = null;
        runAcousticAnalysis(blob, selectedTaskId);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      console.log("recorder started");
      console.log("[Malgyeol] recorder state:", recorder.state);
      console.log("[Malgyeol] recorder started");
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((value) => value + 1);
      }, 1000);
    } catch {
      stopTimer();
      stopStream();
      setIsRecording(false);
      setErrorMessage("마이크 권한이 필요합니다. 브라우저 주소창 왼쪽 권한 설정에서 마이크를 허용한 뒤 다시 시도해 주세요.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      console.log("[Malgyeol] recorder stopping from state:", recorder.state);
      try {
        recorder.requestData();
        console.log("[Malgyeol] recorder requestData called before stop");
      } catch (error) {
        console.warn("[Malgyeol] recorder requestData skipped", error);
      }
      recorder.stop();
    }
    stopTimer();
    setIsRecording(false);
  }

  function getExpectedTextForAnalysis() {
    if (selectedTask.id === "spontaneous") return "";
    return selectedTask.prompt;
  }

  async function requestAiAnalysis() {
    if (!recordedBlob) {
      setAiAnalysisStatus("error");
      setAiAnalysisError("녹음 파일이 없습니다. 먼저 녹음을 완료해 주세요.");
      return;
    }
    if (!aiConsent) {
      setAiAnalysisStatus("error");
      setAiAnalysisError("AI 분석 전송에 동의한 뒤 다시 시도해 주세요.");
      return;
    }

    setAiAnalysisStatus("uploading");
    setAiAnalysisError("");
    setAiAnalysisResult(null);
    setExpertReviewValues(createEmptyExpertReviewValues());
    setDistributionStatus("draft");

    const form = new FormData();
    form.append("audio", recordedBlob, `malgyeol-${selectedTask.id}.webm`);
    form.append("taskId", selectedTask.id);
    form.append("taskType", selectedTask.title);
    form.append("expectedText", getExpectedTextForAnalysis());
    form.append("consent", "true");

    try {
      const response = await fetch("/api/speech-analysis", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) {
        throw new Error(typeof data.error === "string" ? data.error : "AI 음성 분석 요청에 실패했습니다.");
      }
      setAiAnalysisResult(data as SpeechAnalysisResponse);
      setAiAnalysisStatus("success");
    } catch (error) {
      setAiAnalysisStatus("error");
      setAiAnalysisError(error instanceof Error ? error.message : "AI 음성 분석 요청에 실패했습니다.");
    }
  }

  function playVoiceGuide() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setErrorMessage("이 브라우저에서는 음성 안내를 사용할 수 없습니다.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedTask.voiceGuide);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function renderTextPrompt() {
    if (selectedTask.id === "smr" && "soundSteps" in selectedTask) {
      return (
        <div className="grid grid-cols-3 gap-2">
          {selectedTask.soundSteps.map((step, index) => (
            <div key={step} className="rounded-xl border border-accent-soft bg-accent-soft/60 px-4 py-5 text-center">
              <p className="text-xs font-bold text-accent-deep">STEP {index + 1}</p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{step}</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedTask.id === "reading" && "words" in selectedTask) {
      return (
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-bold text-ink-faint">예시 단어</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTask.words.map((word) => (
                <span key={word} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-extrabold text-ink">
                  {word}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-ink-faint">예시 문장</p>
            <ol className="mt-2 grid gap-2 text-sm font-semibold leading-6 text-ink-soft">
              {selectedTask.sentences.map((sentence, index) => (
                <li key={sentence}>
                  {index + 1}. {sentence}
                </li>
              ))}
            </ol>
          </div>
        </div>
      );
    }

    return <p className="text-lg font-bold text-ink">{selectedTask.prompt}</p>;
  }

  function renderPicturePrompt() {
    if (selectedTask.id === "reading" && "pictureCards" in selectedTask) {
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          {selectedTask.pictureCards.map(([label, emoji]) => (
            <div key={label} className="rounded-xl border border-line bg-white px-4 py-4 text-center">
              <p className="text-4xl" aria-hidden>
                {emoji}
              </p>
              <p className="mt-2 text-sm font-extrabold text-ink">{label}</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedTask.id === "spontaneous" && "situationCards" in selectedTask) {
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {selectedTask.situationCards.map(([label, emoji]) => (
            <div key={label} className="rounded-xl border border-line bg-white px-4 py-4">
              <p className="text-4xl" aria-hidden>
                {emoji}
              </p>
              <p className="mt-2 text-sm font-extrabold leading-5 text-ink">{label}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-line bg-white px-4 py-5 text-center">
        <p className="text-6xl" aria-hidden>
          {selectedTask.icon}
        </p>
        <p className="mt-3 text-sm font-bold text-ink-soft">{selectedTask.iconLabel}</p>
      </div>
    );
  }

  const automaticMeasurementRows = acousticAnalysis
    ? [
        ["전체 녹음시간", formatSeconds(acousticAnalysis.totalDurationSecond)],
        ["실제 발성시간", formatSeconds(acousticAnalysis.voicedDurationSecond)],
        ["무음 비율", formatPercent(acousticAnalysis.silenceRatioPercent)],
        ["250ms 이상 중간 무음", `${acousticAnalysis.midSilenceCount}회`],
        ["음량 변동", acousticAnalysis.loudnessVariationDb === null ? "측정 후보 없음" : `${acousticAnalysis.loudnessVariationDb.toFixed(1)}dB`],
        ["입력 왜곡 가능성", acousticAnalysis.distortionPossible ? "가능성 있음: 재녹음 또는 청취 검수 필요" : "뚜렷한 클리핑 후보 없음"],
      ]
    : [];
  const segmentation = acousticAnalysis?.segmentation ?? null;
  const segmentationRows =
    segmentation && segmentation.status === "ready"
      ? [
          ["각 음절 반복 횟수", Object.entries(segmentation.syllableCounts).map(([key, value]) => `${key} ${value}회`).join(" · ")],
          ["전체 녹음시간 기준", formatRate(segmentation.syllablesPerTotalSecond)],
          ["실제 발성시간 기준", formatRate(segmentation.syllablesPerVoicedSecond)],
          ["음절 간격 평균", formatSeconds(segmentation.meanIntervalSecond)],
          ["음절 간격 표준편차", formatSeconds(segmentation.intervalStandardDeviationSecond)],
          ["음절 간격 변동계수", formatNumber(segmentation.intervalCoefficientOfVariation)],
          ["후반부 속도 변화", formatPercent(segmentation.lateSpeedChangePercent)],
        ]
      : [];
  const clinicalReferenceText =
    buildReferenceNote({
      aiAnalysisReady: aiAnalysisStatus === "success",
      taskId: selectedTaskId,
      transcriptSummary,
    });
  const selectedReferenceLabel = getSelectedReferenceLabel({
    version: KOREAN_CLINICAL_REFERENCE_VERSION,
    references: KOREAN_CLINICAL_REFERENCES,
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/demo" className="text-sm font-bold text-[#7dd3fc]">
          ← 말결 Care 랜딩으로
        </Link>
        <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-[#dce9fb]">
          브라우저 내 비저장 데모
        </span>
      </div>

      <section className="rounded-[28px] border border-[#7dd3fc]/30 bg-[linear-gradient(135deg,rgba(4,12,29,0.98),rgba(9,27,52,0.92)_54%,rgba(16,34,61,0.86))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.36)] sm:p-8">
        <p className="inline-flex rounded-full border border-[#82b8d3]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#c9e7ff]">
          MalGyeol Care Public Beta
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#fff8e7] sm:text-4xl">
          표준화 녹음 테스트 데모
        </h1>
        <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-[#dff7ff]">
          5가지 표준화된 녹음 과제 중 하나를 선택해 녹음하고, 녹음 완료 후 자동 정리 지표와 임상 전문가 검수 흐름을 확인합니다.
        </p>
        <p className="mt-4 rounded-2xl border border-[#f6d58f]/25 bg-[#f6d58f]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#fff2ce]">
          {TOP_NOTICE}
        </p>
      </section>

      <section>
        <Eyebrow>과제 선택 영역</Eyebrow>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {tasks.map((task) => {
            const selected = task.id === selectedTask.id;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => resetRecording(task.id)}
                disabled={isRecording}
                className={`min-h-44 rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-[#5cc8d5] bg-[#e8fbff] shadow-[0_12px_28px_rgba(92,200,213,0.22)]"
                    : "border-line bg-white/95 hover:border-[#5cc8d5]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                  표준화된 녹음 과제
                </span>
                <h2 className="mt-2 text-base font-extrabold text-ink">{task.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{task.guide}</p>
                <p className="mt-3 text-xs font-semibold leading-5 text-ink-faint">
                  참고 항목: {task.metrics.join(", ")}
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-4 inline-flex rounded-xl border border-line bg-white/95 p-1">
          {(["text", "picture"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPromptMode(mode)}
              disabled={isRecording}
              className={`rounded-lg px-4 py-2 text-sm font-extrabold transition ${
                promptMode === mode
                  ? "bg-accent text-white"
                  : "text-ink-soft hover:bg-ground hover:text-ink"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {mode === "text" ? "텍스트 모드" : "그림 모드"}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>선택된 과제 안내문</Eyebrow>
            <Pill tone="teal">{selectedTask.title}</Pill>
          </div>
          <div className="grid gap-4 md:grid-cols-[0.35fr_0.65fr]">
            <div className="rounded-xl border border-line bg-ground px-4 py-5 text-center">
              <p className="text-6xl" aria-hidden>
                {selectedTask.icon}
              </p>
              <p className="mt-3 text-xs font-bold leading-5 text-ink-faint">
                {selectedTask.iconLabel}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-ink">{selectedTask.title}</h2>
              <p className="mt-2 text-lg font-bold leading-7 text-ink">{selectedTask.guide}</p>
              <div className="mt-4 rounded-xl border border-line bg-ground px-4 py-3">
                <p className="text-xs font-bold text-ink-faint">
                  {promptMode === "text" ? "텍스트 제시" : "그림 기반 제시"}
                </p>
                <div className="mt-3">
                  {promptMode === "text" ? renderTextPrompt() : renderPicturePrompt()}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={playVoiceGuide}
              className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:border-accent hover:text-accent-deep"
            >
              음성 안내
            </button>
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-45"
            >
              녹음 시작
            </button>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            이 데모는 실제 저장되지 않습니다. 녹음 데이터는 서버로 전송되지 않고 현재 브라우저 메모리 안에서만 재생됩니다.
          </p>
        </Card>

        <Card className="border-[#7dd3fc]/25 bg-white/95">
          <Eyebrow>녹음 테스트</Eyebrow>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ground p-4">
            <div>
              <p className="text-sm font-bold text-ink-soft">녹음 중 타이머</p>
              <p className="mt-1 font-mono text-4xl font-extrabold text-ink">{formatTime(elapsedSeconds)}</p>
            </div>
            <Pill tone={isRecording ? "warn" : hasRecording ? "good" : "grey"}>
              {isRecording ? "녹음 중" : hasRecording ? "녹음 완료" : "대기"}
            </Pill>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={startRecording} disabled={isRecording} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-45">
              녹음 시작
            </button>
            <button type="button" onClick={stopRecording} disabled={!isRecording} className="rounded-lg bg-warn px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">
              녹음 종료
            </button>
            <button type="button" onClick={() => resetRecording()} disabled={isRecording} className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:border-accent hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-45">
              다시 녹음
            </button>
          </div>

          {audioUrl && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-ink-faint">녹음 재생 플레이어</p>
              <audio ref={audioRef} key={audioUrl} className="h-10 w-full" controls src={audioUrl} preload="metadata" playsInline />
            </div>
          )}
          {errorMessage && <p className="mt-3 text-xs font-semibold text-warn">{errorMessage}</p>}

          <div className="mt-5 rounded-xl border border-line bg-white px-4 py-4">
            <label className="flex gap-3 text-sm font-semibold leading-6 text-ink-soft">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(event) => setAiConsent(event.target.checked)}
                disabled={!recordedBlob || aiAnalysisStatus === "uploading"}
                className="mt-1 h-4 w-4 accent-[#0f9aa8]"
              />
              <span>
                AI 음성 분석을 위해 이번 녹음을 외부 AI API로 전송하는 것에 동의합니다.
              </span>
            </label>
            <p className="mt-2 text-xs font-semibold leading-5 text-ink-faint">
              기본 녹음과 재생은 브라우저에서 처리됩니다. AI 분석을 선택하면 이번 녹음이 음성인식 처리를 위해 외부 AI API로 전송됩니다. 말결 서비스는 본 데모에서 녹음 파일을 별도로 저장하지 않습니다.
            </p>
            <button
              type="button"
              onClick={requestAiAnalysis}
              disabled={!canRequestAiAnalysis}
              className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-45"
            >
              {aiAnalysisStatus === "uploading" ? "AI 음성 분석 중" : "AI 음성 분석 시작"}
            </button>
            {aiAnalysisStatus === "idle" && (
              <p className="mt-3 text-xs font-semibold text-ink-faint">
                아직 AI 음성 분석을 실행하지 않았습니다.
              </p>
            )}
            {aiAnalysisStatus === "uploading" && (
              <p className="mt-3 text-xs font-semibold text-ink-soft">
                녹음된 음성을 AI 음성인식 API로 분석하고 있습니다.
              </p>
            )}
            {aiAnalysisStatus === "error" && (
              <p className="mt-3 text-xs font-semibold text-warn">{aiAnalysisError}</p>
            )}
          </div>
        </Card>
      </section>

      {hasRecording ? (
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white/95 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Eyebrow>전문가 검수 전 자동 참고의견</Eyebrow>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
                국내 임상평가 항목을 참고한 구조이며, 전문가 승인 기준값은 아직 등록되지 않았습니다.
              </p>
            </div>
            <Pill tone="warn">전문가 기준 검토 전</Pill>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-line bg-ground px-4 py-4">
              <p className="text-sm font-extrabold text-ink">A. 자동 음향 측정</p>
              {acousticAnalysisStatus === "analyzing" && (
                <p className="mt-3 text-sm font-semibold leading-6 text-ink-soft">
                  원음 파형에서 발성 구간과 에너지 피크 후보를 계산하고 있습니다.
                </p>
              )}
              {acousticAnalysisStatus === "error" && (
                <p className="mt-3 text-sm font-semibold leading-6 text-warn">{acousticAnalysisError}</p>
              )}
              {acousticAnalysisStatus === "ready" && acousticAnalysis && (
                <div className="mt-3 grid gap-2">
                  {automaticMeasurementRows.map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2">
                      <span className="text-xs font-bold text-ink-faint">{label}</span>
                      <span className="text-right text-sm font-extrabold text-ink">{value}</span>
                    </div>
                  ))}
                  <div className="rounded-lg border border-line bg-white px-3 py-3">
                    <p className="text-xs font-bold text-ink-faint">자동 음절 분절 후보</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-ink-faint">
                      숨소리, 마이크 잡음, 파열음이 음절 후보로 감지될 수 있으므로 전문가 청취 확인이 필요합니다.
                    </p>
                    {segmentation?.status === "ready" ? (
                      <div className="mt-2 grid gap-2">
                        {segmentationRows.map(([label, value]) => (
                          <div key={label} className="flex items-start justify-between gap-3 text-sm">
                            <span className="font-semibold text-ink-soft">{label}</span>
                            <span className="text-right font-extrabold text-ink">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
                        {segmentation?.reason ?? "자동 분절 확인 필요"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-line bg-ground px-4 py-4">
              <p className="text-sm font-extrabold text-ink">B. AI 음성인식 결과</p>
              {aiAnalysisStatus !== "success" || !aiAnalysisResult ? (
                <p className="mt-3 text-sm font-semibold leading-6 text-ink-soft">
                  AI 전사를 실행하면 전사문, 제시 음절 인식 여부, 전사 기준 반복 횟수, 순서 인식 결과가 표시됩니다.
                </p>
              ) : (
                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg border border-line bg-white px-3 py-3">
                    <p className="text-xs font-bold text-ink-faint">전사문</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink">{transcriptSummary.transcript || "전사문 없음"}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2">
                    <p className="text-xs font-bold text-ink-faint">제시 음절 인식 여부</p>
                    <p className="mt-1 text-sm font-semibold text-ink-soft">{transcriptSummary.targetStatus}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2">
                    <p className="text-xs font-bold text-ink-faint">AI 전사 기준 반복 횟수</p>
                    <p className="mt-1 text-sm font-semibold text-ink-soft">{transcriptSummary.repetitionText}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2">
                    <p className="text-xs font-bold text-ink-faint">순서 인식 결과</p>
                    <p className="mt-1 text-sm font-semibold text-ink-soft">{transcriptSummary.orderStatus}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-white px-3 py-2">
                      <p className="text-xs font-bold text-ink-faint">누락 인식 표현</p>
                      <p className="mt-1 text-sm font-semibold text-ink-soft">
                        {aiAnalysisResult.comparison.omittedTokens.length ? aiAnalysisResult.comparison.omittedTokens.join(" ") : "표시할 항목 없음"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-white px-3 py-2">
                      <p className="text-xs font-bold text-ink-faint">추가 인식 표현</p>
                      <p className="mt-1 text-sm font-semibold text-ink-soft">
                        {aiAnalysisResult.comparison.addedTokens.length ? aiAnalysisResult.comparison.addedTokens.join(" ") : "표시할 항목 없음"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-line bg-ground px-4 py-4">
              <p className="text-sm font-extrabold text-ink">C. 전문가 검수 전 참고의견</p>
              <div className="mt-3 grid gap-2">
                <div className="rounded-lg border border-[#f6d58f]/35 bg-[#fff8e7] px-3 py-3">
                  <p className="text-xs font-bold text-[#6b4a0b]">현재 측정값 설명</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#6b4a0b]">{clinicalReferenceText}</p>
                </div>
                <div className="rounded-lg border border-line bg-white px-3 py-2">
                  <p className="text-xs font-bold text-ink-faint">검사의 충분성 여부</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">
                    승인된 기준표와 전문가 청취 검수 전에는 충분성을 확정하지 않습니다.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-white px-3 py-2">
                  <p className="text-xs font-bold text-ink-faint">해석 제한</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">
                    OpenAI 전사는 음성인식 참고자료이며 임상평가 결과로 표시하지 않습니다.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-white px-3 py-2">
                  <p className="text-xs font-bold text-ink-faint">전문가 확인 필요 항목</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">
                    원음 청취, 자동 음절 분절, 반복 횟수, 리듬 규칙성, 조음 붕괴 여부, 검사 유효성
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-white px-3 py-2">
                  <p className="text-xs font-bold text-ink-faint">적용한 참고기준</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">{selectedReferenceLabel}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {AUTOMATIC_RESULT_NOTICE}
          </p>
        </Card>

        <Card className="bg-white/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>AI 음성인식 참고 결과</Eyebrow>
            <Pill tone={aiAnalysisStatus === "success" ? "teal" : aiAnalysisStatus === "error" ? "warn" : "grey"}>
              {aiAnalysisStatus === "success" ? "분석 완료" : aiAnalysisStatus === "uploading" ? "분석 중" : "대기"}
            </Pill>
          </div>
          <p className="mb-3 rounded-lg border border-[#f6d58f]/35 bg-[#fff8e7] px-3 py-2 text-xs font-bold leading-5 text-[#6b4a0b]">
            AI 음성인식 결과는 API 분석을 실행한 뒤 표시됩니다.
          </p>
          {aiAnalysisStatus !== "success" || !aiAnalysisResult ? (
            <p className="rounded-lg border border-line bg-ground px-3 py-3 text-sm font-semibold leading-6 text-ink-soft">
              아직 AI 음성 분석을 실행하지 않았습니다. 동의 후 버튼을 누르면 이번 녹음에 대한 음성인식 참고 결과가 표시됩니다.
            </p>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-lg border border-line bg-ground px-3 py-3">
                <p className="text-xs font-bold text-ink-faint">AI 전사 결과</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink">{aiAnalysisResult.transcript}</p>
              </div>
              {aiAnalysisResult.expectedText && (
                <div className="rounded-lg border border-line bg-ground px-3 py-3">
                  <p className="text-xs font-bold text-ink-faint">제시문</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">{aiAnalysisResult.expectedText}</p>
                </div>
              )}
              {aiAnalysisResult.comparison.referenceMatchPercent !== null && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-line bg-white px-3 py-2">
                    <p className="text-xs text-ink-faint">제시문 참고 일치율</p>
                    <p className="mt-1 text-sm font-extrabold text-ink">
                      {aiAnalysisResult.comparison.referenceMatchPercent}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2">
                    <p className="text-xs text-ink-faint">일치 토큰</p>
                    <p className="mt-1 text-sm font-extrabold text-ink">
                      {aiAnalysisResult.comparison.matchedTokenCount}/{aiAnalysisResult.comparison.expectedTokenCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2">
                    <p className="text-xs text-ink-faint">사용 모델</p>
                    <p className="mt-1 text-sm font-extrabold text-ink">{aiAnalysisResult.model}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-white px-3 py-3">
                  <p className="text-xs font-bold text-ink-faint">빠진 것으로 보이는 표현</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
                    {aiAnalysisResult.comparison.omittedTokens.length
                      ? aiAnalysisResult.comparison.omittedTokens.join(" ")
                      : "표시할 항목 없음"}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-white px-3 py-3">
                  <p className="text-xs font-bold text-ink-faint">추가로 인식된 표현</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
                    {aiAnalysisResult.comparison.addedTokens.length
                      ? aiAnalysisResult.comparison.addedTokens.join(" ")
                      : "표시할 항목 없음"}
                  </p>
                </div>
              </div>
              <ul className="grid gap-1 text-xs font-semibold leading-5 text-ink-faint">
                {aiAnalysisResult.notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {AUTOMATIC_RESULT_NOTICE}
          </p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>임상 전문가 검수 영역</Eyebrow>
          <p className="mb-3 rounded-lg border border-[#f6d58f]/35 bg-[#fff8e7] px-3 py-2 text-xs font-bold leading-5 text-[#6b4a0b]">
            이 공개 데모의 전문가 입력 내용은 저장되지 않습니다.
          </p>
          <div className="grid gap-3">
            {therapistFields.map((field) => (
              <label key={field} className="grid gap-1 text-sm font-bold text-ink">
                {field}
                {field === "적용 기준 선택" ? (
                  <select
                    value={expertReviewValues[field]}
                    onChange={(event) => setExpertReviewValues((values) => ({ ...values, [field]: event.target.value }))}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft"
                  >
                    <option value="">전문가 검수 전</option>
                    <option value={selectedReferenceLabel}>{selectedReferenceLabel}</option>
                    <option value="전문가 승인 기준 등록 후 선택">전문가 승인 기준 등록 후 선택</option>
                  </select>
                ) : field === "자동 음절 분절 확인" || field === "검사 유효성" || field === "전문가 승인" ? (
                  <select
                    value={expertReviewValues[field]}
                    onChange={(event) => setExpertReviewValues((values) => ({ ...values, [field]: event.target.value }))}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft"
                  >
                    <option value="">전문가 검수 전</option>
                    <option value="확인 필요">확인 필요</option>
                    <option value="검수 완료">검수 완료</option>
                  </select>
                ) : field === "최종 참고의견" ? (
                  <textarea
                    value={expertReviewValues[field]}
                    onChange={(event) => setExpertReviewValues((values) => ({ ...values, [field]: event.target.value }))}
                    className="min-h-24 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft"
                    placeholder={`${field} 입력`}
                  />
                ) : (
                  <input
                    value={expertReviewValues[field]}
                    onChange={(event) => setExpertReviewValues((values) => ({ ...values, [field]: event.target.value }))}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft"
                    placeholder={`${field} 입력`}
                  />
                )}
              </label>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {AUTOMATIC_RESULT_NOTICE}
          </p>
        </Card>

        <Card className="bg-white/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>AI 보조 과제 후보 카드</Eyebrow>
            <Pill tone="teal">홈트레이닝 과제 후보</Pill>
          </div>
          <div className="grid gap-2">
            {homeTrainingCandidates.map((item) => (
              <div key={item} className="rounded-lg border border-accent-soft bg-accent-soft/60 px-3 py-3 text-sm font-bold text-accent-deep">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            과제 후보는 임상 전문가 검수 참고자료 예시이며, 최종 배포 내용은 임상 전문가가 승인 또는 수정합니다.
          </p>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {AUTOMATIC_RESULT_NOTICE}
          </p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>임상 전문가 승인 및 배포 상태</Eyebrow>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDistributionStatus("approved")} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-deep">
              전문가 승인
            </button>
            <button type="button" onClick={() => setDistributionStatus("edited")} className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:border-accent hover:text-accent-deep">
              전문가 수정
            </button>
            <button type="button" onClick={() => setDistributionStatus("distributed")} className="rounded-lg bg-good px-4 py-2 text-sm font-bold text-white">
              홈트레이닝 과제 배포 완료
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-line bg-ground px-4 py-3">
            <p className="text-xs font-bold text-ink-faint">현재 검수 상태</p>
            <p className="mt-1 text-lg font-extrabold text-ink">
              {distributionStatus === "draft" && "임상 전문가 검수 대기"}
              {distributionStatus === "approved" && "임상 전문가 승인 완료"}
              {distributionStatus === "edited" && "임상 전문가 수정안 반영"}
              {distributionStatus === "distributed" && "홈트레이닝 과제 배포 완료"}
            </p>
          </div>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {AUTOMATIC_RESULT_NOTICE}
          </p>
        </Card>
      </section>
      ) : (
        <Card className="border-[#7dd3fc]/25 bg-white/95">
          <Eyebrow>녹음 완료 후 표시</Eyebrow>
          <p className="text-sm font-semibold leading-6 text-ink-soft">
            녹음 종료 후 녹음 재생 플레이어, 자동 음향 측정, AI 음성인식 결과, 자동 참고의견, 임상 전문가 검수 입력이 표시됩니다.
          </p>
        </Card>
      )}
    </>
  );
}
