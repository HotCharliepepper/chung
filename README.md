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

## 실행 방법 (Windows)

1. zip 파일을 `C:\dev\staymind-ai` 에 압축 풉니다. (폴더 안에 바로 `package.json`이 보이도록)
2. VS Code에서 `C:\dev\staymind-ai` 폴더를 엽니다.
3. VS Code 메뉴 터미널 → 새 터미널을 열고 아래를 차례로 실행합니다.

```
npm install
npm run dev
```

4. 브라우저에서 http://localhost:3000 을 엽니다.

## AI 답변 초안 사용하기 (/draft)

AI 초안을 만들려면 본인의 Claude API 키가 필요합니다.

1. https://console.anthropic.com 에 로그인해서 API Keys 메뉴에서 키를 새로 만들고 복사합니다. (결제 수단 등록이나 크레딧 충전이 필요할 수 있습니다.)
2. VS Code에서 `C:\dev\staymind-ai` 폴더 바로 아래에 새 파일 `.env.local` 을 만듭니다. (`package.json`과 같은 위치, 파일 이름 앞의 점까지 정확히)
3. 아래 한 줄을 넣고 저장합니다. `=` 뒤에 복사한 키를 붙여넣고, 따옴표나 띄어쓰기는 넣지 않습니다.

```
ANTHROPIC_API_KEY=여기에_복사한_키
```

4. 터미널에서 `Ctrl + C` 로 실행 중인 서버를 멈추고, 다시 `npm run dev` 를 실행합니다. (`.env.local`은 서버를 시작할 때만 읽습니다.)
5. 브라우저에서 http://localhost:3000/draft 를 엽니다.

**API 키는 비밀번호와 같습니다. 채팅, 메신저, 스크린샷, 깃허브 어디에도 절대 붙여넣거나 보여주지 마세요.**
`.env.local` 파일은 `.gitignore`에 들어 있어서 git에 올라가지 않습니다. 키가 노출됐다면 콘솔에서 바로 삭제하고 새로 만드세요.

선택: 다른 모델을 쓰고 싶으면 `.env.local`에 `ANTHROPIC_MODEL=모델이름` 줄을 추가합니다. 비워 두면 기본값 `claude-sonnet-5-5`를 씁니다.

### 동작 방식
- 문의를 보내기 전에 브라우저에서 전화번호와 이메일을 `[전화번호]`, `[이메일]`로 가립니다. (서버에서도 한 번 더 가림)
- AI는 저장된 숙소 정보와 FAQ만 근거로 답하고, 정보에 없는 내용은 "확인 후 안내드리겠습니다"라고 씁니다.
- 초안은 자동으로 보내지지 않습니다. 확인·수정한 뒤 "복사" 버튼으로 복사해서 직접 붙여넣으세요.
- 문의와 초안은 어디에도 저장되지 않습니다.

### 테스트 실행
```
npm test
```
