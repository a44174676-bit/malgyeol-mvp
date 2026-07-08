"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_STORAGE_NOTICE } from "@/lib/demo";
import { computeVoiceMetrics, type FrameSample, type VoiceMetrics } from "@/lib/metrics";

type RecorderState = "idle" | "recording" | "ready" | "blocked" | "unsupported";

type DemoRecorderCopy = {
  storageNotice?: string;
  start?: string;
  stop?: string;
  reset?: string;
  unsupported?: string;
  blocked?: string;
  ready?: string;
};

export function DemoRecorder({
  label = "음성 녹음 미리보기",
  copy = {},
  metricKind,
  onMetrics,
}: {
  label?: string;
  copy?: DemoRecorderCopy;
  /** 전달 시 녹음을 특허 기반 비진단 음성지표 엔진(computeVoiceMetrics)으로 실시간 분석합니다. */
  metricKind?: VoiceMetrics["kind"];
  onMetrics?: (metrics: VoiceMetrics | null) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const framesRef = useRef<FrameSample[]>([]);
  const analysisStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopAnalysis = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  function analysisLoop() {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !buf || !ctx) return;
    rafRef.current = requestAnimationFrame(analysisLoop);
    analyser.getFloatTimeDomainData(buf);
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    const db = rms > 0.0001 ? Math.max(0, Math.min(95, 96 + 20 * Math.log10(rms))) : 0;
    let hz = 0;
    if (rms > 0.012) {
      const sr = ctx.sampleRate;
      const minOff = Math.floor(sr / 500);
      const maxOff = Math.floor(sr / 60);
      let best = 0;
      let bestOff = -1;
      for (let off = minOff; off < maxOff; off++) {
        let c = 0;
        for (let i = 0; i < buf.length - off; i++) c += buf[i] * buf[i + off];
        c /= buf.length - off;
        if (c > best) {
          best = c;
          bestOff = off;
        }
      }
      if (bestOff > 0 && best > 0.0008) hz = sr / bestOff;
    }
    const t = (performance.now() - analysisStartRef.current) / 1000;
    framesRef.current.push({ t, db, hz });
  }

  useEffect(() => {
    return () => {
      stopTimer();
      stopAnalysis();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopStream();
    };
  }, [audioUrl, stopAnalysis, stopStream, stopTimer]);

  async function startRecording() {
    if (typeof window === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setState("unsupported");
      setMessage(copy.unsupported ?? "이 브라우저에서는 녹음 미리보기를 사용할 수 없습니다.");
      return;
    }

    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setDuration(0);
      setMessage("");
      onMetrics?.(null);

      if (metricKind) {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        ctx.createMediaStreamSource(stream).connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        bufRef.current = new Float32Array(2048);
        framesRef.current = [];
        analysisStartRef.current = performance.now();
        rafRef.current = requestAnimationFrame(analysisLoop);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopTimer();
        stopAnalysis();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setState("ready");
        stopStream();
        if (metricKind) {
          onMetrics?.(computeVoiceMetrics(framesRef.current, metricKind));
        }
      };

      recorder.start();
      setState("recording");
      timerRef.current = window.setInterval(() => {
        if (startedAtRef.current) {
          setDuration(Math.round((Date.now() - startedAtRef.current) / 100) / 10);
        }
      }, 200);
    } catch {
      stopTimer();
      stopStream();
      setState("blocked");
      setMessage(copy.blocked ?? "마이크 권한이 허용되지 않았습니다. 브라우저 권한 설정을 확인해 주세요.");
    }
  }

  function stopRecording() {
    stopTimer();
    if (startedAtRef.current) {
      setDuration(Math.round((Date.now() - startedAtRef.current) / 100) / 10);
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function resetRecording() {
    stopTimer();
    stopStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    setMessage("");
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="mt-1 text-xs text-ink-faint">{copy.storageNotice ?? DEMO_STORAGE_NOTICE}</p>
        </div>
        <span className="rounded-full bg-ground px-3 py-1 text-xs font-bold text-ink-soft tabular">
          {duration.toFixed(1)}초
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {state !== "recording" ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-deep"
          >
            {copy.start ?? "녹음 시작"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-lg bg-warn px-4 py-2 text-sm font-bold text-white"
          >
            {copy.stop ?? "녹음 종료"}
          </button>
        )}
        {audioUrl && (
          <button
            type="button"
            onClick={resetRecording}
            className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:border-accent hover:text-accent-deep"
          >
            {copy.reset ?? "다시 녹음"}
          </button>
        )}
      </div>

      {audioUrl && <audio className="mt-4 w-full h-10" controls src={audioUrl} />}
      {message && <p className="mt-3 text-xs font-semibold text-warn">{message}</p>}
      {state === "ready" && (
        <p className="mt-3 text-xs text-ink-faint">
          {copy.ready ?? "이 미리보기는 현재 브라우저 탭 안에서만 재생됩니다. 서버 업로드와 파일 저장은 실행하지 않습니다."}
        </p>
      )}
    </div>
  );
}
