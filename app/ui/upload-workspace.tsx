"use client";

// 배포본(시연용) 방식의 작업 화면: 파일 올리기 → (다음 단계) 조회·선택·미리보기·내려받기
// 올린 데이터는 이 화면의 메모리에만 있다. (서버로 보내지 않는다.)

import { useState } from "react";
import UploadPanel, { type UploadedData } from "@/app/ui/upload-panel";

export default function UploadWorkspace() {
  // 파일이 모두 준비되면 값이 들어오고, 아니면 null이다.
  const [data, setData] = useState<UploadedData | null>(null);

  return (
    <div className="flex w-full flex-col gap-8">
      <UploadPanel onReady={setData} />

      {/* TODO(단위 16): 올린 데이터(data)로 조회 → 선택 → 미리보기를 보여 준다. */}
      {data && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          조회 화면은 다음 단계에서 연결됩니다.
        </p>
      )}
    </div>
  );
}
