"use client";

import { useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "oh-hyeonsu" 님의 페이지 — 정형외과 인기 영상 모음 (MVP)
// 국내 / 해외 탭을 나누고, 인기 영상 10개를 카드 갤러리로 보여줍니다.
// ⚠️ YouTube API 미연동 — 아래 샘플 데이터로 화면과 탭 전환만 동작합니다.

type Video = {
  title: string;
  channel: string;
  views: string;
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

const DOMESTIC: Video[] = [
  { title: "무릎 통증, 수술 없이 좋아지는 스트레칭 3가지", channel: "정형외과 김원장", views: "조회수 214만회", duration: "12:04" },
  { title: "허리 디스크 초기 증상과 자가진단법 총정리", channel: "튼튼정형외과TV", views: "조회수 187만회", duration: "09:41" },
  { title: "오십견, 이 동작 하나면 어깨가 풀립니다", channel: "닥터 재활", views: "조회수 156만회", duration: "07:52" },
  { title: "회전근개 파열, 수술해야 할까? 전문의가 답합니다", channel: "서울관절병원", views: "조회수 132만회", duration: "15:23" },
  { title: "척추관 협착증 환자를 위한 걷기 운동", channel: "바른자세연구소", views: "조회수 121만회", duration: "10:18" },
  { title: "발목 삐끗했을 때 절대 하면 안 되는 것", channel: "정형외과 김원장", views: "조회수 98만회", duration: "06:33" },
  { title: "손목터널증후군, 마우스 쓰는 사람 필수 시청", channel: "튼튼정형외과TV", views: "조회수 87만회", duration: "08:47" },
  { title: "반월상 연골 손상, 재활 4주 프로그램", channel: "스포츠재활클리닉", views: "조회수 76만회", duration: "13:59" },
  { title: "목 디스크와 일자목, 베개 고르는 법", channel: "바른자세연구소", views: "조회수 64만회", duration: "11:12" },
  { title: "골다공증 예방을 위한 근력 운동 루틴", channel: "닥터 재활", views: "조회수 52만회", duration: "09:05" },
];

const OVERSEAS: Video[] = [
  { title: "Fix Knee Pain in 5 Minutes (No Equipment)", channel: "Bob & Brad", views: "18M views", duration: "10:22" },
  { title: "The BEST Exercises for a Herniated Disc", channel: "Physical Therapy Guru", views: "12M views", duration: "14:08" },
  { title: "Frozen Shoulder: Full Recovery Routine", channel: "AskDoctorJo", views: "9.4M views", duration: "08:36" },
  { title: "Rotator Cuff Tear — Surgery or Not?", channel: "Sports Ortho Clinic", views: "7.1M views", duration: "16:44" },
  { title: "Spinal Stenosis Exercises That Actually Work", channel: "Rehab Science", views: "6.3M views", duration: "12:51" },
  { title: "How to Heal a Sprained Ankle Fast", channel: "E3 Rehab", views: "5.8M views", duration: "07:19" },
  { title: "Carpal Tunnel Syndrome: Do This Daily", channel: "Bob & Brad", views: "4.9M views", duration: "09:57" },
  { title: "Meniscus Tear Rehab Protocol (Week by Week)", channel: "Rehab Science", views: "4.2M views", duration: "18:03" },
  { title: "Neck Pain Relief: The 90-Second Fix", channel: "AskDoctorJo", views: "3.7M views", duration: "06:11" },
  { title: "Osteoporosis: Safe Strength Training Guide", channel: "Physical Therapy Guru", views: "3.1M views", duration: "13:27" },
];

const TABS = [
  { key: "domestic", label: "🇰🇷 국내", data: DOMESTIC },
  { key: "overseas", label: "🌍 해외", data: OVERSEAS },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("domestic");
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <MemberShell slug="oh-hyeonsu">
      {/* 소개 */}
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
          영상 제작 리서치
        </p>
        <h2 className="mt-1 text-2xl font-bold">🎬 정형외과 인기 영상 모음</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">
          영상 기획을 위해 최근 인기 있는 정형외과 콘텐츠를 국내·해외로 나눠
          모았습니다. (샘플 데이터 · YouTube API 미연동)
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

      {/* 카드 갤러리 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {active.data.map((v, i) => (
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
              <p className="mt-0.5 text-xs text-neutral-400">{v.views}</p>
            </div>
          </article>
        ))}
      </div>
    </MemberShell>
  );
}
