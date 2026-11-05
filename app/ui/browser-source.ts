// 개발 단위 16: 배포본 방식 — 올린 파일로 이 브라우저 안에서 조회·미리보기를 처리한다.
//
// 개인정보 원칙: 올린 원장·양식과 만든 PDF는 서버로 보내지 않는다.
// 서버에서 받는 것은 공개해도 되는 한글 글꼴 파일뿐이다.

import type { UploadedData } from "@/app/ui/upload-panel";
import type { DataSource } from "@/app/ui/data-source";
import { findByCif, findMissingFields } from "@/lib/ledgerCore";

// 한글 글꼴(오픈 라이선스)을 한 번만 내려받아 계속 쓴다.
let fontPromise: Promise<Uint8Array> | null = null;

function loadFont(): Promise<Uint8Array> {
  if (!fontPromise) {
    fontPromise = fetch("/api/font")
      .then(async (response) => {
        if (!response.ok) throw new Error("글꼴을 받지 못했습니다.");
        return new Uint8Array(await response.arrayBuffer());
      })
      .catch((error) => {
        fontPromise = null; // 실패하면 다음에 다시 시도할 수 있게 비운다.
        throw error;
      });
  }
  return fontPromise;
}

// 올린 데이터로 처리하는 연결부를 만든다.
export function makeBrowserSource(data: UploadedData): DataSource {
  return {
    async lookup(cif) {
      const records = findByCif(data.records, cif);
      if (records.length === 0) {
        throw new Error("확인 필요: 입력한 CIF의 건이 올린 원장에 없습니다.");
      }
      return records.map((record) => ({ ...record, missing: findMissingFields(record) }));
    },

    async createPreview(record) {
      let fontBytes: Uint8Array;
      try {
        fontBytes = await loadFont();
      } catch {
        throw new Error("확인 필요: 한글 글꼴을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
      try {
        // PDF를 만드는 코드는 크기가 커서, 미리보기를 처음 만들 때 불러온다.
        const { createTransferPdf } = await import("@/lib/transferCore");
        const bytes = await createTransferPdf(record, data.formBytes, fontBytes);
        // Blob은 ArrayBuffer 기반 입력만 받으므로 복사해서 넘긴다.
        return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("확인 필요:")) throw error;
        throw new Error("확인 필요: PDF를 만들지 못했습니다. 양식 이미지를 확인해 주세요.");
      }
    },

    async save() {
      // TODO(단위 17): 새 파일명으로 내려받기를 연결한다.
      throw new Error("확인 필요: 내려받기는 다음 단계에서 연결됩니다.");
    },
  };
}
