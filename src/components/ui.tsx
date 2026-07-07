import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-line rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
      {children}
    </p>
  );
}

const PILL_STYLES: Record<string, string> = {
  teal: "bg-accent-soft text-accent-deep",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  crit: "bg-crit-soft text-crit",
  warm: "bg-warm-soft text-warm",
  grey: "bg-ground text-ink-soft",
};

export function Pill({
  tone = "grey",
  children,
}: {
  tone?: keyof typeof PILL_STYLES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${PILL_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  color = "bg-accent",
  size = "md",
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "w-8 h-8 text-[11px]", md: "w-9 h-9 text-xs", lg: "w-12 h-12 text-base" };
  return (
    <span
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
    >
      {name.slice(-2)}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "bg-accent",
}: {
  value: number;
  tone?: string;
}) {
  return (
    <div className="h-1.5 rounded-full bg-ground overflow-hidden flex-1">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function judgmentLabel(j: string | null): { text: string; tone: "good" | "warn" | "crit" | "grey" } {
  switch (j) {
    case "CORRECT":
      return { text: "정반응", tone: "good" };
    case "APPROX":
      return { text: "왜곡/근사", tone: "warn" };
    case "WRONG":
      return { text: "오반응", tone: "crit" };
    default:
      return { text: "대기", tone: "grey" };
  }
}
