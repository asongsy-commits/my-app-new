import CifSearchForm from "@/app/ui/cif-search-form";
import DemoBanner from "@/app/ui/demo-banner";
import UploadWorkspace from "@/app/ui/upload-workspace";
import { isUploadMode } from "@/lib/appMode";

// 첫 화면: CIF를 입력해 양도증서 작성을 시작한다.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      {/* 배포본(시연용) 방식에서만 안내 문구를 보여 준다. */}
      {isUploadMode && <DemoBanner />}

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">양도증서 작성도우미</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          CIF를 입력하면 해당 건을 조회해 양도증서를 만들 수 있습니다.
        </p>
      </header>

      {/* 배포본 방식은 파일을 올려서 쓰고, 내 컴퓨터 방식은 고정 폴더에서 읽는다. */}
      {isUploadMode ? <UploadWorkspace /> : <CifSearchForm />}
    </main>
  );
}
