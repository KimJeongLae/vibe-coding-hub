// 광고 성과 대시보드 샘플 데이터 (조권일 페이지 전용).
// 실제 API/수집 없이 코드에 직접 넣은 샘플 숫자입니다.
// 모든 수치는 "최근 7일" 기준이며, 날짜 토글로 기간에 맞춰 스케일됩니다.
// 랜덤을 쓰지 않고 고정 가중치로 생성해 서버/클라이언트 렌더가 항상 동일합니다.

export type Metrics = {
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
};

export type CampaignType = "SA" | "DA"; // 검색광고 / 디스플레이광고

export type GroupRow = {
  id: string;
  name: string;
  type: CampaignType;
  metrics: Metrics;
};
export type KeywordRow = {
  id: string;
  keyword: string;
  group: string;
  metrics: Metrics;
};
export type CreativeRow = {
  id: string;
  name: string;
  format: "image" | "video";
  group: string;
  metrics: Metrics;
};

export type MediaDetail = {
  key: string;
  name: string;
  color: string;
  totals: Metrics;
  campaigns: { type: CampaignType; label: string; metrics: Metrics }[];
  groups: GroupRow[];
  keywords: KeywordRow[];
  creatives: CreativeRow[];
};

// ── 매체별 기본 총합 (최근 7일) + SA 비중 ──
const BASE: {
  key: string;
  name: string;
  color: string;
  saShare: number;
  totals: Metrics;
}[] = [
  {
    key: "naver",
    name: "네이버",
    color: "#2a78d6",
    saShare: 0.62,
    totals: { cost: 3_200_000, impressions: 1_250_000, clicks: 42_000, conversions: 1_850, revenue: 28_500_000 },
  },
  {
    key: "google",
    name: "구글",
    color: "#1baf7a",
    saShare: 0.55,
    totals: { cost: 4_500_000, impressions: 2_100_000, clicks: 68_000, conversions: 2_400, revenue: 41_000_000 },
  },
  {
    key: "meta",
    name: "메타",
    color: "#eda100",
    saShare: 0.22,
    totals: { cost: 2_800_000, impressions: 3_400_000, clicks: 55_000, conversions: 1_500, revenue: 22_000_000 },
  },
  {
    key: "kakao",
    name: "카카오",
    color: "#e34948",
    saShare: 0.48,
    totals: { cost: 1_600_000, impressions: 780_000, clicks: 21_000, conversions: 720, revenue: 9_800_000 },
  },
];

// 이름 풀
const SA_GROUP_NAMES = ["브랜드 검색", "핵심 키워드", "경쟁사 대응", "일반 키워드", "시즌 프로모션", "롱테일 키워드"];
const DA_GROUP_NAMES = ["리타겟팅", "관심사 타겟", "유사 타겟", "신규 고객 유입", "디스플레이 배너", "인스트림 영상"];
const KEYWORDS = ["여름 신상", "런닝화 추천", "무선 이어폰", "캠핑 의자", "홈트 용품", "가을 아우터", "주방 가전", "다이어트 보조제"];
const IMAGE_NAMES = ["메인 배너 A", "할인 카드뉴스", "제품 상세컷", "시즌 키비주얼"];
const VIDEO_NAMES = ["15초 브랜드 영상", "제품 사용 영상", "리뷰 인터뷰", "튜토리얼 영상"];

// 고정 가중치 (내림차순) — 상위 항목일수록 볼륨이 큼
const W6 = [0.3, 0.22, 0.17, 0.13, 0.1, 0.08];
const W8 = [0.24, 0.18, 0.15, 0.12, 0.1, 0.09, 0.07, 0.05];
// 효율(ROAS/전환율) 변주 — 볼륨 순위와 성과 순위를 다르게 만들어 랭킹에 변화를 줌
const EFF = [1.28, 0.95, 1.12, 0.86, 1.2, 0.9, 1.06, 0.82];

function share(t: Metrics, s: number): Metrics {
  return {
    cost: t.cost * s,
    impressions: t.impressions * s,
    clicks: t.clicks * s,
    conversions: t.conversions * s,
    revenue: t.revenue * s,
  };
}

function mk(base: Metrics, w: number, eff: number): Metrics {
  return {
    cost: Math.round(base.cost * w),
    impressions: Math.round(base.impressions * w),
    clicks: Math.round(base.clicks * w),
    conversions: Math.round(base.conversions * w * eff),
    revenue: Math.round(base.revenue * w * eff),
  };
}

export const MEDIA_DETAILS: MediaDetail[] = BASE.map((b) => {
  const saBase = share(b.totals, b.saShare);
  const daBase = share(b.totals, 1 - b.saShare);

  // SA / DA 그룹 각각 6개 생성
  const saGroups: GroupRow[] = SA_GROUP_NAMES.map((name, i) => ({
    id: `${b.key}-sa-g${i + 1}`,
    name,
    type: "SA" as const,
    metrics: mk(saBase, W6[i], EFF[i]),
  }));
  const daGroups: GroupRow[] = DA_GROUP_NAMES.map((name, i) => ({
    id: `${b.key}-da-g${i + 1}`,
    name,
    type: "DA" as const,
    metrics: mk(daBase, W6[i], EFF[(i + 3) % EFF.length]),
  }));

  // SA 키워드 8개
  const keywords: KeywordRow[] = KEYWORDS.map((keyword, i) => ({
    id: `${b.key}-kw${i + 1}`,
    keyword,
    group: SA_GROUP_NAMES[i % SA_GROUP_NAMES.length],
    metrics: mk(saBase, W8[i], EFF[i % EFF.length]),
  }));

  // DA 소재 6개 (이미지/동영상 번갈아)
  const creatives: CreativeRow[] = Array.from({ length: 6 }, (_, i) => {
    const isVideo = i % 2 === 1;
    const nameList = isVideo ? VIDEO_NAMES : IMAGE_NAMES;
    return {
      id: `${b.key}-cr${i + 1}`,
      name: nameList[Math.floor(i / 2) % nameList.length],
      format: (isVideo ? "video" : "image") as "image" | "video",
      group: DA_GROUP_NAMES[i % DA_GROUP_NAMES.length],
      metrics: mk(daBase, W6[i], EFF[(i + 2) % EFF.length]),
    };
  });

  return {
    key: b.key,
    name: b.name,
    color: b.color,
    totals: b.totals,
    campaigns: [
      { type: "SA" as const, label: "SA 캠페인 (검색광고)", metrics: mk(saBase, 1, 1) },
      { type: "DA" as const, label: "DA 캠페인 (디스플레이)", metrics: mk(daBase, 1, 1) },
    ],
    groups: [...saGroups, ...daGroups],
    keywords,
    creatives,
  };
});

export function getMediaDetail(key: string): MediaDetail | undefined {
  return MEDIA_DETAILS.find((m) => m.key === key);
}
