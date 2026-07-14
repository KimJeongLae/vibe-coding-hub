import crypto from "crypto";

// 네이버 검색광고(SA) API 서버 라우트.
// 키는 서버 환경변수에서만 읽고, 브라우저로는 결과(성과 숫자)만 내려줍니다.
// URL: /members/jo-kwonil/api/naver?since=YYYY-MM-DD&until=YYYY-MM-DD

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://api.searchad.naver.com";

type Metrics = {
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
};

const ZERO: Metrics = { cost: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };

function sign(ts: string, method: string, path: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(`${ts}.${method}.${path}`).digest("base64");
}

function creds() {
  const apiKey = process.env.NAVER_SA_API_KEY;
  const secret = process.env.NAVER_SA_SECRET_KEY;
  const customer = process.env.NAVER_SA_CUSTOMER_ID;
  if (!apiKey || !secret || !customer) throw new Error("네이버 API 키가 .env.local 에 설정되지 않았습니다.");
  return { apiKey, secret, customer };
}

// path 는 서명용(쿼리 제외), search 는 실제 요청 쿼리스트링
async function naverGet<T>(path: string, search?: URLSearchParams): Promise<T> {
  const { apiKey, secret, customer } = creds();
  const ts = Date.now().toString();
  const signature = sign(ts, "GET", path, secret);
  const url = BASE + path + (search && [...search].length ? `?${search.toString()}` : "");
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Timestamp": ts,
      "X-API-KEY": apiKey,
      "X-Customer": String(customer),
      "X-Signature": signature,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 API ${path} 실패 (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

const FIELDS = '["impCnt","clkCnt","salesAmt","ccnt","convAmt"]';

type StatRow = {
  id: string;
  impCnt?: number;
  clkCnt?: number;
  salesAmt?: number;
  ccnt?: number;
  convAmt?: number;
};

function toMetrics(r?: StatRow): Metrics {
  if (!r) return { ...ZERO };
  return {
    cost: Number(r.salesAmt ?? 0),
    impressions: Number(r.impCnt ?? 0),
    clicks: Number(r.clkCnt ?? 0),
    conversions: Number(r.ccnt ?? 0),
    revenue: Number(r.convAmt ?? 0),
  };
}

function addMetrics(a: Metrics, b: Metrics): Metrics {
  return {
    cost: a.cost + b.cost,
    impressions: a.impressions + b.impressions,
    clicks: a.clicks + b.clicks,
    conversions: a.conversions + b.conversions,
    revenue: a.revenue + b.revenue,
  };
}

// 여러 id 의 통계를 한 번에 조회 (id 별 row 반환)
async function getStats(ids: string[], since: string, until: string): Promise<Record<string, Metrics>> {
  const out: Record<string, Metrics> = {};
  if (ids.length === 0) return out;
  // Naver /stats 는 한 번에 여러 id 를 받습니다.
  const search = new URLSearchParams();
  search.set("ids", ids.join(","));
  search.set("fields", FIELDS);
  search.set("timeRange", JSON.stringify({ since, until }));
  const json = await naverGet<{ data: StatRow[] }>("/stats", search);
  for (const row of json.data ?? []) out[row.id] = toMetrics(row);
  return out;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const today = new Date();
  const until = searchParams.get("until") || ymd(today);
  const since =
    searchParams.get("since") || ymd(new Date(today.getTime() - 6 * 86_400_000));

  try {
    // 1) 캠페인 (검색광고 상품은 모두 SA)
    const campaigns = await naverGet<
      { nccCampaignId: string; name: string; campaignTp: string }[]
    >("/ncc/campaigns");

    const campaignIds = campaigns.map((c) => c.nccCampaignId);
    const campaignStats = await getStats(campaignIds, since, until);

    // 2) 광고그룹 (그룹 랭킹용)
    const adgroupsNested = await Promise.all(
      campaigns.map((c) => {
        const s = new URLSearchParams();
        s.set("nccCampaignId", c.nccCampaignId);
        return naverGet<{ nccAdgroupId: string; name: string; nccCampaignId: string }[]>(
          "/ncc/adgroups",
          s,
        ).catch(() => []);
      }),
    );
    const adgroups = adgroupsNested.flat();
    const adgroupStats = await getStats(
      adgroups.map((g) => g.nccAdgroupId),
      since,
      until,
    );

    const groups = adgroups
      .map((g) => ({
        id: g.nccAdgroupId,
        name: g.name,
        type: "SA" as const,
        metrics: adgroupStats[g.nccAdgroupId] ?? { ...ZERO },
      }))
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue || b.metrics.clicks - a.metrics.clicks);

    // 3) 상위 그룹 3개의 키워드
    const topGroups = groups.slice(0, 3);
    const keywordsNested = await Promise.all(
      topGroups.map((g) => {
        const s = new URLSearchParams();
        s.set("nccAdgroupId", g.id);
        return naverGet<{ nccKeywordId: string; keyword: string; nccAdgroupId: string }[]>(
          "/ncc/keywords",
          s,
        )
          .then((ks) => ks.map((k) => ({ ...k, groupName: g.name })))
          .catch(() => []);
      }),
    );
    const kwList = keywordsNested.flat();
    const keywordStats = await getStats(
      kwList.map((k) => k.nccKeywordId),
      since,
      until,
    );
    const keywords = kwList
      .map((k) => ({
        id: k.nccKeywordId,
        keyword: k.keyword,
        group: k.groupName,
        metrics: keywordStats[k.nccKeywordId] ?? { ...ZERO },
      }))
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue);

    // SA 캠페인 총합
    const saTotal = campaignIds.reduce(
      (acc, id) => addMetrics(acc, campaignStats[id] ?? { ...ZERO }),
      { ...ZERO },
    );

    return Response.json({
      ok: true,
      since,
      until,
      saTotal,
      campaigns: campaigns.map((c) => ({
        id: c.nccCampaignId,
        name: c.name,
        tp: c.campaignTp,
        metrics: campaignStats[c.nccCampaignId] ?? { ...ZERO },
      })),
      groups: groups.slice(0, 10),
      keywords: keywords.slice(0, 8),
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), since, until },
      { status: 500 },
    );
  }
}
