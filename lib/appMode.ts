// 개발 단위 13: 앱이 어느 방식으로 동작하는지 구분한다.
//
// - 내 컴퓨터 방식(기본): 고정 폴더(원장/, 양도증서_pdf/)를 서버가 읽고 결과 폴더에 저장한다.
// - 배포본 방식(upload): 담당자가 파일을 올리고 브라우저에서만 처리한 뒤 내려받는다.
//
// 환경 변수 NEXT_PUBLIC_APP_MODE의 값이 "upload"이면 배포본 방식이다.
// 이 값은 Vercel에만 넣고, 내 컴퓨터의 .env에는 넣지 않는다.
//
// 주의: Next.js는 빌드할 때 `process.env.NEXT_PUBLIC_APP_MODE`라는 글자를 그대로 찾아
// 값으로 바꿔 넣는다. 변수 이름을 따로 모아 쓰는 식으로 바꾸면 값이 들어가지 않는다.

export const isUploadMode: boolean = process.env.NEXT_PUBLIC_APP_MODE === "upload";

// 배포본 방식에서는 서버의 조회·PDF API를 쓰지 않는다. (서버에 원장이 없고, 열어 둘 이유도 없다.)
// 배포본 방식이면 막는 응답(404)을 돌려주고, 내 컴퓨터 방식이면 null을 돌려준다.
export function rejectInUploadMode(): Response | null {
  if (!isUploadMode) return null;
  return Response.json(
    { message: "확인 필요: 배포본에서는 이 기능을 쓸 수 없습니다. 파일을 올려서 이용해 주세요." },
    { status: 404 }
  );
}
