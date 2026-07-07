"use client";

import { useTransition } from "react";
import { deletePatient } from "../actions";

export function DeletePatientButton({
  patientId,
  name,
}: {
  patientId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            `${name} 환자의 모든 기록(목표·세션·처방·녹음)이 영구 삭제됩니다.\n정말 삭제할까요?`
          )
        ) {
          startTransition(() => deletePatient(patientId));
        }
      }}
      className="text-xs text-ink-faint hover:text-crit hover:border-crit border border-line rounded-lg px-3 py-1.5 disabled:opacity-50"
    >
      {pending ? "삭제 중…" : "환자 삭제"}
    </button>
  );
}
