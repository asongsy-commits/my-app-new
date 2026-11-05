// 개발 단위 9: 선택한 건의 양도증서 PDF를 만들어 결과 폴더에 저장하는 API
// 사용법: POST /api/transfer-pdf/save  본문(JSON): { cif, round, institution, loanType }
// 응답: { fileName } — 저장한 파일 이름 (결과 폴더는 data-config.json의 outputFolder)

import { FileExistsError, saveTransferPdf } from "@/lib/saveTransferPdf";
import { createTransferPdf } from "@/lib/transferPdf";
import { errorResponse, resolveRecord } from "@/lib/transferRequest";

export async function POST(request: Request) {
  // 1) 요청 검사와 건 찾기 (미리보기와 같은 규칙)
  const resolved = await resolveRecord(request);
  if ("response" in resolved) return resolved.response;

  try {
    // 2) PDF 만들기 (비어 있는 값이 있으면 여기서 멈춘다.)
    const pdf = await createTransferPdf(resolved.record);
    // 3) 새 파일명으로 저장하기 (같은 이름이 있으면 덮어쓰지 않는다.)
    const fileName = await saveTransferPdf(resolved.record, pdf);
    return Response.json({ fileName }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof FileExistsError) {
      return errorResponse(
        `같은 이름의 파일이 이미 있어 덮어쓰지 않았습니다. (${error.fileName})`,
        409
      );
    }
    console.error("PDF 저장 실패:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message.startsWith("확인 필요:")) {
      return Response.json({ message: error.message }, { status: 422 });
    }
    return errorResponse("PDF를 저장하지 못했습니다. 결과 폴더와 설정을 확인해 주세요.", 500);
  }
}
