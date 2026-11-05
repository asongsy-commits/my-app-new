// 개발 단위 7·14: 양도증서 양식 이미지를 PDF로 바꾸고, 맨 뒤에 별지를 붙인다.
// 파일 시스템(fs)을 쓰지 않고 파일 내용을 받아서, 서버와 브라우저에서 모두 쓸 수 있다.
// (파일을 경로로 읽는 서버용 코드는 transferPdf.ts에 있다.)
//
// 규칙(PRD):
// - 양식 본문은 수정하지 않는다. 이미지 그대로 한 쪽에 넣는다.
// - 별지는 맨 뒤에만 붙인다.

import { PDFDocument } from "pdf-lib";
import { createAppendixPdf } from "./appendixCore";
import type { LedgerRecord } from "./ledgerCore";

// A4 크기(포인트 단위)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// 양식 이미지(JPEG)를 A4 한 쪽에 비율을 지켜 가득 채운 PDF 쪽으로 만든다.
async function addFormPage(pdf: PDFDocument, bytes: Uint8Array) {

  // 파일 맨 앞 2바이트가 FF D8이면 JPEG(.jfif 포함)이다. 아니면 PNG로 시도한다.
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  let image;
  try {
    image = isJpeg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
  } catch {
    throw new Error("양도증서 양식 이미지를 읽을 수 없습니다. JPEG 또는 PNG 파일인지 확인해 주세요.");
  }

  // 이미지가 A4 안에 들어가도록 비율을 유지하며 줄인다. (가운데 맞춤)
  const scale = Math.min(PAGE_WIDTH / image.width, PAGE_HEIGHT / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawImage(image, {
    x: (PAGE_WIDTH - width) / 2,
    y: (PAGE_HEIGHT - height) / 2,
    width,
    height,
  });
}

// 양식 1쪽 + 별지 1쪽으로 이루어진 양도증서 PDF를 만들어 돌려준다.
// formBytes: 양도증서 양식 이미지(JPEG·PNG) 파일 내용, fontBytes: 한글 글꼴 파일 내용
export async function createTransferPdf(
  record: LedgerRecord,
  formBytes: Uint8Array,
  fontBytes: Uint8Array
): Promise<Uint8Array> {
  // 별지를 먼저 만든다. (비어 있는 값이 있으면 여기서 멈춘다.)
  const appendixBytes = await createAppendixPdf(record, fontBytes);

  const pdf = await PDFDocument.create();
  await addFormPage(pdf, formBytes);

  // 별지를 맨 뒤에 붙인다.
  const appendix = await PDFDocument.load(appendixBytes);
  const pages = await pdf.copyPages(appendix, appendix.getPageIndices());
  pages.forEach((page) => pdf.addPage(page));

  return pdf.save();
}
