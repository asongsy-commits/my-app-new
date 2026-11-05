"use client";

// 개발 단위 3: CIF 입력 화면 (입력 칸 + 조회 버튼)
// 입력값 검사와 버튼 동작이 필요해서 클라이언트 컴포넌트로 만든다.

import { useState } from "react";

export default function CifSearchForm() {
  const [cif, setCif] = useState(""); // 입력 칸의 값
  const [error, setError] = useState(""); // 입력 오류 안내 문구
  const [submittedCif, setSubmittedCif] = useState(""); // 조회 버튼을 누른 CIF

  // 조회 버튼을 눌렀을 때: 입력값을 검사한다.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = cif.trim();

    if (value === "") {
      setError("CIF를 입력해 주세요.");
      setSubmittedCif("");
      return;
    }
    if (!/^\d+$/.test(value)) {
      setError("CIF는 숫자만 입력할 수 있습니다.");
      setSubmittedCif("");
      return;
    }

    setError("");
    setSubmittedCif(value);
    // TODO(단위 4): 여기서 CIF로 건 목록을 조회하는 API를 호출한다.
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3" noValidate>
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
          className="shrink-0 rounded-md bg-blue-600 px-5 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          조회
        </button>
      </div>

      {error && (
        <p id="cif-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 임시 표시: 단위 4에서 건 목록 조회가 연결되면 이 부분을 목록으로 바꾼다. */}
      {submittedCif && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          입력한 CIF: {submittedCif}
        </p>
      )}
    </form>
  );
}
