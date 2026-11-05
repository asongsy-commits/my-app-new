// 개발 단위 8: 선택한 건으로 양도증서 PDF(양식 + 별지)를 만들어 돌려주는 API
// 사용법: POST /api/transfer-pdf  본문(JSON): { cif, round, institution, loanType }
// 미리보기용이라 파일로 저장하지 않는다. (저장은 단위 9에서 만든다.)

import { findByCif, loadLedger, type LedgerRecord } from "@/lib/ledger";
import { createTransferPdf } from "@/lib/transferPdf";

// 안내 문구와 상태 번호를 담은 오류 응답을 만든다.
function errorResponse(message: string, status: number) {
  return Response.json({ message: `확인 필요: ${message}` }, { status });
}

export async function POST(request: Request) {
  // 1) 요청 내용 읽기와 검사
  let body: Partial<Record<"cif" | "round" | "institution" | "loanType", unknown>>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 내용을 읽을 수 없습니다.", 400);
  }
  const { cif, round, institution, loanType } = body;
  if (
    typeof cif !== "string" ||
    !/^\d+$/.test(cif) ||
    typeof round !== "string" ||
    typeof institution !== "string" ||
    typeof loanType !== "string"
  ) {
    return errorResponse("CIF, 회차, 금융기관, 대출과목을 모두 보내 주세요.", 400);
  }

  // 2) 원장에서 정확히 1건을 찾는다. (0건이나 2건 이상이면 추측하지 않고 멈춘다.)
  let record: LedgerRecord;
  try {
    const matches = findByCif(await loadLedger(), cif).filter(
      (r) => r.round === round && r.institution === institution && r.loanType === loanType
    );
    if (matches.length === 0) return errorResponse("선택한 건을 원장에서 찾을 수 없습니다.", 404);
    if (matches.length > 1) {
      return errorResponse("같은 조건의 건이 2개 이상이라 하나로 정할 수 없습니다.", 409);
    }
    record = matches[0];
  } catch (error) {
    console.error("원장 읽기 실패:", error instanceof Error ? error.message : error);
    return errorResponse("원장을 읽지 못했습니다. 설정 파일과 원장 파일을 확인해 주세요.", 500);
  }

  // 3) PDF 만들기 (비어 있는 값이 있으면 여기서 멈춘다.)
  try {
    const pdf = await createTransferPdf(record);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store", // 개인정보가 들어 있어 저장해 두지 않게 한다.
      },
    });
  } catch (error) {
    console.error("PDF 만들기 실패:", error instanceof Error ? error.message : error);
    // 비어 있는 값 안내는 그대로 보여 주고, 그 밖의 오류는 일반 안내만 보낸다.
    if (error instanceof Error && error.message.startsWith("확인 필요:")) {
      return Response.json({ message: error.message }, { status: 422 });
    }
    return errorResponse("PDF를 만들지 못했습니다. 설정과 양식 파일을 확인해 주세요.", 500);
  }
}
