"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DemoShell } from "@/components/DemoShell";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { DISCLAIMER } from "@/lib/metrics";

const TOP_NOTICE =
  "이 데모는 실제 저장되지 않는 공개 베타 미리보기입니다. 실제 환자 정보, 실제 검사 결과, 실제 음성파일은 저장하지 않습니다.";

const MOCK_METRIC_NOTICE =
  "아래 지표는 실제 AI 분석 결과가 아니라, 화면 흐름을 설명하기 위한 데모용 예시값입니다.";

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

const mockMetricByTask: Record<TaskId, Array<[string, string]>> = {
  vowel: [
    ["녹음 품질", "양호"],
    ["발화 지속시간", "8.4초"],
    ["말속도", "해당 과제 참고 제외"],
    ["무음구간", "0.6초"],
    ["반복 횟수", "해당 과제 참고 제외"],
    ["인식 불확실 구간", "후반 1.2초"],
    ["불일치 후보", "없음"],
  ],
  amr: [
    ["녹음 품질", "양호"],
    ["발화 지속시간", "6.8초"],
    ["말속도", "초당 4.1회"],
    ["무음구간", "0.4초"],
    ["반복 횟수", "28회"],
    ["인식 불확실 구간", "중간 0.5초"],
    ["불일치 후보", "터/커 혼동 후보 1개"],
  ],
  smr: [
    ["녹음 품질", "재녹음 권장"],
    ["발화 지속시간", "7.1초"],
    ["말속도", "초당 2.3세트"],
    ["무음구간", "1.1초"],
    ["반복 횟수", "16세트"],
    ["인식 불확실 구간", "초반 0.8초"],
    ["불일치 후보", "퍼터커 순서 흔들림 후보"],
  ],
  reading: [
    ["녹음 품질", "양호"],
    ["발화 지속시간", "12.6초"],
    ["말속도", "분당 92음절"],
    ["무음구간", "2.2초"],
    ["반복 횟수", "해당 과제 참고 제외"],
    ["인식 불확실 구간", "문장 후반 1곳"],
    ["불일치 후보", "전화/전하 후보"],
  ],
  spontaneous: [
    ["녹음 품질", "양호"],
    ["발화 지속시간", "21.3초"],
    ["말속도", "분당 84음절"],
    ["무음구간", "3.4초"],
    ["반복 횟수", "해당 과제 참고 제외"],
    ["인식 불확실 구간", "긴 멈춤 이후 1곳"],
    ["불일치 후보", "없음"],
  ],
};

const therapistFields = [
  "말명료도 관찰",
  "반복 발화 양상",
  "무음구간 증가 여부",
  "피로도 관찰",
  "오류 유형 메모",
  "재검사 필요 여부",
  "홈트레이닝 권장 방향",
];

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [distributionStatus, setDistributionStatus] = useState<"draft" | "approved" | "edited" | "distributed">("draft");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId],
  );
  const hasRecording = Boolean(audioUrl);

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);

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

  function resetRecording(nextTaskId?: TaskId) {
    stopTimer();
    stopStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioUrl(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    setErrorMessage("");
    setDistributionStatus("draft");
    if (nextTaskId) setSelectedTaskId(nextTaskId);
  }

  function getSupportedMimeType() {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
  }

  async function startRecording() {
    if (typeof window === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setErrorMessage("현재 브라우저에서는 녹음 기능을 지원하지 않습니다. Chrome 또는 Edge 최신 버전에서 다시 시도해 주세요.");
      return;
    }

    try {
      setErrorMessage("");
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      chunksRef.current = [];
      setElapsedSeconds(0);
      setDistributionStatus("draft");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("mic stream acquired");
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        console.log("dataavailable", event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        console.log("recorder stopped");
        stopTimer();
        setIsRecording(false);
        console.log("chunks length", chunksRef.current.length);
        if (chunksRef.current.length === 0) {
          setErrorMessage("녹음 데이터가 생성되지 않았습니다. 마이크 입력 장치와 브라우저 녹음 지원 여부를 확인한 뒤 다시 시도해 주세요.");
          setAudioUrl(null);
          stopStream();
          mediaRecorderRef.current = null;
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        console.log("blob size", blob.size);
        if (blob.size === 0) {
          setErrorMessage("녹음 데이터가 생성되지 않았습니다. 마이크 입력 장치와 브라우저 녹음 지원 여부를 확인한 뒤 다시 시도해 주세요.");
          setAudioUrl(null);
          stopStream();
          mediaRecorderRef.current = null;
          return;
        }

        const url = URL.createObjectURL(blob);
        console.log("audio url created", url);
        setAudioUrl(url);
        setErrorMessage("");
        stopStream();
        mediaRecorderRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      console.log("recorder started");
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
      recorder.stop();
    }
    stopTimer();
    setIsRecording(false);
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
          5가지 표준화된 녹음 과제 중 하나를 선택해 녹음하고, 녹음 완료 후 데모용 예시 지표와 치료사 검수 mock 흐름을 확인합니다.
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
              <audio className="h-10 w-full" controls src={audioUrl} />
            </div>
          )}
          {errorMessage && <p className="mt-3 text-xs font-semibold text-warn">{errorMessage}</p>}
        </Card>
      </section>

      {hasRecording ? (
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>데모용 예시 지표</Eyebrow>
            <Pill tone="teal">mock 비진단 음성지표</Pill>
          </div>
          <p className="mb-3 rounded-lg border border-[#f6d58f]/35 bg-[#fff8e7] px-3 py-2 text-xs font-bold leading-5 text-[#6b4a0b]">
            {MOCK_METRIC_NOTICE}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {mockMetricByTask[selectedTask.id].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-ground px-3 py-2">
                <p className="text-xs text-ink-faint">{label}</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-ink-faint">
            AI 보조 지표 예정 영역입니다. 현재는 치료사 검수 참고자료 예시만 표시합니다.
          </p>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {DISCLAIMER}
          </p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>치료사 결과 입력 mock 폼</Eyebrow>
          <div className="grid gap-3">
            {therapistFields.map((field) => (
              <label key={field} className="grid gap-1 text-sm font-bold text-ink">
                {field}
                {field === "재검사 필요 여부" ? (
                  <select className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft">
                    <option>치료사 검수 후 결정</option>
                    <option>재검사 필요</option>
                    <option>현재 기록 유지</option>
                  </select>
                ) : (
                  <input className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft" placeholder={`${field} 입력 예시`} />
                )}
              </label>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {DISCLAIMER}
          </p>
        </Card>

        <Card className="bg-white/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>AI 보조 과제 후보 mock 카드</Eyebrow>
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
            과제 후보는 치료사 검수 참고자료 예시이며, 최종 배포 내용은 치료사가 승인 또는 수정합니다.
          </p>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {DISCLAIMER}
          </p>
        </Card>

        <Card className="bg-white/95">
          <Eyebrow>치료사 승인 및 배포 상태 mock</Eyebrow>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDistributionStatus("approved")} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-deep">
              치료사 승인
            </button>
            <button type="button" onClick={() => setDistributionStatus("edited")} className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:border-accent hover:text-accent-deep">
              치료사 수정
            </button>
            <button type="button" onClick={() => setDistributionStatus("distributed")} className="rounded-lg bg-good px-4 py-2 text-sm font-bold text-white">
              홈트레이닝 과제 배포 완료
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-line bg-ground px-4 py-3">
            <p className="text-xs font-bold text-ink-faint">현재 mock 상태</p>
            <p className="mt-1 text-lg font-extrabold text-ink">
              {distributionStatus === "draft" && "치료사 검수 대기"}
              {distributionStatus === "approved" && "치료사 승인 완료"}
              {distributionStatus === "edited" && "치료사 수정안 반영"}
              {distributionStatus === "distributed" && "홈트레이닝 과제 배포 완료 mock"}
            </p>
          </div>
          <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
            {DISCLAIMER}
          </p>
        </Card>
      </section>
      ) : (
        <Card className="border-[#7dd3fc]/25 bg-white/95">
          <Eyebrow>녹음 완료 후 표시</Eyebrow>
          <p className="text-sm font-semibold leading-6 text-ink-soft">
            녹음 종료 후 녹음 재생 플레이어, 데모용 예시 지표, 치료사 입력 mock 폼, AI 보조 과제 후보 mock 카드가 표시됩니다.
          </p>
        </Card>
      )}
    </>
  );
}
