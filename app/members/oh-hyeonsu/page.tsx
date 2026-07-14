"use client";

import { useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "oh-hyeonsu" 님의 페이지 — 인기 영상 모음 (MVP)
// 탭: 정형외과 / 일반 인기 영상. 각 탭은 조회수순(내림차순)으로 정렬됩니다.
// ⚠️ YouTube API 미연동 — 아래 샘플 데이터로 화면과 탭 전환만 동작합니다.

type Video = {
  title: string;
  channel: string;
  views: number; // 조회수 (정렬 기준)
  duration: string;
};

// 썸네일 대체용 그라데이션 팔레트 (API 미사용이라 이미지 대신 사용)
const THUMBS = [
  "from-rose-500 to-orange-500",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-purple-600",
  "from-amber-500 to-red-500",
  "from-cyan-500 to-blue-600",
  "from-lime-500 to-green-600",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-indigo-700",
  "from-orange-500 to-amber-600",
];

// 조회수를 "조회수 XXX만회 / X억회" 형식으로 표시
function formatViews(n: number): string {
  if (n >= 1e8) {
    const eok = n / 1e8;
    return `조회수 ${Number.isInteger(eok) ? eok : eok.toFixed(1)}억회`;
  }
  if (n >= 1e4) return `조회수 ${Math.round(n / 1e4)}만회`;
  return `조회수 ${n.toLocaleString()}회`;
}

const ORTHOPEDIC: Video[] = [
  { title: "무릎 통증, 수술 없이 좋아지는 스트레칭 3가지", channel: "정형외과 김원장", views: 2140000, duration: "12:04" },
  { title: "허리 디스크 초기 증상과 자가진단법 총정리", channel: "튼튼정형외과TV", views: 1870000, duration: "09:41" },
  { title: "오십견, 이 동작 하나면 어깨가 풀립니다", channel: "닥터 재활", views: 1560000, duration: "07:52" },
  { title: "회전근개 파열, 수술해야 할까? 전문의가 답합니다", channel: "서울관절병원", views: 1320000, duration: "15:23" },
  { title: "척추관 협착증 환자를 위한 걷기 운동", channel: "바른자세연구소", views: 1210000, duration: "10:18" },
  { title: "발목 삐끗했을 때 절대 하면 안 되는 것", channel: "정형외과 김원장", views: 980000, duration: "06:33" },
  { title: "손목터널증후군, 마우스 쓰는 사람 필수 시청", channel: "튼튼정형외과TV", views: 870000, duration: "08:47" },
  { title: "반월상 연골 손상, 재활 4주 프로그램", channel: "스포츠재활클리닉", views: 760000, duration: "13:59" },
  { title: "목 디스크와 일자목, 베개 고르는 법", channel: "바른자세연구소", views: 640000, duration: "11:12" },
  { title: "골다공증 예방을 위한 근력 운동 루틴", channel: "닥터 재활", views: 520000, duration: "09:05" },
];

const GENERAL: Video[] = [
  { title: "[MV] 신곡 뮤직비디오 공식 영상", channel: "K-POP Official", views: 152000000, duration: "03:48" },
  { title: "역대급 예능 하이라이트 몰아보기", channel: "예능 클립실", views: 89000000, duration: "18:12" },
  { title: "1억 뷰 먹방 레전드 모음", channel: "먹방왕TV", views: 45000000, duration: "22:37" },
  { title: "요즘 난리난 챌린지 댄스 커버", channel: "댄스타임", views: 28000000, duration: "01:59" },
  { title: "게임 실황 명장면 베스트", channel: "게임하는곰", views: 21000000, duration: "14:05" },
  { title: "이 영화 결말 반전 리뷰 (스포주의)", channel: "무비덕후", views: 15000000, duration: "12:44" },
  { title: "브이로그 | 나의 하루 루틴", channel: "데일리 소소", views: 9800000, duration: "10:26" },
  { title: "10분 완성 초간단 자취요리", channel: "혼밥연구소", views: 7600000, duration: "09:33" },
  { title: "댕댕이 반응 모음 (심장주의)", channel: "펫스타그램", views: 5400000, duration: "07:18" },
  { title: "국내 여행 가성비 코스 추천 TOP5", channel: "여행가방", views: 3900000, duration: "16:50" },
];

const TABS = [
  { key: "orthopedic", label: "🩺 정형외과", data: ORTHOPEDIC },
  { key: "general", label: "🔥 일반 인기 영상", data: GENERAL },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("orthopedic");
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  // 조회수 내림차순 정렬
  const videos = [...active.data].sort((a, b) => b.views - a.views);

  return (
    <MemberShell slug="oh-hyeonsu">
      {/* 소개 */}
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
          영상 제작 리서치
        </p>
        <h2 className="mt-1 text-2xl font-bold">🎬 인기 영상 모음</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">
          영상 기획을 위해 인기 콘텐츠를 모았습니다. 탭으로 <b>정형외과</b>와{" "}
          <b>일반 인기 영상</b>을 나눠 보고, 각 탭은 조회수순으로 정렬됩니다.
          (샘플 데이터 · YouTube API 미연동)
        </p>
      </section>

      {/* 탭 */}
      <div className="mb-6 inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-white text-blue-600 shadow dark:bg-neutral-950 dark:text-blue-400"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 정렬 안내 */}
      <p className="mb-4 text-xs text-neutral-400">
        조회수 높은 순으로 정렬됨 · 총 {videos.length}개
      </p>

      {/* 카드 갤러리 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => (
          <article
            key={`${tab}-${i}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
          >
            {/* 썸네일 (그라데이션 대체) */}
            <div
              className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${
                THUMBS[i % THUMBS.length]
              }`}
            >
              <span className="text-4xl text-white/90 transition-transform group-hover:scale-110">
                ▶
              </span>
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                {v.duration}
              </span>
              <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-bold text-neutral-800">
                #{i + 1}
              </span>
            </div>

            {/* 내용 */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                {v.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {v.channel}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {formatViews(v.views)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </MemberShell>
  );
}
