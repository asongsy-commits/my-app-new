# 양도증서 작성도우미

CIF를 입력하면 엑셀 원장에서 해당 건을 조회하고, 양도증서 양식 뒤에 별지를 붙여 PDF로 저장하는 앱입니다.
기획 내용은 `PRD.md`, 배포 계획은 `DEPLOY.md`에 있습니다.

## 폴더를 다른 곳으로 옮기기

이 폴더는 **이름과 위치를 바꿔도(한글·공백이 있는 경로 포함) 그대로 동작**합니다. 코드에 폴더 위치가 적혀 있지 않고, 앱을 실행한 폴더를 기준으로 파일을 찾기 때문입니다.
(이름이 다른 복사본을 한글·공백 경로에 만들어 조회, 미리보기, 저장, 빌드까지 확인했습니다.)

**옮기는 방법**

1. 폴더 전체를 복사하거나 옮깁니다. 아래 항목이 모두 들어 있어야 합니다.
   - `원장/` : 엑셀 원장과 보강 데이터 (GitHub에는 올라가지 않으므로 직접 챙겨야 합니다)
   - `양도증서_pdf/` : 양식 이미지와 저장된 결과 (`결과/` 폴더)
   - `fonts/`, `data-config.json`, `.env`
   - `node_modules/` : 없으면 옮긴 곳에서 `npm install`을 한 번 실행합니다.
2. 옮긴 폴더 **안에서** 실행합니다.

   ```bash
   npm run dev
   ```

3. 같은 이름의 폴더가 이미 있는 곳(예: 이미 `my-app`이 있는 폴더)에는 **덮어쓰지 말고** 다른 이름으로 옮깁니다.

**저장 위치**

- 저장한 PDF는 옮긴 폴더 안의 `양도증서_pdf/결과/`에 생깁니다. 저장은 항상 이 폴더에 먼저 하고, 필요하면 그 파일을 직접 다른 곳으로 옮기면 됩니다.
- 결과 폴더를 바꾸고 싶으면 `data-config.json`의 `outputFolder`를 고칩니다. (이 프로젝트 폴더 안의 경로만 쓸 수 있습니다.)

**옮긴 뒤 "원장을 읽지 못했습니다"가 나오면**

`원장/` 폴더나 `data-config.json`의 파일 이름이 맞는지 확인하세요. 데이터 폴더를 함께 옮기지 않은 경우가 가장 흔합니다.

## Next.js 기본 안내

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
