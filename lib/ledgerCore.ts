// 개발 단위 14: 엑셀 원장과 보강 데이터(CSV)를 "파일 내용"으로 받아 CIF 기준으로 한 건씩 합친다.
// 파일 시스템(fs)을 쓰지 않아서 서버와 브라우저에서 모두 쓸 수 있다.
// (파일 경로로 읽는 서버용 코드는 ledger.ts에 있다.)
//
// 개인정보 규칙: 필요한 열만 읽는다.
// - 주민번호앞자리, 대출금액 열은 별지에 쓰지 않으므로 읽지 않는다.

import ExcelJS from "exceljs";

// 합쳐진 한 건의 모양
export type LedgerRecord = {
  cif: string; // 고객 번호
  name: string; // 성명
  round: string; // 인수회차 (예: 1차)
  institution: string; // 금융기관
  loanType: string; // 대출과목
  balance: number | null; // 대출잔액(원) — 비어 있으면 만들지 않고 null
  // 아래는 보강 데이터에서 가져온다. 값이 없으면 만들지 않고 null로 둔다.
  firstLoanDate: string | null; // 최초대출일
  accruedInterest: number | null; // 미수이자(원)
  overdueInterest: number | null; // 연체이자(원)
  total: number | null; // 합계(원)
  address: string | null; // 주소
};

// 엑셀 원장에서 읽을 열 이름
const LEDGER_HEADERS = {
  cif: "CIF",
  name: "성명",
  round: "인수회차",
  institution: "금융기관",
  loanType: "대출과목",
  balance: "대출잔액(원)",
} as const;

// 보강 CSV에서 읽을 열 이름
const SUPPLEMENT_HEADERS = {
  cif: "CIF",
  firstLoanDate: "최초대출일",
  accruedInterest: "미수이자",
  overdueInterest: "연체이자",
  total: "합계",
  address: "주소",
} as const;

// 엑셀 칸의 값을 글자로 바꾼다. (숫자·수식·서식 있는 글자 모두 처리)
function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined) return String(value.result).trim();
    if ("richText" in value) return value.richText.map((r) => r.text).join("").trim();
    if ("text" in value) return String(value.text).trim();
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return "";
  }
  return String(value).trim();
}

// 글자를 숫자로 바꾼다. 쉼표는 지우고, 숫자가 아니면 null을 돌려준다.
function toNumber(text: string): number | null {
  if (text === "") return null;
  const n = Number(text.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

// 머리글 이름으로 열 번호를 찾는다. 없으면 어느 열이 없는지 알려 준다.
function findColumns<T extends Record<string, string>>(
  headerRow: string[],
  headers: T,
  fileLabel: string
): Record<keyof T, number> {
  const result = {} as Record<keyof T, number>;
  for (const key of Object.keys(headers) as (keyof T)[]) {
    const index = headerRow.indexOf(headers[key]);
    if (index === -1) {
      throw new Error(`${fileLabel}에 '${headers[key]}' 열이 없습니다.`);
    }
    result[key] = index;
  }
  return result;
}

// CSV 한 줄을 칸으로 나눈다. 큰따옴표로 감싼 칸 안의 쉼표도 처리한다.
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

// 보강 CSV를 읽어 CIF별로 묶는다.
type Supplement = Pick<
  LedgerRecord,
  "firstLoanDate" | "accruedInterest" | "overdueInterest" | "total" | "address"
>;

function parseSupplement(csvText: string): Map<string, Supplement> {
  // 엑셀에서 저장한 CSV 맨 앞의 BOM 표시는 지운다.
  const text = csvText.replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("보강 데이터 파일이 비어 있습니다.");

  const cols = findColumns(parseCsvLine(lines[0]), SUPPLEMENT_HEADERS, "보강 데이터");
  const map = new Map<string, Supplement>();
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const cif = cells[cols.cif] ?? "";
    if (cif === "") continue;
    map.set(cif, {
      firstLoanDate: cells[cols.firstLoanDate] || null,
      accruedInterest: toNumber(cells[cols.accruedInterest] ?? ""),
      overdueInterest: toNumber(cells[cols.overdueInterest] ?? ""),
      total: toNumber(cells[cols.total] ?? ""),
      address: cells[cols.address] || null,
    });
  }
  return map;
}

// 엑셀 원장(파일 내용)과 보강 데이터(CSV 글자)를 합쳐, 한 건씩의 목록을 돌려준다.
export async function parseLedger(
  xlsxData: ArrayBuffer | Uint8Array,
  csvText: string
): Promise<LedgerRecord[]> {
  const supplements = parseSupplement(csvText);

  const workbook = new ExcelJS.Workbook();
  // exceljs는 Buffer 모양의 입력을 받는다. (브라우저에서는 ArrayBuffer를 그대로 쓴다.)
  try {
    await workbook.xlsx.load(xlsxData as ArrayBuffer);
  } catch {
    // 라이브러리의 영어 오류 대신, 담당자가 이해할 수 있는 안내로 바꾼다.
    throw new Error("엑셀 원장 파일을 읽을 수 없습니다. 올바른 .xlsx 파일인지 확인해 주세요.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("엑셀 원장에 시트가 없습니다.");

  const headerRow = (sheet.getRow(1).values as ExcelJS.CellValue[])
    .slice(1) // 엑셀 행 값은 0번 칸이 비어 있어서 1번부터 쓴다.
    .map(cellToText);
  const cols = findColumns(headerRow, LEDGER_HEADERS, "엑셀 원장");

  const records: LedgerRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 머리글 줄은 건너뛴다.
    const get = (index: number) => cellToText(row.getCell(index + 1).value);

    const cif = get(cols.cif);
    if (cif === "") return; // CIF가 없는 빈 줄은 건너뛴다.

    const supplement = supplements.get(cif);
    records.push({
      cif,
      name: get(cols.name),
      round: get(cols.round),
      institution: get(cols.institution),
      loanType: get(cols.loanType),
      balance: toNumber(get(cols.balance)),
      firstLoanDate: supplement?.firstLoanDate ?? null,
      accruedInterest: supplement?.accruedInterest ?? null,
      overdueInterest: supplement?.overdueInterest ?? null,
      total: supplement?.total ?? null,
      address: supplement?.address ?? null,
    });
  });

  return records;
}

// ---- 개발 단위 4: CIF로 건 찾기 ----

// 화면에 보여 줄 열 이름 (값이 비었을 때 어느 항목인지 알려 주기 위함)
const FIELD_LABELS: Record<keyof Omit<LedgerRecord, "cif">, string> = {
  name: "성명",
  round: "인수회차",
  institution: "금융기관",
  loanType: "대출과목",
  balance: "대출잔액",
  firstLoanDate: "최초대출일",
  accruedInterest: "미수이자",
  overdueInterest: "연체이자",
  total: "합계",
  address: "주소",
};

// 입력한 CIF와 일치하는 건만 골라 돌려준다. (없으면 빈 목록)
export function findByCif(records: LedgerRecord[], cif: string): LedgerRecord[] {
  return records.filter((r) => r.cif === cif);
}

// 값이 비어 있는 항목의 이름을 돌려준다. 비어 있는 것이 없으면 빈 목록이다.
export function findMissingFields(record: LedgerRecord): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]) {
    const value = record[key];
    if (value === null || value === "") missing.push(FIELD_LABELS[key]);
  }
  return missing;
}
