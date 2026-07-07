"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  computeVoiceMetrics,
  qualityIssue,
  type FrameSample,
  type VoiceMetrics,
} from "@/lib/metrics";
import { koreanMetricRows } from "@/lib/korean-copy";

type Phase = "idle" | "recording" | "recorded" | "uploading" | "done" | "error";

export function KoreanRecorder({
  token,
  itemId,
  targetText,
  focus,
}: {
  token: string;
  itemId: string;
  targetText: string;
  focus: string | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [metrics, setMetrics] = useState<VoiceMetrics | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [self, setSelf] = useState({
    tiredness: "",
    confidence: "",
    difficulty: "",
    memo: "",
  });

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const framesRef = useRef<FrameSample[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTRef = useRef(0);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      mediaRef.current?.stream.getTracks().forEach((track) => track.stop());
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  function sampleLoop() {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !buf || !ctx) return;
    rafRef.current = requestAnimationFrame(sampleLoop);
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
    // eslint-disable-next-line react-hooks/purity
    const t = (performance.now() - startTRef.current) / 1000;
    framesRef.current.push({ t, db, hz });
    setSeconds(Math.floor(t));
  }

  async function start() {
    setError("");
    setMetrics(null);
    setQuality(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(2048);
      framesRef.current = [];
      startTRef.current = performance.now();

      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(blobRef.current);
        setAudioUrl(audioUrlRef.current);
        stream.getTracks().forEach((track) => track.stop());
        const nextMetrics = computeVoiceMetrics(framesRef.current, "READ");
        setMetrics(nextMetrics);
        setQuality(qualityIssue(nextMetrics));
        setPhase("recorded");
      };
      mediaRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setPhase("recording");
      sampleLoop();
    } catch {
      setError("마이크 권한을 확인해 주세요.");
      setPhase("error");
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    mediaRef.current?.stop();
  }

  async function upload() {
    if (!blobRef.current || !metrics) return;
    setPhase("uploading");
    const form = new FormData();
    form.append("token", token);
    form.append("itemId", itemId);
    form.append("metricsJson", JSON.stringify(metrics));
    form.append("qualityFlag", quality ? "LOW" : "OK");
    form.append("selfAssessmentJson", JSON.stringify(self));
    form.append("file", blobRef.current, "korean-practice.webm");
    try {
      const res = await fetch("/api/korean/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setPhase("done");
      setTimeout(() => router.push(`/korean/portal/${token}`), 900);
    } catch {
      setError("제출에 실패했습니다. 다시 시도해 주세요.");
      setPhase("recorded");
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-line rounded-2xl p-6">
      <p className="text-[11px] font-bold tracking-widest text-ink-faint mb-2">
        한국어 생활문장 연습
      </p>
      <h1 className="text-xl font-bold mb-2">&ldquo;{targetText}&rdquo;</h1>
      {focus && <p className="text-sm text-accent-deep mb-5">연습 초점: {focus}</p>}

      {phase === "idle" && (
        <div className="text-center py-8">
          <button
            type="button"
            onClick={start}
            className="w-20 h-20 rounded-full bg-accent text-white font-bold shadow-lg shadow-accent/20"
          >
            녹음
          </button>
          <p className="text-xs text-ink-faint mt-4">문장을 천천히 읽고 녹음해 주세요.</p>
        </div>
      )}

      {phase === "recording" && (
        <div className="text-center py-8">
          <button
            type="button"
            onClick={stop}
            className="w-20 h-20 rounded-full bg-crit text-white font-bold animate-pulse"
          >
            정지
          </button>
          <p className="text-sm font-bold text-crit mt-4 tabular">{mmss}</p>
        </div>
      )}

      {(phase === "recorded" || phase === "uploading") && metrics && (
        <div className="flex flex-col gap-4">
          {audioUrl && <audio controls src={audioUrl} className="w-full h-10" />}
          {quality && (
            <p className="text-sm text-warn bg-warn-soft rounded-lg px-3 py-2">
              녹음이 너무 짧습니다. 조용한 곳에서 한 번 더 시도해 주세요.
            </p>
          )}
          <div className="border border-line rounded-xl px-4 py-3">
            <p className="text-[11px] font-bold tracking-widest text-ink-faint mb-2">
              발음 연습 참고지표
            </p>
            {koreanMetricRows(metrics).map(([label, value]) => (
              <p key={label} className="flex justify-between text-[13px] py-0.5">
                <span className="text-ink-soft">{label}</span>
                <b>{value}</b>
              </p>
            ))}
          </div>
          <div className="border border-line rounded-xl px-4 py-3">
            <p className="text-[11px] font-bold tracking-widest text-ink-faint mb-2">
              학습자 자기평가
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                ["tiredness", "말하기 피로도", 0, 10],
                ["confidence", "오늘 자신감", 1, 5],
                ["difficulty", "문장 어려움", 1, 5],
              ].map(([key, label, min, max]) => (
                <label key={key} className="text-xs font-semibold text-ink-soft">
                  {label}
                  <select
                    value={self[key as keyof typeof self]}
                    onChange={(e) => setSelf((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2 py-2 bg-white"
                  >
                    <option value="">선택</option>
                    {Array.from({ length: Number(max) - Number(min) + 1 }, (_, i) => Number(min) + i).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <textarea
              value={self.memo}
              onChange={(e) => setSelf((prev) => ({ ...prev, memo: e.target.value }))}
              rows={2}
              placeholder="연습하면서 어려웠던 점"
              className="mt-3 w-full border border-line rounded-lg px-3 py-2 text-sm resize-y"
            />
          </div>
          <button
            type="button"
            disabled={phase === "uploading" || Boolean(quality)}
            onClick={upload}
            className="bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {phase === "uploading" ? "제출 중" : "교사/튜터에게 제출"}
          </button>
        </div>
      )}

      {phase === "done" && <p className="text-center font-bold py-8">제출되었습니다.</p>}
      {error && <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2 mt-4">{error}</p>}
    </div>
  );
}
