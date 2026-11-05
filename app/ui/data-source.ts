// 개발 단위 16: 조회·미리보기·저장을 "어디서 처리하는지"에 따라 나눈 연결부
//
// 화면(CifSearchForm)은 아래 세 가지 일만 시키고, 실제로 어디서 하는지는 모른다.
// - 내 컴퓨터 방식: 서버(API)가 고정 폴더의 파일로 처리한다. (serverSource)
// - 배포본 방식: 올린 파일로 이 브라우저 안에서 처리한다. (browser-source.ts)
//
// 문제가 생기면 "확인 필요: ..."로 시작하는 한국어 문구를 담은 Error를 던진다.

import type { RecordItem } from "@/app/ui/record-list";

export type DataSource = {
  // CIF로 건 목록을 조회한다.
  lookup(cif: string): Promise<RecordItem[]>;
  // 선택한 건으로 양도증서 PDF(양식 + 별지)를 만들어 미리보기용으로 돌려준다.
  createPreview(record: RecordItem): Promise<Blob>;
  // 선택한 건의 PDF를 저장하고, 화면에 보여 줄 결과 문구를 돌려준다.
  save(record: RecordItem): Promise<string>;
};

// 서버에 연결하지 못했을 때의 안내
const NETWORK_ERROR = "확인 필요: 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";

// 서버 API를 부르고, 실패하면 서버가 보낸 안내 문구로 Error를 던진다.
async function callServer(url: string, init: RequestInit | undefined, fallback: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? fallback);
  }
  return response;
}

// 서버가 건을 하나로 정할 때 쓰는 값들
function keyOf(record: RecordItem) {
  return JSON.stringify({
    cif: record.cif,
    round: record.round,
    institution: record.institution,
    loanType: record.loanType,
  });
}

const JSON_POST = { method: "POST", headers: { "Content-Type": "application/json" } } as const;

// 내 컴퓨터 방식: 서버 API로 처리한다.
export const serverSource: DataSource = {
  async lookup(cif) {
    const response = await callServer(
      `/api/records?cif=${encodeURIComponent(cif)}`,
      undefined,
      "확인 필요: 조회에 실패했습니다."
    );
    return (await response.json()).records as RecordItem[];
  },

  async createPreview(record) {
    const response = await callServer(
      "/api/transfer-pdf",
      { ...JSON_POST, body: keyOf(record) },
      "확인 필요: 미리보기를 만들지 못했습니다."
    );
    return response.blob();
  },

  async save(record) {
    const response = await callServer(
      "/api/transfer-pdf/save",
      { ...JSON_POST, body: keyOf(record) },
      "확인 필요: 저장하지 못했습니다."
    );
    const data = await response.json();
    return `저장했습니다: ${data.fileName}`;
  },
};

// 던져진 값에서 화면에 보여 줄 문구를 꺼낸다. (문구가 없으면 기본 안내를 쓴다.)
export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
