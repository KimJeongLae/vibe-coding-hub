"use client";

import { useEffect, useState } from "react";
import MemberShell from "@/components/MemberShell";

// 클릭 시 재생되는 샘플 미리보기 영상 (YouTube API 미연동 — 데모용 클립).
// 실제 영상은 카드/모달의 "유튜브에서 보기" 버튼으로 이동합니다.
const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// ✏️ "oh-hyeonsu" 님의 페이지 — 인기 영상 모음 (MVP)
// 상단: 국내/해외 토글(전체 적용). 탭: 정형외과(부위·나이대) / 제품 판매 추천.
// ⚠️ YouTube API 미연동 — 아래 샘플 데이터로 화면과 필터/탭 전환만 동작합니다.

type Region = "domestic" | "overseas";
type Platform = "youtube" | "instagram";

type Video = {
  title: string;
  channel: string;
  views: number; // 조회수 (정렬 기준)
  duration: string;
  region: Region;
  ages?: number[]; // 정형외과 영상의 추천 나이대 (10~70)
  platform?: Platform; // 제품 판매 추천 영상의 플랫폼
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

// 제목 → 실제 YouTube 영상 ID (제목 검색 상위 결과). 썸네일/재생에 사용.
// ⚠️ YouTube Data API 미사용 — 정적 매핑 + 이미지/임베드만 사용합니다.
const YT_IDS: Record<string, string> = {
  "거북목 교정 스트레칭 5분 루틴": "aDbqk7JbpEs",
  "목 디스크 초기 증상과 자가진단법": "EWioR0syCns",
  "일자목, 베개 하나로 잡는 법": "rcmDpjDKU1g",
  "스마트폰 목 통증 예방 습관": "kuNH1c8SQSY",
  "자고 나면 목이 안 돌아갈 때": "BPDN_1EQBqI",
  "목·어깨 뭉침 푸는 셀프 마사지": "YtLQFyJF6Y8",
  "경추 협착증 환자를 위한 안전 운동": "HZhw8uRGvaY",
  "학생 거북목, 공부자세 교정법": "I8dM2t0xEuE",
  "목 디스크, 수술 없이 관리하기": "fEJBZuozjgA",
  "어르신 목 통증 완화 스트레칭": "mUnSpfItRf0",
  "Fix 'Tech Neck' in 5 Minutes": "R0LskN7fNFg",
  "Neck Pain Relief: The 90-Second Fix": "B0xlVOJHbiA",
  "Best Exercises for a Neck Disc": "nqo_4txvD50",
  "Forward Head Posture Correction": "_xg9z3bY90E",
  "Cervical Stenosis Safe Exercises": "Z_bysI-yMt8",
  "오십견, 이 동작 하나면 어깨가 풀립니다": "InieLaiFSaI",
  "회전근개 파열, 수술해야 할까?": "0NA2uwta8DU",
  "라운드숄더(굽은 어깨) 교정 운동": "MU_PCU-wkHU",
  "헬스 중 어깨 통증, 원인과 해결": "R15ColNVDqE",
  "어깨 충돌증후군 재활 운동": "83rK2U-ANi4",
  "오십견 초기 증상 자가진단": "H3vdZ7_6H1U",
  "운동 전 어깨 워밍업 루틴": "u-mxnnQf3MI",
  "어깨 석회성 건염 관리법": "AAB8jOgIG_U",
  "어깨 뭉침 풀어주는 스트레칭": "InieLaiFSaI",
  "어르신 어깨 통증 안전 재활": "g0trhTzLntA",
  "Frozen Shoulder: Full Recovery Routine": "3s61bO4FnWo",
  "Rotator Cuff Tear — Surgery or Not?": "ubpzaRjH7vA",
  "Rounded Shoulders Fix (Posture)": "ApQvSiw4fik",
  "Shoulder Impingement Rehab": "KM36zdNUzZk",
  "Shoulder Warm-up Before Lifting": "-Tvd1XFD8gs",
  "허리 디스크 초기 증상과 자가진단법 총정리": "KJWaq4Euef8",
  "척추관 협착증 환자를 위한 걷기 운동": "TLevMe2xv2k",
  "앉아서 일하는 사람 허리 관리법": "33C8ujK5drw",
  "급성 요통(삐끗) 응급 대처법": "WseZnlwh2YU",
  "허리 통증 잡는 초간단 스트레칭": "pwoCopzAXLY",
  "허리 디스크, 수술 없이 재활하기": "wU7ZkcsXMsw",
  "코어 강화로 허리 보호하기": "q9KWecBByhc",
  "학생 허리 통증, 자세 교정법": "c8rdV_7xoyQ",
  "임신부 허리 통증 완화 운동": "3k29gDkCgIY",
  "어르신 허리 굽음 예방 운동": "tTrxDWMiAco",
  "Herniated Disc: The BEST Exercises": "cMlxTdqN3OA",
  "Spinal Stenosis Walking Program": "mWZZHU1pk-8",
  "Low Back Pain: Quick Relief": "RwOfHZ5pkag",
  "Core Stability for Your Back": "bQ5a_yaKvJI",
  "Sciatica Stretch Routine": "8YXglW9kvH4",
  "무릎 통증, 수술 없이 좋아지는 스트레칭 3가지": "cEvvw99_pbw",
  "퇴행성 관절염, 무릎 지키는 운동": "JA9HIksZ01c",
  "반월상 연골 손상 재활 4주 프로그램": "Gu7BriXPWkI",
  "러닝 후 무릎 통증, 원인은?": "Ly5P34AlsEQ",
  "계단 오르내릴 때 무릎 아플 때": "Y5vPtmBR5js",
  "무릎 연골 지키는 근력 운동": "Kz5K0IabjMs",
  "십자인대 파열 수술 후 재활": "NnoNzrja03k",
  "무릎 붓기 빠르게 빼는 관리법": "qh33iuCjXEs",
  "성장기 무릎 통증(오스굿병) 관리": "Dzrqa3FG3JQ",
  "어르신 인공관절 수술 후 운동": "pgLauJvl15A",
  "Fix Knee Pain in 5 Minutes (No Equipment)": "OlcRCMpz6GA",
  "Knee Osteoarthritis Exercises": "sLCahUJl8jk",
  "Meniscus Tear Rehab Protocol": "t-5g9V426SE",
  "Runner's Knee: The Real Fix": "bFjLZgFGp_A",
  "ACL Reconstruction Rehab Guide": "WLrUhc31DGA",
  "발목 삐끗했을 때 절대 하면 안 되는 것": "btIBD6vhbis",
  "자주 삐는 발목(불안정성) 강화 운동": "lCWpncjNRcQ",
  "발목 인대 파열 재활 가이드": "Ky7jQLZBmDI",
  "아킬레스건염 원인과 관리법": "I3_eSgdAeos",
  "발목 골절 후 재활 운동 단계별": "NXVlT8Zu21E",
  "축구·농구 발목 부상 예방법": "0JUt36BoSIc",
  "발목 붓기 빠르게 빼기": "kMFMMscghco",
  "만성 발목 통증 셀프 관리": "GrWC9JgnAEE",
  "발목 근력 밴드 운동 루틴": "9ZcbxhpbhcA",
  "어르신 발목 근력·낙상 예방 운동": "mvLvxRB8oVU",
  "How to Heal a Sprained Ankle Fast": "_6hjIWhB8Yc",
  "Chronic Ankle Instability Exercises": "mr0YhNAc4a8",
  "Achilles Tendinitis: Full Guide": "IEfyCfCtIJA",
  "Ankle Sprain Prevention for Athletes": "Y54xXB384mM",
  "Ankle Mobility Routine (Daily)": "77iX2a1BqOk",
  "족저근막염 아침 통증 잡는 스트레칭": "Y0cZl1qHfLI",
  "무지외반증(엄지 튀어나옴) 관리법": "l_Nwoy1U3Hw",
  "평발 교정 운동과 깔창 고르는 법": "1oLEW1Npko8",
  "발 아치 무너짐, 셀프 체크법": "RkvtVcfkdVo",
  "발가락 저림, 원인과 대처법": "hWa_yJbLVQU",
  "하이힐 자주 신는 사람 발 건강 관리": "iztyW4Dcx0o",
  "티눈·굳은살 안전하게 관리하기": "lgTpIx6CRuw",
  "발바닥 통증 부위별 원인 총정리": "2vGtOaxaBv4",
  "성장기 아이 발 통증 체크리스트": "BumT4RSzqcI",
  "어르신 발 저림·부종 관리법": "B5Z2wOTBSI4",
  "Plantar Fasciitis: Morning Pain Fix": "uod-dBB11hs",
  "Bunion Management Without Surgery": "NrguGSvO3h0",
  "Flat Feet Correction Exercises": "MHqMLLjmDPI",
  "Fallen Arches: Self-Check & Fix": "wskTlylWr78",
  "Foot Numbness: Causes & Fixes": "PQ2WxXhcs6M",
  "신제품 언박싱 & 첫 사용 후기": "GDIn4qXF_JY",
  "라이브 커머스 판매 대박 사례 분석": "-0EB2JnnzVA",
  "제품 비교 리뷰 TOP 5 (구매 가이드)": "BgSXY5jKIl4",
  "실사용 한 달, 솔직 장단점 후기": "D9jlYYazIyw",
  "헬스케어 제품 실사용 후기": "zS53OFu51bY",
  "공동구매 인기 상품 소개 & 시연": "cjduH9BXm4E",
  "가성비 아이템 추천 모음 (실구매)": "ZRssirZh7JM",
  "제품 사용법 튜토리얼 (개봉→세팅)": "J_FKrNdwi2s",
  "구매 전 꼭 봐야 할 단점 리뷰": "ilzgdKoM1Yc",
  "홈쇼핑 스타일 제품 시연 & 판매": "u6_ovynrHH0",
  "Product Unboxing & First Impressions": "F1yIklspM9k",
  "Live Shopping Sales Highlights": "jbi6C-en4Kc",
  "Honest Product Review (30 Days)": "24W-zI6gbvk",
  "Top 5 Product Comparison (Buying Guide)": "daF9JE6yQ8w",
  "How-To Product Tutorial (Setup)": "33bm9ssnuuM",
  "Best Value Gadgets Roundup": "OpOmfAr9HU8",
  "경추베개 | 아침 목 통증 '비포·애프터' 상황극 릴스": "whPLXvuSJ9Q",
  "경추베개 | 자는 동안 목 정렬 3D 모션그래픽 광고": "1oC1rTSOe78",
  "허리베개 | 무너지는 허리 vs 받쳐주는 허리 대비 릴스": "9mU8vmyhpkE",
  "허리베개 | 재택근무 허리 세우기 15초 데모 광고": "KaJbSSMmDHo",
  "자동차 허리쿠션 | 장거리 운전 허리 뻐근함 해결 상황극": "gMEF2KzgU5A",
  "자동차 허리쿠션 | 운전 자세 교정 인포그래픽 릴스": "G9bD76jMnmY",
  "차량용 목쿠션 | 신호대기 중 꾸벅, 목 받쳐주는 순간 광고": "JCtQ7M5XT-Q",
  "차량용 목쿠션 | 조수석 낮잠 편안함 감성 ASMR 릴스": "JCtQ7M5XT-Q",
  "허리보호대 | 무거운 짐 들기 전·후 코어 잡아주는 데모 광고": "aF60pe42SrE",
  "허리보호대 | 물류·택배 근무자 하루 착용 시네마틱 광고": "OgGNv1zKEOU",
  "Cervical Pillow | 'Wake up pain-free' before/after reel": "cSSu8QsJqYE",
  "Lumbar Pillow | Desk posture fix in 15s (demo ad)": "6Nl7oCssJ5g",
  "Car Lumbar Cushion | Long-drive back relief story reel": "5H1o6ebCaWc",
  "Car Neck Cushion | Passenger nap comfort ASMR reel": "0ZbH1kPjQSk",
  "Back Support Belt | Lift-safe core support (demo ad)": "XKWrW1Ro3N4",
};

function ytId(v: { title: string }): string {
  return YT_IDS[v.title] ?? "";
}

// ─────────────────── 정형외과: 부위별 카테고리 ───────────────────
const ORTHO_CATEGORIES: Category[] = [
  {
    key: "neck",
    label: "목",
    videos: [
      // 국내
      { title: "거북목 교정 스트레칭 5분 루틴", channel: "바른자세연구소", views: 1980000, duration: "05:12", region: "domestic", ages: [10, 20, 30] },
      { title: "목 디스크 초기 증상과 자가진단법", channel: "정형외과 김원장", views: 1720000, duration: "09:41", region: "domestic", ages: [30, 40, 50] },
      { title: "일자목, 베개 하나로 잡는 법", channel: "튼튼정형외과TV", views: 1340000, duration: "08:03", region: "domestic", ages: [20, 30, 40] },
      { title: "스마트폰 목 통증 예방 습관", channel: "닥터 재활", views: 1120000, duration: "06:27", region: "domestic", ages: [10, 20, 30] },
      { title: "자고 나면 목이 안 돌아갈 때", channel: "서울관절병원", views: 890000, duration: "07:15", region: "domestic", ages: [20, 30, 40, 50] },
      { title: "목·어깨 뭉침 푸는 셀프 마사지", channel: "바른자세연구소", views: 760000, duration: "10:44", region: "domestic", ages: [20, 30, 40, 50] },
      { title: "경추 협착증 환자를 위한 안전 운동", channel: "정형외과 김원장", views: 640000, duration: "12:18", region: "domestic", ages: [50, 60, 70] },
      { title: "학생 거북목, 공부자세 교정법", channel: "스포츠재활클리닉", views: 520000, duration: "07:52", region: "domestic", ages: [10, 20] },
      { title: "목 디스크, 수술 없이 관리하기", channel: "튼튼정형외과TV", views: 430000, duration: "13:05", region: "domestic", ages: [40, 50, 60] },
      { title: "어르신 목 통증 완화 스트레칭", channel: "닥터 재활", views: 310000, duration: "09:38", region: "domestic", ages: [60, 70] },
      // 해외
      { title: "Fix 'Tech Neck' in 5 Minutes", channel: "Bob & Brad", views: 14000000, duration: "05:58", region: "overseas", ages: [10, 20, 30] },
      { title: "Neck Pain Relief: The 90-Second Fix", channel: "AskDoctorJo", views: 8600000, duration: "06:11", region: "overseas", ages: [20, 30, 40] },
      { title: "Best Exercises for a Neck Disc", channel: "Rehab Science", views: 5200000, duration: "12:44", region: "overseas", ages: [30, 40, 50] },
      { title: "Forward Head Posture Correction", channel: "E3 Rehab", views: 3400000, duration: "09:27", region: "overseas", ages: [20, 30, 40] },
      { title: "Cervical Stenosis Safe Exercises", channel: "Physical Therapy Guru", views: 1900000, duration: "11:36", region: "overseas", ages: [50, 60, 70] },
    ],
  },
  {
    key: "shoulder",
    label: "어깨",
    videos: [
      { title: "오십견, 이 동작 하나면 어깨가 풀립니다", channel: "닥터 재활", views: 2150000, duration: "07:52", region: "domestic", ages: [40, 50, 60] },
      { title: "회전근개 파열, 수술해야 할까?", channel: "서울관절병원", views: 1680000, duration: "15:23", region: "domestic", ages: [40, 50, 60, 70] },
      { title: "라운드숄더(굽은 어깨) 교정 운동", channel: "바른자세연구소", views: 1290000, duration: "09:10", region: "domestic", ages: [20, 30, 40] },
      { title: "헬스 중 어깨 통증, 원인과 해결", channel: "스포츠재활클리닉", views: 1040000, duration: "11:33", region: "domestic", ages: [20, 30] },
      { title: "어깨 충돌증후군 재활 운동", channel: "정형외과 김원장", views: 870000, duration: "10:47", region: "domestic", ages: [30, 40, 50] },
      { title: "오십견 초기 증상 자가진단", channel: "튼튼정형외과TV", views: 720000, duration: "06:19", region: "domestic", ages: [40, 50, 60] },
      { title: "운동 전 어깨 워밍업 루틴", channel: "스포츠재활클리닉", views: 610000, duration: "05:48", region: "domestic", ages: [10, 20, 30] },
      { title: "어깨 석회성 건염 관리법", channel: "서울관절병원", views: 480000, duration: "12:02", region: "domestic", ages: [40, 50, 60] },
      { title: "어깨 뭉침 풀어주는 스트레칭", channel: "바른자세연구소", views: 390000, duration: "08:26", region: "domestic", ages: [20, 30, 40, 50] },
      { title: "어르신 어깨 통증 안전 재활", channel: "닥터 재활", views: 260000, duration: "10:15", region: "domestic", ages: [60, 70] },
      { title: "Frozen Shoulder: Full Recovery Routine", channel: "AskDoctorJo", views: 9400000, duration: "08:36", region: "overseas", ages: [40, 50, 60] },
      { title: "Rotator Cuff Tear — Surgery or Not?", channel: "Sports Ortho Clinic", views: 7100000, duration: "16:44", region: "overseas", ages: [40, 50, 60, 70] },
      { title: "Rounded Shoulders Fix (Posture)", channel: "E3 Rehab", views: 4600000, duration: "09:52", region: "overseas", ages: [20, 30, 40] },
      { title: "Shoulder Impingement Rehab", channel: "Rehab Science", views: 3000000, duration: "13:18", region: "overseas", ages: [30, 40, 50] },
      { title: "Shoulder Warm-up Before Lifting", channel: "Bob & Brad", views: 1700000, duration: "05:31", region: "overseas", ages: [10, 20, 30] },
    ],
  },
  {
    key: "back",
    label: "허리",
    videos: [
      { title: "허리 디스크 초기 증상과 자가진단법 총정리", channel: "튼튼정형외과TV", views: 2340000, duration: "09:41", region: "domestic", ages: [20, 30, 40, 50] },
      { title: "척추관 협착증 환자를 위한 걷기 운동", channel: "바른자세연구소", views: 1760000, duration: "10:18", region: "domestic", ages: [50, 60, 70] },
      { title: "앉아서 일하는 사람 허리 관리법", channel: "정형외과 김원장", views: 1450000, duration: "08:37", region: "domestic", ages: [20, 30, 40] },
      { title: "급성 요통(삐끗) 응급 대처법", channel: "서울관절병원", views: 1180000, duration: "07:09", region: "domestic", ages: [20, 30, 40, 50] },
      { title: "허리 통증 잡는 초간단 스트레칭", channel: "닥터 재활", views: 990000, duration: "06:44", region: "domestic", ages: [20, 30, 40] },
      { title: "허리 디스크, 수술 없이 재활하기", channel: "튼튼정형외과TV", views: 820000, duration: "13:59", region: "domestic", ages: [30, 40, 50] },
      { title: "코어 강화로 허리 보호하기", channel: "스포츠재활클리닉", views: 690000, duration: "11:22", region: "domestic", ages: [20, 30, 40] },
      { title: "학생 허리 통증, 자세 교정법", channel: "바른자세연구소", views: 540000, duration: "07:31", region: "domestic", ages: [10, 20] },
      { title: "임신부 허리 통증 완화 운동", channel: "닥터 재활", views: 420000, duration: "09:12", region: "domestic", ages: [20, 30] },
      { title: "어르신 허리 굽음 예방 운동", channel: "정형외과 김원장", views: 300000, duration: "10:05", region: "domestic", ages: [60, 70] },
      { title: "Herniated Disc: The BEST Exercises", channel: "Rehab Science", views: 12000000, duration: "14:08", region: "overseas", ages: [20, 30, 40, 50] },
      { title: "Spinal Stenosis Walking Program", channel: "Physical Therapy Guru", views: 6300000, duration: "12:51", region: "overseas", ages: [50, 60, 70] },
      { title: "Low Back Pain: Quick Relief", channel: "AskDoctorJo", views: 4100000, duration: "07:22", region: "overseas", ages: [20, 30, 40] },
      { title: "Core Stability for Your Back", channel: "E3 Rehab", views: 2600000, duration: "10:47", region: "overseas", ages: [20, 30, 40] },
      { title: "Sciatica Stretch Routine", channel: "Bob & Brad", views: 1500000, duration: "08:03", region: "overseas", ages: [30, 40, 50] },
    ],
  },
  {
    key: "knee",
    label: "무릎",
    videos: [
      { title: "무릎 통증, 수술 없이 좋아지는 스트레칭 3가지", channel: "정형외과 김원장", views: 2210000, duration: "12:04", region: "domestic", ages: [40, 50, 60] },
      { title: "퇴행성 관절염, 무릎 지키는 운동", channel: "서울관절병원", views: 1590000, duration: "13:27", region: "domestic", ages: [50, 60, 70] },
      { title: "반월상 연골 손상 재활 4주 프로그램", channel: "스포츠재활클리닉", views: 1310000, duration: "13:59", region: "domestic", ages: [20, 30, 40] },
      { title: "러닝 후 무릎 통증, 원인은?", channel: "스포츠재활클리닉", views: 1080000, duration: "09:48", region: "domestic", ages: [10, 20, 30] },
      { title: "계단 오르내릴 때 무릎 아플 때", channel: "튼튼정형외과TV", views: 910000, duration: "08:15", region: "domestic", ages: [40, 50, 60] },
      { title: "무릎 연골 지키는 근력 운동", channel: "닥터 재활", views: 780000, duration: "10:33", region: "domestic", ages: [30, 40, 50] },
      { title: "십자인대 파열 수술 후 재활", channel: "스포츠재활클리닉", views: 650000, duration: "14:20", region: "domestic", ages: [10, 20, 30] },
      { title: "무릎 붓기 빠르게 빼는 관리법", channel: "바른자세연구소", views: 520000, duration: "07:41", region: "domestic", ages: [30, 40, 50, 60] },
      { title: "성장기 무릎 통증(오스굿병) 관리", channel: "정형외과 김원장", views: 380000, duration: "08:58", region: "domestic", ages: [10] },
      { title: "어르신 인공관절 수술 후 운동", channel: "서울관절병원", views: 270000, duration: "11:49", region: "domestic", ages: [60, 70] },
      { title: "Fix Knee Pain in 5 Minutes (No Equipment)", channel: "Bob & Brad", views: 18000000, duration: "10:22", region: "overseas", ages: [40, 50, 60] },
      { title: "Knee Osteoarthritis Exercises", channel: "Physical Therapy Guru", views: 7800000, duration: "13:41", region: "overseas", ages: [50, 60, 70] },
      { title: "Meniscus Tear Rehab Protocol", channel: "Rehab Science", views: 4200000, duration: "18:03", region: "overseas", ages: [20, 30, 40] },
      { title: "Runner's Knee: The Real Fix", channel: "E3 Rehab", views: 2900000, duration: "09:35", region: "overseas", ages: [10, 20, 30] },
      { title: "ACL Reconstruction Rehab Guide", channel: "Sports Ortho Clinic", views: 1600000, duration: "16:12", region: "overseas", ages: [10, 20, 30] },
    ],
  },
  {
    key: "ankle",
    label: "발목",
    videos: [
      { title: "발목 삐끗했을 때 절대 하면 안 되는 것", channel: "정형외과 김원장", views: 1870000, duration: "06:33", region: "domestic", ages: [10, 20, 30, 40] },
      { title: "자주 삐는 발목(불안정성) 강화 운동", channel: "스포츠재활클리닉", views: 1240000, duration: "09:27", region: "domestic", ages: [20, 30, 40] },
      { title: "발목 인대 파열 재활 가이드", channel: "서울관절병원", views: 1010000, duration: "11:14", region: "domestic", ages: [10, 20, 30] },
      { title: "아킬레스건염 원인과 관리법", channel: "튼튼정형외과TV", views: 720000, duration: "10:06", region: "domestic", ages: [20, 30, 40, 50] },
      { title: "발목 골절 후 재활 운동 단계별", channel: "스포츠재활클리닉", views: 590000, duration: "12:31", region: "domestic", ages: [30, 40, 50] },
      { title: "축구·농구 발목 부상 예방법", channel: "스포츠재활클리닉", views: 480000, duration: "07:48", region: "domestic", ages: [10, 20] },
      { title: "발목 붓기 빠르게 빼기", channel: "바른자세연구소", views: 360000, duration: "06:19", region: "domestic", ages: [20, 30, 40] },
      { title: "만성 발목 통증 셀프 관리", channel: "닥터 재활", views: 280000, duration: "09:03", region: "domestic", ages: [30, 40, 50] },
      { title: "발목 근력 밴드 운동 루틴", channel: "스포츠재활클리닉", views: 220000, duration: "08:22", region: "domestic", ages: [20, 30, 40] },
      { title: "어르신 발목 근력·낙상 예방 운동", channel: "닥터 재활", views: 160000, duration: "10:22", region: "domestic", ages: [60, 70] },
      { title: "How to Heal a Sprained Ankle Fast", channel: "E3 Rehab", views: 5800000, duration: "07:19", region: "overseas", ages: [10, 20, 30, 40] },
      { title: "Chronic Ankle Instability Exercises", channel: "Rehab Science", views: 3300000, duration: "11:48", region: "overseas", ages: [20, 30, 40] },
      { title: "Achilles Tendinitis: Full Guide", channel: "Physical Therapy Guru", views: 2400000, duration: "12:05", region: "overseas", ages: [20, 30, 40, 50] },
      { title: "Ankle Sprain Prevention for Athletes", channel: "Sports Ortho Clinic", views: 1300000, duration: "08:41", region: "overseas", ages: [10, 20] },
      { title: "Ankle Mobility Routine (Daily)", channel: "Bob & Brad", views: 900000, duration: "06:57", region: "overseas", ages: [20, 30, 40] },
    ],
  },
  {
    key: "foot",
    label: "발",
    videos: [
      { title: "족저근막염 아침 통증 잡는 스트레칭", channel: "닥터 재활", views: 1450000, duration: "07:26", region: "domestic", ages: [30, 40, 50] },
      { title: "무지외반증(엄지 튀어나옴) 관리법", channel: "정형외과 김원장", views: 1120000, duration: "09:14", region: "domestic", ages: [30, 40, 50, 60] },
      { title: "평발 교정 운동과 깔창 고르는 법", channel: "바른자세연구소", views: 940000, duration: "10:38", region: "domestic", ages: [10, 20, 30] },
      { title: "발 아치 무너짐, 셀프 체크법", channel: "스포츠재활클리닉", views: 780000, duration: "06:52", region: "domestic", ages: [20, 30, 40] },
      { title: "발가락 저림, 원인과 대처법", channel: "서울관절병원", views: 660000, duration: "08:47", region: "domestic", ages: [40, 50, 60] },
      { title: "하이힐 자주 신는 사람 발 건강 관리", channel: "튼튼정형외과TV", views: 540000, duration: "07:33", region: "domestic", ages: [20, 30, 40] },
      { title: "티눈·굳은살 안전하게 관리하기", channel: "닥터 재활", views: 430000, duration: "06:18", region: "domestic", ages: [30, 40, 50] },
      { title: "발바닥 통증 부위별 원인 총정리", channel: "정형외과 김원장", views: 350000, duration: "11:09", region: "domestic", ages: [30, 40, 50, 60] },
      { title: "성장기 아이 발 통증 체크리스트", channel: "바른자세연구소", views: 260000, duration: "08:05", region: "domestic", ages: [10] },
      { title: "어르신 발 저림·부종 관리법", channel: "닥터 재활", views: 180000, duration: "09:41", region: "domestic", ages: [60, 70] },
      { title: "Plantar Fasciitis: Morning Pain Fix", channel: "AskDoctorJo", views: 6700000, duration: "08:12", region: "overseas", ages: [30, 40, 50] },
      { title: "Bunion Management Without Surgery", channel: "Physical Therapy Guru", views: 3900000, duration: "10:27", region: "overseas", ages: [30, 40, 50, 60] },
      { title: "Flat Feet Correction Exercises", channel: "E3 Rehab", views: 2500000, duration: "09:19", region: "overseas", ages: [10, 20, 30] },
      { title: "Fallen Arches: Self-Check & Fix", channel: "Rehab Science", views: 1400000, duration: "11:33", region: "overseas", ages: [20, 30, 40] },
      { title: "Foot Numbness: Causes & Fixes", channel: "Bob & Brad", views: 800000, duration: "07:44", region: "overseas", ages: [40, 50, 60] },
    ],
  },
];

// ─────────────────── 제품 판매 추천: 판매에 적합한 영상 (연예인 광고 제외) ───────────────────
// ⚠️ 연예인 출연 광고 영상은 제외하고, 실사용 리뷰·언박싱·라이브커머스 등
//    제품을 직접 파는 데 효과적인 콘텐츠만 담았습니다. (유튜브 / 인스타그램 구분)
const SALES_VIDEOS: Video[] = [
  // ── 유튜브 · 국내 ──
  { title: "신제품 언박싱 & 첫 사용 후기", channel: "언박싱랩", views: 7600000, duration: "12:41", region: "domestic", platform: "youtube" },
  { title: "라이브 커머스 판매 대박 사례 분석", channel: "라이브커머스TV", views: 6100000, duration: "16:22", region: "domestic", platform: "youtube" },
  { title: "제품 비교 리뷰 TOP 5 (구매 가이드)", channel: "리뷰노트", views: 5300000, duration: "14:08", region: "domestic", platform: "youtube" },
  { title: "실사용 한 달, 솔직 장단점 후기", channel: "솔직리뷰", views: 4200000, duration: "11:53", region: "domestic", platform: "youtube" },
  { title: "헬스케어 제품 실사용 후기", channel: "헬스템리뷰", views: 3400000, duration: "13:17", region: "domestic", platform: "youtube" },
  { title: "공동구매 인기 상품 소개 & 시연", channel: "공구마켓", views: 2700000, duration: "10:39", region: "domestic", platform: "youtube" },
  { title: "가성비 아이템 추천 모음 (실구매)", channel: "가성비헌터", views: 2100000, duration: "15:44", region: "domestic", platform: "youtube" },
  { title: "제품 사용법 튜토리얼 (개봉→세팅)", channel: "하우투샵", views: 1600000, duration: "09:26", region: "domestic", platform: "youtube" },
  { title: "구매 전 꼭 봐야 할 단점 리뷰", channel: "팩트리뷰", views: 1200000, duration: "12:05", region: "domestic", platform: "youtube" },
  { title: "홈쇼핑 스타일 제품 시연 & 판매", channel: "시연왕", views: 880000, duration: "17:31", region: "domestic", platform: "youtube" },
  // ── 유튜브 · 해외 ──
  { title: "Product Unboxing & First Impressions", channel: "UnboxLab", views: 10000000, duration: "13:44", region: "overseas", platform: "youtube" },
  { title: "Live Shopping Sales Highlights", channel: "LiveCommerceTV", views: 6800000, duration: "18:12", region: "overseas", platform: "youtube" },
  { title: "Honest Product Review (30 Days)", channel: "HonestReview", views: 5100000, duration: "14:57", region: "overseas", platform: "youtube" },
  { title: "Top 5 Product Comparison (Buying Guide)", channel: "ReviewNote", views: 3300000, duration: "16:05", region: "overseas", platform: "youtube" },
  { title: "How-To Product Tutorial (Setup)", channel: "HowToShop", views: 2000000, duration: "09:38", region: "overseas", platform: "youtube" },
  { title: "Best Value Gadgets Roundup", channel: "ValueHunter", views: 1400000, duration: "15:22", region: "overseas", platform: "youtube" },

  // ── 인스타그램 · 국내 (닥터써클 스토어 제품 기반 광고 아이디어 · 연예인/후기/언박싱 제외) ──
  { title: "경추베개 | 아침 목 통증 '비포·애프터' 상황극 릴스", channel: "닥터써클 · 경추베개", views: 4200000, duration: "0:28", region: "domestic", platform: "instagram" },
  { title: "경추베개 | 자는 동안 목 정렬 3D 모션그래픽 광고", channel: "닥터써클 · 경추베개", views: 3600000, duration: "0:22", region: "domestic", platform: "instagram" },
  { title: "허리베개 | 무너지는 허리 vs 받쳐주는 허리 대비 릴스", channel: "닥터써클 · 허리베개", views: 3100000, duration: "0:30", region: "domestic", platform: "instagram" },
  { title: "허리베개 | 재택근무 허리 세우기 15초 데모 광고", channel: "닥터써클 · 허리베개", views: 2700000, duration: "0:15", region: "domestic", platform: "instagram" },
  { title: "자동차 허리쿠션 | 장거리 운전 허리 뻐근함 해결 상황극", channel: "닥터써클 · 자동차 허리쿠션", views: 2300000, duration: "0:35", region: "domestic", platform: "instagram" },
  { title: "자동차 허리쿠션 | 운전 자세 교정 인포그래픽 릴스", channel: "닥터써클 · 자동차 허리쿠션", views: 1900000, duration: "0:26", region: "domestic", platform: "instagram" },
  { title: "차량용 목쿠션 | 신호대기 중 꾸벅, 목 받쳐주는 순간 광고", channel: "닥터써클 · 차량용 목쿠션", views: 1600000, duration: "0:20", region: "domestic", platform: "instagram" },
  { title: "차량용 목쿠션 | 조수석 낮잠 편안함 감성 ASMR 릴스", channel: "닥터써클 · 차량용 목쿠션", views: 1300000, duration: "0:33", region: "domestic", platform: "instagram" },
  { title: "허리보호대 | 무거운 짐 들기 전·후 코어 잡아주는 데모 광고", channel: "닥터써클 · 허리보호대", views: 1000000, duration: "0:24", region: "domestic", platform: "instagram" },
  { title: "허리보호대 | 물류·택배 근무자 하루 착용 시네마틱 광고", channel: "닥터써클 · 허리보호대", views: 780000, duration: "0:40", region: "domestic", platform: "instagram" },
  // ── 인스타그램 · 해외 (Dr.Circle product ad ideas) ──
  { title: "Cervical Pillow | 'Wake up pain-free' before/after reel", channel: "Dr.Circle · Cervical Pillow", views: 5400000, duration: "0:27", region: "overseas", platform: "instagram" },
  { title: "Lumbar Pillow | Desk posture fix in 15s (demo ad)", channel: "Dr.Circle · Lumbar Pillow", views: 3800000, duration: "0:15", region: "overseas", platform: "instagram" },
  { title: "Car Lumbar Cushion | Long-drive back relief story reel", channel: "Dr.Circle · Car Lumbar Cushion", views: 2600000, duration: "0:34", region: "overseas", platform: "instagram" },
  { title: "Car Neck Cushion | Passenger nap comfort ASMR reel", channel: "Dr.Circle · Car Neck Cushion", views: 1700000, duration: "0:30", region: "overseas", platform: "instagram" },
  { title: "Back Support Belt | Lift-safe core support (demo ad)", channel: "Dr.Circle · Back Support Belt", views: 1200000, duration: "0:22", region: "overseas", platform: "instagram" },
];

// ────────────────────────────── 컴포넌트 ──────────────────────────────
type TabKey = "orthopedic" | "sales";

export default function Page() {
  const [region, setRegion] = useState<Region>("domestic");
  const [tab, setTab] = useState<TabKey>("orthopedic");
  const [orthoCat, setOrthoCat] = useState<string>(ORTHO_CATEGORIES[0].key);
  const [age, setAge] = useState<number | "all">("all");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [selected, setSelected] = useState<Video | null>(null);

  // 모달이 열려 있을 때 ESC 로 닫기
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // 현재 조건에 맞는 영상 목록 (조회수 내림차순)
  let videos: Video[] = [];
  if (tab === "orthopedic") {
    const cat = ORTHO_CATEGORIES.find((c) => c.key === orthoCat);
    videos = (cat?.videos ?? []).filter(
      (v) =>
        v.region === region && (age === "all" || v.ages?.includes(age))
    );
  } else {
    videos = SALES_VIDEOS.filter(
      (v) => v.region === region && v.platform === platform
    );
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
          <b>국내/해외</b>를 골라 <b>정형외과</b>(부위·나이대별)와{" "}
          <b>제품 판매 추천</b> 영상을 살펴보세요. 모든 목록은 조회수순으로
          정렬됩니다. (샘플 데이터 · YouTube API 미연동)
        </p>
      </section>

      {/* 국내/해외 토글 (전체 적용) */}
      <div className="mb-5 inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {(
          [
            { key: "domestic", label: "🇰🇷 국내" },
            { key: "overseas", label: "🌍 해외" },
          ] as const
        ).map((r) => (
          <button
            key={r.key}
            onClick={() => setRegion(r.key)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              region === r.key
                ? "bg-white text-indigo-600 shadow dark:bg-neutral-950 dark:text-indigo-400"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 메인 탭 */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            { key: "orthopedic", label: "🩺 정형외과" },
            { key: "sales", label: "🛒 제품 판매 추천" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
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

      {/* 제품 판매 탭: 플랫폼(유튜브/인스타그램) + 안내 */}
      {tab === "sales" && (
        <>
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold text-neutral-400">플랫폼</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "youtube", label: "▶️ 유튜브" },
                  { key: "instagram", label: "📸 인스타그램" },
                ] as const
              ).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  className={pill(platform === p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {platform === "instagram" ? (
            <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              📸 <b>닥터써클 스토어 제품</b>(경추베개·허리베개·자동차 허리쿠션·차량용
              목쿠션·허리보호대)으로 <b>인스타그램에서 만들 수 있는 광고 콘셉트</b>를
              추천합니다. 조건에 따라 <b>연예인 출연·후기·언박싱은 제외</b>했고, 각
              카드는 참고용 레퍼런스 영상으로 연결됩니다.
            </p>
          ) : (
            <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              🛒 <b>제품 판매</b>에 효과적인 영상(리뷰·언박싱·라이브커머스 등)만
              모았습니다. <b>연예인 광고 영상은 제외</b>했습니다.
            </p>
          )}
        </>
      )}

      {/* 정렬/개수 안내 */}
      <p className="mb-4 text-xs text-neutral-400">
        {region === "domestic" ? "국내" : "해외"} · 조회수 높은 순으로 정렬됨 · 총{" "}
        {videos.length}개
      </p>

      {/* 카드 갤러리 */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <div className="text-4xl">🔍</div>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            조건에 맞는 영상이 없어요. 국내/해외나 나이대·부위를 바꿔보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <article
              key={`${tab}-${region}-${orthoCat}-${platform}-${i}`}
              onClick={() => setSelected(v)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
            >
              {/* 썸네일 (실제 영상 썸네일, 없으면 그라데이션) */}
              <div
                className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${
                  THUMBS[i % THUMBS.length]
                }`}
              >
                {ytId(v) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://i.ytimg.com/vi/${ytId(v)}/hqdefault.jpg`}
                    alt={v.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition-transform group-hover:scale-110">
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

      {/* 재생 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black">
              {ytId(selected) ? (
                <iframe
                  key={selected.title}
                  src={`https://www.youtube.com/embed/${ytId(
                    selected
                  )}?autoplay=1&rel=0`}
                  title={selected.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  key={selected.title}
                  src={SAMPLE_VIDEO_URL}
                  controls
                  autoPlay
                  className="aspect-video w-full"
                />
              )}
              <button
                onClick={() => setSelected(null)}
                aria-label="닫기"
                className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <h3 className="text-base font-semibold">{selected.title}</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {selected.channel} · {formatViews(selected.views)}
              </p>
              <a
                href={
                  ytId(selected)
                    ? `https://www.youtube.com/watch?v=${ytId(selected)}`
                    : `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        selected.title
                      )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                ▶ 유튜브에서 이 영상 보기
              </a>
            </div>
          </div>
        </div>
      )}
    </MemberShell>
  );
}
