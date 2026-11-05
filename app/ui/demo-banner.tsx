// 배포본(시연용) 방식에서만 화면 맨 위에 보여 주는 안내 문구
// 실제 고객 자료를 올리지 않도록 주의를 준다.

export default function DemoBanner() {
  return (
    <div
      role="note"
      className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <strong>가상 데이터 시연용입니다.</strong> 실제 고객 자료를 올리지 마세요. 올린 파일은
      서버로 보내지 않고 이 브라우저 안에서만 처리하며, 새로고침하면 사라집니다.
    </div>
  );
}
