-- ============================================================
-- 바이브코딩 클래스 - Supabase 테이블 설정
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 [Run] 하세요.
-- ============================================================

-- 작업물 테이블
create table if not exists public.works (
  id           uuid primary key default gen_random_uuid(),
  member_slug  text not null,               -- 어느 참가자의 작업물인지 (lib/members.ts 의 slug)
  title        text not null,               -- 제목
  description  text,                         -- 설명
  link         text,                         -- 배포 사이트 등 링크
  image_url    text,                         -- 스크린샷 이미지 URL
  created_at   timestamptz not null default now()
);

-- 목록을 빠르게 불러오기 위한 인덱스
create index if not exists works_member_slug_idx
  on public.works (member_slug, created_at desc);

-- ------------------------------------------------------------
-- RLS(Row Level Security): 행 단위 접근 권한
-- 수업용 데모라서 "누구나 읽기/쓰기 가능"으로 열어둡니다.
-- (나중에 로그인 기능을 붙이면 이 정책을 좁히면 됩니다.)
-- ------------------------------------------------------------
alter table public.works enable row level security;

-- 누구나 조회 가능
drop policy if exists "누구나 조회" on public.works;
create policy "누구나 조회"
  on public.works for select
  using (true);

-- 누구나 등록 가능
drop policy if exists "누구나 등록" on public.works;
create policy "누구나 등록"
  on public.works for insert
  with check (true);
