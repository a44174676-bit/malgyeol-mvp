// 말결 자체 조음·음운 선별 자극 목록
// 자체 제작 목록으로 표준화 검사의 문항·규준과 무관합니다.
// 그림 자극은 현재 이모지 기반이며, 추후 전문 일러스트로 교체 가능합니다.

export type Stimulus = { text: string; emoji: string };

// 낱말 수준 27문항 — 19개 초성 전체 + 주요 종성(ㅇ,ㅁ,ㄴ,ㄹ,ㅂ)을
// 어두/어중/종성 위치에서 커버
export const WORD_ITEMS: Stimulus[] = [
  { text: "바지", emoji: "👖" },     // ㅂ, ㅈ
  { text: "포도", emoji: "🍇" },     // ㅍ, ㄷ
  { text: "아빠", emoji: "👨" },     // ㅃ (어중)
  { text: "엄마", emoji: "👩" },     // 종성ㅁ, ㅁ
  { text: "나비", emoji: "🦋" },     // ㄴ, ㅂ
  { text: "돼지", emoji: "🐷" },     // ㄷ, ㅈ
  { text: "딸기", emoji: "🍓" },     // ㄸ, 종성ㄹ, ㄱ
  { text: "토끼", emoji: "🐰" },     // ㅌ, ㄲ
  { text: "가방", emoji: "🎒" },     // ㄱ, ㅂ, 종성ㅇ
  { text: "코끼리", emoji: "🐘" },   // ㅋ, ㄲ, ㄹ
  { text: "사탕", emoji: "🍬" },     // ㅅ, ㅌ, 종성ㅇ
  { text: "쌍둥이", emoji: "👯" },   // ㅆ, 종성ㅇ, ㄷ
  { text: "참새", emoji: "🐦" },     // ㅊ, 종성ㅁ, ㅅ
  { text: "침대", emoji: "🛏️" },    // ㅊ, 종성ㅁ, ㄷ
  { text: "자동차", emoji: "🚗" },   // ㅈ, ㄷ, 종성ㅇ, ㅊ
  { text: "주스", emoji: "🧃" },     // ㅈ, ㅅ
  { text: "찌개", emoji: "🍲" },     // ㅉ, ㄱ
  { text: "하마", emoji: "🦛" },     // ㅎ, ㅁ
  { text: "호랑이", emoji: "🐯" },   // ㅎ, ㄹ, 종성ㅇ
  { text: "라면", emoji: "🍜" },     // ㄹ, ㅁ, 종성ㄴ
  { text: "노래", emoji: "🎤" },     // ㄴ, ㄹ
  { text: "눈사람", emoji: "⛄" },   // ㄴ, 종성ㄴ, ㅅ, ㄹ, 종성ㅁ
  { text: "김밥", emoji: "🍙" },     // ㄱ, 종성ㅁ, ㅂ, 종성ㅂ
  { text: "장갑", emoji: "🧤" },     // ㅈ, 종성ㅇ, ㄱ, 종성ㅂ
  { text: "풍선", emoji: "🎈" },     // ㅍ, 종성ㅇ, ㅅ, 종성ㄴ
  { text: "뽀뽀", emoji: "💋" },     // ㅃ
  { text: "땅콩", emoji: "🥜" },     // ㄸ, 종성ㅇ, ㅋ, 종성ㅇ
];

// 문장 수준 10문항 — 목표 음소를 문장 맥락에 배치 (연결발화 일반화 확인)
export const SENTENCE_ITEMS: Stimulus[] = [
  { text: "수박이 시원해요", emoji: "🍉" },        // ㅅ 어두·어중
  { text: "참새가 짹짹 울어요", emoji: "🐦" },     // ㅊ, ㅉ
  { text: "코끼리 코가 길어요", emoji: "🐘" },     // ㅋ, ㄱ, ㄹ
  { text: "토끼가 당근을 먹어요", emoji: "🐰🥕" }, // ㅌ, ㄷ, 종성ㄱ
  { text: "아빠가 뽀뽀해요", emoji: "👨💋" },      // ㅃ, ㅎ
  { text: "동생이 라면을 먹어요", emoji: "🍜" },   // ㄷ, ㄹ, ㅁ
  { text: "딸기가 정말 달아요", emoji: "🍓" },     // ㄸ, ㅈ, 종성ㄹ
  { text: "호랑이가 어흥 해요", emoji: "🐯" },     // ㅎ, 종성ㅇ
  { text: "풍선이 하늘로 날아가요", emoji: "🎈" }, // ㅍ, ㅎ, ㄴ, ㄹ
  { text: "쌍둥이가 장갑을 껴요", emoji: "👯🧤" }, // ㅆ, ㅈ, ㄲ, 종성ㅂ
];

/** 하위 호환: 기존 코드가 사용하는 낱말 텍스트 배열 */
export const SCREENING_WORDS: string[] = WORD_ITEMS.map((w) => w.text);

/** 표준화 검사 목록 (점수 기록 관리용) */
export const STANDARD_TESTS = [
  "U-TAP2 (우리말 조음·음운평가-2)",
  "APAC (아동용 발음평가)",
  "PRES (취학전 수용-표현 언어검사)",
  "SELSI (영유아 언어발달검사)",
  "REVT-수용 (수용 어휘력)",
  "REVT-표현 (표현 어휘력)",
  "LSSC (학령기 아동 언어검사)",
  "P-FA-II (파라다이스 유창성검사)",
  "K-WAB-R (한국판 웨스턴 실어증검사)",
  "K-BNT (한국판 보스턴 이름대기검사)",
  "SMST (조음기관 구조·기능 선별검사)",
  "기타",
];
