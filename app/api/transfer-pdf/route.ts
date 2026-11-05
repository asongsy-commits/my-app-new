// 개발 단위 8: 선택한 건으로 양도증서 PDF(양식 + 별지)를 만들어 돌려주는 API
// 사용법: POST /api/transfer-pdf  본문(JSON): { cif, round, institution, loanType }
// 미리보기용이라 파일로 저장하지 않는다. (저장은 /api/transfer-pdf/save)

import { errorResponse, resolveRecord } from "@/lib/transferRequest";
import { createTransferPdf } from "@/lib/transferPdf";

export async function POST(request: Request) {
  // 1) 요청 검사와 건 찾기 (공용)
  const resolved = await resolveRecord(request);
  if ("response" in resolved) return resolved.response;

  // 2) PDF 만들기 (비어 있는 값이 있으면 여기서 멈춘다.)
  try {
    const pdf = await createTransferPdf(resolved.record);
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
