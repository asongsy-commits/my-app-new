// 개발 단위 4: CIF로 건 목록을 조회하는 API
// 사용법: GET /api/records?cif=10000182
//
// 개인정보 규칙: 주민번호는 원장에서 읽지 않으므로 응답에도 없다.
// 값이 없거나 비어 있으면 추측하지 않고 "확인 필요" 안내를 돌려준다.

import { rejectInUploadMode } from "@/lib/appMode";
import { findByCif, findMissingFields, loadLedger } from "@/lib/ledger";

export async function GET(request: Request) {
  // 배포본 방식에서는 쓰지 않는다.
  const blocked = rejectInUploadMode();
  if (blocked) return blocked;

  const cif = (new URL(request.url).searchParams.get("cif") ?? "").trim();

  // 1) 입력값 검사: 비었거나 숫자가 아니면 조회하지 않는다.
  if (cif === "") {
    return Response.json({ message: "확인 필요: CIF를 입력해 주세요." }, { status: 400 });
  }
  if (!/^\d+$/.test(cif)) {
    return Response.json(
      { message: "확인 필요: CIF는 숫자만 입력할 수 있습니다." },
      { status: 400 }
    );
  }

  // 2) 원장 읽기
  let records;
  try {
    records = findByCif(await loadLedger(), cif);
  } catch (error) {
    // 서버 로그에는 원인만 남기고(고객 정보는 남기지 않는다), 화면에는 일반 안내만 보낸다.
    console.error("원장 읽기 실패:", error instanceof Error ? error.message : error);
    return Response.json(
      { message: "확인 필요: 원장을 읽지 못했습니다. 프로젝트를 옮겼다면 원장/ 폴더도 함께 옮겼는지, data-config.json의 파일 이름이 맞는지 확인해 주세요." },
      { status: 500 }
    );
  }

  // 3) 일치하는 건이 없으면 멈춘다.
  if (records.length === 0) {
    return Response.json(
      { message: "확인 필요: 입력한 CIF의 건이 원장에 없습니다." },
      { status: 404 }
    );
  }

  // 4) 건마다 비어 있는 항목을 함께 알려 준다. (화면에서 선택을 막을 때 쓴다.)
  return Response.json({
    records: records.map((record) => ({ ...record, missing: findMissingFields(record) })),
  });
}
