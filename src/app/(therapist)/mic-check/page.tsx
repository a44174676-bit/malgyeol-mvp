import { MicCheckClient } from "./MicCheckClient";

export const dynamic = "force-dynamic";

export default function MicCheckPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-2">마이크 점검</h1>
      <p className="text-[13px] text-ink-soft mb-5">
        녹음이 안 되거나 재생 시 소리가 없을 때, 검사 전에 여기서 마이크를 확인하세요.
      </p>
      <MicCheckClient />
    </div>
  );
}
