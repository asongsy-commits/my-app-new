// 개발 단위 9·14: 저장·내려받기에 쓰는 파일 이름을 만든다.
// 파일 시스템을 쓰지 않아서 서버와 브라우저에서 모두 쓸 수 있다.
// 형식: CIF_회차_금융기관_날짜.pdf (예: 10000182_1차_미래캐피탈_20261105.pdf)

import type { LedgerRecord } from "./ledgerCore";

// 파일 이름에 쓸 수 없는 글자(\ / : * ? " < > |)와 공백은 밑줄로 바꾼다.
function toSafeName(text: string): string {
  return text.replace(/[\\/:*?"<>|\s]+/g, "_");
}

// 오늘 날짜를 한국 시간 기준으로 YYYYMMDD 형태로 돌려준다.
function todayText(now: Date = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }).replaceAll("-", "");
}

// 저장할 파일 이름을 만든다. (예: 10000182_1차_미래캐피탈_20261105.pdf)
export function makeFileName(record: LedgerRecord, now: Date = new Date()): string {
  const parts = [record.cif, record.round, record.institution, todayText(now)];
  return `${parts.map(toSafeName).join("_")}.pdf`;
}
