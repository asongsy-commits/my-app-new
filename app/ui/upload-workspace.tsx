"use client";

// 배포본(시연용) 방식의 작업 화면: 파일 올리기 → 조회·선택·미리보기 (내려받기는 단위 17)
// 올린 데이터는 이 화면의 메모리에만 있다. (서버로 보내지 않는다.)

import { useMemo, useState } from "react";
import { makeBrowserSource } from "@/app/ui/browser-source";
import CifSearchForm from "@/app/ui/cif-search-form";
import UploadPanel, { type UploadedData } from "@/app/ui/upload-panel";

export default function UploadWorkspace() {
  // 파일이 모두 준비되면 값이 들어오고, 아니면 null이다.
  const [data, setData] = useState<UploadedData | null>(null);
  // 파일 상태가 바뀔 때마다 올라가는 번호. 조회 화면을 새로 시작하는 기준으로 쓴다.
  const [version, setVersion] = useState(0);

  // 올린 데이터가 바뀔 때만 새로 만든다.
  const source = useMemo(() => (data ? makeBrowserSource(data) : null), [data]);

  return (
    <div className="flex w-full flex-col gap-8">
      <UploadPanel
        onReady={(next) => {
          setData(next);
          setVersion((v) => v + 1);
        }}
      />

      {/* 파일이 모두 준비되면 조회 → 선택 → 미리보기를 올린 데이터로 처리한다. */}
      {data && source && (
        <section aria-labelledby="work-title" className="flex w-full flex-col gap-4">
          <h2 id="work-title" className="text-lg font-semibold">
            2. 양도증서 만들기
          </h2>
          {/* data가 바뀌면(파일을 바꿔 올리면) 이전 조회 결과가 남지 않도록 새로 시작한다. */}
          <CifSearchForm key={version} source={source} />
        </section>
      )}
    </div>
  );
}
