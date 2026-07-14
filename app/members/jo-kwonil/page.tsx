"use client";

import { useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "jo-kwonil"(조권일) 님의 페이지 — 광고 성과 대시보드 MVP.
// 실제 데이터 수집/API 연동 없이, 아래 샘플 숫자만으로 화면을 그립니다.
// 아래 MEDIA 값은 "최근 7일" 기준이며, 날짜 토글로 기간에 맞춰 스케일됩니다.

type Media = {
  key: string;
  name: string;
  color: string; // 카드용 매체 색상 (categorical)
  cost: number; // 총비용 (원)
  impressions: number; // 노출수
  clicks: number; // 클릭수
  conversions: number; // 전환수
  revenue: number; // 전환매출액 (원)
};

// 📊 샘플 데이터 ("최근 7일" 기준, 코드에 직접 입력)
const MEDIA: Media[] = [
  {
    key: "naver",
    name: "네이버",
    color: "#2a78d6",
    cost: 3_200_000,
    impressions: 1_250_000,
    clicks: 42_000,
    conversions: 1_850,
    revenue: 28_500_000,
  },
  {
    key: "google",
    name: "구글",
    color: "#1baf7a",
    cost: 4_500_000,
    impressions: 2_100_000,
    clicks: 68_000,
    conversions: 2_400,
    revenue: 41_000_000,
  },
  {
    key: "meta",
    name: "메타",
    color: "#eda100",
    cost: 2_800_000,
    impressions: 3_400_000,
    clicks: 55_000,
    conversions: 1_500,
    revenue: 22_000_000,
  },
  {
    key: "kakao",
    name: "카카오",
    color: "#e34948",
    cost: 1_600_000,
    impressions: 780_000,
    clicks: 21_000,
    conversions: 720,
    revenue: 9_800_000,
  },
];

type MetricKey = "cost" | "impressions" | "clicks" | "conversions" | "revenue";

const METRICS: { key: MetricKey; label: string; isMoney: boolean }[] = [
  { key: "cost", label: "총비용", isMoney: true },
  { key: "impressions", label: "노출수", isMoney: false },
  { key: "clicks", label: "클릭수", isMoney: false },
  { key: "conversions", label: "전환수", isMoney: false },
  { key: "revenue", label: "전환매출액", isMoney: true },
];

// 📅 날짜 토글 (샘플 데이터라 기간 비율로 스케일)
const RANGES: { key: string; label: string; days: number }[] = [
  { key: "today", label: "오늘", days: 1 },
  { key: "7d", label: "최근 7일", days: 7 },
  { key: "30d", label: "최근 30일", days: 30 },
  { key: "90d", label: "최근 90일", days: 90 },
];

// 🔀 비교 그룹 (같은 단위끼리 묶어 막대+꺾은선 콤보로 표시 — 이중축 지양)
type Group = {
  id: string;
  label: string;
  isMoney: boolean;
  bar: { key: MetricKey; name: string };
  line: { key: MetricKey; name: string };
  ratio: { name: string; calc: (m: Media) => number; fmt: (x: number) => string };
};

const GROUPS: Group[] = [
  {
    id: "revenue",
    label: "비용 · 매출",
    isMoney: true,
    bar: { key: "cost", name: "총비용" },
    line: { key: "revenue", name: "전환매출액" },
    ratio: {
      name: "ROAS",
      calc: (m) => m.revenue / m.cost,
      fmt: (x) => x.toFixed(1) + "x",
    },
  },
  {
    id: "traffic",
    label: "노출 · 클릭",
    isMoney: false,
    bar: { key: "impressions", name: "노출수" },
    line: { key: "clicks", name: "클릭수" },
    ratio: {
      name: "CTR",
      calc: (m) => (m.clicks / m.impressions) * 100,
      fmt: (x) => x.toFixed(2) + "%",
    },
  },
  {
    id: "funnel",
    label: "클릭 · 전환",
    isMoney: false,
    bar: { key: "clicks", name: "클릭수" },
    line: { key: "conversions", name: "전환수" },
    ratio: {
      name: "전환율",
      calc: (m) => (m.conversions / m.clicks) * 100,
      fmt: (x) => x.toFixed(2) + "%",
    },
  },
];

// 전체 표기 (카드용)
function formatValue(value: number, isMoney: boolean): string {
  if (isMoney) return "₩" + Math.round(value).toLocaleString("ko-KR");
  return Math.round(value).toLocaleString("ko-KR");
}

// 축약 표기 (그래프 축/라벨용) — 억/만 단위
function formatCompact(value: number, isMoney: boolean): string {
  const sign = isMoney ? "₩" : "";
  const v = Math.round(value);
  if (v >= 100_000_000)
    return sign + (v / 100_000_000).toFixed(1).replace(/\.0$/, "") + "억";
  if (v >= 10_000)
    return sign + Math.round(v / 10_000).toLocaleString("ko-KR") + "만";
  return sign + v.toLocaleString("ko-KR");
}

// 축 최댓값을 보기 좋은 값으로 올림 (1·2·2.5·5·10 × 10ⁿ)
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const f = v / base;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * base;
}

export default function Page() {
  const [rangeKey, setRangeKey] = useState("7d");
  const [groupId, setGroupId] = useState("revenue");
  const [hovered, setHovered] = useState<number | null>(null);

  const range = RANGES.find((r) => r.key === rangeKey)!;
  const group = GROUPS.find((g) => g.id === groupId)!;
  const factor = range.days / 7; // 기준(7일) 대비 배율

  // 기간에 맞춰 스케일된 데이터
  const data = MEDIA.map((m) => ({
    ...m,
    cost: m.cost * factor,
    impressions: m.impressions * factor,
    clicks: m.clicks * factor,
    conversions: m.conversions * factor,
    revenue: m.revenue * factor,
  }));

  // ── 콤보 차트 좌표 계산 ──
  const W = 680;
  const H = 340;
  const padL = 60;
  const padR = 20;
  const padT = 28;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slotW = plotW / data.length;
  const barW = 44;

  const rawMax = Math.max(
    ...data.map((d) => Math.max(d[group.bar.key], d[group.line.key])),
  );
  const axisMax = niceCeil(rawMax);

  const xCenter = (i: number) => padL + slotW * (i + 0.5);
  const y = (v: number) => padT + plotH * (1 - v / axisMax);
  const baseY = padT + plotH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * axisMax);
  const linePoints = data
    .map((d, i) => `${xCenter(i)},${y(d[group.line.key])}`)
    .join(" ");

  return (
    <MemberShell slug="jo-kwonil">
      {/* 로컬 CSS 변수: 라이트/다크 모드 대응 (dataviz 팔레트) */}
      <style>{`
        .viz {
          --surface-1: #fcfcfb;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --gridline: #e1e0d9;
          --baseline: #c3c2b7;
          --border: rgba(11,11,11,0.10);
          --series-bar: #2a78d6;
          --series-line: #1baf7a;
        }
        @media (prefers-color-scheme: dark) {
          .viz {
            --surface-1: #1a1a19;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --baseline: #383835;
            --border: rgba(255,255,255,0.10);
            --series-bar: #3987e5;
            --series-line: #199e70;
          }
        }
      `}</style>

      <div className="viz">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">📈 광고 성과 대시보드</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              매체별 광고 성과 요약 (샘플 데이터 · MVP)
            </p>
          </div>

          {/* 날짜 설정 토글 */}
          <div>
            <span className="mb-1.5 block text-right text-xs text-neutral-400">
              기간
            </span>
            <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
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
            </div>
          </div>
        </header>

        {/* 상단: 매체별 요약 카드 */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((m) => (
            <article
              key={m.key}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: m.color }}
                />
                <h3 className="font-semibold">{m.name}</h3>
              </div>

              <dl className="mt-4 space-y-2">
                {METRICS.map((metricDef) => (
                  <div
                    key={metricDef.key}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                      {metricDef.label}
                    </dt>
                    <dd
                      className="text-sm font-semibold"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatValue(m[metricDef.key], metricDef.isMoney)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>

        {/* 하단: 매체별 비교 콤보 차트 (막대 + 꺾은선) */}
        <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">매체별 성과 비교</h3>

            {/* 비교 그룹 선택 (같은 단위끼리) */}
            <div className="flex flex-wrap gap-1.5">
              {GROUPS.map((g) => {
                const active = g.id === groupId;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGroupId(g.id);
                      setHovered(null);
                    }}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                      (active
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700")
                    }
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex items-center gap-5 text-xs text-neutral-600 dark:text-neutral-300">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-[3px]"
                style={{ background: "var(--series-bar)" }}
              />
              {group.bar.name} <span className="text-neutral-400">(막대)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="20" height="10" aria-hidden>
                <line
                  x1="0"
                  y1="5"
                  x2="20"
                  y2="5"
                  stroke="var(--series-line)"
                  strokeWidth="2"
                />
                <circle cx="10" cy="5" r="3.5" fill="var(--series-line)" />
              </svg>
              {group.line.name}{" "}
              <span className="text-neutral-400">(꺾은선)</span>
            </span>
          </div>

          {/* 콤보 차트 (SVG) */}
          <div className="relative mt-2">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: "auto" }}
              role="img"
              aria-label={`매체별 ${group.bar.name} 및 ${group.line.name} 비교`}
            >
              {/* 가로 그리드라인 + 축 값 */}
              {ticks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={y(t)}
                    x2={W - padR}
                    y2={y(t)}
                    stroke={i === 0 ? "var(--baseline)" : "var(--gridline)"}
                    strokeWidth={i === 0 ? 1.5 : 1}
                  />
                  <text
                    x={padL - 8}
                    y={y(t) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--text-muted)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCompact(t, group.isMoney)}
                  </text>
                </g>
              ))}

              {/* 막대 */}
              {data.map((d, i) => {
                const val = d[group.bar.key];
                const top = y(val);
                const dim = hovered !== null && hovered !== i;
                return (
                  <g key={d.key} opacity={dim ? 0.4 : 1}>
                    <rect
                      x={xCenter(i) - barW / 2}
                      y={top}
                      width={barW}
                      height={Math.max(0, baseY - top)}
                      rx={4}
                      fill="var(--series-bar)"
                    />
                    <text
                      x={xCenter(i)}
                      y={top - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--text-secondary)"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatCompact(val, group.isMoney)}
                    </text>
                  </g>
                );
              })}

              {/* 꺾은선 */}
              <polyline
                points={linePoints}
                fill="none"
                stroke="var(--series-line)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.map((d, i) => {
                const val = d[group.line.key];
                const dim = hovered !== null && hovered !== i;
                return (
                  <g key={d.key} opacity={dim ? 0.4 : 1}>
                    <circle
                      cx={xCenter(i)}
                      cy={y(val)}
                      r={5}
                      fill="var(--series-line)"
                      stroke="var(--surface-1)"
                      strokeWidth="2"
                    />
                    <text
                      x={xCenter(i)}
                      y={y(val) - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--series-line)"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatCompact(val, group.isMoney)}
                    </text>
                  </g>
                );
              })}

              {/* x축 매체 이름 */}
              {data.map((d, i) => (
                <text
                  key={d.key}
                  x={xCenter(i)}
                  y={H - 16}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="500"
                  fill="var(--text-secondary)"
                >
                  {d.name}
                </text>
              ))}

              {/* 호버 감지 영역 */}
              {data.map((d, i) => (
                <rect
                  key={d.key}
                  x={padL + slotW * i}
                  y={padT}
                  width={slotW}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </svg>

            {/* 호버 툴팁 */}
            {hovered !== null &&
              (() => {
                const d = data[hovered];
                return (
                  <div
                    className="pointer-events-none absolute top-1 z-10 w-44 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 shadow-lg"
                    style={{ left: `${(xCenter(hovered) / W) * 100}%` }}
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="text-sm font-semibold">{d.name}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="text-[var(--text-muted)]">
                        {group.bar.name}
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatValue(d[group.bar.key], group.isMoney)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="text-[var(--text-muted)]">
                        {group.line.name}
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatValue(d[group.line.key], group.isMoney)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex justify-between gap-2 border-t border-[var(--border)] pt-1.5 text-xs font-medium">
                      <span className="text-[var(--text-muted)]">
                        {group.ratio.name}
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {group.ratio.fmt(group.ratio.calc(d))}
                      </span>
                    </div>
                  </div>
                );
              })()}
          </div>

          <p className="mt-4 text-xs text-neutral-400">
            * 상단 &ldquo;기간&rdquo; 토글로 날짜 범위를, 그래프 위 버튼으로 비교
            그룹(같은 단위끼리)을 바꿀 수 있습니다. 막대/점에 마우스를 올리면 상세
            수치가 표시됩니다.
          </p>
        </section>
      </div>
    </MemberShell>
  );
}
