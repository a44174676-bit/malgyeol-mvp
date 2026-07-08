"use client";

import { useEffect, useRef, useState } from "react";
import { MicPicker } from "@/components/MicPicker";
import { getMicStream } from "@/lib/mic";

export function MicCheckClient() {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [recState, setRecState] = useState<"idle" | "rec" | "done">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [secure] = useState(() =>
    typeof window !== "undefined" ? window.isSecureContext : true
  );

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startMeter() {
    stopAll();
    setError("");
    try {
      const stream = await getMicStream();
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      ctxRef.current = ctx;
      const buf = new Float32Array(1024);
      setListening(true);
      setPeak(0);
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        analyser.getFloatTimeDomainData(buf);
        let rms = 0;
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / buf.length);
        const db = rms > 0.0001 ? Math.max(0, Math.min(95, 96 + 20 * Math.log10(rms))) : 0;
        setLevel(db);
        setPeak((p) => Math.max(p, db));
      };
      loop();
    } catch {
      setError("마이크를 열 수 없습니다. 브라우저 주소창의 마이크 권한을 확인해 주세요.");
      setListening(false);
    }
  }

  function stopAll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null;
    ctxRef.current = null;
    setListening(false);
    setLevel(0);
  }

  async function recordTest() {
    setError("");
    try {
      if (!streamRef.current?.active) await startMeter();
      const rec = new MediaRecorder(streamRef.current!);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setRecState("done");
      };
      recRef.current = rec;
      rec.start();
      setRecState("rec");
      setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 3000);
    } catch {
      setError("녹음 테스트를 시작할 수 없습니다.");
      setRecState("idle");
    }
  }

  const levelOk = peak > 35;

  return (
    <div className="bg-white border border-line rounded-xl p-6 max-w-xl flex flex-col gap-4">
      {!secure && (
        <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2">
          이 주소는 보안 연결(HTTPS/localhost)이 아니라 마이크가 차단됩니다. localhost
          또는 외부접속(https) 주소로 접속하세요.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <MicPicker onChange={() => { if (listening) startMeter(); }} />
        <button
          type="button"
          onClick={listening ? stopAll : startMeter}
          className={`text-sm font-semibold rounded-lg px-4 py-2 ${
            listening ? "border border-line" : "bg-accent text-white"
          }`}
        >
          {listening ? "측정 중지" : "① 소리 측정 시작"}
        </button>
      </div>

      <div>
        <div className="h-5 rounded-full bg-ground overflow-hidden border border-line">
          <div
            className={`h-full transition-all ${level > 35 ? "bg-good" : "bg-warn"}`}
            style={{ width: `${(level / 95) * 100}%` }}
          />
        </div>
        <p className="text-xs text-ink-soft mt-1.5">
          {listening
            ? level > 35
              ? "✓ 소리가 잘 들어오고 있습니다 — 이 마이크를 사용하세요"
              : "말을 해보세요… 막대가 움직이지 않으면 위에서 다른 마이크를 선택하세요"
            : "측정을 시작하고 마이크에 대고 말해 보세요"}
          {peak > 0 && ` (최대 ${Math.round(peak)} dB)`}
        </p>
      </div>

      <div className="border-t border-line pt-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={recordTest}
            disabled={recState === "rec"}
            className="text-sm font-semibold rounded-lg px-4 py-2 bg-crit text-white disabled:opacity-60"
          >
            {recState === "rec" ? "녹음 중 (3초)…" : "② 3초 녹음 테스트"}
          </button>
          {audioUrl && recState === "done" && (
            <audio controls src={audioUrl} className="h-10 flex-1 min-w-52" />
          )}
        </div>
        {recState === "done" && (
          <p className="text-xs text-ink-soft mt-2">
            ▶ 재생해서 목소리가 들리면 정상입니다. 들리지 않으면 다른 마이크를 선택한 뒤
            다시 테스트하세요. {levelOk ? "" : "지금은 입력 신호가 약합니다."}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2">{error}</p>
      )}

      <p className="text-[11.5px] text-ink-faint leading-relaxed">
        여기서 선택한 마이크는 이 브라우저의 모든 검사·녹음 화면(조음 검사, 구음장애
        배터리)에 자동 적용됩니다. Windows 설정 → 개인 정보 → 마이크 허용도 함께
        확인하세요.
      </p>
    </div>
  );
}
