// 개발 단위 9: 완성한 양도증서 PDF를 결과 폴더에 새 파일명으로 저장한다.
// 서버 쪽 코드에서만 사용한다. (파일을 쓰기 때문)
//
// 규칙(PRD):
// - 파일명은 CIF_회차_금융기관_날짜.pdf 형식이다.
// - 원본(양식·원장)은 그대로 두고 새 파일로만 저장한다.
// - 같은 이름의 파일이 있으면 덮어쓰지 않고 안내한다.

import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig, type ResolvedConfig } from "./config";
import type { LedgerRecord } from "./ledger";

// 같은 이름의 파일이 이미 있을 때 던지는 오류
export class FileExistsError extends Error {
  constructor(public fileName: string) {
    super(`이미 같은 이름의 파일이 있습니다: ${fileName}`);
  }
}

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

// PDF를 결과 폴더에 저장하고, 저장한 파일 이름을 돌려준다.
export async function saveTransferPdf(
  record: LedgerRecord,
  pdf: Uint8Array,
  config: ResolvedConfig = loadConfig(),
  now: Date = new Date()
): Promise<string> {
  const fileName = makeFileName(record, now);
  const filePath = path.join(config.outputFolder, fileName);

  // 결과 폴더 밖으로 나가는 경로는 막는다. (파일명에 이상한 글자가 있어도 폴더 밖에는 쓰지 않는다.)
  if (path.dirname(path.resolve(filePath)) !== path.resolve(config.outputFolder)) {
    throw new Error("저장 경로가 결과 폴더 밖을 가리킵니다.");
  }

  await fs.mkdir(config.outputFolder, { recursive: true });
  try {
    // flag "wx": 같은 이름의 파일이 있으면 덮어쓰지 않고 실패한다.
    await fs.writeFile(filePath, pdf, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new FileExistsError(fileName);
    throw error;
  }
  return fileName;
}
