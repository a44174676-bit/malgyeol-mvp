import Link from "next/link";
import { db } from "@/lib/db";
import { weekStart, age } from "@/lib/dates";
import { Card, Eyebrow, Pill, Avatar } from "@/components/ui";
import { createPatient } from "./actions";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await db.patient.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      prescriptions: {
        where: { weekStart: weekStart() },
        include: { items: true },
      },
      submissions: { where: { judgment: null } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">환자 관리</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <Card>
          <Eyebrow>등록 환자 {patients.length}명</Eyebrow>
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] text-ink-faint border-b border-line">
                <th className="pb-2 font-semibold">이름</th>
                <th className="pb-2 font-semibold">진단</th>
                <th className="pb-2 font-semibold">이번 주 과제</th>
                <th className="pb-2 font-semibold">치료사 검수 대기</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const items = p.prescriptions[0]?.items ?? [];
                const done = items.filter((i) => i.status === "DONE").length;
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={p.name} size="sm" />
                        <span>
                          <Link
                            href={`/patients/${p.id}`}
                            className="font-semibold hover:text-accent-deep"
                          >
                            {p.name}
                          </Link>
                          <span className="block text-[11px] text-ink-faint">
                            {age(p.birthYear)} {p.gender ?? ""}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-ink-soft">{p.diagnosis}</td>
                    <td className="py-3 tabular">
                      {items.length > 0 ? (
                        <Pill tone={done === items.length ? "good" : done === 0 ? "warn" : "teal"}>
                          {done}/{items.length} 완료
                        </Pill>
                      ) : (
                        <Pill tone="grey">처방 없음</Pill>
                      )}
                    </td>
                    <td className="py-3 tabular">
                      {p.submissions.length > 0 ? (
                        <Pill tone="crit">{p.submissions.length}건</Pill>
                      ) : (
                        <span className="text-ink-faint text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/patients/${p.id}`}
                        className="text-xs font-semibold text-accent-deep"
                      >
                        상세 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <Eyebrow>새 환자 등록</Eyebrow>
          <form action={createPatient} className="flex flex-col gap-3 text-sm">
            <input
              name="name"
              required
              placeholder="이름 *"
              className="border border-line rounded-lg px-3 py-2 focus:outline-2 focus:outline-accent"
            />
            <div className="flex gap-2">
              <input
                name="birthYear"
                type="number"
                placeholder="출생연도 (예: 2020)"
                className="border border-line rounded-lg px-3 py-2 flex-1 min-w-0 focus:outline-2 focus:outline-accent"
              />
              <select
                name="gender"
                className="border border-line rounded-lg px-2 py-2 bg-white focus:outline-2 focus:outline-accent"
                defaultValue=""
              >
                <option value="">성별</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>
            <input
              name="diagnosis"
              required
              placeholder="진단명 * (예: 조음음운장애)"
              className="border border-line rounded-lg px-3 py-2 focus:outline-2 focus:outline-accent"
            />
            <textarea
              name="memo"
              rows={3}
              placeholder="메모 (검사 결과, 치료 빈도 등)"
              className="border border-line rounded-lg px-3 py-2 resize-y focus:outline-2 focus:outline-accent"
            />
            <button
              type="submit"
              className="bg-accent text-white rounded-lg py-2.5 font-semibold hover:bg-accent-deep"
            >
              등록
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
