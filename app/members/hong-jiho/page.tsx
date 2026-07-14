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
// 아예 수집/표시하지 않을 제품명 (사용자 요청)
const EXCLUDE_NAMES = ["기타상품"];

// 표에 고정으로 보여줄 제품 순서. 여기 없는 제품은 아래에 발견 순서대로 쌓임.
// 실제 이름의 '닥터써클' 접두사·공백·언더바(_)를 무시하고 끝부분(suffix)으로 매칭.
const PRODUCT_ORDER = [
  "경추베개",
  "경추베개커버",
  "허리베개",
  "차량용등받이쿠션",
  "차량용목쿠션",
  "허리보호대S",
  "허리보호대M",
  "허리보호대L",
  "허리보호대XL",
];
function normalizeName(name: string) {
  return name.replace(/[\s_]/g, "").toLowerCase();
}
function orderRank(name: string) {
  const n = normalizeName(name);
  for (let i = 0; i < PRODUCT_ORDER.length; i++) {
    if (n.endsWith(normalizeName(PRODUCT_ORDER[i]))) return i;
  }
  return PRODUCT_ORDER.length; // 목록에 없으면 맨 뒤
}

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
  if (c.includes("구분")) return 0; // '배송수량구분' 등 제외
  if (c.includes("배송수량총") || c.includes("배송수량전체")) return 7; // 배송수량(총) 최우선
  if (c === "배송수량") return 6;
  if (c.includes("출고수량") || c.includes("판매수량")) return 5;
  if (c.includes("평균") && c.includes("배송")) return 4; // 평균일일배송수량(차선)
  if (c.includes("배송수량") || c.includes("출고량") || c.includes("판매량")) return 3;
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
    if (!name || includesAny(name, SKIP_NAMES) || includesAny(name, EXCLUDE_NAMES))
      continue;
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
  avg7: number | null; // 최근 7일 기준 일평균 소진량
  avg30: number | null; // 최근 30일 기준 일평균 소진량
  maxDaily: number | null; // 최고 일 소진량
  minDaily: number | null; // 최소 일 소진량
  daysLeft: number | null; // 소진까지 남은 일수 (7일 평균 기준)
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
  const lastStockDate = stockPts.length ? stockPts[stockPts.length - 1].date : null;

  const empty: Metric = {
    current,
    avg7: null,
    avg30: null,
    maxDaily: null,
    minDaily: null,
    daysLeft: null,
    depletionDate: null,
    basis: null,
  };

  // 일일 출고량 시계열 (오름차순)
  const outPts = snaps
    .filter((s) => s.out[product] !== undefined)
    .map((s) => ({ date: s.date, v: s.out[product] }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (outPts.length >= 1 && outPts.some((p) => p.v > 0)) {
    // [출고량 기준] 주말(토·일)은 반출이 없으므로,
    // 월요일 출고량을 토·일·월 3일로 나눠(÷3) 각 날에 배분한 "일별 소진량" 시계열.
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
    const series = Array.from(adj, ([date, v]) => ({ date, v })).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const lastDate = series[series.length - 1].date;
    // 최근 N일 창(window)의 평균
    const windowAvg = (days: number) => {
      const from = shiftDate(lastDate, -(days - 1));
      const win = series.filter((s) => s.date >= from);
      return win.length ? win.reduce((a, b) => a + b.v, 0) / win.length : null;
    };
    const avg7 = windowAvg(7);
    const avg30 = windowAvg(30);
    const vals = series.map((s) => s.v);
    const maxDaily = Math.max(...vals);
    const minDaily = Math.min(...vals);
    // 소진까지/예상소진일은 30일 평균(안정적) 기준, 없으면 7일 평균으로 폴백.
    // 30일 창은 데이터가 쌓일수록 완전한 4주+ 표본이 되어 예측이 정확해짐.
    const rate = avg30 && avg30 > 0 ? avg30 : avg7 && avg7 > 0 ? avg7 : null;
    const daysLeft = rate ? Math.round(current / rate) : null;
    return {
      current,
      avg7,
      avg30,
      maxDaily,
      minDaily,
      daysLeft,
      depletionDate:
        daysLeft !== null && lastStockDate ? addDays(lastStockDate, daysLeft) : null,
      basis: "out",
    };
  }

  if (stockPts.length >= 2) {
    // [폴백] 출고 데이터가 없으면 재고 감소분으로 하루 평균만 추정 (7/30 동일값)
    let consumed = 0;
    for (let i = 1; i < stockPts.length; i++) {
      const diff = stockPts[i - 1].v - stockPts[i].v;
      if (diff > 0) consumed += diff;
    }
    const span = daysBetween(stockPts[0].date, stockPts[stockPts.length - 1].date);
    const avg = span > 0 ? consumed / span : null;
    if (!avg || avg <= 0) return empty;
    const daysLeft = Math.round(current / avg);
    return {
      current,
      avg7: avg,
      avg30: avg,
      maxDaily: null,
      minDaily: null,
      daysLeft,
      depletionDate: lastStockDate ? addDays(lastStockDate, daysLeft) : null,
      basis: "stock",
    };
  }

  return empty;
}
function fmt1(n: number | null) {
  if (n === null) return "-";
  return (Math.round(n * 10) / 10).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}
// 상태 기준: 소진까지 60일 이하 = 부족(빨강), 99일 이하 = 보통(노랑), 100일 이상 = 여유(초록)
// badgeCls: 상태 뱃지 색 / textCls: 소진까지·예상 소진일 글자 색
function statusFor(daysLeft: number | null) {
  if (daysLeft === null)
    return {
      label: "데이터 부족",
      badgeCls:
        "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
      textCls: "text-neutral-400",
    };
  if (daysLeft <= 60)
    return {
      label: "부족",
      badgeCls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      textCls: "text-red-600 dark:text-red-400",
    };
  if (daysLeft <= 99)
    return {
      label: "보통",
      badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      textCls: "text-amber-600 dark:text-amber-400",
    };
  return {
    label: "여유",
    badgeCls:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    textCls: "text-emerald-600 dark:text-emerald-400",
  };
}

export default function Page() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<string | null>(null); // 상세 달력 모달 대상 제품
  const [calYM, setCalYM] = useState<{ y: number; m: number }>({ y: 2026, m: 0 });
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
        if (!seen.includes(name) && !includesAny(name, EXCLUDE_NAMES))
          seen.push(name);
    // 고정 순서 우선, 목록에 없는 제품은 발견 순서대로 뒤에 정렬
    return seen
      .map((name, i) => ({ name, i, rank: orderRank(name) }))
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.i - b.i))
      .map((x) => x.name);
  }, [sorted]);
  const dates = useMemo(() => sorted.map((s) => s.date), [sorted]);
  const metrics = useMemo(() => {
    const map: Record<string, Metric> = {};
    for (const p of products) map[p] = computeMetric(p, sorted);
    return map;
  }, [products, sorted]);

  // 제품별 날짜→{재고, 소진} 맵 + 날짜 목록(최신순) — 달력/상세표/그래프에 사용
  // 파일엔 '그날의 재고'가 없고 '현재고'만 있어, 현재고에서 이후 출고량을 역산해 날짜별 재고를 복원.
  //   재고[d] = 현재고 + (d 이후 모든 날의 출고량 합)   ← 마지막 입고 이후 구간은 정확
  const dayDataByProduct = useMemo(() => {
    const res: Record<
      string,
      { map: Record<string, { stock?: number; out?: number }>; datesDesc: string[] }
    > = {};
    for (const p of products) {
      const rows: { date: string; rawStock?: number; out?: number }[] = [];
      for (const s of sorted) {
        if (s.stock[p] !== undefined || s.out[p] !== undefined) {
          rows.push({ date: s.date, rawStock: s.stock[p], out: s.out[p] });
        }
      }
      const current = rows.length ? (rows[rows.length - 1].rawStock ?? 0) : 0;
      const map: Record<string, { stock?: number; out?: number }> = {};
      const datesDesc: string[] = [];
      let acc = 0; // 해당 날짜 이후의 누적 출고량
      for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i];
        map[r.date] = { stock: current + acc, out: r.out };
        datesDesc.push(r.date);
        acc += r.out ?? 0;
      }
      res[p] = { map, datesDesc };
    }
    return res;
  }, [products, sorted]);

  // 상세 모달의 최근 30일 재고 그래프 데이터 (오래된→최신 순)
  const detailChart = useMemo(() => {
    if (!detail || !dayDataByProduct[detail]) return [];
    const dd = dayDataByProduct[detail];
    return dd.datesDesc
      .slice(0, 30)
      .map((d) => ({ date: d, stock: dd.map[d].stock ?? 0 }))
      .reverse();
  }, [detail, dayDataByProduct]);

  const urgentCount = products.filter(
    (p) => metrics[p].daysLeft !== null && metrics[p].daysLeft! <= 60,
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

  const latestYM = useMemo(() => {
    const last = dates.length ? dates[dates.length - 1] : null;
    if (!last) return { y: 2026, m: 0 };
    const [y, m] = last.split("-").map(Number);
    return { y, m: m - 1 };
  }, [dates]);

  function openDetail(p: string) {
    setCalYM(latestYM); // 열 때 데이터 기준월로 시작
    setDetail(p);
  }
  function stepMonth(delta: number) {
    setCalYM((c) => {
      const d = new Date(Date.UTC(c.y, c.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }
  function resetAll() {
    setSnapshots([]);
    setNotice("");
    setError("");
  }

  return (
    <MemberShell slug={SLUG}>
      {/* 공통 레이아웃(max-w-4xl)보다 넓게 — 뷰포트 중앙 기준 약 1.3배 폭 */}
      <div className="relative left-1/2 w-[72rem] max-w-[92vw] -translate-x-1/2">
      {/* 요약 카드 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="관리 제품" value={`${products.length}`} unit="개" />
        <SummaryCard
          label="부족(≤60일)"
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
          <div className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-neutral-50 px-4 py-3 text-left font-semibold dark:bg-neutral-900">
                    제품명
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    현재고
                  </th>
                  <th className="px-4 py-3 text-right font-semibold leading-tight">
                    <div className="whitespace-nowrap">7일 평균</div>
                    <div className="whitespace-nowrap">소진량</div>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold leading-tight">
                    <div className="whitespace-nowrap">30일 평균</div>
                    <div className="whitespace-nowrap">소진량</div>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    최고 소진
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    최소 소진
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
                      <td className="group relative whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(p)}
                          className="font-bold tabular-nums text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                          title="클릭하면 과거 재고 달력·표 보기"
                        >
                          {m.current.toLocaleString()}
                        </button>
                        {/* 마우스 오버 시 이번 달 재고 달력 미리보기 */}
                        <div className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-[340px] group-hover:block">
                          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                            <MonthCalendar
                              year={latestYM.y}
                              month={latestYM.m}
                              data={dayDataByProduct[p]?.map ?? {}}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {fmt1(m.avg7)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                        {fmt1(m.avg30)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                        {fmt1(m.maxDaily)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                        {fmt1(m.minDaily)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-center font-semibold tabular-nums ${s.textCls}`}
                      >
                        {m.daysLeft !== null ? `${m.daysLeft}일` : "-"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-center font-medium ${s.textCls}`}
                      >
                        {m.depletionDate ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badgeCls}`}
                        >
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-neutral-400">
        * 소진량은 엑셀의 <b>배송수량(총)</b>(일일 출고량) 기준입니다. 주말(토·일)은 반출이
        없으므로 <b>월요일 출고량을 토·일·월 3일로 나눠(÷3)</b> 반영합니다.{" "}
        <b>소진까지·예상 소진일</b>은 <b>최근 30일 평균 소진량</b>(없으면 7일) 기준이며,
        데이터가 쌓일수록 정확해집니다. <b>상태</b>는 60일 이하 <b>부족(빨강)</b>, 99일 이하{" "}
        <b>보통(노랑)</b>, 100일 이상 <b>여유(초록)</b>. 날짜별 재고는 파일에 &lsquo;그날의
        재고&rsquo;가 없어 <b>현재고에서 이후 출고량을 역산</b>해 복원한 값입니다(마지막 입고
        이후 구간은 정확). <b>현재고 숫자</b>: 마우스오버=이번 달 달력, 클릭=과거 전체
        달력·표·그래프.
      </p>
      </div>

      {/* 현재고 클릭 시: 과거 재고 달력 + 표 모달 (transform 래퍼 밖에 두어야 fixed 가 뷰포트 기준) */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{detail}</h3>
              <button
                onClick={() => setDetail(null)}
                aria-label="닫기"
                className="rounded px-2 py-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-6 md:flex-row">
              {/* 달력 (월 이동) + 재고 그래프 */}
              <div className="md:w-[380px] md:shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => stepMonth(-1)}
                    className="rounded px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    ◀ 이전달
                  </button>
                  <button
                    onClick={() => stepMonth(1)}
                    className="rounded px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    다음달 ▶
                  </button>
                </div>
                <MonthCalendar
                  year={calYM.y}
                  month={calYM.m}
                  data={dayDataByProduct[detail]?.map ?? {}}
                />
                <p className="mt-2 text-[11px] text-neutral-400">
                  각 날짜: 위=재고, 아래=소진(▼)
                </p>
                <div className="mt-4">
                  <div className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    최근 30일 재고 추이
                  </div>
                  <StockChart data={detailChart} />
                </div>
              </div>
              {/* 전체 기간 표 */}
              <div className="max-h-[60vh] flex-1 overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-neutral-900">
                    <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-700">
                      <th className="py-2 pr-3">날짜</th>
                      <th className="py-2 pr-3 text-right">재고</th>
                      <th className="py-2 text-right">소진</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dayDataByProduct[detail]?.datesDesc ?? []).map((d) => {
                      const info = dayDataByProduct[detail].map[d];
                      return (
                        <tr
                          key={d}
                          className="border-b border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="py-1.5 pr-3 tabular-nums">{d}</td>
                          <td className="py-1.5 pr-3 text-right font-medium tabular-nums">
                            {info.stock?.toLocaleString() ?? "-"}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-neutral-500">
                            {info.out ?? "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </MemberShell>
  );
}

// 한 달 달력: 각 날짜에 재고(위)·소진량(아래 ▼) 표시. 데이터 있는 날만 강조.
function MonthCalendar({
  year,
  month,
  data,
}: {
  year: number;
  month: number;
  data: Record<string, { stock?: number; out?: number }>;
}) {
  const startDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dows = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <div>
      <div className="mb-1 text-center text-sm font-semibold">
        {year}년 {month + 1}월
      </div>
      <div className="mb-0.5 grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {dows.map((d, i) => (
          <div
            key={d}
            className={
              i === 0
                ? "text-red-400"
                : i === 6
                  ? "text-blue-400"
                  : "text-neutral-400"
            }
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = `${year}-${pad(month + 1)}-${pad(d)}`;
          const info = data[key];
          return (
            <div
              key={i}
              className={`min-h-[54px] rounded p-1 text-center leading-tight ${
                info
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : "bg-neutral-50/40 dark:bg-neutral-900/40"
              }`}
            >
              <div className="text-[11px] text-neutral-400">{d}</div>
              {info && (
                <>
                  <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {info.stock?.toLocaleString() ?? "-"}
                  </div>
                  <div className="text-[11px] tabular-nums text-blue-500">
                    ▼{info.out ?? 0}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 최근 재고 추이 라인 그래프 (외부 라이브러리 없이 SVG)
function StockChart({ data }: { data: { date: string; stock: number }[] }) {
  if (data.length < 2)
    return (
      <p className="text-center text-[11px] text-neutral-400">
        그래프를 그리려면 날짜 데이터가 2일 이상 필요합니다.
      </p>
    );
  const W = 320;
  const H = 110;
  const padX = 6;
  const padY = 10;
  const max = Math.max(...data.map((d) => d.stock), 1);
  const min = Math.min(...data.map((d) => d.stock), 0);
  const span = max - min || 1;
  const px = (i: number) => padX + (i / (data.length - 1)) * (W - padX * 2);
  const py = (v: number) => padY + (1 - (v - min) / span) * (H - padY * 2);
  const line = data.map((d, i) => `${px(i)},${py(d.stock)}`).join(" ");
  const area = `${px(0)},${H - padY} ${line} ${px(data.length - 1)},${H - padY}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <polygon points={area} className="fill-red-500/10" />
        <polyline
          points={line}
          fill="none"
          className="stroke-red-500"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-neutral-400">
        <span>{data[0].date.slice(5)}</span>
        <span>최대 {max.toLocaleString()}</span>
        <span>{data[data.length - 1].date.slice(5)}</span>
      </div>
    </div>
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
