import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { weekStart } from "@/lib/dates";
import { KOREAN_NOTICE, KOREAN_SERVICE_LINE } from "@/lib/korean-copy";

export const dynamic = "force-dynamic";

export default async function KoreanPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const learner = await db.patient.findFirst({
    where: { portalToken: token, serviceLine: KOREAN_SERVICE_LINE },
    include: {
      prescriptions: {
        where: { weekStart: weekStart() },
        include: { items: { include: { activity: true } } },
      },
    },
  });
  if (!learner) notFound();
  const items = learner.prescriptions[0]?.items ?? [];

  return (
    <main className="min-h-screen bg-ground p-4 sm:p-7">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5">
          <p className="text-sm text-ink-faint">말결 Korean</p>
          <h1 className="text-xl font-bold">{learner.name}님의 한국어 생활문장 연습</h1>
        </div>
        <div className="bg-white border border-line rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-widest text-ink-faint mb-3">오늘의 과제</p>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/korean/portal/${token}/record/${item.id}`}
                className="border border-line rounded-xl px-4 py-3 hover:border-accent"
              >
                <p className="font-semibold text-sm">{item.activity.title}</p>
                <p className="text-xs text-ink-soft">&ldquo;{item.activity.targetText}&rdquo;</p>
                <p className="text-[11px] text-accent-deep mt-1">
                  {item.status === "DONE" ? "제출 완료 · 다시 연습 가능" : "녹음 제출하기"}
                </p>
              </Link>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-ink-faint py-5 text-center">배정된 과제가 없습니다.</p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-ink-faint leading-relaxed mt-5">{KOREAN_NOTICE}</p>
      </div>
    </main>
  );
}

