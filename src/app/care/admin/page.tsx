import type { Metadata } from "next";
import { requireCareRole } from "@/lib/auth/care-session";
import { CareRoleHome } from "../_components/CareRoleHome";

export const metadata: Metadata = {
  title: "말결 Care 관리자 홈",
};

export default async function CareAdminPage() {
  const user = await requireCareRole(["ADMIN"]);

  return (
    <CareRoleHome
      user={user}
      title="관리자 홈"
      notice="사용자 연결 관리 기능은 다음 단계에서 연결됩니다."
    />
  );
}
