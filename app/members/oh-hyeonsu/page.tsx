"use client";

import { useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "oh-hyeonsu" 님의 페이지 — 인기 영상 모음 (MVP)
// 탭: 정형외과(부위·나이대 필터) / 일반 인기 영상(카테고리별). 모두 조회수순 정렬.
// ⚠️ YouTube API 미연동 — 아래 샘플 데이터로 화면과 필터/탭 전환만 동작합니다.

type Video = {
  title: string;
  channel: string;
  views: number; // 조회수 (정렬 기준)
  duration: string;
  ages?: number[]; // 정형외과 영상의 추천 나이대 (10~70)
};

type Category = { key: string; label: string; videos: Video[] };

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

const AGE_GROUPS = [10, 20, 30, 40, 50, 60, 70];

// ─────────────────── 정형외과: 부위별 카테고리 (각 10개) ───────────────────
const ORTHO_CATEGORIES: Category[] = [
  {
    key: "neck",
    label: "목",
    videos: [
      { title: "거북목 교정 스트레칭 5분 루틴", channel: "바른자세연구소", views: 1980000, duration: "05:12", ages: [10, 20, 30] },
      { title: "목 디스크 초기 증상과 자가진단법", channel: "정형외과 김원장", views: 1720000, duration: "09:41", ages: [30, 40, 50] },
      { title: "일자목, 베개 하나로 잡는 법", channel: "튼튼정형외과TV", views: 1340000, duration: "08:03", ages: [20, 30, 40] },
      { title: "스마트폰 목 통증 예방 습관", channel: "닥터 재활", views: 1120000, duration: "06:27", ages: [10, 20, 30] },
      { title: "자고 나면 목이 안 돌아갈 때", channel: "서울관절병원", views: 890000, duration: "07:15", ages: [20, 30, 40, 50] },
      { title: "목·어깨 뭉침 푸는 셀프 마사지", channel: "바른자세연구소", views: 760000, duration: "10:44", ages: [20, 30, 40, 50] },
      { title: "경추 협착증 환자를 위한 안전 운동", channel: "정형외과 김원장", views: 640000, duration: "12:18", ages: [50, 60, 70] },
      { title: "학생 거북목, 공부자세 교정법", channel: "스포츠재활클리닉", views: 520000, duration: "07:52", ages: [10, 20] },
      { title: "목 디스크, 수술 없이 관리하기", channel: "튼튼정형외과TV", views: 430000, duration: "13:05", ages: [40, 50, 60] },
      { title: "어르신 목 통증 완화 스트레칭", channel: "닥터 재활", views: 310000, duration: "09:38", ages: [60, 70] },
    ],
  },
  {
    key: "shoulder",
    label: "어깨",
    videos: [
      { title: "오십견, 이 동작 하나면 어깨가 풀립니다", channel: "닥터 재활", views: 2150000, duration: "07:52", ages: [40, 50, 60] },
      { title: "회전근개 파열, 수술해야 할까?", channel: "서울관절병원", views: 1680000, duration: "15:23", ages: [40, 50, 60, 70] },
      { title: "라운드숄더(굽은 어깨) 교정 운동", channel: "바른자세연구소", views: 1290000, duration: "09:10", ages: [20, 30, 40] },
      { title: "헬스 중 어깨 통증, 원인과 해결", channel: "스포츠재활클리닉", views: 1040000, duration: "11:33", ages: [20, 30] },
      { title: "어깨 충돌증후군 재활 운동", channel: "정형외과 김원장", views: 870000, duration: "10:47", ages: [30, 40, 50] },
      { title: "오십견 초기 증상 자가진단", channel: "튼튼정형외과TV", views: 720000, duration: "06:19", ages: [40, 50, 60] },
      { title: "운동 전 어깨 워밍업 루틴", channel: "스포츠재활클리닉", views: 610000, duration: "05:48", ages: [10, 20, 30] },
      { title: "어깨 석회성 건염 관리법", channel: "서울관절병원", views: 480000, duration: "12:02", ages: [40, 50, 60] },
      { title: "어깨 뭉침 풀어주는 스트레칭", channel: "바른자세연구소", views: 390000, duration: "08:26", ages: [20, 30, 40, 50] },
      { title: "어르신 어깨 통증 안전 재활", channel: "닥터 재활", views: 260000, duration: "10:15", ages: [60, 70] },
    ],
  },
  {
    key: "back",
    label: "허리",
    videos: [
      { title: "허리 디스크 초기 증상과 자가진단법 총정리", channel: "튼튼정형외과TV", views: 2340000, duration: "09:41", ages: [20, 30, 40, 50] },
      { title: "척추관 협착증 환자를 위한 걷기 운동", channel: "바른자세연구소", views: 1760000, duration: "10:18", ages: [50, 60, 70] },
      { title: "앉아서 일하는 사람 허리 관리법", channel: "정형외과 김원장", views: 1450000, duration: "08:37", ages: [20, 30, 40] },
      { title: "급성 요통(삐끗) 응급 대처법", channel: "서울관절병원", views: 1180000, duration: "07:09", ages: [20, 30, 40, 50] },
      { title: "허리 통증 잡는 초간단 스트레칭", channel: "닥터 재활", views: 990000, duration: "06:44", ages: [20, 30, 40] },
      { title: "허리 디스크, 수술 없이 재활하기", channel: "튼튼정형외과TV", views: 820000, duration: "13:59", ages: [30, 40, 50] },
      { title: "코어 강화로 허리 보호하기", channel: "스포츠재활클리닉", views: 690000, duration: "11:22", ages: [20, 30, 40] },
      { title: "학생 허리 통증, 자세 교정법", channel: "바른자세연구소", views: 540000, duration: "07:31", ages: [10, 20] },
      { title: "임신부 허리 통증 완화 운동", channel: "닥터 재활", views: 420000, duration: "09:12", ages: [20, 30] },
      { title: "어르신 허리 굽음 예방 운동", channel: "정형외과 김원장", views: 300000, duration: "10:05", ages: [60, 70] },
    ],
  },
  {
    key: "knee",
    label: "무릎",
    videos: [
      { title: "무릎 통증, 수술 없이 좋아지는 스트레칭 3가지", channel: "정형외과 김원장", views: 2210000, duration: "12:04", ages: [40, 50, 60] },
      { title: "퇴행성 관절염, 무릎 지키는 운동", channel: "서울관절병원", views: 1590000, duration: "13:27", ages: [50, 60, 70] },
      { title: "반월상 연골 손상 재활 4주 프로그램", channel: "스포츠재활클리닉", views: 1310000, duration: "13:59", ages: [20, 30, 40] },
      { title: "러닝 후 무릎 통증, 원인은?", channel: "스포츠재활클리닉", views: 1080000, duration: "09:48", ages: [10, 20, 30] },
      { title: "계단 오르내릴 때 무릎 아플 때", channel: "튼튼정형외과TV", views: 910000, duration: "08:15", ages: [40, 50, 60] },
      { title: "무릎 연골 지키는 근력 운동", channel: "닥터 재활", views: 780000, duration: "10:33", ages: [30, 40, 50] },
      { title: "십자인대 파열 수술 후 재활", channel: "스포츠재활클리닉", views: 650000, duration: "14:20", ages: [10, 20, 30] },
      { title: "무릎 붓기 빠르게 빼는 관리법", channel: "바른자세연구소", views: 520000, duration: "07:41", ages: [30, 40, 50, 60] },
      { title: "성장기 무릎 통증(오스굿병) 관리", channel: "정형외과 김원장", views: 380000, duration: "08:58", ages: [10] },
      { title: "어르신 인공관절 수술 후 운동", channel: "서울관절병원", views: 270000, duration: "11:49", ages: [60, 70] },
    ],
  },
  {
    key: "ankle",
    label: "발목",
    videos: [
      { title: "발목 삐끗했을 때 절대 하면 안 되는 것", channel: "정형외과 김원장", views: 1870000, duration: "06:33", ages: [10, 20, 30, 40] },
      { title: "자주 삐는 발목(불안정성) 강화 운동", channel: "스포츠재활클리닉", views: 1240000, duration: "09:27", ages: [20, 30, 40] },
      { title: "발목 인대 파열 재활 가이드", channel: "서울관절병원", views: 1010000, duration: "11:14", ages: [10, 20, 30] },
      { title: "족저근막염 스트레칭 총정리", channel: "닥터 재활", views: 860000, duration: "08:52", ages: [30, 40, 50, 60] },
      { title: "아킬레스건염 원인과 관리법", channel: "튼튼정형외과TV", views: 720000, duration: "10:06", ages: [20, 30, 40, 50] },
      { title: "발목 골절 후 재활 운동 단계별", channel: "스포츠재활클리닉", views: 590000, duration: "12:31", ages: [30, 40, 50] },
      { title: "축구·농구 발목 부상 예방법", channel: "스포츠재활클리닉", views: 480000, duration: "07:48", ages: [10, 20] },
      { title: "발목 붓기 빠르게 빼기", channel: "바른자세연구소", views: 360000, duration: "06:19", ages: [20, 30, 40] },
      { title: "평발로 인한 발목 통증 관리", channel: "정형외과 김원장", views: 280000, duration: "09:03", ages: [10, 20, 30] },
      { title: "어르신 발목 근력·낙상 예방 운동", channel: "닥터 재활", views: 190000, duration: "10:22", ages: [60, 70] },
    ],
  },
];

// ─────────────────── 일반 인기 영상: 카테고리별 ───────────────────
const GENERAL_CATEGORIES: Category[] = [
  {
    key: "music",
    label: "🎵 음악",
    videos: [
      { title: "[MV] 신곡 뮤직비디오 공식 영상", channel: "K-POP Official", views: 152000000, duration: "03:48" },
      { title: "역대급 라이브 무대 모음", channel: "MUSIC LIVE", views: 68000000, duration: "21:10" },
      { title: "감성 발라드 플레이리스트 1시간", channel: "밤에 듣는 노래", views: 41000000, duration: "58:22" },
      { title: "요즘 대세 아이돌 커버 댄스", channel: "댄스타임", views: 33000000, duration: "02:57" },
      { title: "버스킹 라이브 레전드 무대", channel: "거리의 가수", views: 19000000, duration: "05:41" },
      { title: "노래방 필수곡 TOP 20", channel: "노래방차트", views: 12000000, duration: "18:33" },
      { title: "잔잔한 재즈 카페 음악", channel: "카페뮤직", views: 8700000, duration: "1:12:04" },
      { title: "드라이브할 때 듣는 신나는 팝송", channel: "드라이브뮤직", views: 6400000, duration: "42:19" },
    ],
  },
  {
    key: "variety",
    label: "🎪 예능",
    videos: [
      { title: "역대급 예능 하이라이트 몰아보기", channel: "예능 클립실", views: 89000000, duration: "18:12" },
      { title: "빵 터지는 리액션 명장면 모음", channel: "웃음창고", views: 54000000, duration: "12:47" },
      { title: "게스트 폭소 토크쇼 하이라이트", channel: "토크왕", views: 37000000, duration: "15:22" },
      { title: "복불복 게임 레전드 편", channel: "예능 클립실", views: 26000000, duration: "20:05" },
      { title: "리얼 야생 서바이벌 명장면", channel: "야생예능", views: 18000000, duration: "16:38" },
      { title: "아이돌 예능 입담 모음", channel: "웃음창고", views: 13000000, duration: "11:14" },
      { title: "심야 라디오 스타 명대사", channel: "토크왕", views: 9200000, duration: "09:51" },
      { title: "커플 관찰 예능 하이라이트", channel: "연애관찰", views: 7100000, duration: "14:03" },
    ],
  },
  {
    key: "mukbang",
    label: "🍜 먹방",
    videos: [
      { title: "1억 뷰 먹방 레전드 모음", channel: "먹방왕TV", views: 45000000, duration: "22:37" },
      { title: "매운 라면 챌린지 도전", channel: "매운맛중독", views: 31000000, duration: "13:09" },
      { title: "대왕 해산물 한 상 먹방", channel: "바다밥상", views: 24000000, duration: "18:44" },
      { title: "편의점 신상 다 먹어보기", channel: "편의점탐험대", views: 17000000, duration: "15:26" },
      { title: "길거리 음식 투어 먹방", channel: "길거리미식가", views: 12000000, duration: "20:11" },
      { title: "디저트 무한리필 먹방", channel: "단거러버", views: 8900000, duration: "12:33" },
      { title: "혼밥 야식 먹방 ASMR", channel: "야식요정", views: 6300000, duration: "16:58" },
      { title: "세계 각국 라면 먹어보기", channel: "라면덕후", views: 4800000, duration: "14:47" },
    ],
  },
  {
    key: "game",
    label: "🎮 게임",
    videos: [
      { title: "게임 실황 명장면 베스트", channel: "게임하는곰", views: 21000000, duration: "14:05" },
      { title: "신작 게임 첫 플레이 리뷰", channel: "게임리뷰어", views: 15000000, duration: "23:41" },
      { title: "역대급 클러치 하이라이트", channel: "e스포츠클립", views: 12000000, duration: "10:52" },
      { title: "초보 탈출 공략 가이드", channel: "게임선생", views: 8600000, duration: "18:19" },
      { title: "친구들과 웃긴 합방 순간", channel: "게임하는곰", views: 6900000, duration: "16:37" },
      { title: "숨겨진 명작 인디게임 추천", channel: "인디게이머", views: 4500000, duration: "12:24" },
      { title: "프로게이머 실력 감상", channel: "e스포츠클립", views: 3800000, duration: "09:48" },
      { title: "레트로 게임 추억 여행", channel: "옛날게임관", views: 2700000, duration: "20:33" },
    ],
  },
  {
    key: "vlog",
    label: "📷 브이로그",
    videos: [
      { title: "브이로그 | 나의 하루 루틴", channel: "데일리 소소", views: 9800000, duration: "10:26" },
      { title: "직장인 퇴근 후 자취 브이로그", channel: "혼자살기", views: 7300000, duration: "12:11" },
      { title: "여행 브이로그 | 국내 가성비 코스", channel: "여행가방", views: 6100000, duration: "16:50" },
      { title: "댕댕이 반응 모음 (심장주의)", channel: "펫스타그램", views: 5400000, duration: "07:18" },
      { title: "카페 창업 준비 브이로그", channel: "사장님일기", views: 3900000, duration: "14:29" },
      { title: "미니멀 라이프 정리 브이로그", channel: "비움생활", views: 2800000, duration: "11:43" },
      { title: "육아 브이로그 | 아이와 하루", channel: "육아일상", views: 2100000, duration: "13:05" },
      { title: "10분 완성 초간단 자취요리", channel: "혼밥연구소", views: 1600000, duration: "09:33" },
    ],
  },
];

// ────────────────────────────── 컴포넌트 ──────────────────────────────
type TabKey = "orthopedic" | "general";

export default function Page() {
  const [tab, setTab] = useState<TabKey>("orthopedic");
  const [orthoCat, setOrthoCat] = useState<string>(ORTHO_CATEGORIES[0].key);
  const [age, setAge] = useState<number | "all">("all");
  const [genCat, setGenCat] = useState<string>(GENERAL_CATEGORIES[0].key);

  // 현재 탭에 보여줄 영상 목록 (조회수 내림차순)
  let videos: Video[] = [];
  if (tab === "orthopedic") {
    const cat = ORTHO_CATEGORIES.find((c) => c.key === orthoCat);
    videos = (cat?.videos ?? []).filter(
      (v) => age === "all" || v.ages?.includes(age)
    );
  } else {
    const cat = GENERAL_CATEGORIES.find((c) => c.key === genCat);
    videos = cat?.videos ?? [];
  }
  videos = [...videos].sort((a, b) => b.views - a.views);

  const pill = (activeState: boolean) =>
    `rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
      activeState
        ? "bg-blue-600 text-white shadow"
        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
    }`;

  return (
    <MemberShell slug="oh-hyeonsu">
      {/* 소개 */}
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
          영상 제작 리서치
        </p>
        <h2 className="mt-1 text-2xl font-bold">🎬 인기 영상 모음</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">
          <b>정형외과</b>는 부위·나이대별로, <b>일반 인기 영상</b>은 카테고리별로
          모았습니다. 모든 목록은 조회수순으로 정렬됩니다. (샘플 데이터 · YouTube
          API 미연동)
        </p>
      </section>

      {/* 메인 탭 */}
      <div className="mb-5 inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {(
          [
            { key: "orthopedic", label: "🩺 정형외과" },
            { key: "general", label: "🔥 일반 인기 영상" },
          ] as const
        ).map((t) => (
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

      {/* 정형외과 필터: 부위 + 나이대 */}
      {tab === "orthopedic" && (
        <div className="mb-5 space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-neutral-400">부위</p>
            <div className="flex flex-wrap gap-2">
              {ORTHO_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setOrthoCat(c.key)}
                  className={pill(orthoCat === c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-neutral-400">나이대</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAge("all")}
                className={pill(age === "all")}
              >
                전체
              </button>
              {AGE_GROUPS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className={pill(age === a)}
                >
                  {a}대
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 일반 인기 영상 필터: 카테고리 */}
      {tab === "general" && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-neutral-400">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {GENERAL_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setGenCat(c.key)}
                className={pill(genCat === c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 정렬/개수 안내 */}
      <p className="mb-4 text-xs text-neutral-400">
        조회수 높은 순으로 정렬됨 · 총 {videos.length}개
      </p>

      {/* 카드 갤러리 */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <div className="text-4xl">🔍</div>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            선택한 나이대에 맞는 영상이 없어요. 다른 나이대나 부위를 골라보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <article
              key={`${tab}-${orthoCat}-${genCat}-${i}`}
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
                {v.ages && v.ages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.ages.map((a) => (
                      <span
                        key={a}
                        className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {a}대
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </MemberShell>
  );
}
