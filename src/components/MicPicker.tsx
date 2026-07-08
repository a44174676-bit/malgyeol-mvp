"use client";

import { useCallback, useEffect, useState } from "react";
import { getSavedMicId, saveMicId, listMics } from "@/lib/mic";

/** 마이크 선택 드롭다운 — 선택은 브라우저에 저장되어 모든 녹음 화면에 적용 */
export function MicPicker({ onChange }: { onChange?: (id: string) => void }) {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [needPermission, setNeedPermission] = useState(false);

  const refresh = useCallback(async () => {
    try {
      let list = await listMics();
      // 권한 전에는 label이 비어 있음 → 권한 요청 후 재조회
      if (list.length === 0 || list.every((d) => !d.label)) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((t) => t.stop());
        list = await listMics();
      }
      setMics(list);
      setNeedPermission(false);
      const saved = getSavedMicId();
      const initial =
        (saved && list.some((d) => d.deviceId === saved) && saved) ||
        list[0]?.deviceId ||
        "";
      setSelected(initial);
      if (initial) saveMicId(initial);
    } catch {
      setNeedPermission(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (needPermission) {
    return (
      <button
        type="button"
        onClick={refresh}
        className="text-xs font-semibold text-crit bg-crit-soft rounded-lg px-3 py-2"
      >
        마이크 권한이 필요합니다 — 눌러서 허용
      </button>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs text-ink-soft">
      <span className="font-semibold shrink-0">🎙 마이크</span>
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          saveMicId(e.target.value);
          onChange?.(e.target.value);
        }}
        className="border border-line rounded-lg px-2 py-1.5 bg-white max-w-56 text-xs"
      >
        {mics.map((d, i) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `마이크 ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
}
