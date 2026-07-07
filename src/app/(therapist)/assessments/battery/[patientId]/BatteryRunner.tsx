"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DYSARTHRIA_BATTERY } from "@/lib/battery";
import {
  computeVoiceMetrics, qualityIssue, metricRows,
  type VoiceMetrics, type FrameSample,
} from "@/lib/metrics";

type SubState = { metrics: VoiceMetrics | null; skipped: boolean };

export function BatteryRunner({ patientId, patientName }: { patientId: string; patientName: string }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [states, setStates] = useState<SubState[]>(() =>
    DYSARTHRIA_BATTERY.map(() => ({ metrics: null, skipped: false }))
  );
  const [recState, setRecState] = useState<"idle" | "rec" | "done">("idle");
  const [quality, setQuality] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const blobsRef = useRef<(Blob | null)[]>(DYSARTHRIA_BATTERY.map(() => null));
  const urlsRef = useRef<(string | null)[]>(DYSARTHRIA_BATTERY.map(() => null));
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const framesRef = useRef<FrameSample[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const urls = urlsRef.current;
    const stream = streamRef;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      urls.forEach((u) => u && URL.revokeObjectURL(u));
      stream.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  const sub = DYSARTHRIA_BATTERY[idx];
  const isLast = idx === DYSARTHRIA_BATTERY.length - 1;
  const doneCount = states.filter((s) => s.metrics || s.skipped).length;

  function loop() {
    const analyser = analyserRef.current, buf = bufRef.current, ctx = ctxRef.current;
    if (!analyser || !buf || !ctx) return;
    rafRef.current = requestAnimationFrame(loop);
    analyser.getFloatTimeDomainData(buf);
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    const db = rms > 0.0001 ? Math.max(0, Math.min(95, 96 + 20 * Math.log10(rms))) : 0;
    let hz = 0;
    if (rms > 0.012) {
      const sr = ctx.sampleRate, minOff = Math.floor(sr / 500), maxOff = Math.floor(sr / 60);
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
    const cv = canvasRef.current;
    if (cv) {
      const c = cv.getContext("2d")!;
      const W = cv.width, H = cv.height;
      c.fillStyle = "#0f1c1a"; c.fillRect(0, 0, W, H);
      const fr = framesRef.current.slice(-160), step = W / 160;
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

  async function startRec() {
    setError(""); setQuality(null);
    try {
      if (!streamRef.current || !streamRef.current.active) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false },
        });
      }
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(streamRef.current).connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(2048);
      framesRef.current = [];
      startTRef.current = performance.now();
      const rec = new MediaRecorder(streamRef.current);
      const at = idx;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        blobsRef.current[at] = blob;
        if (urlsRef.current[at]) URL.revokeObjectURL(urlsRef.current[at]!);
        urlsRef.current[at] = URL.createObjectURL(blob);
        const m = computeVoiceMetrics(framesRef.current, DYSARTHRIA_BATTERY[at].kind);
        setStates((prev) => prev.map((s, i) => (i === at ? { metrics: m, skipped: false } : s)));
        setQuality(qualityIssue(m));
        setRecState("done");
      };
      mediaRef.current = rec;
      rec.start();
      setSeconds(0);
      setRecState("rec");
      loop();
    } catch {
      setError("마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.");
    }
  }

  function stopRec() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    mediaRef.current?.stop();
  }

  function next() {
    setRecState("idle");
    setQuality(null);
    if (isLast) setFinished(true);
    else setIdx(idx + 1);
  }

  function skip() {
    setStates((prev) => prev.map((s, i) => (i === idx ? { metrics: null, skipped: true } : s)));
    blobsRef.current[idx] = null;
    next();
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("patientId", patientId);
      fd.append(
        "resultsJson",
        JSON.stringify(
          DYSARTHRIA_BATTERY.map((s, i) => ({
            key: s.key,
            title: s.title,
            kind: s.kind,
            metrics: states[i].metrics,
          }))
        )
      );
      blobsRef.current.forEach((b, i) => {
        if (b) fd.append(`audio-${i}`, b, `sub-${i}.webm`);
      });
      const res = await fetch("/api/dysarthria", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/assessments/dys/${id}`);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  // ── 제출 화면 ──
  if (finished) {
    return (
      <div className="bg-white border border-line rounded-xl p-6 max-w-2xl">
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
          배터리 완료 — 제출 전 확인
        </p>
        <div className="border border-line rounded-lg divide-y divide-line mb-4">
          {DYSARTHRIA_BATTERY.map((s, i) => (
            <div key={s.key} className="px-3.5 py-2 text-[13px] flex items-center gap-2">
              <b className="w-40 shrink-0">{s.title}</b>
              {states[i].skipped ? (
                <span className="text-ink-faint">건너뜀</span>
              ) : states[i].metrics ? (
                <span className="text-accent-deep tabular">
                  {s.kind === "MPT" && `${states[i].metrics!.maxRunSec}초`}
                  {s.kind === "DDK" && `${states[i].metrics!.rate}회/초 · ${states[i].metrics!.onsets}회`}
                  {s.kind === "READ" && `${states[i].metrics!.voicedSec}초 · 무음 ${states[i].metrics!.pauses}회`}
                </span>
              ) : (
                <span className="text-crit">미시행</span>
              )}
              <button
                type="button"
                onClick={() => { setIdx(i); setFinished(false); setRecState(states[i].metrics ? "done" : "idle"); }}
                className="ml-auto text-xs text-accent-deep font-semibold"
              >
                {states[i].metrics ? "다시" : "시행"}
              </button>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => setFinished(false)}
            className="border border-line rounded-lg px-4 py-2.5 text-sm font-semibold">
            ← 돌아가기
          </button>
          <button type="button" disabled={submitting} onClick={submit}
            className="bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-accent-deep disabled:opacity-50">
            {submitting ? "저장 중…" : "제출하고 결과 보기 →"}
          </button>
        </div>
      </div>
    );
  }

  // ── 하위 과제 진행 화면 ──
  const m = states[idx].metrics;
  const audioUrl = urlsRef.current[idx];
  return (
    <div className="bg-white border border-line rounded-xl p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase">
          {patientName} · 구음장애 선별 배터리
        </p>
        <span className="text-xs font-bold tabular text-accent-deep">
          {idx + 1} / {DYSARTHRIA_BATTERY.length} · 완료 {doneCount}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ground overflow-hidden mb-5">
        <div className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((idx + 1) / DYSARTHRIA_BATTERY.length) * 100}%` }} />
      </div>

      <p className="text-center font-bold text-lg mb-1">{sub.title}</p>
      <p className={`text-center font-extrabold py-3 ${sub.target.length > 25 ? "text-base leading-relaxed" : "text-3xl"}`}>
        {sub.target}
      </p>
      <p className="text-center text-xs text-ink-faint mb-1">{sub.hint}</p>
      <p className="text-center text-[11.5px] text-accent-deep bg-accent-soft rounded-lg px-3 py-1.5 mb-4 inline-block w-full">
        시행 안내: {sub.guide}
      </p>

      {recState === "rec" && (
        <div className="bg-[#0f1c1a] rounded-xl p-3 mb-4">
          <canvas ref={canvasRef} width={640} height={100} className="w-full h-auto block" />
          <p className="text-[11px] text-[#9fbcb5] mt-1.5">
            상대 강도(초록) · 음도(주황) · 경과 {seconds}초
          </p>
        </div>
      )}

      {recState === "done" && m && (
        <>
          {audioUrl && <audio controls src={audioUrl} className="w-full mb-3 h-10" />}
          {quality ? (
            <div className="bg-warn-soft border border-warn rounded-xl px-4 py-3 mb-3">
              <p className="text-[13px] font-bold text-warn">품질 조건 미충족 — {quality}</p>
              <p className="text-xs text-ink-soft">다시 녹음을 권장합니다.</p>
            </div>
          ) : (
            <div className="border border-line rounded-xl px-4 py-3 mb-3">
              <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-1.5">
                측정 결과 <span className="bg-ground rounded-full px-2 py-0.5 text-[10px]">비진단 참고지표</span>
              </p>
              <div className="grid grid-cols-2 gap-x-5">
                {metricRows(m).map(([k, v]) => (
                  <p key={k} className="flex justify-between text-[12.5px] py-0.5">
                    <span className="text-ink-soft">{k}</span>
                    <b className="tabular">{v}</b>
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 justify-center flex-wrap">
        {recState === "idle" && (
          <>
            <button type="button" onClick={startRec}
              className="bg-crit text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-crit/30">
              ● 녹음 시작
            </button>
            <button type="button" onClick={skip}
              className="border border-line rounded-full px-5 py-3 text-sm font-semibold text-ink-faint">
              건너뛰기
            </button>
          </>
        )}
        {recState === "rec" && (
          <button type="button" onClick={stopRec}
            className="bg-crit text-white rounded-full px-6 py-3 text-sm font-bold animate-pulse">
            ■ 정지
          </button>
        )}
        {recState === "done" && (
          <>
            <button type="button" onClick={startRec}
              className="border border-line rounded-lg px-4 py-2.5 text-sm font-semibold">
              다시 녹음
            </button>
            <button type="button" onClick={next}
              className="bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-accent-deep">
              {isLast ? "완료 → 확인" : "다음 과제 →"}
            </button>
          </>
        )}
      </div>
      {idx > 0 && recState !== "rec" && (
        <button type="button" onClick={() => { setIdx(idx - 1); setRecState(states[idx - 1].metrics ? "done" : "idle"); }}
          className="mt-3 text-xs font-semibold text-ink-faint hover:text-accent-deep">
          ← 이전 과제
        </button>
      )}
      {error && <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2 mt-3">{error}</p>}
    </div>
  );
}
