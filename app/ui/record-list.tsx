"use client";

// 개발 단위 5: 조회된 건 목록을 보여 주고, 담당자가 1건만 고르게 한다.
// 값이 비어 있는 건은 고를 수 없게 막고 "확인 필요"로 안내한다.

import type { LedgerRecord } from "@/lib/ledger";

// 조회 API가 돌려주는 한 건의 모양 (비어 있는 항목 이름 목록이 함께 온다)
export type RecordItem = LedgerRecord & { missing: string[] };

type Props = {
  records: RecordItem[];
  selectedIndex: number | null; // 고른 건의 번호 (아직 안 골랐으면 null)
  onSelect: (index: number) => void;
};

// 원 단위 금액을 읽기 쉽게 바꾼다. (예: 15840000 → 15,840,000원)
function formatWon(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

export default function RecordList({ records, selectedIndex, onSelect }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">
        {records.length}건이 조회되었습니다. 처리할 건을 1건 선택해 주세요.
      </legend>

      {records.map((record, index) => {
        const blocked = record.missing.length > 0; // 값이 비어 있으면 고를 수 없다.
        const checked = selectedIndex === index;

        return (
          <label
            key={`${record.cif}-${record.round}-${record.institution}-${index}`}
            className={`flex gap-3 rounded-md border p-3 text-sm ${
              blocked
                ? "cursor-not-allowed border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                : checked
                  ? "cursor-pointer border-blue-600 bg-blue-50 dark:bg-blue-950"
                  : "cursor-pointer border-zinc-300 hover:border-blue-400 dark:border-zinc-700"
            }`}
          >
            <input
              type="radio"
              name="record"
              className="mt-1"
              checked={checked}
              disabled={blocked}
              onChange={() => onSelect(index)}
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">
                {record.institution || "(금융기관 없음)"} · {record.round || "(회차 없음)"}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {record.name || "(성명 없음)"} · {record.loanType || "(대출과목 없음)"} · 잔액{" "}
                {formatWon(record.balance)}
              </span>
              {blocked && (
                <span role="alert" className="text-red-600">
                  확인 필요: 비어 있는 항목이 있어 선택할 수 없습니다. ({record.missing.join(", ")})
                </span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
