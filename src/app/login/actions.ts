"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.APP_PASSWORD) {
    redirect("/login?error=1");
  }
  const jar = await cookies();
  jar.set("mg_session", password, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14, // 2주
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete("mg_session");
  redirect("/login");
}
