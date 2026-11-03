// 고객 문의를 서버(AI)로 보내기 전에 전화번호와 이메일을 가린다.
// 브라우저에서 먼저 실행하고, 서버에서도 한 번 더 실행한다(이중 안전장치).

export const PHONE_TOKEN = "[전화번호]";
export const EMAIL_TOKEN = "[이메일]";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

// 국제번호: +82 10-1234-5678, +1 415 555 1234 등
const INTL_PHONE_RE = /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,3}(?!\d)/g;

// 국내번호: 010-1234-5678, 01012345678, 010 1234 5678, 02-123-4567, 031.123.4567, 1588-1234
const KR_PHONE_RE =
  /(?<![\d-])(?:0\d{1,2}[\s.-]?\d{3,4}[\s.-]?\d{4}|1[5-9]\d{2}-\d{4})(?![\d-])/g;

export type MaskResult = {
  masked: string;
  phoneCount: number;
  emailCount: number;
};

export function maskPersonalInfo(text: string): MaskResult {
  let emailCount = 0;
  let phoneCount = 0;

  let masked = text.replace(EMAIL_RE, () => {
    emailCount += 1;
    return EMAIL_TOKEN;
  });
  masked = masked.replace(INTL_PHONE_RE, () => {
    phoneCount += 1;
    return PHONE_TOKEN;
  });
  masked = masked.replace(KR_PHONE_RE, () => {
    phoneCount += 1;
    return PHONE_TOKEN;
  });

  return { masked, phoneCount, emailCount };
}

/** 운영자에게 보여줄 안내 문구. 가린 것이 없으면 null. */
export function describeMasking(result: MaskResult): string | null {
  const parts: string[] = [];
  if (result.phoneCount > 0) parts.push(`전화번호 ${result.phoneCount}개`);
  if (result.emailCount > 0) parts.push(`이메일 ${result.emailCount}개`);
  if (parts.length === 0) return null;
  return `개인정보 보호를 위해 ${parts.join(", ")}를 가린 뒤 AI에 보냈습니다.`;
}
