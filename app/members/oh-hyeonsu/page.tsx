"use client";

import { useState } from "react";
import MemberShell from "@/components/MemberShell";

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

  // ── 인스타그램 · 국내 ──
  { title: "릴스로 제품 30초 소개 (전환율 UP)", channel: "릴스마케팅", views: 5400000, duration: "0:30", region: "domestic", platform: "instagram" },
  { title: "인스타 공동구매 후기 릴스 모음", channel: "공구스타그램", views: 3900000, duration: "0:45", region: "domestic", platform: "instagram" },
  { title: "제품 언박싱 릴스 (짧고 강하게)", channel: "언박싱릴스", views: 3100000, duration: "0:38", region: "domestic", platform: "instagram" },
  { title: "사용 전후 비교 릴스", channel: "비포애프터", views: 2600000, duration: "0:52", region: "domestic", platform: "instagram" },
  { title: "인스타 라이브 쇼핑 하이라이트", channel: "라이브샵그램", views: 1900000, duration: "1:12", region: "domestic", platform: "instagram" },
  { title: "1분 제품 사용법 릴스", channel: "꿀팁릴스", views: 1400000, duration: "0:58", region: "domestic", platform: "instagram" },
  { title: "인플루언서 실사용 릴스 (비연예인)", channel: "리뷰그램", views: 980000, duration: "0:41", region: "domestic", platform: "instagram" },
  { title: "제품 스타일링 릴스", channel: "스타일샵", views: 720000, duration: "0:35", region: "domestic", platform: "instagram" },
  // ── 인스타그램 · 해외 ──
  { title: "30-Second Product Reel (High Convert)", channel: "ReelsMarketing", views: 8200000, duration: "0:30", region: "overseas", platform: "instagram" },
  { title: "Instagram Live Shopping Highlights", channel: "LiveShopGram", views: 4700000, duration: "1:20", region: "overseas", platform: "instagram" },
  { title: "Before & After Product Reel", channel: "BeforeAfter", views: 3600000, duration: "0:48", region: "overseas", platform: "instagram" },
  { title: "Unboxing Reels Compilation", channel: "UnboxReels", views: 2400000, duration: "0:55", region: "overseas", platform: "instagram" },
  { title: "Influencer Honest Reel (non-celebrity)", channel: "ReviewGram", views: 1500000, duration: "0:42", region: "overseas", platform: "instagram" },
];

// ────────────────────────────── 컴포넌트 ──────────────────────────────
type TabKey = "orthopedic" | "sales";

export default function Page() {
  const [region, setRegion] = useState<Region>("domestic");
  const [tab, setTab] = useState<TabKey>("orthopedic");
  const [orthoCat, setOrthoCat] = useState<string>(ORTHO_CATEGORIES[0].key);
  const [age, setAge] = useState<number | "all">("all");
  const [platform, setPlatform] = useState<Platform>("youtube");

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
          <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            🛒 <b>제품 판매</b>에 효과적인 영상(리뷰·언박싱·라이브커머스 등)만
            모았습니다. <b>연예인 광고 영상은 제외</b>했습니다.
          </p>
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
              key={`${tab}-${region}-${orthoCat}-${i}`}
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
