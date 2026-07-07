"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createActivity(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  if (!title || !area) return;
  await db.activity.create({
    data: {
      title,
      area,
      level: String(formData.get("level") ?? "") || null,
      format: String(formData.get("format") ?? "CHECK"),
      description: String(formData.get("description") ?? "") || null,
      dose: String(formData.get("dose") ?? "") || null,
      targetText: String(formData.get("targetText") ?? "") || null,
    },
  });
  revalidatePath("/activities");
}
