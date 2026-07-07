"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  computeVoiceMetrics, qualityIssue, metricRows,
  type VoiceMetrics, type FrameSample,
} from "@/lib/metrics";

type Phase = "idle" | "recording" | "recorded" | "uploading" | "done" | "error";
type Kind = VoiceMetrics["kind"];

const SELF_ASSESSMENT = [
  { key: "fatigue", label: "오늘 말하기 피로도", min: 0, max: 10, suffix: "/10" },
  { key: "fluency", label: "오늘 말이 잘 나온 정도", min: 1, max: 5, suffix: "/5" },
  { key: "condition", label: "오늘 말하기 컨디션", min: 1, max: 5, suffix: "/5" },
] as const;

const CAREGIVER_OBS = [
  { key: "easyToUnderstand", label: "말을 알아듣기 쉬웠나요?", options: ["예", "보통", "아니오"] },
  { key: "repeatIncreased", label: "다시 물어본 횟수가 늘었나요?", options: ["아니오", "비슷함", "예"] },
  { key: "phoneDifficult", label: "전화 통화가 어려웠나요?", options: ["아니오", "조금", "예"] },
  { key: "coughDuringMeal", label: "식사 중 사레/기침이 있었나요?", options: ["없음", "1-2회", "자주"] },
  { key: "tiredAfterSpeaking", label: "말한 후 피로해 보였나요?", options: ["아니오", "조금", "예"] },
] as const;

export function Recorder({
  token,
  itemId,
  targetText,
  metricKind,
  goalCondition,
}: {
  token: string;
  itemId: string;
  targetText: string | null;
  metricKind: string | null;
  goalCondition: string | null;
}) {
  const router = useRouter();
  const kind: Kind = metricKind === "MPT" || metricKind === "DDK" ? metricKind : "READ";
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [metrics, setMetrics] = useState<VoiceMetrics | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [selfAssessment, setSelfAssessment] = useState<Record<string, string>>({
    fatigue: "",
    fluency: "",
    condition: "",
  });
  const [caregiverObs, setCaregiverObs] = useState<Record<string, string>>({
    easyToUnderstand: "",
    repeatIncreased: "",
    phoneDifficult: "",
    coughDuringMeal: "",
    tiredAfterSpeaking: "",
    memo: "",
  });

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const framesRef = useRef<FrameSample[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTRef = useRef(0);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  function loop() {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !buf || !ctx) return;
    rafRef.current = requestAnimationFrame(loop);
    analyser.getFloatTimeDomainData(buf);
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    const db = rms > 0.0001 ? Math.max(0, Math.min(95, 96 + 20 * Math.log10(rms))) : 0;
    let hz = 0;
    if (rms > 0.012) {
      const sr = ctx.sampleRate;
      const minOff = Math.floor(sr / 500), maxOff = Math.floor(sr / 60);
      let best = 0, bestOff = -1;
      for (let off = minOff; off < maxOff; off++) {
        let c = 0;
        for (let i = 0; i < buf.length - off; i++) c += buf[i] * buf[i + off];
        c /= buf.length - off;
        if (c > best) { best = c; bestOff = off; }
      }
      if (bestOff > 0 && best > 0.0008) hz = sr / bestOff;
    }
    const t = (performance.now() - startTRef.current) / 1000;
    framesRef.current.push({ t, db, hz });
    setSeconds(Math.floor(t));
    // 라이브 미터
    const cv = canvasRef.current;
    if (cv) {
      const c = cv.getContext("2d")!;
      const W = cv.width, H = cv.height;
      c.fillStyle = "#0f1c1a"; c.fillRect(0, 0, W, H);
      const fr = framesRef.current.slice(-140), step = W / 140;
      c.strokeStyle = "#5eead4"; c.lineWidth = 2; c.beginPath();
      fr.forEach((f, i) => {
        const y = H - (f.db / 95) * H;
        if (i === 0) c.moveTo(0, y); else c.lineTo(i * step, y);
      });
      c.stroke();
      c.fillStyle = "#f3b562";
      fr.forEach((f, i) => {
        if (f.hz > 50) {
          c.beginPath();
          c.arc(i * step, H - ((Math.min(f.hz, 400) - 50) / 350) * H, 1.6, 0, 7);
          c.fill();
        }
      });
    }
  }

  async function start() {
    setError("");
    setMetrics(null);
    setQuality(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
      });
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(2048);
      framesRef.current = [];
      startTRef.current = performance.now();

      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(blobRef.current);
        stream.getTracks().forEach((t) => t.stop());
        // ── 단말 내 비진단 음성지표 산출 (온디바이스) ──
        const m = computeVoiceMetrics(framesRef.current, kind);
        setMetrics(m);
        setQuality(qualityIssue(m));
        setPhase("recorded");
      };
      mediaRef.current = rec;
      rec.start();
      setSeconds(0);
      setPhase("recording");
      loop();
    } catch {
      setError("마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.");
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
    const homeTrainingContext = {
      selfAssessment,
      caregiverObs,
      savedAt: new Date().toISOString(),
      note: "1차 구현: DB 스키마 변경 없이 보호자 단말에 더미 저장",
    };
    try {
      localStorage.setItem(
        `malgyeol-home-training:${token}:${itemId}`,
        JSON.stringify(homeTrainingContext)
      );
    } catch {
      // localStorage가 제한된 환경에서는 제출만 진행합니다.
    }
    const fd = new FormData();
    fd.append("token", token);
    fd.append("itemId", itemId);
    fd.append("metricsJson", JSON.stringify(metrics));
    fd.append("qualityFlag", quality ? "LOW" : "OK");
    fd.append("homeTrainingContextJson", JSON.stringify(homeTrainingContext));
    fd.append("file", blobRef.current, "recording.webm");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setPhase("done");
      setTimeout(() => {
        router.push(`/portal/${token}`);
        router.refresh();
      }, 1200);
    } catch {
      setError("업로드에 실패했습니다. 다시 시도해 주세요.");
      setPhase("recorded");
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-line rounded-2xl p-6 text-center">
      {targetText && (
        <>
          <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-1">
            {kind === "MPT" ? "길게 소리 내요" : kind === "DDK" ? "빠르고 규칙적으로 반복해요" : "또박또박 말해요"}
          </p>
          <p className={`font-bold mb-2 ${targetText.length > 20 ? "text-base" : "text-xl"}`}>
            &ldquo;{targetText}&rdquo;
          </p>
        </>
      )}
      {goalCondition && (
        <p className="text-xs text-accent-deep bg-accent-soft rounded-lg inline-block px-3 py-1 mb-4">
          목표 조건: {goalCondition}
        </p>
      )}

      {phase === "recording" && (
        <div className="bg-[#0f1c1a] rounded-xl p-3 mb-4">
          <canvas ref={canvasRef} width={600} height={100} className="w-full h-auto block" />
          <p className="text-[11px] text-[#9fbcb5] mt-1.5 text-left">
            상대 강도(초록) · 음도(주황) — 단말 안에서만 분석됩니다
          </p>
        </div>
      )}

      {phase === "idle" && (
        <>
          <div className="border border-line rounded-xl px-4 py-3 mb-5 text-left">
            <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-2">
              제출 전 확인 · 홈 트레이닝 수행 이력
            </p>
            <p className="text-xs text-ink-soft">
              녹음 후 자가평가와 보호자 관찰 데이터를 함께 남길 수 있습니다. 입력값은 치료사 검수 참고용이며 진단이나 치료 방향 결정이 아닙니다.
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            className="w-20 h-20 rounded-full bg-crit shadow-lg shadow-crit/30 inline-flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="녹음 시작"
          >
            <span className="w-6 h-6 rounded-full bg-white block" />
          </button>
          <p className="text-xs text-ink-faint mt-4">버튼을 누르면 녹음이 시작돼요</p>
        </>
      )}

      {phase === "recording" && (
        <>
          <button
            type="button"
            onClick={stop}
            className="w-20 h-20 rounded-full bg-crit shadow-lg shadow-crit/30 inline-flex items-center justify-center animate-pulse"
            aria-label="녹음 정지"
          >
            <span className="w-6 h-6 rounded-md bg-white block" />
          </button>
          <p className="text-sm font-bold text-crit mt-4 tabular">● 녹음 중 {mmss}</p>
          <p className="text-xs text-ink-faint mt-1">다 했으면 버튼을 눌러 멈춰요</p>
        </>
      )}

      {(phase === "recorded" || phase === "uploading") && metrics && (
        <>
          {audioUrlRef.current && (
            <audio controls src={audioUrlRef.current} className="w-full mb-3 h-10" />
          )}
          {quality ? (
            <div className="bg-warn-soft border border-warn rounded-xl px-4 py-3 mb-3 text-left">
              <p className="text-[13px] font-bold text-warn">다시 녹음해 주세요</p>
              <p className="text-xs text-ink-soft mt-0.5">{quality}. 조용한 곳에서 마이크 가까이에서 해보세요.</p>
            </div>
          ) : (
            <div className="border border-line rounded-xl px-4 py-3 mb-3 text-left">
              <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-1.5">
                측정 결과 <span className="bg-ground text-ink-faint rounded-full px-2 py-0.5 text-[10px]">비진단 참고지표</span>
              </p>
              {metricRows(metrics).map(([k, v]) => (
                <p key={k} className="flex justify-between text-[12.5px] py-0.5">
                  <span className="text-ink-soft">{k}</span>
                  <b className="tabular">{v}</b>
                </p>
              ))}
            </div>
          )}
          <div className="border border-line rounded-xl px-4 py-3 mb-3 text-left">
            <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-2">
              자가평가
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SELF_ASSESSMENT.map((item) => (
                <label key={item.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="font-semibold text-ink-soft">{item.label}</span>
                  <select
                    value={selfAssessment[item.key] ?? ""}
                    onChange={(e) => setSelfAssessment((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    className="border border-line rounded-lg px-2 py-1.5 bg-white min-w-24"
                  >
                    <option value="">선택</option>
                    {Array.from({ length: item.max - item.min + 1 }, (_, i) => item.min + i).map((n) => (
                      <option key={n} value={n}>{n}{item.suffix}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
          <div className="border border-line rounded-xl px-4 py-3 mb-3 text-left">
            <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-2">
              보호자 관찰 데이터
            </p>
            <div className="grid grid-cols-1 gap-2">
              {CAREGIVER_OBS.map((item) => (
                <label key={item.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="font-semibold text-ink-soft">{item.label}</span>
                  <select
                    value={caregiverObs[item.key] ?? ""}
                    onChange={(e) => setCaregiverObs((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    className="border border-line rounded-lg px-2 py-1.5 bg-white min-w-24"
                  >
                    <option value="">선택</option>
                    {item.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="flex flex-col gap-1 text-[12.5px]">
                <span className="font-semibold text-ink-soft">보호자 메모</span>
                <textarea
                  value={caregiverObs.memo ?? ""}
                  onChange={(e) => setCaregiverObs((prev) => ({ ...prev, memo: e.target.value }))}
                  rows={2}
                  className="border border-line rounded-lg px-3 py-2 resize-y"
                  placeholder="오늘 연습 중 관찰한 내용을 적어 주세요"
                />
              </label>
            </div>
            <p className="text-[11px] text-ink-faint mt-2">
              제출하면 보호자 관찰 데이터로 저장되며 치료사 검수와 경과보고서에 참고 정보로 반영됩니다.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={start}
              disabled={phase === "uploading"}
              className="border border-line rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              다시 녹음
            </button>
            <button
              type="button"
              onClick={upload}
              disabled={phase === "uploading" || !!quality}
              className="bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-accent-deep disabled:opacity-50"
            >
              {phase === "uploading" ? "제출 중…" : "선생님께 제출"}
            </button>
          </div>
          <p className="text-[10.5px] text-ink-faint mt-3">
            수치는 참고용이에요 · 판단은 담당 선생님이 합니다
          </p>
        </>
      )}

      {phase === "done" && (
        <div className="py-4">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold">제출 완료! 스티커를 받았어요</p>
          <p className="text-xs text-ink-faint mt-1">선생님이 확인하고 피드백을 보내줄 거예요</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2 mt-4">{error}</p>
      )}
    </div>
  );
}
