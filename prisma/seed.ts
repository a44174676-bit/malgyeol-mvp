import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// 이번 주 월요일 00:00
function weekStart(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // 월=0
  x.setDate(x.getDate() - day);
  return x;
}

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  await db.submission.deleteMany();
  await db.prescriptionItem.deleteMany();
  await db.prescription.deleteMany();
  await db.appointment.deleteMany();
  await db.sessionNote.deleteMany();
  await db.goal.deleteMany();
  await db.activity.deleteMany();
  await db.patient.deleteMany();

  // ── 활동 라이브러리 ──
  const actCard = await db.activity.create({
    data: {
      title: "/ㅅ/ 어중 그림카드 이름대기",
      area: "조음음운",
      level: "낱말",
      format: "RECORD",
      description: "목표 음소가 어중에 오는 그림 20장. 녹음 제출 후 치료사가 검수합니다.",
      dose: "20문항 · 약 10분",
      targetText: "수박이 시원해요",
    },
  });
  const actMinPair = await db.activity.create({
    data: {
      title: "최소대립쌍 듣고 고르기",
      area: "조음음운",
      level: "지각",
      format: "CHECK",
      description: "/사–다/, /솔–돌/ 등 듣고 그림 선택. 지각 훈련용.",
      dose: "16문항 · 약 7분",
    },
  });
  const actImit = await db.activity.create({
    data: {
      title: "따라 말하기: /i/ 문맥 집중 세트",
      area: "조음음운",
      level: "낱말",
      format: "RECORD",
      description: "치료사 녹음 모델을 듣고 모방합니다. 시각 큐 포함 10문항.",
      dose: "10문항 · 약 8분",
      targetText: "시소를 타요",
    },
  });
  const actHidden = await db.activity.create({
    data: {
      title: "/ㅅ/ 낱말 숨은그림 찾기",
      area: "조음음운",
      level: "놀이",
      format: "PLAY",
      description: "장면 속 /ㅅ/ 낱말을 찾아 이름대기. 보호자 진행 가이드 포함.",
      dose: "놀이형 · 약 15분",
    },
  });
  const actScript = await db.activity.create({
    data: {
      title: "일상 스크립트 낭독: 카페 주문",
      area: "실어증",
      level: "문장",
      format: "RECORD",
      description: "개인 맞춤 스크립트를 반복 낭독합니다 (Script Training).",
      dose: "스크립트 1개 · 약 10분",
      targetText: "아메리카노 한 잔 주세요",
    },
  });
  const actLoud = await db.activity.create({
    data: {
      title: "큰 목소리 유지하기: 문장 5개",
      area: "음성",
      level: "문장",
      format: "RECORD",
      description: "LSVT 계열 강도 훈련. 목표 크기로 문장을 유지합니다.",
      dose: "5문장 · 약 8분",
      targetText: "오늘 날씨가 참 좋습니다",
    },
  });
  await db.activity.createMany({
    data: [
      {
        title: "최대연장발성: 아——",
        area: "구음장애 홈 트레이닝",
        level: "발성",
        format: "RECORD",
        description: "편안한 크기로 '아——'를 가능한 길게 이어 말합니다. 결과는 비진단 음성지표로만 참고합니다.",
        dose: "3회 중 1회 제출 · 약 3분",
        targetText: "아——",
        metricKind: "MPT",
        goalCondition: "0.5초 이상 발성이 감지되면 제출 가능",
      },
      {
        title: "AMR: 파파파",
        area: "구음장애 홈 트레이닝",
        level: "AMR",
        format: "RECORD",
        description: "'파파파'를 빠르고 규칙적으로 반복합니다.",
        dose: "5초 반복 · 1회 제출",
        targetText: "파파파파파",
        metricKind: "DDK",
        goalCondition: "반복수와 속도는 치료사 검수용 참고값",
      },
      {
        title: "AMR: 타타타",
        area: "구음장애 홈 트레이닝",
        level: "AMR",
        format: "RECORD",
        description: "'타타타'를 빠르고 규칙적으로 반복합니다.",
        dose: "5초 반복 · 1회 제출",
        targetText: "타타타타타",
        metricKind: "DDK",
        goalCondition: "반복수와 속도는 치료사 검수용 참고값",
      },
      {
        title: "AMR: 카카카",
        area: "구음장애 홈 트레이닝",
        level: "AMR",
        format: "RECORD",
        description: "'카카카'를 빠르고 규칙적으로 반복합니다.",
        dose: "5초 반복 · 1회 제출",
        targetText: "카카카카카",
        metricKind: "DDK",
        goalCondition: "반복수와 속도는 치료사 검수용 참고값",
      },
      {
        title: "SMR: 파타카",
        area: "구음장애 홈 트레이닝",
        level: "SMR",
        format: "RECORD",
        description: "'파타카'를 순서대로 이어 반복합니다.",
        dose: "5초 반복 · 1회 제출",
        targetText: "파타카파타카",
        metricKind: "DDK",
        goalCondition: "순서 유지 여부는 치료사 확인 필요",
      },
      {
        title: "단어 읽기: 기능 단어 6개",
        area: "구음장애 홈 트레이닝",
        level: "단어",
        format: "RECORD",
        description: "사과, 수박, 병원, 전화, 라디오, 자동차를 차례대로 읽습니다.",
        dose: "6단어 · 약 2분",
        targetText: "사과, 수박, 병원, 전화, 라디오, 자동차",
        metricKind: "READ",
        goalCondition: "목표 발화와 다른 부분은 불일치 후보로만 표시",
      },
      {
        title: "문장 읽기: 수박이 시원해요",
        area: "구음장애 홈 트레이닝",
        level: "문장",
        format: "RECORD",
        description: "짧은 문장을 자연스럽게 읽습니다.",
        dose: "1문장 · 약 1분",
        targetText: "수박이 시원해요",
        metricKind: "READ",
        goalCondition: "치료사 검수 후 피드백 제공",
      },
      {
        title: "문장 읽기: 오늘 병원에 다녀왔습니다",
        area: "구음장애 홈 트레이닝",
        level: "문장",
        format: "RECORD",
        description: "일상 문장을 끝까지 읽습니다.",
        dose: "1문장 · 약 1분",
        targetText: "오늘 병원에 다녀왔습니다",
        metricKind: "READ",
        goalCondition: "치료사 검수 후 피드백 제공",
      },
      {
        title: "긴 문장 읽기",
        area: "구음장애 홈 트레이닝",
        level: "긴 문장",
        format: "RECORD",
        description: "긴 문장을 중간 쉼까지 포함해 자연스럽게 읽습니다.",
        dose: "1문장 · 약 2분",
        targetText: "오늘 오후에는 가족과 함께 병원에 다녀온 뒤 집에서 편안하게 쉬었습니다.",
        metricKind: "READ",
        goalCondition: "무음구간과 발화 지속시간은 비진단 참고지표",
      },
      {
        title: "문단 읽기",
        area: "구음장애 홈 트레이닝",
        level: "문단",
        format: "RECORD",
        description: "짧은 문단을 읽고 발화 지속시간과 쉼을 참고합니다.",
        dose: "1문단 · 약 3분",
        targetText: "우리 동네에는 작은 시장이 있습니다. 아침마다 신선한 채소와 과일을 팝니다. 나는 시장에 가서 사과와 두부를 샀습니다.",
        metricKind: "READ",
        goalCondition: "수치 변화는 임상적 결론이 아닌 참고 정보",
      },
      {
        title: "자유발화",
        area: "구음장애 홈 트레이닝",
        level: "자발화",
        format: "RECORD",
        description: "오늘 있었던 일을 자유롭게 이야기합니다.",
        dose: "30초 내외 · 1회 제출",
        targetText: "오늘 있었던 일을 30초 정도 이야기해 주세요.",
        metricKind: "READ",
        goalCondition: "내용 평가는 하지 않고 수행 이력과 참고지표만 확인",
      },
      {
        title: "대화 시나리오: 병원 접수",
        area: "구음장애 홈 트레이닝",
        level: "대화",
        format: "RECORD",
        description: "보호자가 접수 직원 역할을 하며 이름과 예약 시간을 묻습니다.",
        dose: "역할 대화 1회 · 약 3분",
        targetText: "제 이름은 홍길동이고, 오늘 오후 두 시 예약입니다.",
        metricKind: "READ",
        goalCondition: "보호자 관찰 데이터와 함께 치료사 확인 필요",
      },
    ],
  });
  await db.activity.create({
    data: {
      title: "그림책 어휘 확장: 동물원",
      area: "언어",
      level: "낱말",
      format: "PLAY",
      description: "상호작용 그림책으로 목표 어휘를 노출·유도합니다.",
      dose: "그림책 1권 · 약 15분",
    },
  });
  await db.activity.create({
    data: {
      title: "말더듬 중증도 일일 평정",
      area: "유창성",
      level: "관찰",
      format: "CHECK",
      description: "보호자가 하루 말더듬 정도를 1–10으로 평정합니다 (Lidcombe SR).",
      dose: "1회 · 1분",
    },
  });

  // ── 환자: 김도윤 (조음음운) ──
  const doyun = await db.patient.create({
    data: {
      name: "김도윤",
      birthYear: 2020,
      gender: "남",
      diagnosis: "조음음운장애",
      memo: "U-TAP2 자음정확도 71.4% (2026.03) · 주 2회 대면 + 홈프로그램",
    },
  });
  await db.goal.createMany({
    data: [
      { patientId: doyun.id, kind: "LONG", title: "구조화된 놀이 상황에서 /ㅅ/, /ㅆ/ 포함 낱말을 80% 이상 정확하게 산출한다 (2026.12)", order: 0 },
      { patientId: doyun.id, kind: "SHORT", title: "/ㅅ/ 어두 초성, 낱말 수준", criterion: "3회기 연속 20회 시도 중 80% 정반응", status: "MET", order: 1 },
      { patientId: doyun.id, kind: "SHORT", title: "/ㅅ/ 어중 초성, 낱말 수준", criterion: "3회기 연속 80% 정반응", status: "ACTIVE", order: 2 },
      { patientId: doyun.id, kind: "SHORT", title: "/ㅅ/ 문장 수준 일반화", criterion: "단기 2 준거 도달 시 개시", status: "PENDING", order: 3 },
    ],
  });
  const doyunAcc = [38, 45, 42, 55, 58, 60, 62];
  for (let i = 0; i < doyunAcc.length; i++) {
    await db.sessionNote.create({
      data: {
        patientId: doyun.id,
        date: daysAgo((doyunAcc.length - i) * 4),
        accuracy: doyunAcc[i],
        soapO: `/ㅅ/ 어중 낱말 20회 중 ${Math.round((doyunAcc[i] / 100) * 20)}회 정반응(${doyunAcc[i]}%).`,
        soapP: i === doyunAcc.length - 1 ? "다음 회기 시각 단서 점진 제거. 홈프로그램 난이도 유지." : "어중 /ㅅ/ 집중 연습 지속.",
      },
    });
  }

  // 김도윤 이번 주 처방
  const rx = await db.prescription.create({
    data: { patientId: doyun.id, weekStart: weekStart() },
  });
  const it0 = await db.prescriptionItem.create({
    data: { prescriptionId: rx.id, activityId: actCard.id, dayOfWeek: 0, status: "DONE" },
  });
  await db.prescriptionItem.createMany({
    data: [
      { prescriptionId: rx.id, activityId: actMinPair.id, dayOfWeek: 1, status: "PENDING" },
      { prescriptionId: rx.id, activityId: actCard.id, dayOfWeek: 2, status: "PENDING" },
      { prescriptionId: rx.id, activityId: actImit.id, dayOfWeek: 4, status: "PENDING" },
      { prescriptionId: rx.id, activityId: actHidden.id, dayOfWeek: 5, status: "PENDING" },
    ],
  });
  await db.submission.create({
    data: {
      patientId: doyun.id,
      itemId: it0.id,
      targetText: "수박이 시원해요",
      createdAt: daysAgo(1, 19),
    },
  });

  // ── 환자: 이정호 (실어증) ──
  const jungho = await db.patient.create({
    data: {
      name: "이정호",
      birthYear: 1968,
      gender: "남",
      diagnosis: "브로카 실어증",
      memo: "K-WAB AQ 58.2 (2026.01) · 주 1회 원격 + 스크립트 훈련",
    },
  });
  await db.goal.createMany({
    data: [
      { patientId: jungho.id, kind: "LONG", title: "일상 스크립트 3종을 단서 없이 유창하게 산출한다 (2026.11)", order: 0 },
      { patientId: jungho.id, kind: "SHORT", title: "카페 주문 스크립트, 의미 단서 1회 이내", criterion: "3회 연속 성공", status: "ACTIVE", order: 1 },
    ],
  });
  const junghoAcc = [40, 48, 55, 61, 67];
  for (let i = 0; i < junghoAcc.length; i++) {
    await db.sessionNote.create({
      data: {
        patientId: jungho.id,
        date: daysAgo((junghoAcc.length - i) * 7),
        accuracy: junghoAcc[i],
        soapO: `스크립트 낭독 정확도 ${junghoAcc[i]}%. 명사 인출 지연 시 의미 단서에 반응 양호.`,
      },
    });
  }
  const rxJ = await db.prescription.create({
    data: { patientId: jungho.id, weekStart: weekStart() },
  });
  const itJ = await db.prescriptionItem.create({
    data: { prescriptionId: rxJ.id, activityId: actScript.id, dayOfWeek: 0, status: "DONE" },
  });
  await db.prescriptionItem.createMany({
    data: [
      { prescriptionId: rxJ.id, activityId: actScript.id, dayOfWeek: 2, status: "PENDING" },
      { prescriptionId: rxJ.id, activityId: actScript.id, dayOfWeek: 4, status: "PENDING" },
    ],
  });
  await db.submission.create({
    data: {
      patientId: jungho.id,
      itemId: itJ.id,
      targetText: "아메리카노 한 잔 주세요",
      createdAt: daysAgo(1, 21),
    },
  });

  // ── 환자: 한영자 (파킨슨 마비말장애) ──
  const yeongja = await db.patient.create({
    data: {
      name: "한영자",
      birthYear: 1955,
      gender: "여",
      diagnosis: "파킨슨병 마비말장애",
      memo: "음성 강도 저하 주소. 주 1회 원격 + 강도 훈련 홈프로그램",
    },
  });
  await db.goal.createMany({
    data: [
      { patientId: yeongja.id, kind: "LONG", title: "대화 상황에서 기능적 음성 강도를 유지한다 (2026.10)", order: 0 },
      { patientId: yeongja.id, kind: "SHORT", title: "문장 수준에서 목표 강도 5초 유지", criterion: "회기 내 10회 중 8회 성공", status: "ACTIVE", order: 1 },
    ],
  });
  const rxY = await db.prescription.create({
    data: { patientId: yeongja.id, weekStart: weekStart() },
  });
  const itY = await db.prescriptionItem.create({
    data: { prescriptionId: rxY.id, activityId: actLoud.id, dayOfWeek: 0, status: "DONE" },
  });
  await db.prescriptionItem.createMany({
    data: [
      { prescriptionId: rxY.id, activityId: actLoud.id, dayOfWeek: 1, status: "PENDING" },
      { prescriptionId: rxY.id, activityId: actLoud.id, dayOfWeek: 3, status: "PENDING" },
    ],
  });
  await db.submission.create({
    data: {
      patientId: yeongja.id,
      itemId: itY.id,
      targetText: "오늘 날씨가 참 좋습니다",
      createdAt: todayAt(7, 30),
    },
  });

  // ── 환자: 박서아 / 최민준 ──
  const seoa = await db.patient.create({
    data: {
      name: "박서아",
      birthYear: 2022,
      gender: "여",
      diagnosis: "언어발달지연",
      memo: "2어 조합 목표 · 부모 매개 중재 병행",
    },
  });
  const minjun = await db.patient.create({
    data: {
      name: "최민준",
      birthYear: 2017,
      gender: "남",
      diagnosis: "말더듬",
      memo: "Lidcombe 프로그램 · 보호자 일일 평정",
    },
  });

  // ── 오늘 일정 ──
  await db.appointment.createMany({
    data: [
      { patientId: doyun.id, at: todayAt(10), kind: "대면", memo: "/ㅅ/ 어두 초성" },
      { patientId: seoa.id, at: todayAt(11), kind: "대면", memo: "2어 조합" },
      { patientId: jungho.id, at: todayAt(14), kind: "원격", memo: "이름대기(SFA)" },
      { patientId: minjun.id, at: todayAt(15), kind: "대면", memo: "부모 평정 검토" },
      { patientId: yeongja.id, at: todayAt(16, 30), kind: "원격", memo: "강도 훈련" },
    ],
  });

  console.log("Seed 완료");
  console.log("김도윤 포털:", `/portal/${doyun.portalToken}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
