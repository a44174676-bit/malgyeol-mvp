export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** 이번 주 월요일 00:00 */
export function weekStart(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // 월=0
  x.setDate(x.getDate() - day);
  return x;
}

/** 오늘이 주중 몇 번째 요일인지 (월=0) */
export function todayDow(): number {
  return (new Date().getDay() + 6) % 7;
}

export function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtDateTime(d: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]}) ${fmtTime(d)}`;
}

export function fullToday(): string {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export function age(birthYear: number | null): string {
  if (!birthYear) return "";
  return `만 ${new Date().getFullYear() - birthYear}세경`;
}
