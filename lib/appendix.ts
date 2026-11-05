// 개발 단위 6·14: 서버(내 컴퓨터 방식)에서 글꼴 파일을 경로로 읽어 별지 PDF를 만든다.
// 서버 쪽 코드에서만 사용한다. (글꼴 파일을 읽기 때문)
// 실제로 별지를 그리는 일은 appendixCore.ts가 한다. (브라우저에서도 같은 코드를 쓴다.)

import fs from "node:fs";
import path from "node:path";
import { createAppendixPdf as createAppendixPdfFromBytes } from "./appendixCore";
import type { LedgerRecord } from "./ledgerCore";

// 한글 글꼴(Noto Sans KR Regular, 굵기 고정, 오픈 라이선스) 위치
export const FONT_PATH = path.join(process.cwd(), "fonts", "NotoSansKR-Regular.otf");

// 글꼴 파일을 읽는다. 없으면 어느 파일인지 알려 준다.
export function readFontBytes(): Uint8Array {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error("한글 글꼴 파일을 찾을 수 없습니다: fonts/NotoSansKR-Regular.otf");
  }
  return fs.readFileSync(FONT_PATH);
}

// 선택한 건으로 별지 PDF를 만들어 돌려준다.
export async function createAppendixPdf(record: LedgerRecord): Promise<Uint8Array> {
  return createAppendixPdfFromBytes(record, readFontBytes());
}
