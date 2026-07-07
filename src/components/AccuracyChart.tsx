type Point = { label: string; value: number };

/** 회기별 정반응률 SVG 라인 차트 (준거선 80% 포함) */
export function AccuracyChart({
  points,
  criterion = 80,
}: {
  points: Point[];
  criterion?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-ink-faint py-8 text-center">
        아직 기록된 회기 데이터가 없습니다.
      </p>
    );
  }
  const W = 460;
  const H = 170;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const y = (v: number) => padT + innerH - (v / 100) * innerH;
  const x = (i: number) =>
    points.length === 1
      ? padL + innerW / 2
      : padL + (i / (points.length - 1)) * innerW;

  const poly = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`정반응률 추이: 최근 ${last.value}%`}
    >
      {[20, 40, 60, 80, 100].map((v) => (
        <g key={v}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#e8eeeb" />
          <text x={padL - 6} y={y(v) + 3.5} fontSize="9.5" fill="#8a9a96" textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <line
        x1={padL}
        y1={y(criterion)}
        x2={W - padR}
        y2={y(criterion)}
        stroke="#b3540e"
        strokeDasharray="4 4"
      />
      <text x={W - padR} y={y(criterion) - 4} fontSize="9.5" fill="#b3540e" textAnchor="end">
        준거 {criterion}%
      </text>
      <polyline points={poly} fill="none" stroke="#0e6f66" strokeWidth="2.4" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="3.2" fill="#0e6f66" />
      ))}
      <circle
        cx={x(points.length - 1)}
        cy={y(last.value)}
        r="5"
        fill="#0e6f66"
        stroke="#fff"
        strokeWidth="2"
      />
      <text
        x={x(points.length - 1)}
        y={y(last.value) - 10}
        fontSize="10.5"
        fontWeight="700"
        fill="#0a4f49"
        textAnchor="middle"
      >
        {last.value}%
      </text>
      {points.map((p, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          fontSize="9.5"
          fill="#8a9a96"
          textAnchor="middle"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
