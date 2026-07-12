import type { Metadata } from "next";
import { requireCareRole } from "@/lib/auth/care-session";
import { CareRoleHome } from "../_components/CareRoleHome";

export const metadata: Metadata = {
  title: "말결 Care 보호자 홈",
};

export default async function CareCaregiverPage() {
  const user = await requireCareRole(["CAREGIVER"]);

  return (
    <CareRoleHome
      user={user}
      title="보호자 홈"
      notice="연결된 환자 지원 기능은 다음 단계에서 연결됩니다."
    />
  );
}
