import type { Metadata } from "next";
import { requireCareRole } from "@/lib/auth/care-session";
import { CareRoleHome } from "../_components/CareRoleHome";

export const metadata: Metadata = {
  title: "말결 Care 환자 홈",
};

export default async function CarePatientPage() {
  const user = await requireCareRole(["PATIENT"]);

  return (
    <CareRoleHome
      user={user}
      title="환자 홈"
      notice="과제와 피드백 기능은 다음 단계에서 연결됩니다."
    />
  );
}
