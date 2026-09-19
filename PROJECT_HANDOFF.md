# 설문 제작소 프로젝트 인수인계 문서

이 문서는 `survey-maker` 프로젝트의 현재 구현 범위, 코드 구조, Supabase 연동, Vercel 배포 상태를 다음 개발자가 빠르게 파악할 수 있도록 정리한 문서입니다.

마지막 확인일: 2026-09-19

## 1. 프로젝트 개요

설문 제작자가 이메일 계정으로 로그인한 뒤 설문을 만들고 발행할 수 있습니다. 발행된 설문은 공개 링크로 공유하며, 응답자는 로그인 없이 참여할 수 있습니다. 제작자는 응답 결과를 차트와 주관식 답변 목록으로 확인합니다.

- 저장소: https://github.com/gyeonggumun/survey-maker
- 프로덕션: https://survey-maker-inky.vercel.app/
- 프런트엔드: React + TypeScript + Vite
- 스타일: Tailwind CSS
- 인증·데이터베이스: Supabase Auth + PostgreSQL
- 배포: Vercel 정적 프런트엔드

## 2. 구현된 기능

### 인증

- 이메일 회원가입·로그인·로그아웃
- Supabase 세션 기반 인증 상태 유지
- 인증된 사용자만 제작자 화면 접근
- 이메일 인증 리디렉션 설정

### 설문 제작

- 설문 제목·설명 입력
- 객관식, 복수 선택, 주관식 질문
- 필수 응답 설정
- 주관식 최대 글자 수 제한
- 질문 추가·삭제·위/아래 이동
- 질문별·선택지별 유효성 오류 표시
- 임시 저장
- 저장된 임시 설문 편집
- 발행 후 질문 수정 잠금

### 공유·응답

- 발행 설문 공개 URL: `/s/:id`
- 비로그인 응답 가능
- 객관식·복수 선택·주관식 응답 검증
- 필수 응답 및 선택지 유효성 서버 검증
- 응답 제출 완료 화면 및 제작소 이동 버튼

### 결과·관리

- 내 설문 목록
- 임시 저장/발행 상태 표시
- 질문 수·응답 수 표시
- 발행 설문 공유 링크 복사
- 설문 삭제
- 객관식·복수 선택 응답 차트
- 주관식 답변 목록 및 제출 시간 표시
- 저장·발행 성공 안내 메시지

## 3. 현재 코드 구조

```text
survey-maker/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── survey/
│   │       ├── QuestionEditor.tsx
│   │       ├── ResultChart.tsx
│   │       ├── SurveyEditorForm.tsx
│   │       └── SurveyForm.tsx
│   ├── constants/
│   │   └── questionTypes.ts
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── errors.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── survey/
│   │   │   ├── SurveyCreatePage.tsx
│   │   │   ├── SurveyEditPage.tsx
│   │   │   ├── SurveyListPage.tsx
│   │   │   ├── SurveyPreviewPage.tsx
│   │   │   ├── SurveyResponsePage.tsx
│   │   │   └── SurveyResultPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   ├── responseService.ts
│   │   └── surveyService.ts
│   ├── stores/
│   │   └── authStore.ts
│   ├── types/
│   │   └── survey.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260918083002_create_survey_schema.sql
│       └── 20260918112737_harden_survey_writes.sql
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

문서의 초기 예시에 있던 `QuestionCard`, `QuestionInput`, `useSurvey`, `types/auth`는 현재 구조에서 별도 파일로 만들지 않았습니다. 각각 `SurveyForm`·`QuestionEditor`, 서비스 함수, Supabase User 타입으로 역할을 통합했습니다.

## 4. 주요 데이터 흐름

```text
로그인
  → SurveyCreatePage
  → SurveyEditorForm
  → surveyService.saveSurvey()
  → public.save_survey RPC
  → surveys/questions 저장

공개 링크 접근
  → SurveyResponsePage
  → SurveyForm
  → responseService.submitSurvey()
  → public.submit_survey RPC
  → responses/answers 저장

제작자 결과 화면
  → surveyService.getSurveyResults()
  → 소유자 RLS로 responses/answers 조회
  → ResultChart 및 주관식 답변 렌더링
```

설문 저장과 발행은 질문 삭제·재생성 과정까지 하나의 `save_survey` 트랜잭션으로 처리합니다. 응답 제출도 입력 검증과 `responses`·`answers` 저장을 하나의 `submit_survey` 트랜잭션으로 처리합니다.

## 5. Supabase 연동 상태

### 프로젝트

- 프로젝트 이름: `survey-maker`
- 프로젝트 ref: `blhxyoloslthrdpiwfks`
- 리전: Seoul
- 상태: Healthy

### 환경 변수

`.env.local`은 로컬에만 존재하며 Git에 커밋하지 않습니다.

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`VITE_` 변수는 브라우저 번들에 포함되므로 Publishable Key만 사용합니다. `service_role` 키나 Secret Key는 절대 사용하거나 커밋하지 않습니다.

### 데이터베이스

다음 테이블과 RLS가 적용되어 있습니다.

- `public.surveys`
- `public.questions`
- `public.responses`
- `public.answers`

정책은 다음 원칙을 따릅니다.

- 제작자는 자신의 설문과 결과만 조회·관리
- 공개 상태인 설문과 질문만 비로그인 사용자에게 조회 허용
- 응답자는 테이블에 직접 INSERT할 수 없음
- 응답 저장은 검증된 `public.submit_survey` RPC만 사용
- 설문 저장·발행은 인증된 사용자의 `public.save_survey` RPC만 사용
- `app_private` 스키마의 보조 함수는 Data API에 노출하지 않음

### Data API 노출

Supabase Dashboard의 Data API에는 다음만 노출되어 있습니다.

- 테이블: `surveys`, `questions`, `responses`, `answers`
- 함수: `save_survey`, `submit_survey`
- 자동 신규 테이블 노출: 비활성화

### Auth 설정

- Email provider: 활성화
- 신규 가입: 허용
- 이메일 확인: 활성화
- Anonymous sign-in: 비활성화
- Site URL: `https://survey-maker-inky.vercel.app`
- 로컬 및 Vercel Preview redirect URL 등록 완료

## 6. Vercel 배포 상태

- Vercel 프로젝트: `survey-maker`
- Production URL: https://survey-maker-inky.vercel.app/
- GitHub 저장소의 `main` 브랜치 연동
- `main` 푸시 시 자동 배포
- React Router 직접 접근을 위해 `vercel.json` rewrite 적용

```json
{
  "rewrites": [{
    "source": "/(.*)",
    "destination": "/index.html"
  }]
}
```

Vercel 환경 변수에는 다음 두 값을 Development, Preview, Production 범위로 등록해야 합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 7. 검증 결과

### 자동 검증

- `npx tsc -b`: 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Git diff whitespace 검사: 통과

### 실제 프로덕션 E2E

다음 흐름을 실제 배포 주소에서 확인했습니다.

1. 회원가입 및 이메일 인증
2. 로그인
3. 테스트 설문 생성
4. 임시 저장 및 저장 완료 안내
5. 객관식·주관식 질문 확인
6. 설문 발행
7. 공개 링크 접근
8. 객관식·주관식 응답 제출
9. 응답 완료 화면 확인
10. 제작자 결과 화면에서 응답 1건과 주관식 답변 확인

현재 테스트 설문과 테스트 응답 1건은 사용자 계정에 남아 있습니다.

## 8. Git 작업 이력

기능별로 나누어 한글 커밋 메시지로 커밋하고 `main`에 푸시했습니다.

- `9ff4c67 chore(init): React Vite 프로젝트 초기 구성`
- `c7b000e feat(shell): 라우팅과 공통 UI 기반 구성`
- `9f39d8d feat(auth): 이메일 회원가입과 로그인 구현`
- `cdebd44 feat(database): 설문 스키마와 RLS 정책 추가`
- `94a611c feat(survey): 설문 도메인 타입과 데이터 서비스 추가`
- `511c355 feat(editor): 설문 작성과 편집 폼 구현`
- `408e4e9 feat(list): 내 설문 목록과 관리 기능 추가`
- `5af5ea4 feat(response): 공개 설문 응답과 제출 기능 구현`
- `36607a3 feat(results): 설문 응답 결과와 차트 구현`
- `b5ea945 feat(preview): 설문 응답 화면 미리보기 추가`
- `46bbd39 perf(bundle): 화면별 코드 분할 적용`
- `a9f4229 fix(auth): 이메일 인증 리디렉션 설정`
- `562b537 fix(survey): 원자적 저장과 발행 처리 적용`
- `9ae15ec docs(deploy): Supabase와 Vercel 배포 절차 추가`
- `87a3364 fix(form): 질문별 검증 오류 표시`
- `5f78be0 feat(response): 응답 완료 이동 경로 추가`
- `a799804 feat(feedback): 저장과 발행 결과 안내 추가`
- `ded9e1c docs(handoff): 프로젝트 인수인계 문서 정리`
- `edb6b76 style(layout): 반응형 인증과 앱 쉘 개선`
- `df7d115 style(dashboard): 반응형 대시보드 카드 개선`
- `8300697 style(survey): 모바일 설문 화면 반응형 개선`
- `1ebebad docs(handoff): 반응형 디자인 변경 기록`
- `36ea61c fix(ui): 공유 링크 버튼 글자 색상 수정`

## 9. UI·반응형 디자인

- `AuthLayout`을 추가해 로그인·회원가입을 공통 2열/1열 반응형 레이아웃으로 통합
- 데스크톱에서는 소개 패널과 인증 카드를 함께 표시하고, 모바일에서는 입력 카드 중심으로 표시
- 대시보드에 전체 설문·발행 설문·전체 응답 요약 카드 추가
- 설문 목록 카드를 모바일에서 한 열로 배치하고 터치 영역과 hover 상태 개선
- 설문 작성 화면의 저장·발행 버튼을 모바일 하단 고정 액션 바 형태로 개선
- 결과 화면의 공유 버튼을 모바일에서 세로로 배치
- 공개 응답 화면과 결과 화면에 작은 화면용 여백·타이포그래피·그라데이션 적용
- 헤더 이메일 표시를 작은 화면에서 축약하고 로그아웃 버튼을 아이콘 중심으로 축소
- `env(safe-area-inset-bottom)`과 전역 선택 색상을 적용해 모바일 사용성을 보완

검증된 프로덕션 주소: https://survey-maker-inky.vercel.app/

## 10. 남은 선택 기능

문서에서 후순위로 분류한 다음 기능은 현재 범위에 포함하지 않았습니다.

- 드래그 앤 드롭 질문 정렬
- 중복 응답 제한
- 설문 마감일
- 고급 통계
- 관리자 페이지
- 협업 편집 및 테마 커스터마이징

추가 개발 시에는 먼저 테스트 설문 데이터를 정리한 뒤, 기능별 브랜치와 커밋으로 확장하는 것을 권장합니다.

## 11. 보안·운영 주의사항

- `.env.local`과 모든 Secret Key를 GitHub에 올리지 않습니다.
- Supabase Advisor의 이메일 bounce 경고는 계정/메일 전달 운영 항목이므로 별도 관리가 필요합니다.
- 발행된 설문은 결과의 일관성을 위해 질문 수정이 잠깁니다.
- 테스트 설문 삭제가 필요하면 Supabase 데이터와 공개 링크가 함께 사라지는지 확인한 후 수행합니다.
- 환경 변수를 변경한 뒤에는 Vercel 재배포가 필요합니다.
