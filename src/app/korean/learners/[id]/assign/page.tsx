import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { KOREAN_SERVICE_LINE } from "@/lib/korean-copy";
import { assignKoreanTasks } from "@/app/korean/actions";

export const dynamic = "force-dynamic";

export default async function KoreanAssignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [learner, activities] = await Promise.all([
    db.patient.findUnique({
      where: { id, serviceLine: KOREAN_SERVICE_LINE },
      include: { prescriptions: { include: { items: true }, orderBy: { weekStart: "desc" }, take: 1 } },
    }),
    db.activity.findMany({
      where: { serviceLine: KOREAN_SERVICE_LINE },
      orderBy: [{ area: "asc" }, { title: "asc" }],
    }),
  ]);
  if (!learner) notFound();
  const selected = new Set(learner.prescriptions[0]?.items.map((item) => item.activityId) ?? []);
  const areas = [...new Set(activities.map((activity) => activity.area))];

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-xl font-bold">발음 과제 배정 · {learner.name}</h1>
        <Link href={`/korean/learners/${learner.id}`} className="text-sm font-semibold text-accent-deep">
          학습자 상세로
        </Link>
      </div>
      <form action={assignKoreanTasks.bind(null, learner.id)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {areas.map((area) => (
            <Card key={area}>
              <Eyebrow>{area}</Eyebrow>
              <div className="flex flex-col gap-2">
                {activities.filter((activity) => activity.area === area).map((activity) => (
                  <label key={activity.id} className="border border-line rounded-xl px-3 py-3 flex gap-3">
                    <input
                      type="checkbox"
                      name="activityId"
                      value={activity.id}
                      defaultChecked={selected.has(activity.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-sm">{activity.title}</span>
                      <span className="block text-xs text-ink-soft">&ldquo;{activity.targetText}&rdquo;</span>
                      <span className="block mt-1">
                        <Pill tone="grey">{activity.level}</Pill>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="sticky bottom-4 bg-white border border-line rounded-xl px-4 py-3 mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">선택한 과제가 이번 주 학습자 포털에 표시됩니다.</p>
          <button type="submit" className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-semibold">
            배정 저장
          </button>
        </div>
      </form>
    </div>
  );
}

