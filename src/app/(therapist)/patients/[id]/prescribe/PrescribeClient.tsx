"use client";

import { useMemo, useState, useTransition } from "react";
import { DAY_LABELS } from "@/lib/dates";
import { OBS_ITEMS } from "@/lib/metrics";
import { savePrescription } from "./actions";

type ActivityDto = {
  id: string;
  title: string;
  area: string;
  level: string | null;
  format: string;
  description: string | null;
  dose: string | null;
  targetText: string | null;
  metricKind: string | null;
  goalCondition: string | null;
};

type Slot = { activityId: string; dayOfWeek: number };

const FORMAT_LABEL: Record<string, string> = {
  RECORD: "녹음형",
  CHECK: "체크형",
  PLAY: "놀이형",
};

export function PrescribeClient({
  patientId,
  activities,
  initialItems,
  initialObsKeys,
}: {
  patientId: string;
  activities: ActivityDto[];
  initialItems: Slot[];
  initialObsKeys: string[];
}) {
  const areas = useMemo(
    () => [...new Set(activities.map((a) => a.area))],
    [activities]
  );
  const [area, setArea] = useState<string>(areas[0] ?? "");
  const [slots, setSlots] = useState<Slot[]>(initialItems);
  const [obsKeys, setObsKeys] = useState<string[]>(
    initialObsKeys.length > 0 ? initialObsKeys : OBS_ITEMS.map((o) => o.key)
  );
  const [pending, startTransition] = useTransition();

  function toggleObs(key: string) {
    setObsKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const byId = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities]
  );

  function addToNextFreeDay(activityId: string) {
    setSlots((prev) => {
      const used = new Set(prev.map((s) => s.dayOfWeek));
      let day = 0;
      while (used.has(day) && day < 7) day++;
      if (day >= 7) day = 6; // 모든 요일이 차면 일요일에 중복 배정
      return [...prev, { activityId, dayOfWeek: day }];
    });
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSlot(index: number, dayOfWeek: number) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, dayOfWeek } : s))
    );
  }

  const filtered = activities.filter((a) => a.area === area);
  const sorted = slots
    .map((s, index) => ({ ...s, index }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 items-start">
      <div className="bg-white border border-line rounded-xl p-5">
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
          활동 라이브러리
        </p>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              className={`text-[12.5px] px-3 py-1.5 rounded-full border ${
                a === area
                  ? "bg-ink text-white border-ink font-semibold"
                  : "border-line text-ink-soft hover:border-ink-faint"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="border border-line rounded-xl p-3.5 flex flex-col gap-1.5"
            >
              <p className="font-semibold text-[13.5px] leading-snug">{a.title}</p>
              <p className="text-xs text-ink-soft flex-1">{a.description}</p>
              {a.targetText && (
                <p className="text-[11.5px] text-ink-soft">
                  목표 발화: <b className="text-ink">{a.targetText}</b>
                </p>
              )}
              <p className="text-[11.5px] text-ink-faint">
                {a.metricKind && `과제 유형: ${a.metricKind}`}
                {a.metricKind && a.goalCondition && " · "}
                {a.goalCondition && `수행 조건: ${a.goalCondition}`}
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="flex gap-1">
                  {a.level && (
                    <span className="text-[11px] font-semibold bg-ground text-ink-soft px-2 py-0.5 rounded-full">
                      {a.level}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold bg-ground text-ink-soft px-2 py-0.5 rounded-full">
                    {FORMAT_LABEL[a.format] ?? a.format}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => addToNextFreeDay(a.id)}
                  className="text-xs font-semibold bg-accent text-white rounded-lg px-3 py-1.5 hover:bg-accent-deep"
                >
                  담기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl p-5">
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
          이번 주 스케줄
        </p>
        <div className="flex flex-col gap-2">
          {sorted.length === 0 && (
            <p className="text-sm text-ink-faint py-4 text-center border border-dashed border-line rounded-lg">
              왼쪽에서 활동을 담아 주세요
            </p>
          )}
          {sorted.map((s) => {
            const act = byId.get(s.activityId);
            return (
              <div
                key={s.index}
                className="border border-line rounded-lg px-3 py-2.5 flex items-center gap-3"
              >
                <select
                  value={s.dayOfWeek}
                  onChange={(e) => moveSlot(s.index, Number(e.target.value))}
                  className="border border-line rounded-md px-1.5 py-1 text-xs font-bold bg-white"
                  aria-label="요일"
                >
                  {DAY_LABELS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate">{act?.title}</p>
                  <p className="text-[11.5px] text-ink-faint">
                    {act?.dose}
                    {act?.targetText && ` · 목표 발화: ${act.targetText}`}
                    {act?.goalCondition && ` · 수행 조건: ${act.goalCondition}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(s.index)}
                  className="ml-auto text-ink-faint hover:text-crit text-base px-1.5"
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mt-5 mb-2">
          보호자 관찰 항목 (포털에 표시될 문항)
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {OBS_ITEMS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => toggleObs(o.key)}
              className={`text-[12px] px-3 py-1.5 rounded-full border font-semibold ${
                obsKeys.includes(o.key)
                  ? "bg-accent-soft border-accent text-accent-deep"
                  : "border-line text-ink-faint"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-4 bg-accent-soft text-accent-deep rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
          <span>
            주 {slots.length}회 · 녹음{" "}
            {slots.filter((s) => byId.get(s.activityId)?.format === "RECORD").length}건 · 관찰{" "}
            {obsKeys.length}항목
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                savePrescription(
                  patientId,
                  slots.map(({ activityId, dayOfWeek }) => ({ activityId, dayOfWeek })),
                  obsKeys
                )
              )
            }
            className="bg-accent text-white rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-accent-deep disabled:opacity-50"
          >
            {pending ? "저장 중…" : "처방 저장"}
          </button>
        </div>
        <p className="text-[11.5px] text-ink-faint mt-3 leading-relaxed">
          저장하면 이번 주 처방이 교체되고, 보호자 포털에 즉시 반영됩니다.
        </p>
      </div>
    </div>
  );
}
