"use client";

// 개발 단위 15: 엑셀 원장·보강 데이터(CSV)·양도증서 양식 이미지를 올리는 화면 (배포본 방식 전용)
//
// 개인정보 원칙: 올린 파일은 서버로 보내지 않는다.
// 이 브라우저의 메모리에서만 읽고, 새로고침하거나 탭을 닫으면 사라진다.
// (이 파일에는 fetch 같은 네트워크 호출이 없다.)

import { useRef, useState } from "react";
import type { LedgerRecord } from "@/lib/ledgerCore";

// 위 세 파일이 모두 준비되면 부모 화면에 넘겨 주는 데이터
export type UploadedData = {
  records: LedgerRecord[]; // 원장과 보강 데이터를 합친 건 목록
  formBytes: Uint8Array; // 양도증서 양식 이미지 내용
};

type Props = {
  // 세 파일이 모두 준비되면 데이터를, 하나라도 빠지거나 문제가 있으면 null을 알려 준다.
  onReady: (data: UploadedData | null) => void;
};

type Slot = "ledger" | "supplement" | "form";

// 칸별 안내와 제한
const SLOTS: Record<
  Slot,
  { label: string; accept: string; extensions: string[]; maxBytes: number; hint: string }
> = {
  ledger: {
    label: "엑셀 원장",
    accept: ".xlsx",
    extensions: [".xlsx"],
    maxBytes: 30 * 1024 * 1024,
    hint: ".xlsx 파일 (CIF, 성명, 인수회차, 금융기관, 대출과목, 대출잔액 열이 있어야 합니다)",
  },
  supplement: {
    label: "보강 데이터 (CSV)",
    accept: ".csv",
    extensions: [".csv"],
    maxBytes: 10 * 1024 * 1024,
    hint: ".csv 파일 (CIF, 최초대출일, 미수이자, 연체이자, 합계, 주소 열이 있어야 합니다)",
  },
  form: {
    label: "양도증서 양식 이미지",
    accept: ".jfif,.jpg,.jpeg,.png",
    extensions: [".jfif", ".jpg", ".jpeg", ".png"],
    maxBytes: 10 * 1024 * 1024,
    hint: "JPEG(.jfif, .jpg) 또는 PNG 이미지",
  },
};

// 읽어 둔 파일 (원본 내용은 이 화면의 메모리에만 있다.)
type Loaded = { name: string; size: number; bytes: Uint8Array };
type Files = Partial<Record<Slot, Loaded>>;

// 파일 크기를 읽기 쉽게 바꾼다. (예: 12266 → 12.0KB)
function formatSize(size: number): string {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${(size / 1024).toFixed(1)}KB`;
}

// 양식 이미지가 JPEG 또는 PNG인지 맨 앞 글자로 확인한다.
function isJpegOrPng(bytes: Uint8Array): boolean {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return jpeg || png;
}

export default function UploadPanel({ onReady }: Props) {
  // 같은 순간에 파일 두 개를 고르는 경우를 대비해, 최신 파일 목록은 ref로도 들고 있다.
  const filesRef = useRef<Files>({});
  const [files, setFiles] = useState<Files>({});
  const [errors, setErrors] = useState<Partial<Record<Slot, string>>>({});
  const [ledgerCount, setLedgerCount] = useState<number | null>(null); // 읽은 건 수
  const [ledgerError, setLedgerError] = useState(""); // 원장·CSV를 합칠 때 생긴 문제
  const [busy, setBusy] = useState(false);

  // 지금 올라온 파일들로 원장을 읽어 보고, 준비 상태를 부모에게 알린다.
  async function evaluate(current: Files) {
    setLedgerCount(null);
    setLedgerError("");

    // 원장과 보강 데이터가 모두 있어야 합칠 수 있다.
    if (!current.ledger || !current.supplement) {
      onReady(null);
      return;
    }

    setBusy(true);
    try {
      // 엑셀을 읽는 코드는 크기가 커서, 파일을 올렸을 때 처음 불러온다.
      const { parseLedger } = await import("@/lib/ledgerCore");
      const csvText = new TextDecoder("utf-8").decode(current.supplement.bytes);
      const records = await parseLedger(current.ledger.bytes, csvText);
      if (records.length === 0) {
        setLedgerError("확인 필요: 원장에서 읽은 건이 없습니다. 파일 내용을 확인해 주세요.");
        onReady(null);
        return;
      }
      setLedgerCount(records.length);
      onReady(current.form ? { records, formBytes: current.form.bytes } : null);
    } catch (error) {
      setLedgerError(
        error instanceof Error && error.message ? `확인 필요: ${error.message}` : "확인 필요: 파일을 읽지 못했습니다."
      );
      onReady(null);
    } finally {
      setBusy(false);
    }
  }

  // 파일을 골랐을 때: 종류와 크기를 확인하고 메모리로 읽는다.
  async function handleChange(slot: Slot, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일을 다시 골라도 반응하도록 비운다.
    if (!file) return;

    const rule = SLOTS[slot];
    const lowerName = file.name.toLowerCase();
    let problem = "";
    if (!rule.extensions.some((ext) => lowerName.endsWith(ext))) {
      problem = `확인 필요: ${rule.extensions.join(", ")} 파일만 올릴 수 있습니다.`;
    } else if (file.size === 0) {
      problem = "확인 필요: 비어 있는 파일입니다.";
    } else if (file.size > rule.maxBytes) {
      problem = `확인 필요: 파일이 너무 큽니다. (최대 ${formatSize(rule.maxBytes)})`;
    }

    let bytes: Uint8Array | null = null;
    if (!problem) {
      bytes = new Uint8Array(await file.arrayBuffer());
      if (slot === "form" && !isJpegOrPng(bytes)) {
        problem = "확인 필요: JPEG 또는 PNG 이미지가 아닙니다.";
      }
    }

    setErrors((prev) => ({ ...prev, [slot]: problem }));
    if (problem || !bytes) return; // 문제가 있으면 이전에 올린 파일은 그대로 둔다.

    const next: Files = { ...filesRef.current, [slot]: { name: file.name, size: file.size, bytes } };
    filesRef.current = next;
    setFiles(next);
    await evaluate(next);
  }

  // 올린 파일을 지운다.
  async function handleRemove(slot: Slot) {
    const next: Files = { ...filesRef.current };
    delete next[slot];
    filesRef.current = next;
    setFiles(next);
    setErrors((prev) => ({ ...prev, [slot]: "" }));
    await evaluate(next);
  }

  const allUploaded = Boolean(files.ledger && files.supplement && files.form);

  return (
    <section aria-labelledby="upload-title" className="flex w-full max-w-md flex-col gap-4">
      <h2 id="upload-title" className="text-lg font-semibold">
        1. 파일 올리기
      </h2>

      {(Object.keys(SLOTS) as Slot[]).map((slot) => {
        const rule = SLOTS[slot];
        const loaded = files[slot];
        const inputId = `upload-${slot}`;
        return (
          <div key={slot} className="flex flex-col gap-1">
            <label htmlFor={inputId} className="text-sm font-medium">
              {rule.label}
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{rule.hint}</p>

            {loaded ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-950">
                <span className="min-w-0 truncate">
                  ✔ {loaded.name} ({formatSize(loaded.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(slot)}
                  disabled={busy}
                  className="shrink-0 text-xs text-zinc-600 underline hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-300"
                >
                  지우기
                </button>
              </div>
            ) : null}

            {/* 올린 뒤에도 다른 파일로 바꿀 수 있게 항상 보여 준다. */}
            <input
              id={inputId}
              type="file"
              accept={rule.accept}
              disabled={busy}
              onChange={(e) => handleChange(slot, e)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 disabled:opacity-50"
            />

            {errors[slot] && (
              <p role="alert" className="text-sm text-red-600">
                {errors[slot]}
              </p>
            )}
          </div>
        );
      })}

      {busy && <p className="text-sm text-zinc-600 dark:text-zinc-400">원장을 읽는 중...</p>}

      {ledgerError && (
        <p role="alert" className="text-sm text-red-600">
          {ledgerError}
        </p>
      )}

      {ledgerCount !== null && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          원장 {ledgerCount}건을 읽었습니다.
          {allUploaded ? " 파일이 모두 준비되었습니다." : " 양식 이미지도 올려 주세요."}
        </p>
      )}
    </section>
  );
}
