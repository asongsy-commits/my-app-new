// 개발 단위 16: 브라우저가 PDF를 만들 때 쓰는 한글 글꼴(Noto Sans KR Regular)을 내려준다.
// 이 글꼴은 오픈 라이선스(OFL)라 누구에게 줘도 된다. 개인정보는 들어 있지 않다.
// (배포본 방식에서도 이 API는 열려 있다. 위 파일만 내려주기 때문이다.)

import fs from "node:fs/promises";
import path from "node:path";

const FONT_PATH = path.join(process.cwd(), "fonts", "NotoSansKR-Regular.otf");

export async function GET() {
  try {
    const bytes = await fs.readFile(FONT_PATH);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "font/otf",
        // 글꼴은 바뀌지 않으므로 브라우저가 오래 기억해도 된다.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ message: "확인 필요: 글꼴 파일을 찾을 수 없습니다." }, { status: 500 });
  }
}
