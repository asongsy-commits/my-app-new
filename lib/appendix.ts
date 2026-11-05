// 개발 단위 6: 선택한 건의 명세로 별지(A4 1쪽) PDF를 만든다.
// 서버 쪽 코드에서만 사용한다. (글꼴 파일을 읽기 때문)
//
// 규칙(PRD):
// - 별지에는 양도채권 명세 항목(대출과목, 최초대출일, 대출잔액, 미수이자, 연체이자, 합계)과
//   채무자 성명·주소만 쓴다. 주민번호는 쓰지 않는다. (애초에 읽어 오지 않는다.)
// - 값은 원장·보강 데이터 그대로 쓰고, 비어 있는 값이 있으면 만들지 않고 멈춘다.

import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { findMissingFields, type LedgerRecord } from "./ledger";

// 한글 글꼴(Noto Sans KR, 오픈 라이선스) 위치
const FONT_PATH = path.join(process.cwd(), "fonts", "NotoSansKR.ttf");

// A4 크기(포인트 단위)와 여백
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;

// 원 단위 금액을 읽기 쉽게 바꾼다. (예: 15840000 → 15,840,000)
function won(value: number | null): string {
  return (value ?? 0).toLocaleString("ko-KR");
}

// 일반 공백(스페이스)을 전각 공백(U+3000)으로 바꾼다.
// 이 글꼴은 일반 공백이 PDF 글자 층에서 '堺'로 저장돼 복사·검색하면 글자가 깨진다.
// 전각 공백은 제대로 저장되고 화면에서 보이는 모양도 같다.
const sp = (text: string) => text.replace(/ /g, "　");

// 글자가 칸보다 길면 글자 크기를 줄여서 칸 안에 맞춘다.
function drawFitted(
  page: PDFPage,
  font: PDFFont,
  rawText: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number
) {
  const text = sp(rawText);
  let fontSize = size;
  while (fontSize > 6 && font.widthOfTextAtSize(text, fontSize) > maxWidth) fontSize -= 0.5;
  page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
}

// 선택한 건으로 별지 PDF를 만들어 돌려준다.
export async function createAppendixPdf(record: LedgerRecord): Promise<Uint8Array> {
  // 비어 있는 값이 있으면 만들지 않는다. (없는 값을 지어내지 않기 위해)
  const missing = findMissingFields(record);
  if (missing.length > 0) {
    throw new Error(`확인 필요: 비어 있는 항목이 있어 별지를 만들 수 없습니다. (${missing.join(", ")})`);
  }
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error("한글 글꼴 파일을 찾을 수 없습니다: fonts/NotoSansKR.ttf");
  }

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  // subset: false — 글꼴 전체를 PDF에 넣는다. (PDF 1개가 약 5MB)
  // 쓰는 글자만 담는 subset: true로 하면 이 가변(variable) 글꼴에서는 글자가 빠져 보인다.
  // TODO: 크기를 줄이려면 고정(static) 글꼴로 바꾼 뒤 subset: true를 쓴다.
  const font = await pdf.embedFont(fs.readFileSync(FONT_PATH), { subset: false });
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const black = rgb(0, 0, 0);

  // 제목
  const title = sp("별 지");
  const titleSize = 22;
  page.drawText(title, {
    x: (PAGE_WIDTH - font.widthOfTextAtSize(title, titleSize)) / 2,
    y: PAGE_HEIGHT - MARGIN - 20,
    size: titleSize,
    font,
    color: black,
  });
  const subtitle = sp("양도채권의 명세");
  page.drawText(subtitle, {
    x: (PAGE_WIDTH - font.widthOfTextAtSize(subtitle, 13)) / 2,
    y: PAGE_HEIGHT - MARGIN - 46,
    size: 13,
    font,
    color: black,
  });

  // 채무자 정보
  let y = PAGE_HEIGHT - MARGIN - 100;
  const labelX = MARGIN;
  const valueX = MARGIN + 70;
  page.drawText("채무자", { x: labelX, y, size: 12, font, color: black });
  drawFitted(page, font, record.name, valueX, y, contentWidth - 70, 12);
  y -= 24;
  page.drawText(sp("주 소"), { x: labelX, y, size: 12, font, color: black });
  drawFitted(page, font, record.address ?? "", valueX, y, contentWidth - 70, 12);

  // 단위 표시
  y -= 36;
  const unit = sp("(단위: 원)");
  page.drawText(unit, {
    x: MARGIN + contentWidth - font.widthOfTextAtSize(unit, 10),
    y,
    size: 10,
    font,
    color: black,
  });

  // 명세 표: 왼쪽 칸은 항목, 오른쪽 칸은 내용
  const rows: [string, string][] = [
    ["대출과목", record.loanType],
    ["최초대출일", record.firstLoanDate ?? ""],
    ["대출잔액", won(record.balance)],
    ["미수이자", won(record.accruedInterest)],
    ["연체이자", won(record.overdueInterest)],
    ["합 계", won(record.total)],
  ];
  const rowHeight = 30;
  const labelWidth = 130;
  const tableTop = y - 8;
  const tableHeight = rowHeight * rows.length;

  // 바깥 테두리와 줄
  page.drawRectangle({
    x: MARGIN,
    y: tableTop - tableHeight,
    width: contentWidth,
    height: tableHeight,
    borderColor: black,
    borderWidth: 1,
  });
  page.drawLine({
    start: { x: MARGIN + labelWidth, y: tableTop },
    end: { x: MARGIN + labelWidth, y: tableTop - tableHeight },
    thickness: 1,
    color: black,
  });
  rows.forEach(([label, value], index) => {
    const rowTop = tableTop - rowHeight * index;
    if (index > 0) {
      page.drawLine({
        start: { x: MARGIN, y: rowTop },
        end: { x: MARGIN + contentWidth, y: rowTop },
        thickness: 0.5,
        color: black,
      });
    }
    const textY = rowTop - rowHeight / 2 - 4;
    page.drawText(sp(label), { x: MARGIN + 12, y: textY, size: 12, font, color: black });

    // 금액은 오른쪽 맞춤, 글자는 왼쪽 맞춤
    const isAmount = /^[\d,]+$/.test(value);
    const valueWidth = font.widthOfTextAtSize(value, 12);
    const valueXPos = isAmount
      ? MARGIN + contentWidth - 12 - valueWidth
      : MARGIN + labelWidth + 12;
    drawFitted(page, font, value, valueXPos, textY, contentWidth - labelWidth - 24, 12);
  });

  return pdf.save();
}
