// 개발 단위 2·14: 서버(내 컴퓨터 방식)에서 파일 경로로 원장과 보강 데이터를 읽는다.
// 서버 쪽 코드에서만 사용한다. (파일 시스템을 읽기 때문)
//
// 실제로 내용을 읽고 합치는 일은 ledgerCore.ts가 한다. (브라우저에서도 같은 코드를 쓴다.)
// 기존 코드가 `@/lib/ledger`에서 그대로 가져다 쓸 수 있도록 공용 함수와 타입도 다시 내보낸다.

import fs from "node:fs";
import { loadConfig, type ResolvedConfig } from "./config";
import { parseLedger, type LedgerRecord } from "./ledgerCore";

export { findByCif, findMissingFields, parseLedger } from "./ledgerCore";
export type { LedgerRecord } from "./ledgerCore";

// 설정 파일(data-config.json)의 경로로 엑셀 원장과 보강 데이터를 읽어 한 건씩의 목록을 돌려준다.
export async function loadLedger(
  config: ResolvedConfig = loadConfig()
): Promise<LedgerRecord[]> {
  if (!fs.existsSync(config.ledgerPath)) {
    throw new Error(`엑셀 원장 파일을 찾을 수 없습니다: ${config.ledgerPath}`);
  }
  if (!fs.existsSync(config.supplementPath)) {
    throw new Error(`보강 데이터 파일을 찾을 수 없습니다: ${config.supplementPath}`);
  }
  return parseLedger(
    fs.readFileSync(config.ledgerPath),
    fs.readFileSync(config.supplementPath, "utf-8")
  );
}
