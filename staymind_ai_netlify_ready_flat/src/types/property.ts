// 숙소 정보 데이터 구조
// 나중에 AI 초안 생성 기능에서 이 타입을 그대로 사용한다.

export type PropertyInfo = {
  /** 숙소 이름 (필수) */
  name: string;
  /** 위치·찾아오는 길 */
  location: string;
  /** 체크인 시간 */
  checkIn: string;
  /** 체크아웃 시간 */
  checkOut: string;
  /** 주차 안내 */
  parking: string;
  /** 와이파이 안내 */
  wifi: string;
  /** 편의시설 */
  amenities: string;
  /** 이용 규칙 (흡연, 반려동물, 소음 등) */
  rules: string;
  /** 기타 안내사항 */
  notes: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type PropertyData = {
  version: 1;
  property: PropertyInfo;
  faqs: FaqItem[];
  /** 마지막 저장 시각 (ISO 문자열) */
  updatedAt: string | null;
};
