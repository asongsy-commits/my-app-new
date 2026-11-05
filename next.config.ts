import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 배포(Vercel) 때 서버 코드가 읽는 파일을 함께 올리도록 지정한다.
  // 글꼴과 설정 파일은 코드에서 경로를 직접 만들어 읽기 때문에 자동으로 포함되지 않는다.
  // (원장·양식·결과 폴더는 개인정보라 GitHub에 없으므로 여기에 넣지 않는다.)
  outputFileTracingIncludes: {
    "/api/records": ["./data-config.json"],
    "/api/font": ["./fonts/NotoSansKR-Regular.otf"],
    "/api/transfer-pdf": ["./data-config.json", "./fonts/NotoSansKR-Regular.otf"],
    "/api/transfer-pdf/save": ["./data-config.json", "./fonts/NotoSansKR-Regular.otf"],
  },
  // 개인정보가 든 데이터 폴더는 배포 파일에 절대 넣지 않는다.
  outputFileTracingExcludes: {
    "/api/*": ["./원장/**/*", "./양도증서_pdf/**/*", "./trash-can/**/*"],
    "/api/*/*": ["./원장/**/*", "./양도증서_pdf/**/*", "./trash-can/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
