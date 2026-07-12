import type { Metadata } from "next";
import { requireCareRole } from "@/lib/auth/care-session";
import { CareRoleHome } from "../_components/CareRoleHome";

export const metadata: Metadata = {
  title: "말결 Care 언어재활사 홈",
};

export default async function CareTherapistPage() {
  const user = await requireCareRole(["THERAPIST"]);

  return (
    <CareRoleHome
      user={user}
      title="언어재활사 홈"
      notice="환자 배정과 과제 생성 기능은 다음 단계에서 연결됩니다."
    />
  );
}
