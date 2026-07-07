import { PrismaClient } from "@prisma/client";
import { KOREAN_TASKS, koreanActivityData } from "../src/lib/korean-tasks";

const prisma = new PrismaClient();

function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

async function main() {
  const learner = await prisma.patient.upsert({
    where: { id: "korean_demo_learner" },
    update: {
      serviceLine: "KOREAN",
      name: "데모 학습자",
      diagnosis: "한국어 학습",
      memo: "말결 Korean 교육용 더미 학습자",
    },
    create: {
      id: "korean_demo_learner",
      serviceLine: "KOREAN",
      name: "데모 학습자",
      diagnosis: "한국어 학습",
      memo: "말결 Korean 교육용 더미 학습자",
      portalToken: "korean-demo-learner-token",
    },
    select: { id: true, name: true, portalToken: true },
  });

  let created = 0;
  let updated = 0;
  const activityIds: string[] = [];

  for (const task of KOREAN_TASKS) {
    const data = koreanActivityData(task);
    const existing = await prisma.activity.findFirst({
      where: {
        serviceLine: "KOREAN",
        OR: [{ id: task.id }, { title: data.title }, { targetText: data.targetText }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.activity.update({
        where: { id: existing.id },
        data,
      });
      activityIds.push(existing.id);
      updated += 1;
    } else {
      const activity = await prisma.activity.create({
        data: { id: task.id, ...data },
        select: { id: true },
      });
      activityIds.push(activity.id);
      created += 1;
    }
  }

  const ws = weekStart();
  const existingPrescription = await prisma.prescription.findFirst({
    where: { patientId: learner.id, weekStart: ws },
  });

  if (!existingPrescription) {
    await prisma.prescription.create({
      data: {
        patientId: learner.id,
        weekStart: ws,
        obsItemsJson: JSON.stringify(["confidence", "difficulty", "memo"]),
        items: {
          create: activityIds.slice(0, 4).map((activityId, index) => ({
            activityId,
            dayOfWeek: index,
          })),
        },
      },
    });
  }

  console.log(
    `korean demo ready: learner=${learner.name}, portal=/korean/portal/${learner.portalToken}, activities created=${created}, updated=${updated}`,
  );
}

main()
  .catch((error) => {
    console.error("failed to add Korean demo data");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
