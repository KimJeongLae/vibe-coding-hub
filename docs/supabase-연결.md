# Supabase 연결하기 (관리자용) 🗄️

이 문서대로 하면 참가자 페이지의 **"작업물 올리기"** 기능이 실제로 동작합니다.
코드는 이미 준비돼 있고, **Supabase 프로젝트를 만들고 키 2개만 넣으면** 됩니다. (약 5분)

---

## 1. Supabase 프로젝트 만들기
1. https://supabase.com/dashboard → **New project**
2. 입력값:
   - **Organization**: 유료 결제된 조직
   - **Name**: `vibe-coding-hub`
   - **Database Password**: 자동생성 → 어딘가 저장 (앱 연결엔 안 쓰지만 DB 직접 접속 시 필요)
   - **Region**: `Northeast Asia (Seoul)`
3. **Create new project** → 1~2분 대기 ☕

## 2. 테이블 만들기 (스키마 실행)
1. 왼쪽 **SQL Editor** → **New query**
2. `supabase/schema.sql` 파일 내용을 **전부 복사** → 붙여넣기 → **Run** ▶
3. 왼쪽 **Table Editor** 에 `works` 테이블이 보이면 성공 ✅

## 3. 키 2개 복사
왼쪽 **Project Settings(⚙️) → API** 에서:
| 대시보드 항목 | 넣을 환경변수 이름 |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> ⚠️ `service_role` 키와 DB 비밀번호는 **절대 공유 금지**. anon 키는 원래 브라우저에 공개되는 public 키라 직원과 공유해도 안전합니다.

## 4-A. 로컬에 넣기 (내 컴퓨터에서 테스트할 때)
프로젝트 폴더에 `.env.local` 파일을 만들고:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```
그리고 `npm run dev` 재시작 → 참가자 페이지에서 작업물 등록 테스트.

## 4-B. Vercel에 넣기 (실제 배포 사이트 활성화)
1. https://vercel.com → `vibe-coding-hub` 프로젝트 → **Settings → Environment Variables**
2. 위 두 값을 **똑같이** 추가 (Production/Preview/Development 모두 체크)
3. **Deployments** 탭 → 최신 배포 오른쪽 `···` → **Redeploy**
4. 몇 분 뒤 라이브 사이트에서 작업물 등록이 되면 완료 🎉

---

## 확인 체크리스트
- [ ] `works` 테이블이 Table Editor 에 보인다
- [ ] Vercel 환경변수 2개가 등록돼 있다
- [ ] Redeploy 후 참가자 페이지에서 작업물이 등록/조회된다
- [ ] 등록한 데이터가 Supabase **Table Editor → works** 에 실제로 쌓인다
