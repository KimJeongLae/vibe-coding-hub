# 우리 회사 바이브코딩 클래스 🚀

Claude Code → **Supabase** → **GitHub** → **Vercel** 로 이어지는 전체 흐름을
직접 경험하는 실습 프로젝트입니다.

메인 페이지에는 참가자 이름 셀이 있고, 이름을 누르면 그 사람의 페이지로 들어가
본인이 만든 작업물을 올릴 수 있습니다. (작업물은 Supabase DB 에 저장됩니다.)

---

## 📁 이 프로젝트 구조

```
vibe-coding-hub/
├─ app/
│  ├─ page.tsx                 # 메인 허브 (이름 셀 그리드)
│  ├─ layout.tsx               # 공통 레이아웃
│  └─ members/[slug]/
│     ├─ page.tsx              # 참가자 페이지
│     └─ MemberBoard.tsx       # 작업물 목록 + 등록 폼
├─ lib/
│  ├─ members.ts               # 참가자 명단 (여기서 추가/수정)
│  └─ supabase.ts              # Supabase 연결
├─ supabase/schema.sql         # DB 테이블 생성 SQL
└─ .env.local.example          # 환경변수 예시
```

---

## 1️⃣ 로컬에서 실행해보기

```bash
cd vibe-coding-hub
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.
(아직 Supabase 를 연결하지 않았으면, 참가자 페이지에 "Supabase 미연결" 안내가 뜹니다. 정상입니다.)

---

## 2️⃣ Supabase 연결하기

1. https://supabase.com 로그인 → **New project** 생성 (이미 유료 계정 사용 중이면 프로젝트만 새로 생성)
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 파일 내용을 붙여넣고 **Run**
   - `works` 테이블이 생기고, 누구나 읽기/쓰기 가능한 데모용 권한이 설정됩니다.
3. **Project Settings → API** 에서 아래 두 값을 복사:
   - `Project URL`
   - `anon` `public` key
4. 프로젝트 루트에 `.env.local` 파일을 만들고 값을 채웁니다:

   ```bash
   # Windows
   copy .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

5. 개발 서버를 다시 시작 (`Ctrl+C` 후 `npm run dev`) → 이제 작업물 등록이 됩니다.

> ⚠️ `.env.local` 은 절대 GitHub 에 올라가면 안 됩니다. (`.gitignore` 에 이미 포함되어 있습니다.)

---

## 3️⃣ GitHub 에 올리기

```bash
git init
git add .
git commit -m "first commit: 바이브코딩 허브"
# GitHub 에서 새 저장소(repository)를 만든 뒤, 주소를 넣습니다:
git remote add origin https://github.com/<내계정>/vibe-coding-hub.git
git branch -M main
git push -u origin main
```

---

## 4️⃣ Vercel 에 배포하기

1. https://vercel.com 로그인 → **Add New → Project**
2. 방금 만든 GitHub 저장소를 **Import**
3. **Environment Variables** 에 `.env.local` 과 똑같이 두 값을 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** 클릭 → 몇 분 뒤 `https://vercel.app` 주소가 생깁니다.

이후로는 GitHub 에 `git push` 할 때마다 Vercel 이 **자동으로 다시 배포**합니다.

---

## 👥 직원들을 초대하기 (관리자용)

세 서비스 모두 유료 계정이 있으면 팀원을 초대할 수 있습니다.

| 서비스 | 초대 위치 | 참가자에게 주는 권한 |
| --- | --- | --- |
| **GitHub** | 저장소 → Settings → Collaborators → Add people | Write (푸시 가능) |
| **Supabase** | Organization → Team → Invite | Developer |
| **Vercel** | Team → Settings → Members → Invite | Member |

초대받은 직원은 저장소를 `git clone` 한 뒤, 위 **1~2번** 과정을 따라 하면 됩니다.

---

## 🎓 수업 진행 흐름 (참가자가 할 일)

각 참가자에게는 **본인 이름 셀 / 페이지**가 이미 배정되어 있습니다.

1. 저장소를 `git clone` 하고 Claude Code 로 엽니다.
2. `npm install` → `npm run dev` 로 로컬 실행.
3. `.env.local` 에 Supabase 값 넣기 (관리자가 공유).
4. 자기 이름 페이지(`/members/본인slug`)에 접속해서 **작업물을 등록**해봅니다.
5. (심화) 자기 페이지를 Claude Code 로 자유롭게 꾸미거나 기능을 추가.
6. `git add . && git commit -m "..." && git push` → Vercel 이 자동 배포.
7. 배포된 사이트에서 본인 작업물이 보이는지 확인! ✅

---

## ➕ 참가자 추가 / 수정

`lib/members.ts` 배열만 수정하면 메인 셀과 페이지가 자동으로 생성됩니다.

```ts
export const MEMBERS: Member[] = [
  { slug: "jang-jeongyun", name: "장정윤" },
  // { slug: "새영문slug", name: "새이름" },  ← 이렇게 추가
];
```

`slug` 는 URL 주소가 되므로 **영문 소문자와 하이픈(-)** 으로 지어주세요.
