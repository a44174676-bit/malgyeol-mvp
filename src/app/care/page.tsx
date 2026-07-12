import { redirect } from "next/navigation";
import { getCareRoleHome, requireCareUser } from "@/lib/auth/care-session";

export default async function CareRootPage() {
  const user = await requireCareUser();
  redirect(getCareRoleHome(user.role));
}
