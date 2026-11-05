// 양도증서 PDF 요청(미리보기·저장 공용): 요청 내용을 검사하고 원장에서 정확히 1건을 찾는다.
// 서버 쪽 코드에서만 사용한다.

import { findByCif, loadLedger, type LedgerRecord } from "./ledger";

// 안내 문구와 상태 번호를 담은 오류 응답을 만든다.
export function errorResponse(message: string, status: number): Response {
  return Response.json({ message: `확인 필요: ${message}` }, { status });
}

// 요청에서 건을 찾은 결과: 찾았으면 record, 못 찾았으면 그대로 돌려줄 오류 응답
export type ResolveResult = { record: LedgerRecord } | { response: Response };

// 요청 본문(JSON): { cif, round, institution, loanType }
// 0건이나 2건 이상이면 추측하지 않고 멈춘다.
export async function resolveRecord(request: Request): Promise<ResolveResult> {
  let body: Partial<Record<"cif" | "round" | "institution" | "loanType", unknown>>;
  try {
    body = await request.json();
  } catch {
    return { response: errorResponse("요청 내용을 읽을 수 없습니다.", 400) };
  }

  const { cif, round, institution, loanType } = body;
  if (
    typeof cif !== "string" ||
    !/^\d+$/.test(cif) ||
    typeof round !== "string" ||
    typeof institution !== "string" ||
    typeof loanType !== "string"
  ) {
    return { response: errorResponse("CIF, 회차, 금융기관, 대출과목을 모두 보내 주세요.", 400) };
  }

  try {
    const matches = findByCif(await loadLedger(), cif).filter(
      (r) => r.round === round && r.institution === institution && r.loanType === loanType
    );
    if (matches.length === 0) {
      return { response: errorResponse("선택한 건을 원장에서 찾을 수 없습니다.", 404) };
    }
    if (matches.length > 1) {
      return {
        response: errorResponse("같은 조건의 건이 2개 이상이라 하나로 정할 수 없습니다.", 409),
      };
    }
    return { record: matches[0] };
  } catch (error) {
    // 서버 로그에는 원인만 남기고(고객 정보는 남기지 않는다), 화면에는 일반 안내만 보낸다.
    console.error("원장 읽기 실패:", error instanceof Error ? error.message : error);
    return {
      response: errorResponse("원장을 읽지 못했습니다. 설정 파일과 원장 파일을 확인해 주세요.", 500),
    };
  }
}
