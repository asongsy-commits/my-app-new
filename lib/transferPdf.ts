// 개발 단위 7·14: 서버(내 컴퓨터 방식)에서 양식·글꼴 파일을 경로로 읽어 양도증서 PDF를 만든다.
// 서버 쪽 코드에서만 사용한다. (파일을 읽기 때문)
// 실제로 PDF를 만드는 일은 transferCore.ts가 한다. (브라우저에서도 같은 코드를 쓴다.)

import fs from "node:fs";
import { readFontBytes } from "./appendix";
import { loadConfig, type ResolvedConfig } from "./config";
import type { LedgerRecord } from "./ledgerCore";
import { createTransferPdf as createTransferPdfFromBytes } from "./transferCore";

// 양식 1쪽 + 별지 1쪽으로 이루어진 양도증서 PDF를 만들어 돌려준다.
export async function createTransferPdf(
  record: LedgerRecord,
  config: ResolvedConfig = loadConfig()
): Promise<Uint8Array> {
  if (!fs.existsSync(config.formPath)) {
    throw new Error(`양도증서 양식 파일을 찾을 수 없습니다: ${config.formPath}`);
  }
  return createTransferPdfFromBytes(record, fs.readFileSync(config.formPath), readFontBytes());
}
