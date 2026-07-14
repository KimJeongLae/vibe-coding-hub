"use client";

import { Fragment, useMemo, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ 엄요셉(eom-yoseb) 님의 페이지 — 부서별 월간 직원 스케줄표 MVP
// - 부서 선택 / 주(週) 단위로 쌓이는 달력 / 편집 메뉴(프리셋·옵션추가·이름수정)
// - "부서별 스케줄근무" 프리셋: 근무(7시)~근무(5시)/오프/연차/특휴 + 사용자 옵션 추가
// - 오른쪽 요약: 이름별 옵션 개수 + 평일근무일수 + 야간(8시) 개수
// (저장/DB/로그인 없이 화면에서만 동작합니다.)

// 상태 색상 팔레트 (Tailwind 정적 문자열 — 스캐너가 인식하도록 전체 클래스 명시)
const PALETTE = [
  { cell: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300", swatch: "bg-emerald-400" },
  { cell: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300", swatch: "bg-indigo-400" },
  { cell: "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300", swatch: "bg-sky-400" },
  { cell: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300", swatch: "bg-cyan-400" },
  { cell: "bg-lime-100 text-lime-700 hover:bg-lime-200 dark:bg-lime-900/40 dark:text-lime-300", swatch: "bg-lime-400" },
  { cell: "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400", swatch: "bg-neutral-300 dark:bg-neutral-600" },
  { cell: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300", swatch: "bg-amber-400" },
  { cell: "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300", swatch: "bg-rose-400" },
  { cell: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300", swatch: "bg-violet-400" },
  { cell: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300", swatch: "bg-orange-400" },
];

type Option = { id: string; label: string; short: string; colorIdx: number };

const PRESETS: Record<string, { name: string; options: Option[] }> = {
  simple: {
    name: "간단 (근무/연차/오프)",
    options: [
      { id: "work", label: "근무", short: "근무", colorIdx: 0 },
      { id: "leave", label: "연차", short: "연차", colorIdx: 6 },
      { id: "off", label: "오프", short: "오프", colorIdx: 5 },
    ],
  },
  shift: {
    name: "부서별 스케줄근무",
    options: [
      { id: "w7", label: "근무(7시)", short: "7시", colorIdx: 0 },
      { id: "w8", label: "근무(8시)", short: "8시", colorIdx: 1 },
      { id: "w1", label: "근무(1시)", short: "1시", colorIdx: 2 },
      { id: "w2", label: "근무(2시)", short: "2시", colorIdx: 3 },
      { id: "w5", label: "근무(5시)", short: "5시", colorIdx: 4 },
      { id: "off", label: "오프", short: "오프", colorIdx: 5 },
      { id: "leave", label: "연차", short: "연차", colorIdx: 6 },
      { id: "special", label: "특휴", short: "특휴", colorIdx: 7 },
    ],
  },
};

const DEPARTMENTS = [
  { key: "doctor", label: "의사", names: ["김민준", "이서준", "박도윤"] },
  { key: "radiology", label: "방사선사", names: ["최지호", "정하준"] },
  { key: "admin", label: "원무", names: ["강서윤", "조예은", "윤지우"] },
  { key: "nursing", label: "간호", names: ["임수아", "한지민", "오유나", "신채원"] },
  { key: "pt", label: "물리치료사", names: ["배준서", "송시우"] },
  { key: "lab", label: "임상병리", names: ["문하윤", "양지안"] },
  { key: "cleaning", label: "미화", names: ["구본길", "남정순"] },
] as const;

// 월요일 시작 요일 라벨
const WD_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// 한 달을 주 단위(월~일)로 분할
function buildWeeks(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstMon = (new Date(year, month, 1).getDay() + 6) % 7; // 월=0
  const weeks: ({ day: number } | null)[][] = [];
  let week: ({ day: number } | null)[] = Array(firstMon).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push({ day });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export default function Page() {
  const [deptNames, setDeptNames] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(DEPARTMENTS.map((d) => [d.key, [...d.names]])),
  );
  const [deptKey, setDeptKey] = useState<string>(DEPARTMENTS[0].key);

  const [{ year, month }, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [options, setOptions] = useState<Option[]>(PRESETS.simple.options);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [newOptLabel, setNewOptLabel] = useState("");
  const [nextId, setNextId] = useState(1);

  const names = deptNames[deptKey];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  const optById = (id: string) => options.find((o) => o.id === id) ?? options[0];

  const cellKey = (empIdx: number, day: number) =>
    `${deptKey}|${empIdx}|${year}-${month}-${day}`;
  const getStatus = (empIdx: number, day: number) =>
    statuses[cellKey(empIdx, day)] ?? options[0].id;

  function toggleCell(empIdx: number, day: number) {
    const key = cellKey(empIdx, day);
    setStatuses((prev) => {
      const cur = prev[key] ?? options[0].id;
      const idx = options.findIndex((o) => o.id === cur);
      const nextId = idx === -1 ? options[0].id : options[(idx + 1) % options.length].id;
      return { ...prev, [key]: nextId };
    });
  }

  function renameEmployee(empIdx: number, value: string) {
    setDeptNames((prev) => ({
      ...prev,
      [deptKey]: prev[deptKey].map((n, i) => (i === empIdx ? value : n)),
    }));
  }

  function shiftMonth(delta: number) {
    setYearMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function addOption() {
    const label = newOptLabel.trim();
    if (!label) return;
    setOptions((prev) => [
      ...prev,
      { id: `c${nextId}`, label, short: label.slice(0, 3), colorIdx: prev.length % PALETTE.length },
    ]);
    setNextId((n) => n + 1);
    setNewOptLabel("");
  }
  function removeOption(id: string) {
    setOptions((prev) => (prev.length > 1 ? prev.filter((o) => o.id !== id) : prev));
  }

  // 이름별 요약: 옵션별 개수 + 평일근무 + 야간(8시)
  const summary = names.map((name, empIdx) => {
    const counts: Record<string, number> = {};
    options.forEach((o) => (counts[o.id] = 0));
    let weekdayWork = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const id = getStatus(empIdx, day);
      if (counts[id] !== undefined) counts[id]++;
      const o = optById(id);
      const wd = new Date(year, month, day).getDay(); // 0=일 ~ 6=토
      if (wd >= 1 && wd <= 5 && o.label.includes("근무")) weekdayWork++;
    }
    const nightOpt = options.find((o) => o.label === "근무(8시)");
    const night = nightOpt ? counts[nightOpt.id] : null;
    return { name, counts, weekdayWork, night };
  });

  return (
    <MemberShell slug="eom-yoseb">
      {/* 헤더 + 편집 메뉴 버튼 */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">🗓️ 부서별 월간 직원 스케줄표</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            칸 클릭 → 상태 순환. 부서/월을 골라 관리하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            editing
              ? "bg-blue-600 text-white"
              : "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
          }`}
        >
          ⚙️ 편집
        </button>
      </div>

      {/* 편집 패널 */}
      {editing && (
        <section className="mb-2 space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
          {/* 프리셋 */}
          <div>
            <div className="mb-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300">상태 프리셋</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOptions(p.options.map((o) => ({ ...o })))}
                  className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs hover:bg-blue-100 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 옵션 추가/삭제 */}
          <div>
            <div className="mb-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300">상태 옵션 (직접 추가)</div>
            <div className="mb-2 flex gap-2">
              <input
                value={newOptLabel}
                onChange={(e) => setNewOptLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="예) 근무(9시), 반차 ..."
                className="flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800"
              />
              <button
                type="button"
                onClick={addOption}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {options.map((o) => (
                <span
                  key={o.id}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs dark:bg-neutral-800"
                >
                  <span className={`h-3 w-3 rounded-full ${PALETTE[o.colorIdx].swatch}`} />
                  {o.label}
                  <button
                    type="button"
                    onClick={() => removeOption(o.id)}
                    className="ml-0.5 text-neutral-400 hover:text-red-500"
                    aria-label={`${o.label} 삭제`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 직원 이름 수정 */}
          <div>
            <div className="mb-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300">
              직원 이름 수정 ({DEPARTMENTS.find((d) => d.key === deptKey)?.label})
            </div>
            <div className="flex flex-wrap gap-2">
              {names.map((n, i) => (
                <input
                  key={i}
                  value={n}
                  onChange={(e) => renameEmployee(i, e.target.value)}
                  className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 부서 선택 */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {DEPARTMENTS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDeptKey(d.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              deptKey === d.key
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-blue-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 월 이동 */}
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          ◀
        </button>
        <span className="text-base font-bold">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          ▶
        </button>
      </div>

      {/* 본문: 주 단위 달력 + 요약 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
        {/* 주 단위로 쌓이는 달력 */}
        <section className="space-y-2">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="rounded-lg border border-neutral-200 bg-white p-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-0.5 text-center text-[11px]">
                {/* 헤더: 요일 + 날짜 */}
                <div className="py-0.5 text-[10px] font-medium text-neutral-400">{wi + 1}주</div>
                {week.map((d, di) => (
                  <div key={di} className="py-0.5 leading-tight">
                    <div
                      className={
                        di === 6 ? "text-red-500" : di === 5 ? "text-blue-500" : "text-neutral-400"
                      }
                    >
                      {WD_LABELS[di]}
                    </div>
                    <div className="font-bold">{d ? d.day : ""}</div>
                  </div>
                ))}

                {/* 직원별 행 */}
                {names.map((name, empIdx) => (
                  <Fragment key={empIdx}>
                    <div className="flex items-center truncate py-0.5 text-left text-[11px] font-semibold">
                      {name}
                    </div>
                    {week.map((d, di) => {
                      if (!d) return <div key={di} />;
                      const o = optById(getStatus(empIdx, d.day));
                      return (
                        <button
                          key={di}
                          type="button"
                          onClick={() => toggleCell(empIdx, d.day)}
                          className={`h-7 rounded font-medium transition-colors ${PALETTE[o.colorIdx].cell}`}
                          aria-label={`${name} ${month + 1}월 ${d.day}일 ${o.label}`}
                          title={o.label}
                        >
                          {o.short}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* 오른쪽 요약 */}
        <section className="rounded-lg border border-red-200 bg-red-50/40 p-3 dark:border-red-900/60 dark:bg-red-950/20">
          <h3 className="mb-2 text-sm font-bold text-red-600 dark:text-red-300">
            {month + 1}월 요약 (이름별)
          </h3>
          <div className="space-y-2.5">
            {summary.map((row, i) => (
              <div
                key={i}
                className="rounded-md bg-white p-2 dark:bg-neutral-900"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-bold">{row.name}</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    평일근무 {row.weekdayWork}일
                    {row.night !== null && (
                      <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                        · 야간(8시) {row.night}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {options.map((o) => (
                    <span
                      key={o.id}
                      className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] dark:bg-neutral-800"
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${PALETTE[o.colorIdx].swatch}`} />
                      {o.label} {row.counts[o.id]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-neutral-400">
            * {daysInMonth}일 기준 · 평일근무 = 월~금 중 &apos;근무&apos; 포함 상태 일수
          </p>
        </section>
      </div>

      {/* 범례 */}
      <section className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900">
        <span className="text-xs font-semibold text-neutral-400">범례</span>
        {options.map((o) => (
          <span key={o.id} className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-white ${PALETTE[o.colorIdx].swatch}`}
            >
              {o.short.slice(0, 1)}
            </span>
            {o.label}
          </span>
        ))}
      </section>
    </MemberShell>
  );
}
