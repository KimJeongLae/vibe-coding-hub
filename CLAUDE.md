@AGENTS.md

# 우리 회사 바이브코딩 클래스 — 프로젝트 안내 (Claude Code용)

이 문서는 **다른 컴퓨터에서 이어서 작업**할 때 맥락을 빠르게 잡기 위한 메모입니다.

## 이게 뭐야
회사 직원들에게 바이브코딩을 가르치는 실습 프로젝트.
목표 흐름: **Claude Code로 코딩 → GitHub push → Vercel 자동배포** (원하면 Supabase로 동적 기능도).

- 라이브 사이트: https://vibe-coding-hub-kappa.vercel.app
- GitHub: https://github.com/KimJeongLae/vibe-coding-hub
- 배포: Vercel (계정 kimjeonglae, Pro) — `main` 브랜치에 push하면 자동 재배포

## 핵심 동작 방식 (중요)
- 메인 허브(`app/page.tsx`)에 **팀별 참가자 셀 그리드**가 있고, 셀을 누르면 그 사람 페이지로 이동.
- **각 참가자는 자기 페이지 파일 `app/members/<slug>/page.tsx` 를 직접 코딩**해서 자기 작업물을 채운다.
  (예전엔 Supabase 폼 입력 방식이었으나 제거함. 지금은 "각자 자기 페이지를 코딩"하는 방식.)
- 공통 틀(뒤로가기 + 이름/팀 헤더)은 `components/MemberShell.tsx`. 각 페이지는 이걸 감싸고 그 안에 내용만 넣음.

## 참가자/팀 관리
- 명단은 **`lib/members.ts`** 한 곳에서 관리 (slug·이름·팀). 팀 순서는 `TEAMS` 배열.
- 셀 색상은 `app/page.tsx` 의 `TEAM_STYLES` 맵 (팀별 그라데이션).
- **참가자 추가 시**: ① `lib/members.ts` 에 항목 추가 → ② `app/members/<새slug>/page.tsx` 파일 생성
  (기존 파일 복사해서 slug만 바꾸면 됨).

## 폴더 구조
```
app/
  page.tsx                    # 메인 허브 (팀별 셀)
  layout.tsx, globals.css
  members/<slug>/page.tsx     # 참가자별 페이지 (사람마다 하나, 각자 편집)
components/MemberShell.tsx     # 참가자 페이지 공통 틀
lib/
  members.ts                  # 참가자 명단 (여기서 관리)
  supabase.ts                 # Supabase 연결 (선택 기능)
supabase/schema.sql           # works 테이블 SQL (선택)
docs/                         # 수업 운영 문서 (관리자 체크리스트, 직원 가이드, Supabase 연결)
```

## 다른 컴퓨터에서 이어서 작업하기
```bash
git clone https://github.com/KimJeongLae/vibe-coding-hub.git
cd vibe-coding-hub
npm install
npm run dev        # http://localhost:3000
```
- 코드 수정 후: `git add . → git commit → git pull --rebase → git push` → Vercel 자동배포.
- (선택) Supabase 동적 기능을 쓸 때만 `.env.local` 필요:
  `.env.local.example` 복사 후 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 채우기.
  ⚠️ `.env.local` 은 커밋 금지(이미 .gitignore 처리됨). anon/publishable 키만 사용, secret 키 금지.

## 기술 스택
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript · (선택) Supabase.
`@AGENTS.md` 경고대로, Next 16은 학습 데이터와 다를 수 있으니 코드 작성 전 `node_modules/next/dist/docs/` 참고.
예: 동적 라우트의 `params` 는 Promise → `await params` (클라이언트 컴포넌트는 `use(params)`).

## 자주 쓰는 명령
```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드(타입체크 포함) — push 전 확인 권장
npm run lint     # 린트
```
