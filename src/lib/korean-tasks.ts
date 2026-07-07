export type KoreanTaskSeed = {
  id: string;
  title: string;
  area: string;
  level: string;
  targetText: string;
  focus: string;
};

export const KOREAN_TASKS: KoreanTaskSeed[] = [
  { id: "korean_intro_vietnam", title: "자기소개 1", area: "자기소개", level: "생활문장", targetText: "안녕하세요. 저는 베트남에서 왔습니다.", focus: "문장 끝 억양과 받침" },
  { id: "korean_intro_learning", title: "자기소개 2", area: "자기소개", level: "생활문장", targetText: "저는 한국어를 배우고 있습니다.", focus: "ㅡ 모음과 문장 리듬" },
  { id: "korean_school_time", title: "수업 시간 묻기", area: "학교생활", level: "질문 문장", targetText: "수업이 몇 시에 시작하나요?", focus: "ㅓ/ㅗ 구분과 억양" },
  { id: "korean_school_dorm", title: "기숙사 위치 묻기", area: "학교생활", level: "질문 문장", targetText: "기숙사가 어디에 있나요?", focus: "어디, 있나요 연결" },
  { id: "korean_school_professor", title: "교수님께 질문하기", area: "학교생활", level: "생활문장", targetText: "교수님께 질문이 있습니다.", focus: "된소리와 받침" },
  { id: "korean_life_hospital", title: "병원 예약", area: "병원·생활", level: "생활문장", targetText: "병원 예약을 하고 싶습니다.", focus: "받침 ㄱ, ㅂ" },
  { id: "korean_life_pharmacy", title: "약국 위치 묻기", area: "병원·생활", level: "질문 문장", targetText: "약국이 어디에 있나요?", focus: "받침 ㄱ 연음" },
  { id: "korean_life_slowly", title: "천천히 요청하기", area: "병원·생활", level: "생활문장", targetText: "천천히 말씀해 주세요.", focus: "거센소리와 문장 리듬" },
  { id: "korean_admin_card", title: "외국인등록증", area: "행정·비자", level: "생활문장", targetText: "외국인등록증을 만들러 왔습니다.", focus: "ㄹ 연결과 받침" },
  { id: "korean_admin_document", title: "서류 제출", area: "행정·비자", level: "생활문장", targetText: "서류를 제출하러 왔습니다.", focus: "ㄹ, ㅡ 모음" },
  { id: "korean_admin_stay", title: "체류기간 연장", area: "행정·비자", level: "생활문장", targetText: "체류기간을 연장하고 싶습니다.", focus: "ㄹ과 받침 ㄴ" },
  { id: "korean_work_punctual", title: "면접 자기소개", area: "아르바이트·면접", level: "생활문장", targetText: "저는 시간 약속을 잘 지킵니다.", focus: "받침 ㄹ, ㅂ" },
  { id: "korean_work_conversation", title: "한국어 대화 가능", area: "아르바이트·면접", level: "생활문장", targetText: "한국어로 간단한 대화가 가능합니다.", focus: "ㄹ과 된소리" },
  { id: "korean_work_start", title: "근무 시작일", area: "아르바이트·면접", level: "생활문장", targetText: "언제부터 일할 수 있습니다.", focus: "받침과 문장 흐름" },
  { id: "korean_focus_r", title: "ㄹ 연습", area: "한국어 발음 난점", level: "ㄹ", targetText: "서류를 만들러 왔습니다.", focus: "ㄹ 연습" },
  { id: "korean_focus_eu", title: "ㅡ 연습", area: "한국어 발음 난점", level: "ㅡ", targetText: "저는 음식을 천천히 먹습니다.", focus: "ㅡ 연습" },
  { id: "korean_focus_vowels", title: "ㅓ/ㅗ 구분", area: "한국어 발음 난점", level: "ㅓ/ㅗ", targetText: "서울에서 오 분 정도 걸립니다.", focus: "ㅓ/ㅗ 구분" },
  { id: "korean_focus_final", title: "받침 연습", area: "한국어 발음 난점", level: "받침", targetText: "약속 시간에 늦지 않겠습니다.", focus: "받침 연습" },
  { id: "korean_focus_tense", title: "된소리/거센소리 구분", area: "한국어 발음 난점", level: "소리 구분", targetText: "커피를 조금 따뜻하게 주세요.", focus: "된소리/거센소리 구분" },
];

export function koreanActivityData(task: KoreanTaskSeed) {
  return {
    serviceLine: "KOREAN",
    title: task.title,
    area: task.area,
    level: task.level,
    format: "RECORD",
    description: `${task.focus}을 중심으로 한국어 생활문장 연습을 진행합니다.`,
    dose: "문장을 천천히 1회 이상 녹음",
    targetText: task.targetText,
    metricKind: "READ",
    goalCondition: "목표 문장을 듣기 좋게 천천히 읽고 녹음 제출",
  };
}
