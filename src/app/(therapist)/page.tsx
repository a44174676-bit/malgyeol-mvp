import Link from "next/link";
import { db } from "@/lib/db";
import { weekStart, fmtTime, fullToday, fmtDateTime } from "@/lib/dates";
import { Card, Eyebrow, Pill, Avatar, ProgressBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const todayFrom = new Date();
  todayFrom.setHours(0, 0, 0, 0);
  const todayTo = new Date(todayFrom);
  todayTo.setDate(todayTo.getDate() + 1);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [appointments, pending, weekItems, riskAlerts] = await Promise.all([
    db.appointment.findMany({
      where: { at: { gte: todayFrom, lt: todayTo } },
      include: { patient: true },
      orderBy: { at: "asc" },
    }),
    db.submission.findMany({
      where: { reviewedAt: null },
      include: { patient: true, item: { include: { activity: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.prescriptionItem.findMany({
      where: { prescription: { weekStart: weekStart() } },
      include: { prescription: { include: { patient: true } } },
    }),
    db.observationEntry.findMany({
      where: { date: { gte: weekAgo }, cough: { in: ["1-2회", "자주"] } },
      include: { patient: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const pendingTotal = await db.submission.count({ where: { reviewedAt: null } });

  const done = weekItems.filter((i) => i.status === "DONE").length;
  const compliance = weekItems.length
    ? Math.round((done / weekItems.length) * 100)
    : 0;

  // 환자별 수행률 — 60% 미만 주의
  const byPatient = new Map<string, { name: string; id: string; done: number; total: number }>();
  for (const item of weekItems) {
    const p = item.prescription.patient;
    const cur = byPatient.get(p.id) ?? { name: p.name, id: p.id, done: 0, total: 0 };
    cur.total += 1;
    if (item.status === "DONE") cur.done += 1;
    byPatient.set(p.id, cur);
  }
  const attention = [...byPatient.values()]
    .map((v) => ({ ...v, rate: Math.round((v.done / v.total) * 100) }))
    .filter((v) => v.rate < 60)
    .sort((a, b) => a.rate - b.rate);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">안녕하세요, 윤선영 선생님</h1>
        <span className="text-sm text-ink-faint">{fullToday()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">오늘 세션</p>
          <p className="text-[26px] font-extrabold tabular leading-tight">
            {appointments.length}
            <span className="text-sm font-semibold text-ink-faint ml-1">건</span>
          </p>
          <p className="text-xs text-ink-faint mt-1.5">
            대면 {appointments.filter((a) => a.kind === "대면").length} · 원격{" "}
            {appointments.filter((a) => a.kind === "원격").length}
          </p>
        </Card>
        <Link href="/review" className="block">
          <Card className="h-full hover:border-accent transition-colors">
            <p className="text-[13px] text-ink-soft mb-1.5">치료사 검수 대기 제출물</p>
            <p className="text-[26px] font-extrabold tabular leading-tight">
              {pendingTotal}
              <span className="text-sm font-semibold text-ink-faint ml-1">건</span>
            </p>
            <p className="text-xs text-accent-deep mt-1.5 font-semibold">
              치료사 검수로 이동 →
            </p>
          </Card>
        </Link>
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">이번 주 과제 수행률</p>
          <p className="text-[26px] font-extrabold tabular leading-tight">
            {compliance}
            <span className="text-sm font-semibold text-ink-faint ml-1">%</span>
          </p>
          <p className="text-xs text-ink-faint mt-1.5">
            처방 {weekItems.length}건 중 {done}건 완료
          </p>
        </Card>
      </div>

      {riskAlerts.length > 0 && (
        <Card className="mb-4 border-crit">
          <Eyebrow>확인 요청 알림 — 보호자 관찰 데이터 (최근 7일)</Eyebrow>
          {riskAlerts.map((o) => (
            <div key={o.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[13px] flex-wrap">
              <Link href={`/patients/${o.patientId}`} className="font-semibold hover:text-accent-deep">
                {o.patient.name}
              </Link>
              <Pill tone="crit">식사 중 사레/기침 {o.cough}</Pill>
              <span className="text-xs text-ink-faint">{fmtDateTime(o.date)}</span>
              {o.memo && <span className="text-xs text-ink-soft">메모: {o.memo}</span>}
              <Link href="/review" className="ml-auto text-xs font-semibold text-accent-deep">
                검수하기 →
              </Link>
            </div>
          ))}
          <p className="text-[11px] text-ink-faint mt-2">
            ※ 이 알림은 진단·응급 판단이 아니며, 치료사의 확인이 필요한 보고가 있음을 나타냅니다.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <Eyebrow>오늘 일정</Eyebrow>
            {appointments.length === 0 && (
              <p className="text-sm text-ink-faint py-4">오늘 예약된 세션이 없습니다.</p>
            )}
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2.5 border-b border-line last:border-0"
              >
                <span className="w-11 shrink-0 font-bold text-[13px] text-accent-deep tabular">
                  {fmtTime(a.at)}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/patients/${a.patientId}`}
                    className="font-semibold hover:text-accent-deep"
                  >
                    {a.patient.name}
                  </Link>
                  <p className="text-xs text-ink-faint truncate">
                    {a.patient.diagnosis}
                    {a.memo ? ` · ${a.memo}` : ""}
                  </p>
                </div>
                <span className="ml-auto">
                  <Pill tone={a.kind === "원격" ? "warm" : "teal"}>{a.kind}</Pill>
                </span>
              </div>
            ))}
          </Card>

          <Card>
            <Eyebrow>주의가 필요한 환자 — 이번 주 과제 수행률 60% 미만</Eyebrow>
            {attention.length === 0 && (
              <p className="text-sm text-ink-faint py-2">
                모든 환자가 순조롭게 과제를 수행하고 있습니다.
              </p>
            )}
            {attention.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 py-2.5 border-b border-line last:border-0"
              >
                <Link
                  href={`/patients/${p.id}`}
                  className="w-16 shrink-0 font-semibold text-[13px] hover:text-accent-deep"
                >
                  {p.name}
                </Link>
                <ProgressBar
                  value={p.rate}
                  tone={p.rate < 40 ? "bg-crit" : "bg-warn"}
                />
                <span
                  className={`w-9 text-right text-xs font-bold tabular ${
                    p.rate < 40 ? "text-crit" : "text-warn"
                  }`}
                >
                  {p.rate}%
                </span>
              </div>
            ))}
          </Card>
        </div>

        <Card>
          <Eyebrow>치료사 검수 대기 제출물</Eyebrow>
          {pending.length === 0 && (
            <p className="text-sm text-ink-faint py-4">치료사 검수할 제출물이 없습니다.</p>
          )}
          {pending.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-3 py-2.5 border-b border-line last:border-0"
            >
              <Avatar name={s.patient.name} size="sm" color="bg-accent" />
              <div className="min-w-0">
                <p className="font-semibold text-[13px]">{s.patient.name}</p>
                <p className="text-xs text-ink-soft truncate">
                  {s.item?.activity.title ?? "자유 제출"}
                </p>
                <p className="text-[11px] text-ink-faint">{fmtDateTime(s.createdAt)}</p>
              </div>
              <Link
                href="/review"
                className="ml-auto shrink-0 text-xs font-semibold border border-line rounded-lg px-2.5 py-1.5 hover:border-accent hover:text-accent-deep"
              >
                검수
              </Link>
            </div>
          ))}
          {pendingTotal > pending.length && (
            <Link
              href="/review"
              className="block text-center text-xs font-semibold text-accent-deep pt-3"
            >
              전체 {pendingTotal}건 보기 →
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
