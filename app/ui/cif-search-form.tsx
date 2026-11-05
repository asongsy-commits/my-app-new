"use client";

// 개발 단위 3·4·5·16: CIF 입력 → 조회 → 건 목록에서 1건 선택 → 미리보기 → 저장
// 입력값 검사와 버튼 동작이 필요해서 클라이언트 컴포넌트로 만든다.
//
// 조회·미리보기·저장을 어디서 처리하는지는 source가 정한다.
// - 내 컴퓨터 방식(기본): 서버 API (serverSource)
// - 배포본 방식: 올린 파일로 브라우저 안에서 처리 (browser-source.ts)

import { useEffect, useRef, useState } from "react";
import { messageOf, serverSource, type DataSource } from "@/app/ui/data-source";
import RecordList, { type RecordItem } from "@/app/ui/record-list";

type Props = { source?: DataSource };

export default function CifSearchForm({ source = serverSource }: Props) {
  const [cif, setCif] = useState(""); // 입력 칸의 값
  const [error, setError] = useState(""); // 입력·조회 오류 안내 문구
  const [loading, setLoading] = useState(false); // 조회 중인지
  const [records, setRecords] = useState<RecordItem[] | null>(null); // 조회된 건 목록
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 고른 건

  // 미리보기 상태 (단위 8)
  const [previewUrl, setPreviewUrl] = useState(""); // 만들어진 PDF를 볼 수 있는 임시 주소
  const [previewLoading, setPreviewLoading] = useState(false); // PDF를 만드는 중인지
  const [previewError, setPreviewError] = useState(""); // PDF 만들기 실패 안내
  const [saving, setSaving] = useState(false); // 저장 중인지
  const [notice, setNotice] = useState(""); // 저장 결과 안내 (성공 문구)
  const [saveError, setSaveError] = useState(""); // 저장 실패 안내
  const previewUrlRef = useRef(""); // 화면을 떠날 때 임시 주소를 정리하기 위해 기억해 둔다.

  // 화면을 떠날 때 임시 PDF 주소를 정리한다.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // 미리보기를 지운다. (다른 건을 고르거나 새로 조회할 때)
  function clearPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPreviewUrl("");
    setPreviewError("");
    setNotice("");
    setSaveError("");
  }

  // 다른 건을 고르면 이전 미리보기는 지운다.
  function handleSelect(index: number) {
    clearPreview();
    setSelectedIndex(index);
  }

  // 선택한 건으로 양도증서 PDF를 만들어 미리보기에 보여 준다.
  async function handlePreview() {
    if (records === null || selectedIndex === null) return;
    const record = records[selectedIndex];
    clearPreview();
    setPreviewLoading(true);
    try {
      const url = URL.createObjectURL(await source.createPreview(record));
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (e) {
      setPreviewError(messageOf(e, "확인 필요: 미리보기를 만들지 못했습니다."));
    } finally {
      setPreviewLoading(false);
    }
  }

  // 미리보기를 확인한 뒤 "확인 후 저장"을 눌렀을 때: 결과 폴더에 PDF를 저장한다.
  async function handleSave() {
    if (records === null || selectedIndex === null) return;
    const record = records[selectedIndex];
    setNotice("");
    setSaveError("");
    setSaving(true);
    try {
      setNotice(await source.save(record));
    } catch (e) {
      setSaveError(messageOf(e, "확인 필요: 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  // 조회 버튼을 눌렀을 때: 입력값을 검사하고, 통과하면 조회 API를 부른다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = cif.trim();
    // 새로 조회하면 이전 결과와 선택, 미리보기는 지운다.
    setRecords(null);
    setSelectedIndex(null);
    clearPreview();

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
      setRecords(await source.lookup(value));
    } catch (e) {
      setError(messageOf(e, "확인 필요: 조회에 실패했습니다."));
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
        <RecordList records={records} selectedIndex={selectedIndex} onSelect={handleSelect} />
      )}

      {/* 건을 고르면 미리보기를 만들 수 있다. */}
      {selected && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            선택한 건: {selected.institution} · {selected.round}
          </p>

          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading}
            className="self-start rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-300 dark:hover:bg-blue-950"
          >
            {previewLoading ? "미리보기 만드는 중..." : "미리보기 만들기"}
          </button>

          {previewError && (
            <p role="alert" className="text-sm text-red-600">
              {previewError}
            </p>
          )}
        </div>
      )}

      {/* 미리보기: 양도증서(1쪽)와 별지(2쪽)를 확인하고, 문제가 없으면 저장한다. */}
      {previewUrl && (
        <div className="flex flex-col gap-3">
          <iframe
            src={previewUrl}
            title="양도증서 미리보기"
            className="h-[70vh] w-full rounded-md border border-zinc-300 dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="self-start rounded-md bg-blue-600 px-5 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "저장 중..." : "확인 후 저장"}
          </button>
          {notice && (
            <p role="status" className="text-sm text-green-700 dark:text-green-400">
              {notice}
            </p>
          )}
          {saveError && (
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
