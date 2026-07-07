import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { weekStart, todayDow, DAY_LABELS } from "@/lib/dates";
import { DISCLAIMER } from "@/lib/metrics";
import { toggleItemDone, submitObservation } from "./actions";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const patient = await db.patient.findUnique({
    where: { portalToken: token },
    include: {
      prescriptions: {
        where: { weekStart: weekStart() },
        include: {
          items: {
            include: { activity: true, submissions: true },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
      submissions: {
        where: { feedback: { not: null } },
        orderBy: { reviewedAt: "desc" },
        take: 3,
      },
    },
  });
  if (!patient) notFound();

  const todayFrom = new Date();
  todayFrom.setHours(0, 0, 0, 0);
  const obsToday = await db.observationEntry.findFirst({
    where: { patientId: patient.id, date: { gte: todayFrom } },
  });
  const obsKeys: string[] = (() => {
    try {
      return JSON.parse(patient.prescriptions[0]?.obsItemsJson ?? "null") ?? [];
    } catch { return []; }
  })();
  const showObs = (k: string) => obsKeys.length === 0 || obsKeys.includes(k);

  const items = patient.prescriptions[0]?.items ?? [];
  const dow = todayDow();
  const todayItems = items.filter((i) => i.dayOfWeek === dow);
  const doneCount = items.filter((i) => i.status === "DONE").length;
  const totalDone = await db.prescriptionItem.count({
    where: {
      status: "DONE",
      prescription: { patientId: patient.id },
    },
  });

  return (
    <main className="flex-1 max-w-md w-full mx-auto p-5">
      <div className="flex items-center gap-3 mb-5 pt-3">
        <span className="w-11 h-11 rounded-full bg-warm flex items-center justify-center font-bold text-white text-[15px] shrink-0">
          {patient.name.slice(-2)}
        </span>
        <div>
          <h1 className="text-[17px] font-extrabold leading-tight">
            {patient.name.slice(1)}의 오늘 연습
          </h1>
          <p className="text-xs text-ink-soft">
            {DAY_LABELS[dow]}요일 · 윤선영 선생님 처방
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-5 flex items-center gap-4 bg-gradient-to-br from-warm-soft to-[#fbe8cf]">
        <span className="text-2xl" aria-hidden="true">🔥</span>
        <div>
          <p className="text-lg font-extrabold text-[#9a5a10] leading-tight tabular">
            이번 주 {doneCount}/{items.length} 완료
          </p>
          <p className="text-xs text-[#9a6a2e]">꾸준함이 실력이 돼요</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-[#9a6a2e]">모은 스티커</p>
          <p className="text-base font-extrabold text-[#9a5a10] tabular">⭐ {totalDone}개</p>
        </div>
      </div>

      <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
        오늘의 과제 · {todayItems.filter((i) => i.status === "DONE").length}/
        {todayItems.length} 완료
      </p>
      {todayItems.length === 0 && (
        <p className="text-sm text-ink-faint bg-white border border-line rounded-2xl p-5 text-center mb-3">
          오늘은 쉬는 날이에요 🌱
        </p>
      )}
      {todayItems.map((item) => {
        const done = item.status === "DONE";
        return (
          <div
            key={item.id}
            className="bg-white border border-line rounded-2xl p-4 mb-2.5 flex items-center gap-3"
          >
            {item.activity.format === "RECORD" ? (
              <span
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[13px] text-white shrink-0 ${
                  done ? "bg-good border-good" : "border-[#cfd9d5]"
                }`}
              >
                {done ? "✓" : ""}
              </span>
            ) : (
              <form action={toggleItemDone.bind(null, token, item.id)}>
                <button
                  type="submit"
                  aria-label="완료 표시"
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[13px] text-white ${
                    done ? "bg-good border-good" : "border-[#cfd9d5] hover:border-good"
                  }`}
                >
                  {done ? "✓" : ""}
                </button>
              </form>
            )}
            <div className="min-w-0">
              <p
                className={`font-semibold text-sm ${
                  done ? "line-through text-ink-faint" : ""
                }`}
              >
                {item.activity.title}
              </p>
              <p className="text-xs text-ink-faint">
                {item.activity.dose}
                {item.activity.goalCondition && ` · 목표: ${item.activity.goalCondition}`}
              </p>
            </div>
            {item.activity.format === "RECORD" && !done && (
              <Link
                href={`/portal/${token}/record/${item.id}`}
                className="ml-auto shrink-0 bg-accent text-white text-xs font-semibold rounded-lg px-3.5 py-2 hover:bg-accent-deep"
              >
                녹음 시작
              </Link>
            )}
          </div>
        );
      })}

      <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mt-6 mb-3">
        이번 주 전체
      </p>
      <div className="bg-white border border-line rounded-2xl p-4 mb-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 py-1.5 text-[13px]"
          >
            <span className="w-5 font-bold text-ink-faint text-xs shrink-0">
              {DAY_LABELS[item.dayOfWeek]}
            </span>
            <span
              className={`truncate ${
                item.status === "DONE" ? "line-through text-ink-faint" : ""
              }`}
            >
              {item.activity.title}
            </span>
            {item.status === "DONE" && (
              <span className="ml-auto text-good text-xs font-bold shrink-0">완료</span>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-ink-faint text-center py-2">
            이번 주 처방이 아직 없습니다.
          </p>
        )}
      </div>

      <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mt-6 mb-3">
        오늘의 관찰 기록 (보호자·본인)
      </p>
      {obsToday ? (
        <div className="bg-white border border-line rounded-2xl p-4 mb-5 text-sm">
          <p className="font-bold text-good mb-1">✓ 오늘 관찰 기록을 제출했어요</p>
          <p className="text-xs text-ink-soft">
            {[
              obsToday.fatigue !== null && `피로도 ${obsToday.fatigue}/10`,
              obsToday.famIntel !== null && `이해도 ${obsToday.famIntel}/5`,
              obsToday.cough && `사레/기침 ${obsToday.cough}`,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
      ) : (
        <form
          action={submitObservation.bind(null, token)}
          className="bg-white border border-line rounded-2xl p-4 mb-5 flex flex-col gap-3 text-sm"
        >
          {showObs("fatigue") && (
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">말하기 피로도 (0–10)</span>
              <select name="fatigue" className="border border-line rounded-lg px-2 py-1.5 bg-white" defaultValue="">
                <option value="">선택</option>
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
          )}
          {showObs("selfIntel") && (
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">내 말이 전달된 정도 (1–5)</span>
              <select name="selfIntel" className="border border-line rounded-lg px-2 py-1.5 bg-white" defaultValue="">
                <option value="">선택</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
          {showObs("famIntel") && (
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">(보호자) 말 이해 정도 (1–5)</span>
              <select name="famIntel" className="border border-line rounded-lg px-2 py-1.5 bg-white" defaultValue="">
                <option value="">선택</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
          {showObs("repeatQ") && (
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">(보호자) 되묻는 일</span>
              <select name="repeatQ" className="border border-line rounded-lg px-2 py-1.5 bg-white" defaultValue="">
                <option value="">선택</option>
                {["없음", "가끔", "자주"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          )}
          {showObs("phoneCall") && (
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">(보호자) 전화 통화</span>
              <select name="phoneCall" className="border border-line rounded-lg px-2 py-1.5 bg-white" defaultValue="">
                <option value="">선택</option>
                {["가능", "짧게 가능", "어려움"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          )}
          {showObs("cough") && (
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">(보호자) 식사 중 사레/기침</span>
              <select name="cough" className="border border-line rounded-lg px-2 py-1.5 bg-white" defaultValue="">
                <option value="">선택</option>
                {["없음", "1-2회", "자주"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          )}
          <textarea
            name="memo"
            rows={2}
            placeholder="오늘 컨디션 메모 (선택)"
            className="border border-line rounded-lg px-3 py-2 text-[13px] resize-y"
          />
          <button
            type="submit"
            className="bg-accent text-white rounded-lg py-2.5 font-semibold hover:bg-accent-deep"
          >
            관찰 기록 제출
          </button>
        </form>
      )}

      {patient.submissions.length > 0 && (
        <>
          <p className="text-[11px] font-bold tracking-widest text-ink-faint uppercase mb-3">
            선생님의 피드백
          </p>
          <div className="bg-white border border-line rounded-2xl p-4">
            {patient.submissions.map((s) => (
              <div key={s.id} className="py-2 border-b border-line last:border-0">
                {s.targetText && (
                  <p className="text-xs text-ink-faint mb-0.5">
                    &ldquo;{s.targetText}&rdquo;
                  </p>
                )}
                <p className="text-[13.5px]">💬 {s.feedback}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-ink-faint leading-relaxed mt-6 border-t border-line pt-3">
        {DISCLAIMER}
      </p>
    </main>
  );
}
