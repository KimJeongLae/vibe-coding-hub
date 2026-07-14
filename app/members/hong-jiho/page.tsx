"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MemberShell from "@/components/MemberShell";

// 📦 "hong-jiho" 님의 페이지 — 제품별 재고 관리 & 소진 예측 MVP
//
// 사용 방법
//  1) 피디온 관리자에서 재고를 엑셀(.xlsx) 또는 CSV 로 내려받습니다.
//  2) 아래에 그 파일을 업로드하면,
//     - 파일 안의 재고량으로 "현재고" 를 맞추고,
//     - 파일에 적힌 날짜(날짜 열 / 상단 표기 / 파일명)를 인식해 그 날짜 열로 쌓습니다.
//       (날짜를 못 찾으면 화면에서 고른 "기준 날짜" 를 사용합니다.)
//  3) 여러 날짜가 쌓이면 하루 평균 소진량으로 "소진까지 며칠" 을 계산해 줍니다.
//
//  * 데이터는 이 브라우저(localStorage)에 저장됩니다. (외부 라이브러리/서버 없이 동작)
//  * 피디온 공식 API 가 확인되면 이 업로드 부분만 API 호출로 바꾸면 됩니다.

const SLUG = "hong-jiho";
const STORAGE_KEY = `inventory:${SLUG}`;

// 하루 스냅샷: 날짜 + 제품별 현재고(stock) + 제품별 일일 출고량(out)
//  - stock: '현재재고' 열 (표에 일별로 표시 / 현재고 계산)
//  - out:   '평균일일배송수량' 등 일일 출고량 (소진 예측 계산에 사용)
type Snapshot = {
  date: string;
  stock: Record<string, number>;
  out: Record<string, number>;
};

// ── 헤더 키워드 ─────────────────────────────────────────────
// 헤더 행을 찾을 때 쓰는 키워드 (열 선택은 아래 score* 함수가 담당)
const NAME_KEYS = ["제품", "상품", "품명", "품목", "name", "product"];
const QTY_KEYS = ["재고", "수량", "현재고", "잔량", "stock", "qty"];

// ── CSV 파싱 (따옴표/줄바꿈 처리) ─────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, ""); // BOM 제거
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

// UTF-8 로 먼저 읽고, 깨지면(한글 CMS 는 EUC-KR 인 경우가 많음) EUC-KR 로 재시도
async function readTextSmart(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let text = new TextDecoder("utf-8").decode(buf);
  if (text.includes("�")) {
    try {
      text = new TextDecoder("euc-kr").decode(buf);
    } catch {
      /* euc-kr 미지원이면 utf-8 유지 */
    }
  }
  return text;
}

// ── 최소 XLSX(zip) 리더 — 외부 라이브러리 없이 브라우저 내장 기능만 사용 ──
function u16(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8);
}
function u32(b: Uint8Array, o: number) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const copy = new Uint8Array(data.byteLength); // ArrayBuffer 기반으로 복사 (BlobPart 타입 충족)
  copy.set(data);
  const stream = new Blob([copy]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  // End Of Central Directory 찾기
  let eocd = -1;
  const min = Math.max(0, bytes.length - 22 - 65536);
  for (let i = bytes.length - 22; i >= min; i--) {
    if (u32(bytes, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("올바른 xlsx(zip) 파일이 아닙니다.");
  const count = u16(bytes, eocd + 10);
  let off = u32(bytes, eocd + 16);
  const out = new Map<string, Uint8Array>();
  for (let n = 0; n < count && u32(bytes, off) === 0x02014b50; n++) {
    const method = u16(bytes, off + 10);
    const compSize = u32(bytes, off + 20);
    const nameLen = u16(bytes, off + 28);
    const extraLen = u16(bytes, off + 30);
    const commentLen = u16(bytes, off + 32);
    const localOff = u32(bytes, off + 42);
    const name = new TextDecoder().decode(
      bytes.subarray(off + 46, off + 46 + nameLen),
    );
    const lNameLen = u16(bytes, localOff + 26);
    const lExtraLen = u16(bytes, localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const comp = bytes.subarray(dataStart, dataStart + compSize);
    if (method === 0) out.set(name, comp);
    else if (method === 8) out.set(name, await inflateRaw(comp));
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
function colToIndex(ref: string): number {
  const m = ref.match(/^([A-Z]+)/);
  let idx = 0;
  if (m) for (const ch of m[1]) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}
function parseSharedStrings(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagName("si")).map((si) =>
    Array.from(si.getElementsByTagName("t"))
      .map((t) => t.textContent ?? "")
      .join(""),
  );
}
function parseSheet(xml: string, shared: string[]): string[][] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const grid: string[][] = [];
  for (const rowEl of Array.from(doc.getElementsByTagName("row"))) {
    const row: string[] = [];
    for (const c of Array.from(rowEl.getElementsByTagName("c"))) {
      const ci = colToIndex(c.getAttribute("r") ?? "");
      const t = c.getAttribute("t");
      let val = "";
      if (t === "s") {
        const i = Number(c.getElementsByTagName("v")[0]?.textContent);
        val = Number.isFinite(i) ? (shared[i] ?? "") : "";
      } else if (t === "inlineStr" || t === "str") {
        val = Array.from(c.getElementsByTagName("t"))
          .map((x) => x.textContent ?? "")
          .join("");
      } else {
        val = c.getElementsByTagName("v")[0]?.textContent ?? "";
      }
      if (ci >= 0) row[ci] = val;
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = "";
    grid.push(row);
  }
  return grid;
}
async function parseXlsx(file: File): Promise<string[][]> {
  if (typeof DecompressionStream === "undefined")
    throw new Error(
      "이 브라우저는 xlsx 자동 변환을 지원하지 않습니다. CSV 로 저장해서 올려주세요.",
    );
  const files = await unzip(new Uint8Array(await file.arrayBuffer()));
  const dec = new TextDecoder("utf-8");
  const sharedBuf = files.get("xl/sharedStrings.xml");
  const shared = sharedBuf ? parseSharedStrings(dec.decode(sharedBuf)) : [];
  let sheetKey = "xl/worksheets/sheet1.xml";
  if (!files.has(sheetKey)) {
    const cand = Array.from(files.keys())
      .filter((k) => /^xl\/worksheets\/sheet.*\.xml$/.test(k))
      .sort()[0];
    if (cand) sheetKey = cand;
  }
  const sheetBuf = files.get(sheetKey);
  if (!sheetBuf) throw new Error("엑셀에서 워크시트를 찾지 못했습니다.");
  return parseSheet(dec.decode(sheetBuf), shared);
}

// ── 날짜 파싱 (문자열 / 엑셀 시리얼 숫자 모두) ─────────────────
function pad(n: string | number) {
  return String(n).padStart(2, "0");
}
function parseAnyDate(v: string): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  const m = s.match(/(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 80000) {
      // 엑셀 날짜 시리얼(1899-12-30 기준)
      return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86_400_000)
        .toISOString()
        .slice(0, 10);
    }
  }
  return null;
}

// ── 표 → 스냅샷 변환 (헤더/열/날짜 자동 감지) ────────────────
type BuildResult =
  | { ok: true; snapshots: Snapshot[]; products: number; dateFromFile: boolean }
  | { ok: false; error: string };

function includesAny(cell: string, keys: string[]) {
  const c = cell.trim().toLowerCase();
  return keys.some((k) => c.includes(k.toLowerCase()));
}

// 여러 후보 열 중 "가장 적합한" 열을 점수로 선택.
// (예: 배송수량·평균일일배송수량·현재재고 가 함께 있을 때 현재재고 를 골라야 함)
function bestColumn(header: string[], score: (h: string) => number) {
  let best = -1;
  let bestScore = 0;
  header.forEach((h, i) => {
    const s = score(h ?? "");
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return best;
}
function scoreName(h: string) {
  const c = h.trim().toLowerCase();
  if (c.includes("상품명") || c.includes("제품명") || c.includes("품명")) return 5;
  if (c.includes("품목")) return 4;
  if (c.includes("상품") || c.includes("제품") || c.includes("product")) return 3;
  if (c === "name") return 3;
  return 0;
}
function scoreQty(h: string) {
  const c = h.trim().toLowerCase();
  if (c.includes("현재재고") || c.includes("현재고")) return 6; // 최우선
  if (c.includes("가용재고") || c.includes("재고량")) return 5;
  if (c.includes("재고") || c.includes("잔량") || c === "stock") return 4;
  if (c.includes("수량") || c === "qty") return 1; // 배송수량 등은 최하위
  return 0;
}
function scoreDate(h: string) {
  const c = h.trim().toLowerCase();
  if (c.includes("날짜") || c.includes("일자") || c.includes("기준일")) return 3;
  if (c.includes("date")) return 3;
  return 0;
}
// 일일 출고량(소비량) 열 선택. '평균일일배송수량' 을 최우선으로,
// '배송수량구분' 같은 구분/텍스트 열은 제외.
function scoreShipped(h: string) {
  const c = h.trim().toLowerCase().replace(/[\s()]/g, "");
  if (c.includes("구분")) return 0;
  if (c.includes("평균") && c.includes("배송")) return 6; // 평균일일배송수량
  if (c.includes("평균일일")) return 6;
  if (c === "배송수량" || c === "배송수량전체") return 5;
  if (c.includes("출고수량") || c.includes("판매수량")) return 5;
  if (c.includes("배송수량") || c.includes("출고량") || c.includes("판매량")) return 4;
  if (c.includes("출고") || c.includes("판매")) return 2;
  return 0;
}

function buildSnapshots(
  grid: string[][],
  fallbackDate: string,
  fileName: string,
): BuildResult {
  const rows = grid.filter((r) => r.some((c) => (c ?? "").trim() !== ""));
  if (rows.length === 0) return { ok: false, error: "파일이 비어 있습니다." };

  // 헤더 행 찾기 (앞쪽 20줄 안에서 키워드가 있는 첫 줄)
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    if (rows[i].some((c) => includesAny(c, [...NAME_KEYS, ...QTY_KEYS]))) {
      headerRow = i;
      break;
    }
  }
  const header = headerRow >= 0 ? rows[headerRow] : rows[0];
  const dataRows = headerRow >= 0 ? rows.slice(headerRow + 1) : rows;
  const aboveRows = headerRow >= 0 ? rows.slice(0, headerRow) : [];

  let nameIdx = bestColumn(header, scoreName);
  let qtyIdx = bestColumn(header, scoreQty);
  const dateIdx = bestColumn(header, scoreDate);
  const outIdx = bestColumn(header, scoreShipped); // 일일 출고량 (없으면 -1)
  if (nameIdx === -1) nameIdx = 0;
  if (qtyIdx === -1) qtyIdx = header.length > 1 ? 1 : 0;

  // 파일에서 날짜 힌트 찾기 (헤더 위쪽 셀들 → 파일명)
  let bannerDate: string | null = null;
  for (const r of [...aboveRows, header]) {
    for (const cell of r) {
      const d = parseAnyDate(cell);
      if (d) {
        bannerDate = d;
        break;
      }
    }
    if (bannerDate) break;
  }
  if (!bannerDate) bannerDate = parseAnyDate(fileName);

  const singleDate = bannerDate || fallbackDate;
  const byDate = new Map<
    string,
    { stock: Record<string, number>; out: Record<string, number> }
  >();
  let usedFileDate = false;

  const num = (raw: string) => {
    const cleaned = (raw ?? "").replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return cleaned === "" || !Number.isFinite(n) ? null : n;
  };

  const SKIP_NAMES = ["합계", "총계", "소계", "total", "sum"]; // 요약 행 제외
  for (const r of dataRows) {
    const name = (r[nameIdx] ?? "").trim();
    if (!name || includesAny(name, SKIP_NAMES)) continue;
    const stock = num(r[qtyIdx] ?? "");
    if (stock === null) continue; // 재고량 없는 행은 스킵
    const out = outIdx >= 0 ? num(r[outIdx] ?? "") : null;

    let d = singleDate;
    if (dateIdx >= 0) {
      const pd = parseAnyDate(r[dateIdx] ?? "");
      if (pd) {
        d = pd;
        usedFileDate = true;
      }
    }
    if (!d) return { ok: false, error: "날짜를 찾지 못했습니다. 기준 날짜를 선택해주세요." };

    if (!byDate.has(d)) byDate.set(d, { stock: {}, out: {} });
    const bucket = byDate.get(d)!;
    bucket.stock[name] = stock; // 같은 이름은 마지막 값 사용
    if (out !== null) bucket.out[name] = out;
  }

  const snapshots = Array.from(byDate, ([date, v]) => ({
    date,
    stock: v.stock,
    out: v.out,
  }));
  if (snapshots.length === 0)
    return {
      ok: false,
      error:
        "제품/재고 데이터를 찾지 못했습니다. 제품명·재고량 열이 있는지 확인해주세요.",
    };
  const products = new Set(snapshots.flatMap((s) => Object.keys(s.stock))).size;
  return {
    ok: true,
    snapshots,
    products,
    dateFromFile: usedFileDate || bannerDate !== null,
  };
}

// ── 소진 지표 계산 ─────────────────────────────────────────
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
function addDays(date: string, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function weekday(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").getUTCDay(); // 0=일 … 1=월 … 6=토
}
function shiftDate(dateStr: string, delta: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
type Metric = {
  current: number;
  avgDaily: number | null;
  daysLeft: number | null;
  depletionDate: string | null;
  basis: "out" | "stock" | null; // 계산 근거
};
function computeMetric(product: string, snaps: Snapshot[]): Metric {
  // 현재고 = 가장 최근 날짜의 재고
  const stockPts = snaps
    .filter((s) => s.stock[product] !== undefined)
    .map((s) => ({ date: s.date, v: s.stock[product] }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const current = stockPts.length ? stockPts[stockPts.length - 1].v : 0;
  const lastDate = stockPts.length ? stockPts[stockPts.length - 1].date : null;

  // 일일 출고량 시계열 (오름차순)
  const outPts = snaps
    .filter((s) => s.out[product] !== undefined)
    .map((s) => ({ date: s.date, v: s.out[product] }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let avgDaily: number | null = null;
  let basis: Metric["basis"] = null;

  if (outPts.length >= 1 && outPts.some((p) => p.v > 0)) {
    // [출고량 기준] 주말(토·일)은 반출이 없으므로,
    // 월요일 출고량을 토·일·월 3일로 나눠(÷3) 각 날에 배분해 하루 평균을 구함.
    const adj = new Map<string, number>(outPts.map((p) => [p.date, p.v]));
    for (const p of outPts) {
      if (weekday(p.date) === 1) {
        const share = p.v / 3;
        adj.set(p.date, share);
        const sat = shiftDate(p.date, -2);
        const sun = shiftDate(p.date, -1);
        if (adj.has(sat)) adj.set(sat, share);
        if (adj.has(sun)) adj.set(sun, share);
      }
    }
    const vals = Array.from(adj.values());
    avgDaily = vals.reduce((a, b) => a + b, 0) / vals.length;
    basis = "out";
  } else if (stockPts.length >= 2) {
    // [폴백] 출고 데이터가 없으면 재고 감소분으로 추정 (재입고 증가분 제외)
    let consumed = 0;
    for (let i = 1; i < stockPts.length; i++) {
      const diff = stockPts[i - 1].v - stockPts[i].v;
      if (diff > 0) consumed += diff;
    }
    const span = daysBetween(stockPts[0].date, stockPts[stockPts.length - 1].date);
    avgDaily = span > 0 ? consumed / span : null;
    basis = "stock";
  }

  if (!avgDaily || avgDaily <= 0)
    return { current, avgDaily: avgDaily ?? 0, daysLeft: null, depletionDate: null, basis };

  const daysLeft = Math.round(current / avgDaily);
  return {
    current,
    avgDaily,
    daysLeft,
    depletionDate: lastDate ? addDays(lastDate, daysLeft) : null,
    basis,
  };
}
function statusFor(daysLeft: number | null) {
  if (daysLeft === null)
    return {
      label: "데이터 부족",
      cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    };
  if (daysLeft <= 7)
    return {
      label: "소진 임박",
      cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    };
  if (daysLeft <= 14)
    return {
      label: "주의",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    };
  return {
    label: "여유",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  };
}

export default function Page() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const arr: unknown[] = Array.isArray(parsed) ? parsed : [];
        // 구버전(qty) 데이터도 stock 으로 이어받도록 변환
        const migrated: Snapshot[] = arr.map((s) => {
          const o = s as {
            date: string;
            stock?: Record<string, number>;
            out?: Record<string, number>;
            qty?: Record<string, number>;
          };
          return { date: o.date, stock: o.stock ?? o.qty ?? {}, out: o.out ?? {} };
        });
        setSnapshots(migrated);
      }
    } catch {
      /* 손상된 데이터 무시 */
    }
    setDate(new Date().toISOString().slice(0, 10));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }, [snapshots, loaded]);

  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [snapshots],
  );
  const products = useMemo(() => {
    const seen: string[] = [];
    for (const s of sorted)
      for (const name of Object.keys(s.stock))
        if (!seen.includes(name)) seen.push(name);
    return seen;
  }, [sorted]);
  const dates = useMemo(() => sorted.map((s) => s.date), [sorted]);
  // 표시용 날짜: 가장 최근이 왼쪽 (내림차순)
  const displayDates = useMemo(() => [...dates].reverse(), [dates]);
  const metrics = useMemo(() => {
    const map: Record<string, Metric> = {};
    for (const p of products) map[p] = computeMetric(p, sorted);
    return map;
  }, [products, sorted]);

  const urgentCount = products.filter(
    (p) => metrics[p].daysLeft !== null && metrics[p].daysLeft! <= 7,
  ).length;
  const latestDate = dates.length ? dates[dates.length - 1] : "-";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setError("");
    setNotice("");
    if (files.length === 0) return;
    setBusy(true);
    try {
      const collected: Snapshot[] = [];
      const failed: string[] = [];
      let fromFileCount = 0;
      // 여러 파일을 순서대로 파싱해서 모읍니다 (파일별 날짜로 각각 쌓임)
      for (const file of files) {
        try {
          const isCsv = /\.csv$/i.test(file.name);
          const grid = isCsv
            ? parseCSV(await readTextSmart(file))
            : await parseXlsx(file);
          const result = buildSnapshots(grid, date, file.name);
          if (!result.ok) {
            failed.push(`${file.name} (${result.error})`);
            continue;
          }
          collected.push(...result.snapshots);
          if (result.dateFromFile) fromFileCount++;
        } catch (err) {
          failed.push(
            `${file.name} (${err instanceof Error ? err.message : "읽기 오류"})`,
          );
        }
      }

      if (collected.length > 0) {
        setSnapshots((prev) => {
          const map = new Map(prev.map((s) => [s.date, s]));
          for (const s of collected) map.set(s.date, s); // 같은 날짜는 덮어쓰기
          return Array.from(map.values());
        });
        const days = Array.from(new Set(collected.map((s) => s.date))).sort();
        const productCount = new Set(
          collected.flatMap((s) => Object.keys(s.stock)),
        ).size;
        if (days.length === 1) setDate(days[0]);
        setNotice(
          `파일 ${files.length - failed.length}개 · 날짜 ${days.length}일 · 제품 ${productCount}개를 불러왔습니다.` +
            (fromFileCount > 0 ? " (파일에서 날짜 인식)" : " (선택한 기준 날짜 사용)"),
        );
      }
      if (failed.length > 0) {
        setError(`${failed.length}개 파일을 읽지 못했습니다: ${failed.join(", ")}`);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeDate(d: string) {
    setSnapshots((prev) => prev.filter((s) => s.date !== d));
  }
  function resetAll() {
    setSnapshots([]);
    setNotice("");
    setError("");
  }

  return (
    <MemberShell slug={SLUG}>
      {/* 요약 카드 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="관리 제품" value={`${products.length}`} unit="개" />
        <SummaryCard
          label="소진 임박(≤7일)"
          value={`${urgentCount}`}
          unit="개"
          accent={urgentCount > 0 ? "danger" : "ok"}
        />
        <SummaryCard label="기록된 날짜" value={`${dates.length}`} unit="일" />
        <SummaryCard label="데이터 기준일" value={latestDate} />
      </section>

      {/* 업로드 툴바 */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              재고 파일 업로드{" "}
              <span className="font-normal text-neutral-400">
                (.xlsx / .csv · 여러 개 동시 선택 가능)
              </span>
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              disabled={busy}
              onChange={handleFile}
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 disabled:opacity-50"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              기준 날짜{" "}
              <span className="font-normal text-neutral-400">
                (파일에 날짜가 없을 때)
              </span>
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
            />
          </label>

          {snapshots.length > 0 && (
            <button
              onClick={resetAll}
              className="ml-auto rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              전체 초기화
            </button>
          )}
        </div>

        {busy && (
          <p className="mt-3 text-sm text-neutral-500">파일을 분석하는 중…</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
        )}
        {notice && (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
            ✅ {notice}
          </p>
        )}
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          피디온에서 받은 재고 파일을 올리세요. 여러 날짜의 파일을{" "}
          <b>한 번에 선택</b>하면 한꺼번에 쌓입니다. <b>제품명·재고량</b> 열을 자동으로
          찾고, 파일에 적힌 <b>날짜</b>로 그날의 열을 만듭니다. 같은 날짜를 다시 올리면
          덮어씁니다.
        </p>
      </section>

      {/* 재고 표 */}
      <section className="mt-6">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-4xl">📦</div>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              아직 데이터가 없어요. 위에서 재고 엑셀/CSV 를 업로드해보세요.
              <br />
              여러 날짜를 쌓으면 <b>소진까지 남은 일수</b>가 자동 계산됩니다.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-neutral-50 px-4 py-3 text-left font-semibold dark:bg-neutral-900">
                    제품명
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    현재고
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    일평균 소진
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">
                    소진까지
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">
                    예상 소진일
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">
                    상태
                  </th>
                  {displayDates.map((d) => (
                    <th
                      key={d}
                      className="whitespace-nowrap border-l border-neutral-200 px-4 py-3 text-right font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {d.slice(5)}
                        <button
                          onClick={() => removeDate(d)}
                          aria-label={`${d} 열 삭제`}
                          className="text-neutral-300 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const m = metrics[p];
                  const s = statusFor(m.daysLeft);
                  const zebra = idx % 2 === 1;
                  return (
                    <tr
                      key={p}
                      className={
                        zebra
                          ? "bg-neutral-50/50 dark:bg-neutral-900/40"
                          : "bg-white dark:bg-neutral-950"
                      }
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 whitespace-nowrap px-4 py-3 text-left font-medium ${
                          zebra
                            ? "bg-neutral-50 dark:bg-neutral-900"
                            : "bg-white dark:bg-neutral-950"
                        }`}
                      >
                        {p}
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                        {m.current.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                        {m.avgDaily && m.avgDaily > 0 ? m.avgDaily.toFixed(1) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">
                        {m.daysLeft !== null ? (
                          <span className="font-semibold">{m.daysLeft}일</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">
                        {m.depletionDate ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      {displayDates.map((d) => {
                        const v = sorted.find((x) => x.date === d)?.stock[p];
                        return (
                          <td
                            key={d}
                            className="whitespace-nowrap border-l border-neutral-200 px-4 py-3 text-right tabular-nums text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
                          >
                            {v === undefined ? "-" : v.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-neutral-400">
        * 소진 예측은 <b>일일 출고량(평균일일배송수량)</b>을 기준으로 하루 평균 소진량을
        구해 계산합니다. 주말(토·일)은 반출이 없으므로 <b>월요일 출고량을 토·일·월 3일로
        나눠(÷3)</b> 반영합니다. 출고량 데이터가 없으면 재고 감소분으로 추정하며,
        데이터(날짜)가 많을수록 정확해집니다.
      </p>
    </MemberShell>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  accent = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: "default" | "ok" | "danger";
}) {
  const valueCls =
    accent === "danger"
      ? "text-red-600 dark:text-red-400"
      : accent === "ok"
        ? "text-emerald-600 dark:text-emerald-400"
        : "";
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${valueCls}`}>
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-neutral-400">{unit}</span>
        )}
      </div>
    </div>
  );
}
