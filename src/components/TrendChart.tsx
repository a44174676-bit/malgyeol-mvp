type Point = { label: string; value: number };

/** 비진단 지표 시계열 미니 차트 (단위 자유) */
export function TrendChart({
  title,
  sub,
  unit,
  points,
}: {
  title: string;
  sub?: string;
  unit: string;
  points: Point[];
}) {
  const W = 330, H = 110, padL = 30, padB = 18, padT = 16;
  if (points.length === 0) {
    return (
      <div className="border border-line rounded-xl p-3.5">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="text-xs text-ink-faint py-4 text-center">데이터 없음</p>
      </div>
    );
  }
  const max = Math.max(...points.map((p) => p.value), 0.1) * 1.25;
  const x = (i: number) =>
    points.length === 1 ? W / 2 : padL + (i / (points.length - 1)) * (W - padL - 12);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const last = points[points.length - 1];

  return (
    <div className="border border-line rounded-xl p-3.5">
      <p className="text-[13px] font-semibold">
        {title}{" "}
        <span className="text-[10px] font-semibold bg-ground text-ink-faint rounded-full px-2 py-0.5 align-middle">
          참고지표
        </span>
      </p>
      {sub && <p className="text-[11px] text-ink-faint">{sub}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-1" role="img" aria-label={`${title} 추이, 최근 ${last.value}${unit}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} y1={y((max * f) / 1.25)} x2={W - 8} y2={y((max * f) / 1.25)} stroke="#e8eeeb" />
        ))}
        <polyline
          points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
          fill="none" stroke="#0e6f66" strokeWidth="2.2"
        />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#0e6f66" />
        ))}
        <circle cx={x(points.length - 1)} cy={y(last.value)} r="4.6" fill="#0e6f66" stroke="#fff" strokeWidth="2" />
        <text x={x(points.length - 1)} y={y(last.value) - 8} fontSize="10" fontWeight="700" fill="#0a4f49" textAnchor="middle">
          {last.value}{unit}
        </text>
        {points.map((p, i) => (
          <text key={i} x={x(i)} y={H - 4} fontSize="8.5" fill="#8a9a96" textAnchor="middle">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
