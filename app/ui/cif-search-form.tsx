"use client";

// 개발 단위 3·4·5: CIF 입력 → 조회 → 건 목록에서 1건 선택
// 입력값 검사와 버튼 동작이 필요해서 클라이언트 컴포넌트로 만든다.

import { useState } from "react";
import RecordList, { type RecordItem } from "@/app/ui/record-list";

export default function CifSearchForm() {
  const [cif, setCif] = useState(""); // 입력 칸의 값
  const [error, setError] = useState(""); // 입력·조회 오류 안내 문구
  const [loading, setLoading] = useState(false); // 조회 중인지
  const [records, setRecords] = useState<RecordItem[] | null>(null); // 조회된 건 목록
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 고른 건

  // 조회 버튼을 눌렀을 때: 입력값을 검사하고, 통과하면 조회 API를 부른다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = cif.trim();
    // 새로 조회하면 이전 결과와 선택은 지운다.
    setRecords(null);
    setSelectedIndex(null);

    if (value === "") {
      setError("CIF를 입력해 주세요.");
      return;
    }
    if (!/^\d+$/.test(value)) {
      setError("CIF는 숫자만 입력할 수 있습니다.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/records?cif=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (!response.ok) {
        // 서버가 보낸 "확인 필요" 안내를 그대로 보여 준다.
        setError(data.message ?? "확인 필요: 조회에 실패했습니다.");
        return;
      }
      setRecords(data.records as RecordItem[]);
    } catch {
      setError("확인 필요: 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  const selected = records !== null && selectedIndex !== null ? records[selectedIndex] : null;

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <label htmlFor="cif" className="text-sm font-medium">
          CIF 번호
        </label>
        <div className="flex gap-2">
          <input
            id="cif"
            name="cif"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={cif}
            onChange={(e) => setCif(e.target.value)}
            placeholder="예: 10000182"
            aria-invalid={error !== ""}
            aria-describedby={error ? "cif-error" : undefined}
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-md bg-blue-600 px-5 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>

        {error && (
          <p id="cif-error" role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {records && (
        <RecordList records={records} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      )}

      {/* 임시 표시: 단위 6에서 선택한 건으로 별지를 만든다. */}
      {selected && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          선택한 건: {selected.institution} · {selected.round}
        </p>
      )}
    </div>
  );
}
