"use client";

// 마이크 장치 선택 공용 유틸 — 선택한 장치는 브라우저에 저장되어
// 검사·배터리·녹음 화면에서 공통으로 사용됩니다.

const KEY = "malgyeol.micId";

export function getSavedMicId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveMicId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}

export async function listMics(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}

/** 저장된 장치 우선으로 마이크 스트림 획득 (장치 없으면 기본으로 폴백) */
export async function getMicStream(): Promise<MediaStream> {
  const saved = getSavedMicId();
  const base = { echoCancellation: false, noiseSuppression: false };
  if (saved) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { ...base, deviceId: { exact: saved } },
      });
    } catch {
      // 저장된 장치가 사라진 경우 기본 장치로 폴백
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: base });
}
