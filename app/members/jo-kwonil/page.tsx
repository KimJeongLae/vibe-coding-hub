"use client";

import { useState, useEffect } from "react";
import MemberShell from "@/components/MemberShell";
import {
  MEDIA_DETAILS,
  getMediaDetail,
  type Metrics,
  type CampaignType,
} from "./data";

// ✏️ "jo-kwonil"(조권일) 님의 페이지 — 광고 성과 대시보드 MVP.
// 실제 데이터 수집/API 연동 없이 ./data.ts 의 샘플 숫자만으로 화면을 그립니다.
// 매체 카드를 클릭하면 그 매체의 마이크로 대시보드로 드릴다운됩니다.

type MetricKey = keyof Metrics;

const METRICS: { key: MetricKey; label: string; isMoney: boolean }[] = [
  { key: "cost", label: "총비용", isMoney: true },
  { key: "impressions", label: "노출수", isMoney: false },
  { key: "clicks", label: "클릭수", isMoney: false },
  { key: "conversions", label: "전환수", isMoney: false },
  { key: "revenue", label: "전환매출액", isMoney: true },
];

// 📅 날짜 프리셋 (샘플이라 기간 비율로 스케일)
const RANGES: { key: string; label: string; days: number }[] = [
  { key: "today", label: "오늘", days: 1 },
  { key: "7d", label: "최근 7일", days: 7 },
  { key: "30d", label: "최근 30일", days: 30 },
  { key: "90d", label: "최근 90일", days: 90 },
];

// 🔀 매체 비교 그룹 (같은 단위끼리 막대+꺾은선 — 이중축 지양)
type Group = {
  id: string;
  label: string;
  isMoney: boolean;
  bar: { key: MetricKey; name: string };
  line: { key: MetricKey; name: string };
  ratio: { name: string; calc: (m: Metrics) => number; fmt: (x: number) => string };
};

const GROUPS: Group[] = [
  {
    id: "revenue",
    label: "비용 · 매출",
    isMoney: true,
    bar: { key: "cost", name: "총비용" },
    line: { key: "revenue", name: "전환매출액" },
    ratio: { name: "ROAS", calc: (m) => m.revenue / m.cost, fmt: (x) => x.toFixed(1) + "x" },
  },
  {
    id: "traffic",
    label: "노출 · 클릭",
    isMoney: false,
    bar: { key: "impressions", name: "노출수" },
    line: { key: "clicks", name: "클릭수" },
    ratio: { name: "CTR", calc: (m) => (m.clicks / m.impressions) * 100, fmt: (x) => x.toFixed(2) + "%" },
  },
  {
    id: "funnel",
    label: "클릭 · 전환",
    isMoney: false,
    bar: { key: "clicks", name: "클릭수" },
    line: { key: "conversions", name: "전환수" },
    ratio: { name: "전환율", calc: (m) => (m.conversions / m.clicks) * 100, fmt: (x) => x.toFixed(2) + "%" },
  },
];

const SORTS: { key: string; label: string; calc: (m: Metrics) => number }[] = [
  { key: "roas", label: "ROAS", calc: (m) => m.revenue / m.cost },
  { key: "revenue", label: "전환매출액", calc: (m) => m.revenue },
  { key: "conversions", label: "전환수", calc: (m) => m.conversions },
];

const FORMAT_META = {
  image: { label: "이미지", icon: "🖼️" },
  video: { label: "동영상", icon: "🎬" },
} as const;

// 매체 개요 (상세 데이터의 총합에서 파생)
const MEDIA = MEDIA_DETAILS.map((d) => ({
  key: d.key,
  name: d.name,
  color: d.color,
  ...d.totals,
}));

// 개요용 소재 목록 (모든 매체의 DA 소재 취합)
const OVERVIEW_CREATIVES = MEDIA_DETAILS.flatMap((d) =>
  d.creatives.map((c) => ({ ...c, media: d.name, mediaColor: d.color })),
);

// ── 포맷터 ──
function formatValue(value: number, isMoney: boolean): string {
  if (isMoney) return "₩" + Math.round(value).toLocaleString("ko-KR");
  return Math.round(value).toLocaleString("ko-KR");
}
function formatCompact(value: number, isMoney: boolean): string {
  const sign = isMoney ? "₩" : "";
  const v = Math.round(value);
  if (v >= 100_000_000) return sign + (v / 100_000_000).toFixed(1).replace(/\.0$/, "") + "억";
  if (v >= 10_000) return sign + Math.round(v / 10_000).toLocaleString("ko-KR") + "만";
  return sign + v.toLocaleString("ko-KR");
}
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const f = v / base;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * base;
}
function scaleM(m: Metrics, factor: number): Metrics {
  return {
    cost: m.cost * factor,
    impressions: m.impressions * factor,
    clicks: m.clicks * factor,
    conversions: m.conversions * factor,
    revenue: m.revenue * factor,
  };
}
const roas = (m: Metrics) => m.revenue / m.cost;
const ctr = (m: Metrics) => (m.clicks / m.impressions) * 100;
// 비용 0(브랜드검색 등)일 때 ROAS 무한대 방지
const roasFmt = (m: Metrics) => (m.cost > 0 ? (m.revenue / m.cost).toFixed(1) + "x" : "—");
// CPC(클릭당 비용) / CTR — 분모 0 방지
const cpcFmt = (m: Metrics) =>
  m.clicks > 0 ? "₩" + Math.round(m.cost / m.clicks).toLocaleString("ko-KR") : "—";
const ctrFmt = (m: Metrics) =>
  m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) + "%" : "—";
// 성과 저조(낭비) 판정: 비용은 썼는데 매출이 0이거나 비용보다 적음(ROAS<1)
const isWasteful = (m: Metrics) => m.cost > 0 && (m.revenue === 0 || m.revenue < m.cost);
// 정액제(브랜드검색 등): 노출·클릭은 있는데 광고비(salesAmt)가 0으로 내려옴
// → 네이버가 클릭당 광고비를 제공하지 않는 상품이므로 ₩0이 아니라 '정액제'로 표기
const isFlatRate = (m: Metrics) => m.cost === 0 && (m.clicks > 0 || m.impressions > 0);
const FLAT_TITLE = "브랜드검색 등 정액제 상품은 클릭당 광고비(비용)가 네이버 API로 제공되지 않습니다.";

// 네이버 실데이터 API 응답 타입
type NaverResp = {
  ok: true;
  since: string;
  until: string;
  saTotal: Metrics;
  campaigns: { id: string; name: string; tp: string; metrics: Metrics }[];
  groups: { id: string; name: string; type: "SA"; metrics: Metrics }[];
  keywords: { id: string; keyword: string; group: string; metrics: Metrics }[];
};

// 선택한 기간 → 실제 날짜(YYYY-MM-DD)로 변환 (네이버 API 조회용)
function rangeToDates(rangeKey: string, customStart: string, customEnd: string) {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (rangeKey === "custom") return { since: customStart, until: customEnd };
  const days = RANGES.find((r) => r.key === rangeKey)?.days ?? 7;
  const now = new Date();
  return { since: fmt(new Date(now.getTime() - (days - 1) * 86_400_000)), until: fmt(now) };
}

const TYPE_BADGE: Record<CampaignType, { label: string; color: string }> = {
  SA: { label: "SA", color: "#2a78d6" },
  DA: { label: "DA", color: "#eda100" },
};

export default function Page() {
  const [rangeKey, setRangeKey] = useState("7d");
  const [customStart, setCustomStart] = useState("2026-07-01");
  const [customEnd, setCustomEnd] = useState("2026-07-14");
  const [groupId, setGroupId] = useState("revenue");
  const [hovered, setHovered] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [sortKey, setSortKey] = useState("roas");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [groupSort, setGroupSort] = useState("revenue");
  const [naver, setNaver] = useState<NaverResp | null>(null);
  const [naverLoading, setNaverLoading] = useState(true);
  const [naverError, setNaverError] = useState<string | null>(null);

  const group = GROUPS.find((g) => g.id === groupId)!;
  const sort = SORTS.find((s) => s.key === sortKey)!;
  const gSort = SORTS.find((s) => s.key === groupSort)!;

  // ── 기간 → 배율(factor) ──
  let days = 7;
  let rangeLabel = "최근 7일";
  if (rangeKey === "custom") {
    const s = new Date(customStart).getTime();
    const e = new Date(customEnd).getTime();
    const diff = Math.round((e - s) / 86_400_000) + 1;
    days = Number.isFinite(diff) && diff > 0 ? diff : 1;
    rangeLabel = `${customStart} ~ ${customEnd} (${days}일)`;
  } else {
    const preset = RANGES.find((r) => r.key === rangeKey)!;
    days = preset.days;
    rangeLabel = preset.label;
  }
  const factor = days / 7;

  // 네이버 실데이터 불러오기 (기간이 바뀌면 다시 조회)
  useEffect(() => {
    const { since, until } = rangeToDates(rangeKey, customStart, customEnd);
    let cancelled = false;
    setNaverLoading(true);
    setNaverError(null);
    fetch(`/members/jo-kwonil/api/naver?since=${since}&until=${until}`)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (j.ok) setNaver(j as NaverResp);
        else {
          setNaver(null);
          setNaverError(j.error || "네이버 데이터를 불러오지 못했습니다.");
        }
      })
      .catch((e) => {
        if (!cancelled) setNaverError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setNaverLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeKey, customStart, customEnd]);

  const realNaver = naver?.saTotal ?? null;

  // 네이버는 실데이터(기간에 맞춰 API가 반환), 나머지는 샘플을 기간 배율로 스케일
  const data = MEDIA.map((m) =>
    m.key === "naver" && realNaver ? { ...m, ...realNaver } : { ...m, ...scaleM(m, factor) },
  );

  const overviewCreatives = OVERVIEW_CREATIVES.map((c) => ({
    ...c,
    metrics: scaleM(c.metrics, factor),
  }))
    .filter((c) => typeFilter === "all" || c.format === typeFilter)
    .sort((a, b) => sort.calc(b.metrics) - sort.calc(a.metrics))
    .slice(0, 8);

  // ── 콤보 차트 좌표 ──
  const W = 680, H = 340, padL = 60, padR = 20, padT = 28, padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slotW = plotW / data.length;
  const barW = 44;
  const rawMax = Math.max(...data.map((d) => Math.max(d[group.bar.key], d[group.line.key])));
  const axisMax = niceCeil(rawMax);
  const xCenter = (i: number) => padL + slotW * (i + 0.5);
  const y = (v: number) => padT + plotH * (1 - v / axisMax);
  const baseY = padT + plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * axisMax);
  const linePoints = data.map((d, i) => `${xCenter(i)},${y(d[group.line.key])}`).join(" ");

  // ── 상세(드릴다운) 데이터 ──
  const detail = selectedMedia ? getMediaDetail(selectedMedia) : null;

  const rangeBar = (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-400">기간</span>
        <div className="inline-flex flex-wrap rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
          {RANGES.map((r) => {
            const active = r.key === rangeKey;
            return (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                  (active
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200")
                }
              >
                {r.label}
              </button>
            );
          })}
          <button
            onClick={() => setRangeKey("custom")}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
              (rangeKey === "custom"
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200")
            }
          >
            직접 설정
          </button>
        </div>
      </div>
      {rangeKey === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="date"
            value={customStart}
            max={customEnd}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{ colorScheme: "light dark" }}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <span className="text-neutral-400">~</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            onChange={(e) => setCustomEnd(e.target.value)}
            style={{ colorScheme: "light dark" }}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {days}일
          </span>
        </div>
      )}
    </div>
  );

  return (
    <MemberShell slug="jo-kwonil">
      <style>{`
        .viz {
          --surface-1: #fcfcfb; --text-secondary: #52514e; --text-muted: #898781;
          --gridline: #e1e0d9; --baseline: #c3c2b7; --border: rgba(11,11,11,0.10);
          --series-bar: #2a78d6; --series-line: #1baf7a;
        }
        @media (prefers-color-scheme: dark) {
          .viz {
            --surface-1: #1a1a19; --text-secondary: #c3c2b7; --text-muted: #898781;
            --gridline: #2c2c2a; --baseline: #383835; --border: rgba(255,255,255,0.10);
            --series-bar: #3987e5; --series-line: #199e70;
          }
        }
      `}</style>

      <div className="viz">
        {/* ===================== 상세 드릴다운 화면 ===================== */}
        {detail ? (
          <DetailView
            detail={detail}
            factor={factor}
            rangeLabel={rangeLabel}
            groupSort={groupSort}
            setGroupSort={setGroupSort}
            gSort={gSort}
            rangeBar={rangeBar}
            onBack={() => setSelectedMedia(null)}
            real={detail.key === "naver" ? naver : null}
            loading={detail.key === "naver" && naverLoading}
            error={detail.key === "naver" ? naverError : null}
          />
        ) : (
          <>
            {/* ===================== 개요 화면 ===================== */}
            <header className="mb-6">
              <h2 className="text-xl font-bold">📈 광고 성과 대시보드</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                매체별 광고 성과 요약 (샘플 데이터 · MVP) · 매체 카드를 클릭하면 상세 대시보드로 이동합니다.
              </p>
              {rangeBar}
            </header>

            {/* 매체별 요약 카드 (클릭 → 드릴다운) */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMedia(m.key)}
                  className="group rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ background: m.color }} />
                      <h3 className="font-semibold">{m.name}</h3>
                    </div>
                    <span className="flex items-center gap-1.5">
                      {m.key === "naver" && realNaver && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          실데이터
                        </span>
                      )}
                      <span className="text-xs text-neutral-400 transition-colors group-hover:text-blue-500">
                        자세히 →
                      </span>
                    </span>
                  </div>
                  <dl className="mt-4 space-y-2">
                    {METRICS.map((md) => (
                      <div key={md.key} className="flex items-baseline justify-between gap-2">
                        <dt className="text-xs text-neutral-500 dark:text-neutral-400">{md.label}</dt>
                        <dd className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatValue(m[md.key], md.isMoney)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </button>
              ))}
            </section>

            {/* 매체별 비교 콤보 차트 */}
            <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold">매체별 성과 비교</h3>
                <div className="flex flex-wrap gap-1.5">
                  {GROUPS.map((g) => {
                    const active = g.id === groupId;
                    return (
                      <button
                        key={g.id}
                        onClick={() => { setGroupId(g.id); setHovered(null); }}
                        className={
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                          (active ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700")
                        }
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-5 text-xs text-neutral-600 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--series-bar)" }} />
                  {group.bar.name} <span className="text-neutral-400">(막대)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="20" height="10" aria-hidden>
                    <line x1="0" y1="5" x2="20" y2="5" stroke="var(--series-line)" strokeWidth="2" />
                    <circle cx="10" cy="5" r="3.5" fill="var(--series-line)" />
                  </svg>
                  {group.line.name} <span className="text-neutral-400">(꺾은선)</span>
                </span>
              </div>

              <div className="relative mt-2">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} role="img" aria-label={`매체별 ${group.bar.name} 및 ${group.line.name} 비교`}>
                  {ticks.map((t, i) => (
                    <g key={i}>
                      <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={i === 0 ? "var(--baseline)" : "var(--gridline)"} strokeWidth={i === 0 ? 1.5 : 1} />
                      <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(t, group.isMoney)}
                      </text>
                    </g>
                  ))}
                  {data.map((d, i) => {
                    const val = d[group.bar.key];
                    const top = y(val);
                    const dim = hovered !== null && hovered !== i;
                    return (
                      <g key={d.key} opacity={dim ? 0.4 : 1}>
                        <rect x={xCenter(i) - barW / 2} y={top} width={barW} height={Math.max(0, baseY - top)} rx={4} fill="var(--series-bar)" />
                        <text x={xCenter(i)} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-secondary)" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatCompact(val, group.isMoney)}
                        </text>
                      </g>
                    );
                  })}
                  <polyline points={linePoints} fill="none" stroke="var(--series-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {data.map((d, i) => {
                    const val = d[group.line.key];
                    const dim = hovered !== null && hovered !== i;
                    return (
                      <g key={d.key} opacity={dim ? 0.4 : 1}>
                        <circle cx={xCenter(i)} cy={y(val)} r={5} fill="var(--series-line)" stroke="var(--surface-1)" strokeWidth="2" />
                        <text x={xCenter(i)} y={y(val) - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--series-line)" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatCompact(val, group.isMoney)}
                        </text>
                      </g>
                    );
                  })}
                  {data.map((d, i) => (
                    <text key={d.key} x={xCenter(i)} y={H - 16} textAnchor="middle" fontSize="13" fontWeight="500" fill="var(--text-secondary)">
                      {d.name}
                    </text>
                  ))}
                  {data.map((d, i) => (
                    <rect key={d.key} x={padL + slotW * i} y={padT} width={slotW} height={plotH} fill="transparent" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
                  ))}
                </svg>
                {hovered !== null && (() => {
                  const d = data[hovered];
                  return (
                    <div className="pointer-events-none absolute top-1 z-10 w-44 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 shadow-lg" style={{ left: `${(xCenter(hovered) / W) * 100}%` }}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm font-semibold">{d.name}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="text-[var(--text-muted)]">{group.bar.name}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatValue(d[group.bar.key], group.isMoney)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="text-[var(--text-muted)]">{group.line.name}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatValue(d[group.line.key], group.isMoney)}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between gap-2 border-t border-[var(--border)] pt-1.5 text-xs font-medium">
                        <span className="text-[var(--text-muted)]">{group.ratio.name}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{group.ratio.fmt(group.ratio.calc(d))}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <p className="mt-4 text-xs text-neutral-400">
                * &ldquo;기간&rdquo; 토글/직접 설정으로 날짜 범위를, 그래프 위 버튼으로 비교 그룹(같은 단위끼리)을 바꿀 수 있습니다.
              </p>
            </section>

            {/* 고성과 소재 (개요) */}
            <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">🏆 고성과 소재</h3>
                  <p className="mt-1 text-xs text-neutral-400">{rangeLabel} · {sort.label} 기준 정렬 · 상위 8개</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
                    {([{ key: "all", label: "전체" }, { key: "image", label: "🖼️ 이미지" }, { key: "video", label: "🎬 동영상" }] as const).map((t) => {
                      const active = t.key === typeFilter;
                      return (
                        <button key={t.key} onClick={() => setTypeFilter(t.key)} className={"rounded-full px-3 py-1.5 text-xs font-medium transition-colors " + (active ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200")}>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
                    {SORTS.map((s) => {
                      const active = s.key === sortKey;
                      return (
                        <button key={s.key} onClick={() => setSortKey(s.key)} className={"rounded-full px-3 py-1.5 text-xs font-medium transition-colors " + (active ? "bg-blue-600 text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200")}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {overviewCreatives.map((c, i) => {
                  const r = roas(c.metrics);
                  const meta = FORMAT_META[c.format];
                  const isTop = r >= 12;
                  return (
                    <article key={c.id} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl text-2xl" style={{ background: c.format === "video" ? "linear-gradient(135deg,#e0ecfb,#c9def8)" : "linear-gradient(135deg,#d9f3e8,#c4ecd9)" }}>
                        <span>{meta.icon}</span>
                        <span className="mt-0.5 text-[10px] font-medium text-neutral-600">{meta.label}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-neutral-400">#{i + 1}</span>
                              <h4 className="truncate font-semibold">{c.name}</h4>
                            </div>
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.mediaColor }} />{c.media}
                            </span>
                          </div>
                          {isTop && <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">⭐ 고성과</span>}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <Stat label="ROAS" value={r.toFixed(1) + "x"} />
                          <Stat label="CTR" value={ctr(c.metrics).toFixed(2) + "%"} />
                          <Stat label="전환수" value={formatValue(c.metrics.conversions, false)} />
                        </div>
                        <div className="mt-2 flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span>노출 {formatCompact(c.metrics.impressions, false)}</span>
                          <span>비용 {formatCompact(c.metrics.cost, true)}</span>
                          <span>매출 {formatCompact(c.metrics.revenue, true)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {overviewCreatives.length === 0 && <p className="mt-4 text-center text-sm text-neutral-400">해당 유형의 소재가 없습니다.</p>}
            </section>
          </>
        )}
      </div>
    </MemberShell>
  );
}

// 작은 스탯 박스
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 py-1.5 dark:bg-neutral-900">
      <div className="text-[10px] text-neutral-400">{label}</div>
      <div className="text-sm font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

// ===================== 매체 상세(마이크로 대시보드) =====================
function DetailView({
  detail,
  factor,
  rangeLabel,
  groupSort,
  setGroupSort,
  gSort,
  rangeBar,
  onBack,
  real,
  loading,
  error,
}: {
  detail: NonNullable<ReturnType<typeof getMediaDetail>>;
  factor: number;
  rangeLabel: string;
  groupSort: string;
  setGroupSort: (k: string) => void;
  gSort: (typeof SORTS)[number];
  rangeBar: React.ReactNode;
  onBack: () => void;
  real: NaverResp | null;
  loading: boolean;
  error: string | null;
}) {
  const isReal = !!real;
  // 상위 그룹 SA/DA 필터 (뷰 전환은 클라이언트 상태로만 → 즉시 반응)
  const [gTypeFilter, setGTypeFilter] = useState<"all" | "SA" | "DA">("all");

  // SA는 실데이터(있으면), DA는 미연동이라 샘플 유지. 나머지 매체는 전체 샘플.
  const saSample = detail.campaigns.find((c) => c.type === "SA")!;
  const daSample = detail.campaigns.find((c) => c.type === "DA")!;
  const campaigns = [
    {
      type: "SA" as const,
      label: isReal ? "SA 캠페인 (검색광고 · 실데이터)" : "SA 캠페인 (검색광고)",
      metrics: real ? real.saTotal : scaleM(saSample.metrics, factor),
      note: null as string | null,
    },
    {
      type: "DA" as const,
      label: "DA 캠페인 (디스플레이)",
      metrics: scaleM(daSample.metrics, factor),
      note: isReal ? "GFA 미연동 · 샘플" : null,
    },
  ];

  const groupsSrc = real
    ? real.groups.map((g) => ({ id: g.id, name: g.name, type: g.type as CampaignType, metrics: g.metrics }))
    : detail.groups.map((g) => ({ id: g.id, name: g.name, type: g.type, metrics: scaleM(g.metrics, factor) }));
  const groupsFiltered =
    gTypeFilter === "all" ? groupsSrc : groupsSrc.filter((g) => g.type === gTypeFilter);
  const groups = [...groupsFiltered]
    .sort((a, b) => gSort.calc(b.metrics) - gSort.calc(a.metrics))
    .slice(0, 10);
  const maxGroupVal = Math.max(...groups.map((g) => gSort.calc(g.metrics)), 1);

  const keywordsSrc = real
    ? real.keywords.map((k) => ({ id: k.id, keyword: k.keyword, group: k.group, metrics: k.metrics }))
    : detail.keywords.map((k) => ({ ...k, metrics: scaleM(k.metrics, factor) }));
  const keywords = [...keywordsSrc]
    .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
    .slice(0, 8);

  // DA 소재는 항상 샘플 (GFA 미연동)
  const creatives = detail.creatives
    .map((c) => ({ ...c, metrics: scaleM(c.metrics, factor) }))
    .sort((a, b) => roas(b.metrics) - roas(a.metrics));

  // ⚠️ 긴급 알럿: 비용은 썼는데 매출이 없거나 비용보다 적은(ROAS<1) 그룹·키워드
  // (전체 데이터에서 계산 → 상위 랭킹 밖에 숨은 낭비까지 잡아냄, 낭비 비용 큰 순)
  const wasteScore = (m: Metrics) => m.cost - m.revenue; // 순손실(비용-매출)이 클수록 위
  const wasteGroups = groupsSrc
    .filter((g) => isWasteful(g.metrics))
    .sort((a, b) => wasteScore(b.metrics) - wasteScore(a.metrics));
  const wasteKeywords = keywordsSrc
    .filter((k) => isWasteful(k.metrics))
    .sort((a, b) => wasteScore(b.metrics) - wasteScore(a.metrics));
  const wasteTotal =
    wasteGroups.reduce((s, g) => s + g.metrics.cost, 0) +
    wasteKeywords.reduce((s, k) => s + k.metrics.cost, 0);
  const hasWaste = wasteGroups.length > 0 || wasteKeywords.length > 0;

  return (
    // #0 넓은 화면: 공통 MemberShell(max-w-4xl)을 건드리지 않고 상세 뷰만 뷰포트 기준으로 확장
    <div className="relative left-1/2 w-[94vw] max-w-[1320px] -translate-x-1/2">
      <header className="mb-6">
        <button onClick={onBack} className="text-sm text-neutral-500 transition-colors hover:text-blue-600 dark:text-neutral-400">
          ← 전체 대시보드
        </button>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full" style={{ background: detail.color }} />
          <h2 className="text-xl font-bold">{detail.name} 상세 대시보드</h2>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">캠페인 · 그룹 · 키워드/소재 성과</p>
          {loading && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              네이버 실데이터 불러오는 중…
            </span>
          )}
          {isReal && real && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
              ● 네이버 실데이터 · {real.since}~{real.until}
            </span>
          )}
          {error && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" title={error}>
              실데이터 연동 실패 — 샘플 표시
            </span>
          )}
        </div>
        {rangeBar}
      </header>

      {/* 1) 최상단: SA / DA 캠페인별 성과 */}
      <section className="grid gap-4 sm:grid-cols-2">
        {campaigns.map((c) => (
          <article key={c.type} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: TYPE_BADGE[c.type].color }}>
                  {TYPE_BADGE[c.type].label}
                </span>
                <h3 className="font-semibold">{c.label}</h3>
                {c.note && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {c.note}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold" style={{ fontVariantNumeric: "tabular-nums", color: TYPE_BADGE[c.type].color }}>
                ROAS {roasFmt(c.metrics)}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {METRICS.map((md) => (
                <div key={md.key} className="flex items-baseline justify-between gap-2">
                  <dt className="text-xs text-neutral-500 dark:text-neutral-400">{md.label}</dt>
                  <dd className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatValue(c.metrics[md.key], md.isMoney)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>

      {/* 2) 상위 그룹 랭킹 (1~10위) — SA/DA 구분 + 노출·클릭·비용·CPC·CTR */}
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">상위 광고 그룹 (1~10위)</h3>
            <p className="mt-1 text-xs text-neutral-400">{rangeLabel} · {gSort.label} 기준{isReal ? " · 실데이터" : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* #1 SA / DA 구분 필터 (클라이언트 상태 전환 → 즉시 반응) */}
            <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
              {([{ key: "all", label: "전체" }, { key: "SA", label: "SA" }, { key: "DA", label: "DA" }] as const).map((t) => {
                const active = t.key === gTypeFilter;
                const tint = t.key === "SA" ? TYPE_BADGE.SA.color : t.key === "DA" ? TYPE_BADGE.DA.color : undefined;
                return (
                  <button
                    key={t.key}
                    onClick={() => setGTypeFilter(t.key)}
                    className={"rounded-full px-3 py-1.5 text-xs font-medium transition-colors " + (active ? "text-white shadow-sm" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200")}
                    style={active ? { background: tint ?? "#3f3f46" } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
              {SORTS.map((s) => {
                const active = s.key === groupSort;
                return (
                  <button key={s.key} onClick={() => setGroupSort(s.key)} className={"rounded-full px-3 py-1.5 text-xs font-medium transition-colors " + (active ? "bg-blue-600 text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200")}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 컬럼 헤더 (넓은 화면에서만) */}
        <div className="mt-4 hidden items-center gap-3 px-4 pb-1 text-[11px] font-medium text-neutral-400 lg:flex" style={{ fontVariantNumeric: "tabular-nums" }}>
          <span className="w-6 text-center">#</span>
          <span className="w-8">구분</span>
          <span className="min-w-0 flex-1">그룹명</span>
          <span className="w-16 text-right">노출</span>
          <span className="w-14 text-right">클릭</span>
          <span className="w-20 text-right">비용</span>
          <span className="w-16 text-right">CPC</span>
          <span className="w-14 text-right">CTR</span>
          <span className="w-12 text-right">전환</span>
          <span className="w-20 text-right">매출</span>
          <span className="w-14 text-right">ROAS</span>
        </div>

        <div className="space-y-2 lg:mt-0">
          {groups.map((g, i) => {
            const pct = (gSort.calc(g.metrics) / maxGroupVal) * 100;
            const bad = isWasteful(g.metrics); // #2 성과 저조 → 빨간 음영
            return (
              <div key={g.id} className={"relative overflow-hidden rounded-xl border " + (bad ? "border-red-300 dark:border-red-900/70" : "border-neutral-200 dark:border-neutral-800")}>
                <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: bad ? "#e34948" : TYPE_BADGE[g.type].color, opacity: bad ? 0.14 : 0.1 }} />
                <div className="relative flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 text-center text-sm font-bold text-neutral-400">{i + 1}</span>
                  <span className="w-8 rounded px-1.5 py-0.5 text-center text-[10px] font-bold text-white" style={{ background: TYPE_BADGE[g.type].color }}>
                    {g.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{g.name}</span>
                      {bad && (
                        <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-300">
                          {g.metrics.revenue === 0 ? "매출 0" : "저ROAS"}
                        </span>
                      )}
                    </div>
                    {/* 모바일 축약 지표 */}
                    <div className="mt-0.5 text-[11px] text-neutral-400 lg:hidden" style={{ fontVariantNumeric: "tabular-nums" }}>
                      노출 {formatCompact(g.metrics.impressions, false)} · 클릭 {formatCompact(g.metrics.clicks, false)} · 비용 {isFlatRate(g.metrics) ? "정액제" : formatCompact(g.metrics.cost, true)} · CTR {ctrFmt(g.metrics)}
                    </div>
                  </div>
                  <span className="hidden w-16 text-right text-xs text-neutral-500 dark:text-neutral-400 lg:block" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCompact(g.metrics.impressions, false)}</span>
                  <span className="hidden w-14 text-right text-xs text-neutral-500 dark:text-neutral-400 lg:block" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCompact(g.metrics.clicks, false)}</span>
                  <span className="hidden w-20 text-right text-xs font-medium text-neutral-700 dark:text-neutral-200 lg:block" style={{ fontVariantNumeric: "tabular-nums" }} title={isFlatRate(g.metrics) ? FLAT_TITLE : undefined}>{isFlatRate(g.metrics) ? <span className="text-neutral-400">정액제</span> : formatCompact(g.metrics.cost, true)}</span>
                  <span className="hidden w-16 text-right text-xs text-neutral-500 dark:text-neutral-400 lg:block" style={{ fontVariantNumeric: "tabular-nums" }}>{cpcFmt(g.metrics)}</span>
                  <span className="hidden w-14 text-right text-xs text-neutral-500 dark:text-neutral-400 lg:block" style={{ fontVariantNumeric: "tabular-nums" }}>{ctrFmt(g.metrics)}</span>
                  <span className="hidden w-12 text-right text-xs text-neutral-500 dark:text-neutral-400 lg:block" style={{ fontVariantNumeric: "tabular-nums" }}>{formatValue(g.metrics.conversions, false)}</span>
                  <span className="hidden w-20 text-right text-xs font-medium text-neutral-700 dark:text-neutral-200 lg:block" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCompact(g.metrics.revenue, true)}</span>
                  <span className={"w-14 text-right text-sm font-bold " + (bad ? "text-red-600 dark:text-red-400" : "")} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {roasFmt(g.metrics)}
                  </span>
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 py-6 text-center text-sm text-neutral-400 dark:border-neutral-700">
              {gTypeFilter === "DA" && isReal
                ? "DA(디스플레이) 그룹은 GFA 연동 후 표시됩니다."
                : "표시할 그룹이 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 3) SA 키워드 / DA 소재 */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* SA 고성과 키워드 — #3 총비용·매출액만 표시 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: TYPE_BADGE.SA.color }}>SA</span>
            <h3 className="font-semibold">고성과 키워드</h3>
            {isReal && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">실데이터</span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-400">검색광고 · 전환매출 기준 · 총비용 / 매출액</p>
          <div className="mt-3 flex items-center gap-3 px-3 text-[11px] font-medium text-neutral-400">
            <span className="w-5" />
            <span className="min-w-0 flex-1">키워드</span>
            <span className="w-24 text-right">총비용</span>
            <span className="w-24 text-right">매출액</span>
          </div>
          <ol className="mt-1 space-y-2">
            {keywords.map((k, i) => (
              <li key={k.id} className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-950">
                <span className="w-5 text-center text-xs font-bold text-neutral-400">{i + 1}</span>
                <div className="min-w-0 flex-1 truncate text-sm font-medium">{k.keyword}</div>
                <span className="w-24 text-right text-sm text-neutral-600 dark:text-neutral-300" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {isFlatRate(k.metrics) ? <span className="text-xs text-neutral-400" title={FLAT_TITLE}>정액제</span> : formatValue(k.metrics.cost, true)}
                </span>
                <span className="w-24 text-right text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{formatValue(k.metrics.revenue, true)}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* DA 고성과 소재 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: TYPE_BADGE.DA.color }}>DA</span>
            <h3 className="font-semibold">고성과 소재</h3>
            {isReal && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">GFA 미연동 · 샘플</span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-400">디스플레이 · ROAS 기준</p>
          <ol className="mt-4 space-y-2">
            {creatives.map((c, i) => {
              const meta = FORMAT_META[c.format];
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-950">
                  <span className="w-5 text-center text-xs font-bold text-neutral-400">{i + 1}</span>
                  <span className="text-lg" title={meta.label}>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-[11px] text-neutral-400">{c.group} · 클릭 {formatCompact(c.metrics.clicks, false)} · 전환 {formatValue(c.metrics.conversions, false)}</div>
                  </div>
                  <span className="text-sm font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{roasFmt(c.metrics)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 4) 🚨 긴급 알럿 — 비용은 썼는데 매출이 없거나 비용보다 적은(ROAS<1) 그룹·키워드 */}
      <section className={"mt-8 rounded-2xl border p-6 shadow-sm " + (hasWaste ? "border-red-300 bg-red-50/70 dark:border-red-900/70 dark:bg-red-950/30" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900")}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{hasWaste ? "🚨" : "✅"}</span>
            <h3 className={"font-semibold " + (hasWaste ? "text-red-700 dark:text-red-300" : "")}>
              긴급 점검 — 비용 대비 성과 저조
            </h3>
          </div>
          {hasWaste && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-300">
              낭비 추정 {formatCompact(wasteTotal, true)} · {wasteGroups.length + wasteKeywords.length}건
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          매출 0이거나 매출보다 비용을 더 쓴(ROAS 1x 미만) 항목입니다. 입찰가·키워드 재점검이 필요합니다. ({rangeLabel})
        </p>

        {!hasWaste ? (
          <p className="mt-4 rounded-xl border border-dashed border-neutral-300 py-6 text-center text-sm text-neutral-400 dark:border-neutral-700">
            현재 기간에 비용 대비 성과가 저조한 그룹·키워드가 없습니다. 👍
          </p>
        ) : (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* 낭비 그룹 */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">광고 그룹 {wasteGroups.length > 0 && `(${wasteGroups.length})`}</h4>
              {wasteGroups.length === 0 ? (
                <p className="rounded-lg bg-white/60 px-3 py-3 text-xs text-neutral-400 dark:bg-neutral-900/40">해당 그룹 없음</p>
              ) : (
                <ul className="space-y-2">
                  {wasteGroups.slice(0, 8).map((g) => (
                    <li key={g.id} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 dark:border-red-900/60 dark:bg-neutral-950">
                      <span className="w-7 rounded px-1 py-0.5 text-center text-[10px] font-bold text-white" style={{ background: TYPE_BADGE[g.type].color }}>{g.type}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{g.name}</span>
                      <span className="text-right text-xs text-neutral-500 dark:text-neutral-400" style={{ fontVariantNumeric: "tabular-nums" }}>
                        비용 <b className="text-red-600 dark:text-red-400">{formatCompact(g.metrics.cost, true)}</b> · 매출 {formatCompact(g.metrics.revenue, true)}
                      </span>
                      <span className="w-12 text-right text-sm font-bold text-red-600 dark:text-red-400" style={{ fontVariantNumeric: "tabular-nums" }}>{roasFmt(g.metrics)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* 낭비 키워드 */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">SA 키워드 {wasteKeywords.length > 0 && `(${wasteKeywords.length})`}</h4>
              {wasteKeywords.length === 0 ? (
                <p className="rounded-lg bg-white/60 px-3 py-3 text-xs text-neutral-400 dark:bg-neutral-900/40">해당 키워드 없음</p>
              ) : (
                <ul className="space-y-2">
                  {wasteKeywords.slice(0, 8).map((k) => (
                    <li key={k.id} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 dark:border-red-900/60 dark:bg-neutral-950">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{k.keyword}</span>
                      <span className="text-right text-xs text-neutral-500 dark:text-neutral-400" style={{ fontVariantNumeric: "tabular-nums" }}>
                        비용 <b className="text-red-600 dark:text-red-400">{formatCompact(k.metrics.cost, true)}</b> · 매출 {formatCompact(k.metrics.revenue, true)}
                      </span>
                      <span className="w-12 text-right text-sm font-bold text-red-600 dark:text-red-400" style={{ fontVariantNumeric: "tabular-nums" }}>{roasFmt(k.metrics)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
