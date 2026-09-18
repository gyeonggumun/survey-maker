# 설문 제작소

설문을 작성·발행하고, 공개 링크로 응답을 받고, 결과를 차트로 확인하는 React + Supabase 서비스입니다.

## 구현 기능

- 이메일 회원가입·로그인·로그아웃 및 보호된 제작자 화면
- 설문 생성, 임시 저장, 편집, 삭제, 질문 순서 변경
- 객관식, 복수 선택, 주관식 및 필수 응답·글자 수 제한
- 응답자 화면 미리보기와 설문 발행
- 로그인 없이 접근하는 공개 설문 응답과 서버 측 검증
- 객관식·복수 선택 차트와 주관식 답변 목록
- Supabase RLS, 최소 권한 GRANT, 원자적 `save_survey`·`submit_survey` RPC

## 기술 구성

```text
React + TypeScript + Vite + Tailwind CSS
  ├── React Hook Form: 설문 작성·응답 검증
  ├── Zustand: 인증 사용자 상태
  ├── Supabase: Auth + PostgreSQL + RLS
  └── Vercel: 정적 프런트엔드 배포
```

## 로컬 실행

Node.js 20.19 이상을 사용합니다.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local`에는 Supabase Connect 화면에서 받은 값만 넣습니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`VITE_` 값은 브라우저에 포함됩니다. Publishable Key만 사용하고 `service_role` 또는 Secret Key는 절대 넣지 않습니다.

## Supabase 연결

1. Supabase에서 새 프로젝트를 만듭니다.
2. 프로젝트를 로컬 저장소와 연결합니다.

   ```powershell
   npx supabase login --token <personal-access-token>
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

3. Dashboard의 **Integrations → Data API**에서 `public` 스키마와 `surveys`, `questions`, `responses`, `answers`, `save_survey`, `submit_survey`을 Data API에 노출합니다. 최근 Supabase 프로젝트는 새 테이블이 자동 노출되지 않을 수 있습니다.
4. Connect 화면의 Project URL 및 Publishable Key를 `.env.local`에 넣고 개발 서버를 다시 시작합니다.
5. Authentication → URL Configuration에서 **Site URL**을 실제 Vercel Production URL로 설정하고, Redirect URLs에 아래 주소를 등록합니다.

   ```text
   https://<your-vercel-domain>
   http://localhost:5173/**
   https://<your-vercel-domain>/**
   https://*-<your-vercel-account>.vercel.app/**
   ```

`supabase/migrations/`의 마이그레이션은 소유자만 설문·결과를 읽고 수정하도록 RLS를 설정합니다. `save_survey`는 질문 변경과 발행을 하나의 트랜잭션으로 처리하고, 응답자는 테이블에 직접 쓰지 못합니다. 공개된 `submit_survey` RPC는 설문 상태·필수 응답·선택지 유효성을 검증한 뒤 하나의 트랜잭션으로 저장합니다.

## Vercel 배포

Vercel 환경 변수에 아래 두 값을 Development, Preview, Production에 각각 등록합니다.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

CLI 배포 예시입니다.

```powershell
npx vercel login
npx vercel link
npx vercel --prod
```

`vercel.json`은 React Router의 `/s/:id`, `/surveys/:id/results` 같은 직접 접근 URL을 `index.html`로 되돌립니다.

## 품질 확인

```powershell
npm run build
npm run lint
```

## 주요 경로

| URL | 용도 |
| --- | --- |
| `/login`, `/signup` | 계정 인증 |
| `/surveys` | 내 설문 목록 |
| `/surveys/new` | 새 설문 작성 |
| `/surveys/:id/edit` | 임시 설문 편집·발행 |
| `/surveys/:id/preview` | 응답 화면 미리보기 |
| `/surveys/:id/results` | 응답 결과 |
| `/s/:id` | 공개 설문 응답 |
