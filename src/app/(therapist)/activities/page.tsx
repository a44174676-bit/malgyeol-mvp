import { db } from "@/lib/db";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { createActivity } from "./actions";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  RECORD: "녹음형",
  CHECK: "체크형",
  PLAY: "놀이형",
};

export default async function ActivitiesPage() {
  const activities = await db.activity.findMany({
    orderBy: [{ area: "asc" }, { title: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  const areas = [...new Set(activities.map((a) => a.area))];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">활동 라이브러리</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          {areas.map((area) => (
            <Card key={area}>
              <Eyebrow>{area}</Eyebrow>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activities
                  .filter((a) => a.area === area)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="border border-line rounded-xl p-3.5 flex flex-col gap-1.5"
                    >
                      <p className="font-semibold text-[13.5px] leading-snug">
                        {a.title}
                      </p>
                      <p className="text-xs text-ink-soft flex-1">{a.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {a.level && <Pill tone="grey">{a.level}</Pill>}
                        <Pill tone="grey">{FORMAT_LABEL[a.format] ?? a.format}</Pill>
                        {a.dose && (
                          <span className="text-[11px] text-ink-faint ml-auto">
                            {a.dose} · 처방 {a._count.items}회
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <Eyebrow>새 활동 만들기</Eyebrow>
          <form action={createActivity} className="flex flex-col gap-3 text-sm">
            <input
              name="title"
              required
              placeholder="활동명 *"
              className="border border-line rounded-lg px-3 py-2 focus:outline-2 focus:outline-accent"
            />
            <div className="flex gap-2">
              <select
                name="area"
                required
                className="border border-line rounded-lg px-2 py-2 bg-white flex-1"
                defaultValue="조음음운"
              >
                <option>조음음운</option>
                <option>언어</option>
                <option>유창성</option>
                <option>음성</option>
                <option>실어증</option>
              </select>
              <select
                name="format"
                className="border border-line rounded-lg px-2 py-2 bg-white flex-1"
                defaultValue="RECORD"
              >
                <option value="RECORD">녹음형 (제출 → 치료사 검수)</option>
                <option value="CHECK">체크형 (완료 표시)</option>
                <option value="PLAY">놀이형 (보호자 진행)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                name="level"
                placeholder="수준 (낱말/문장…)"
                className="border border-line rounded-lg px-3 py-2 flex-1 min-w-0"
              />
              <input
                name="dose"
                placeholder="분량 (예: 20문항 · 10분)"
                className="border border-line rounded-lg px-3 py-2 flex-1 min-w-0"
              />
            </div>
            <input
              name="targetText"
              placeholder="목표 발화 (녹음형일 때, 예: 수박이 시원해요)"
              className="border border-line rounded-lg px-3 py-2"
            />
            <textarea
              name="description"
              rows={3}
              placeholder="설명 · 보호자 진행 가이드"
              className="border border-line rounded-lg px-3 py-2 resize-y"
            />
            <button
              type="submit"
              className="bg-accent text-white rounded-lg py-2.5 font-semibold hover:bg-accent-deep"
            >
              활동 추가
            </button>
          </form>
          <p className="text-[11.5px] text-ink-faint mt-4 leading-relaxed">
            선생님의 임상 노하우가 담긴 활동이 이 플랫폼의 핵심 자산입니다. 영역·수준·형식
            태그를 일관되게 붙여 두면 처방이 빨라집니다.
          </p>
        </Card>
      </div>
    </div>
  );
}
