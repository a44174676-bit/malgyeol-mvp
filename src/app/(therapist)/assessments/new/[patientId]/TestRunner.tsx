"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decompose } from "@/lib/phonology";

type Dist = { syl: number; part: "cho" | "jong" };
type ItemState = { response: string; distorted: Dist[] };

function consonantOptions(word: string): { label: string; dist: Dist }[] {
  const out: { label: string; dist: Dist }[] = [];
  decompose(word).forEach((s, i) => {
    if (s.cho !== "ㅇ") {
      out.push({
        label: `${s.cho} (${i === 0 ? "어두" : "어중"}초성)`,
        dist: { syl: i, part: "cho" },
      });
    }
    if (s.jong !== "") {
      out.push({ label: `${s.jong} (종성)`, dist: { syl: i, part: "jong" } });
    }
  });
  return out;
}

export function TestRunner({
  patientId,
  patientName,
  stimuli,
  level,
}: {
  patientId: string;
  patientName: string;
  stimuli: { text: string; emoji: string }[];
  level: "WORD" | "SENTENCE";
}) {
  const words = stimuli.map((s) => s.text);
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [items, setItems] = useState<ItemState[]>(() =>
    words.map((w) => ({ response: w, distorted: [] }))
  );
  const [finished, setFinished] = useState(false);
  const [showDistort, setShowDistort] = useState(false);
  const [recState, setRecState] = useState<"idle" | "rec">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recordedCount, setRecordedCount] = useState(0);
  const [audioUrls, setAudioUrls] = useState<(string | null)[]>(() =>
    words.map(() => null)
  );

  const blobsRef = useRef<(Blob | null)[]>(words.map(() => null));
  const urlsRef = useRef<(string | null)[]>(words.map(() => null));
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    const stream = streamRef;
    return () => {
      urls.forEach((u) => u && URL.revokeObjectURL(u));
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const word = words[idx];
  const item = items[idx];
  const isLast = idx === words.length - 1;

  function patch(p: Partial<ItemState>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...p } : it)));
  }

  async function toggleRecord() {
    setError("");
    if (recState === "rec") {
      recRef.current?.stop();
      return;
    }
    try {
      if (!streamRef.current || !streamRef.current.active) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const rec = new MediaRecorder(streamRef.current);
      const at = idx;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        blobsRef.current[at] = blob;
        if (urlsRef.current[at]) URL.revokeObjectURL(urlsRef.current[at]!);
        urlsRef.current[at] = URL.createObjectURL(blob);
        setAudioUrls([...urlsRef.current]);
        setRecordedCount(blobsRef.current.filter(Boolean).length);
        setRecState("idle");
      };
      recRef.current = rec;
      rec.start();
      setRecState("rec");
    } catch {
      setError("마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요. (녹음 없이 검사는 계속 가능합니다)");
      setRecState("idle");
    }
  }

  function stopRecIfActive() {
    if (recState === "rec") recRef.current?.stop();
  }

  function next() {
    stopRecIfActive();
    setShowDistort(false);
    if (isLast) setFinished(true);
    else setIdx(idx + 1);
  }

  function toggleDist(d: Dist) {
    const has = item.distorted.some((x) => x.syl === d.syl && x.part === d.part);
    patch({
      distorted: has
        ? item.distorted.filter((x) => !(x.syl === d.syl && x.part === d.part))
        : [...item.distorted, d],
    });
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("patientId", patientId);
      fd.append("level", level);
      fd.append(
        "itemsJson",
        JSON.stringify(
          words.map((w, i) => ({
            word: w,
            response: items[i].response.trim(),
            distorted: items[i].distorted,
          }))
        )
      );
      blobsRef.current.forEach((b, i) => {
        if (b) fd.append(`audio-${i}`, b, `item-${i}.webm`);
      });
      const res = await fetch("/api/assessments", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/assessments/${id}`);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  // ── 제출 전 확인 화면 ──
  if (finished) {
    const flagged = words
      .map((w, i) => ({ w, i }))
      .filter(
        ({ w, i }) => items[i].response.trim() !== w || items[i].distorted.length > 0
      );
    return (
      <div className="bg-white border border-line rounded-xl p-6 max-w-xl">
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
          검사 완료 — 제출 전 확인
        </p>
        <p className="text-sm mb-4">
          총 {words.length}문항 · 오류 기록 {flagged.length}건 · 녹음 {recordedCount}개
        </p>
        {flagged.length > 0 && (
          <div className="border border-line rounded-lg divide-y divide-line mb-4 max-h-64 overflow-y-auto">
            {flagged.map(({ w, i }) => (
              <div key={i} className="px-3.5 py-2 text-[13.5px] flex items-center gap-2 flex-wrap">
                <b>{w}</b>
                <span className="text-ink-faint">→</span>
                <span className="text-crit font-semibold">
                  {items[i].response.trim() || "(무반응)"}
                </span>
                {items[i].distorted.map((d, k) => {
                  const syl = decompose(w)[d.syl];
                  return (
                    <span
                      key={k}
                      className="text-[11px] font-semibold bg-warn-soft text-warn px-2 py-0.5 rounded-full"
                    >
                      왜곡: {d.part === "cho" ? syl?.cho : syl?.jong}
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIdx(i);
                    setFinished(false);
                  }}
                  className="ml-auto text-xs text-accent-deep font-semibold"
                >
                  수정
                </button>
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2 mb-3">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFinished(false)}
            className="border border-line rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            ← 돌아가기
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-accent-deep disabled:opacity-50"
          >
            {submitting ? "저장·분석 중…" : "제출하고 자동 분석 →"}
          </button>
        </div>
      </div>
    );
  }

  // ── 문항 진행 화면 ──
  const distOpts = consonantOptions(word);
  const audioUrl = audioUrls[idx];

  return (
    <div className="bg-white border border-line rounded-xl p-6 max-w-xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase">
          {patientName} · 조음 선별검사 ({level === "SENTENCE" ? "문장" : "낱말"} 수준)
        </p>
        <span className="text-xs font-bold tabular text-accent-deep">
          {idx + 1} / {words.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ground overflow-hidden mb-6">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((idx + 1) / words.length) * 100}%` }}
        />
      </div>

      <p className="text-center text-6xl py-2" aria-hidden="true">
        {stimuli[idx].emoji}
      </p>
      <p className={`text-center font-extrabold tracking-wide ${level === "SENTENCE" ? "text-2xl py-3" : "text-4xl py-4"}`}>
        {word}
      </p>

      {/* 녹음 컨트롤 */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          type="button"
          onClick={toggleRecord}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold border-2 ${
            recState === "rec"
              ? "bg-crit text-white border-crit animate-pulse"
              : "border-crit text-crit hover:bg-crit-soft"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              recState === "rec" ? "bg-white" : "bg-crit"
            }`}
          />
          {recState === "rec" ? "녹음 중 — 눌러서 정지" : "아동 발화 녹음"}
        </button>
        {audioUrl && recState === "idle" && (
          <audio controls src={audioUrl} className="h-9 max-w-48" />
        )}
      </div>

      <label className="text-xs font-semibold text-ink-soft block mb-1.5">
        아동 발화 전사 (들리는 대로 한글로 — 대치·생략은 여기서 잡힙니다)
      </label>
      <input
        type="text"
        value={item.response}
        onChange={(e) => patch({ response: e.target.value })}
        className="w-full border border-line rounded-lg px-3.5 py-2.5 text-lg text-center font-semibold focus:outline-2 focus:outline-accent mb-3"
      />

      {/* 왜곡 자음 선택 패널 */}
      {showDistort && (
        <div className="border border-warn bg-warn-soft rounded-lg p-3.5 mb-3">
          <p className="text-xs font-bold text-warn mb-2">
            왜곡된 자음을 선택하세요 (전사로 표현 안 되는 오류 — 치간음화, 설측음화 등)
          </p>
          <div className="flex gap-2 flex-wrap">
            {distOpts.map((o, k) => {
              const on = item.distorted.some(
                (x) => x.syl === o.dist.syl && x.part === o.dist.part
              );
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleDist(o.dist)}
                  className={`text-[13px] font-bold rounded-full px-3.5 py-1.5 border-2 ${
                    on
                      ? "bg-warn text-white border-warn"
                      : "bg-white text-ink-soft border-line hover:border-warn"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => {
            patch({ response: word, distorted: [] });
            next();
          }}
          className="bg-good-soft text-good border-2 border-good rounded-lg py-2.5 text-[13px] font-bold hover:opacity-85"
        >
          정조음 ✓
        </button>
        <button
          type="button"
          onClick={next}
          className="border-2 border-line rounded-lg py-2.5 text-[13px] font-bold text-ink-soft hover:border-accent hover:text-accent-deep"
        >
          대치·생략
        </button>
        <button
          type="button"
          onClick={() => {
            if (showDistort && item.distorted.length > 0) next();
            else setShowDistort(!showDistort);
          }}
          className={`border-2 rounded-lg py-2.5 text-[13px] font-bold ${
            showDistort
              ? "bg-warn text-white border-warn"
              : "border-line text-ink-soft hover:border-warn hover:text-warn"
          }`}
        >
          {showDistort && item.distorted.length > 0 ? "왜곡 기록 →" : "왜곡"}
        </button>
        <button
          type="button"
          onClick={() => {
            patch({ response: "", distorted: [] });
            next();
          }}
          className="border-2 border-line rounded-lg py-2.5 text-[13px] font-bold text-ink-faint hover:border-crit hover:text-crit"
        >
          무반응
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        {idx > 0 ? (
          <button
            type="button"
            onClick={() => {
              stopRecIfActive();
              setShowDistort(false);
              setIdx(idx - 1);
            }}
            className="text-xs font-semibold text-ink-faint hover:text-accent-deep"
          >
            ← 이전 문항
          </button>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-ink-faint">
          녹음은 선택 사항 · 결과 화면에서 다시 들을 수 있습니다
        </span>
      </div>
      {error && (
        <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2 mt-3">{error}</p>
      )}
    </div>
  );
}
