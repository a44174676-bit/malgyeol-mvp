import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoScenario = {
  title: "병원 접수 상황 말하기",
  area: "구음장애 홈 트레이닝",
  level: "대화 시나리오",
  format: "RECORD",
  description:
    "병원 접수 상황에서 필요한 문장을 연습하고, 치료사가 발화 흐름과 말명료도를 검수하는 과제",
  dose: "상황 문장 1회 이상 · 녹음 제출",
  targetText:
    "안녕하세요. 예약한 환자입니다. 구음장애 때문에 천천히 말하겠습니다.",
  metricKind: "READ",
  goalCondition: "상황 문장을 천천히 1회 이상 말하고 녹음 제출",
};

async function main() {
  const existingByTitle = await prisma.activity.findFirst({
    where: { title: demoScenario.title },
    select: {
      id: true,
      title: true,
      targetText: true,
      area: true,
      level: true,
      format: true,
      description: true,
      dose: true,
      metricKind: true,
      goalCondition: true,
    },
  });

  if (existingByTitle) {
    const needsUpdate = Object.entries(demoScenario).some(
      ([key, value]) =>
        existingByTitle[key as keyof typeof existingByTitle] !== value,
    );

    if (needsUpdate) {
      const updated = await prisma.activity.update({
        where: { id: existingByTitle.id },
        data: demoScenario,
        select: { id: true, title: true },
      });

      console.log(`updated: ${updated.title} (${updated.id})`);
      return;
    }

    console.log(`already exists: ${existingByTitle.title} (${existingByTitle.id})`);
    return;
  }

  const existingByTargetText = await prisma.activity.findFirst({
    where: { targetText: demoScenario.targetText },
    select: { id: true, title: true },
  });

  if (existingByTargetText) {
    console.log(
      `already exists: ${existingByTargetText.title} (${existingByTargetText.id})`,
    );
    return;
  }

  const created = await prisma.activity.create({
    data: demoScenario,
    select: { id: true, title: true },
  });

  console.log(`created: ${created.title} (${created.id})`);
}

main()
  .catch((error) => {
    console.error("failed to add demo scenario activity");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
