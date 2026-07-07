import { DEMO_NOTICE } from "@/lib/demo";

export function DemoBanner() {
  return (
    <div className="mb-5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
      <b className="font-extrabold">공개 베타 데모</b>
      <span className="ml-2">{DEMO_NOTICE}</span>
    </div>
  );
}
