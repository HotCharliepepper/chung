# StayMind AI — 최상위 정리형 소스 배포 가이드

이 ZIP은 기존 Next.js 애플리케이션 소스를 보존하면서 GitHub **최상위**에 바로 업로드할 수 있도록 정리한 대안입니다.
최상위에 `package.json`, `next.config.ts`, `netlify.toml`, `src/`, `public/`가 있습니다.

**주의**: 기존 `chungwhan` 저장소는 `staymind-ai-step2-dashboard/` 내부에 소스가 있는 구조입니다.
기존 저장소를 건드리지 않고 해결하려면 이 ZIP 대신 `staymind_chungwhan_hotfix.zip`의 루트 `netlify.toml`을 사용하세요.

## 새로운 저장소 혹은 깔끔한 루트 구조를 선택한다면
1. ZIP의 **압축을 풀고 내부 파일/폴더**를 GitHub 저장소 루트에 업로드하세요 (ZIP 그 자체를 올리는 것이 아님).
2. Netlify에서 Git 저장소를 연결해 빌드합니다. Base directory는 빈칸(저장소 루트)입니다.
3. Build command `npm run build`, Publish directory `.next`, Node.js `22`.
4. `ANTHROPIC_API_KEY`는 Netlify Environment variables에만 설정하세요.
5. `/`, `/draft`, `/settings`, POST `/api/draft`(유효하지 않은 요청은 400) 순서로 검사합니다.

## 코드에서 최소로 변경한 점
- `netlify.toml` 추가 (Next.js SSR/Route Handler 배포 설정)
- `npm test` 명령 수정 (Node 22.16에서도 TypeScript 테스트 실행)
- 이 안내 문서 추가
- 원본 ZIP에 포함돼 있던 `.git/`을 제외 (다른 저장소에 기존 Git 내부 기록을 복사하지 않기 위함)

## 주의
- `output: "export"`, `/* /index.html 200` 등을 임의로 추가하지 마세요: API 라우트가 무력화될 수 있습니다.
- 공개 전에 `/api/draft`에 인증과 호출 제한을 적용하세요. 현재 서버 API는 로그인 없이 사용 가능하며 유료 API 키의 비용 위험이 있습니다.
- 숙소 정보는 브라우저 localStorage에만 저장되며 실제 예약 자동화, OTA 연동, 서버 DB, 자동발송은 구현되어 있지 않습니다.
- 현재 작업 환경에서는 npm 패키지 레지스트리에 접속할 수 없어 전체 빌드 성공 여부를 검증하지 못했습니다.
