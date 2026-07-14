"use client";

import { useMemo, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ 엄요셉(eom-yoseb) 님의 페이지 — 부서별 월간 직원 스케줄표 MVP
// - 부서를 고르면 그 부서 직원들이 나옵니다 (이름 수정 가능)
// - 달력은 실제 날짜(숫자) + 월~일 기준
// - 칸을 클릭하면 근무 → 연차 → 오프 순으로 상태/색이 바뀝니다
// - 오른쪽 요약에 한 달 기준 이름별 근무/연차/오프 개수가 나옵니다
// (저장/DB/로그인 없이 화면에서만 동작합니다.)

type Status = "work" | "leave" | "off";
const STATUS_ORDER: Status[] = ["work", "leave", "off"];

const STATUS_META: Record<
  Status,
  { label: string; abbr: string; cell: string; swatch: string }
> = {
  work: {
    label: "근무",
    abbr: "근",
    cell: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60",
    swatch: "bg-emerald-400",
  },
  leave: {
    label: "연차",
    abbr: "연",
    cell: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60",
    swatch: "bg-amber-400",
  },
  off: {
    label: "오프",
    abbr: "오",
    cell: "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700",
    swatch: "bg-neutral-300 dark:bg-neutral-600",
  },
};

function nextStatus(current: Status): Status {
  const i = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

// 부서 구성 (샘플 이름)
const DEPARTMENTS = [
  { key: "doctor", label: "의사", names: ["김민준", "이서준", "박도윤"] },
  { key: "radiology", label: "방사선사", names: ["최지호", "정하준"] },
  { key: "admin", label: "원무", names: ["강서윤", "조예은", "윤지우"] },
  { key: "nursing", label: "간호", names: ["임수아", "한지민", "오유나", "신채원"] },
  { key: "pt", label: "물리치료사", names: ["배준서", "송시우"] },
  { key: "lab", label: "임상병리", names: ["문하윤", "양지안"] },
  { key: "cleaning", label: "미화", names: ["구본길", "남정순"] },
] as const;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Page() {
  // 부서별 이름 (수정 가능)
  const [deptNames, setDeptNames] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(DEPARTMENTS.map((d) => [d.key, [...d.names]])),
  );
  const [deptKey, setDeptKey] = useState<string>(DEPARTMENTS[0].key);

  // 표시 월 (기본: 오늘 기준)
  const [{ year, month }, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // 상태 저장: `${dept}|${empIdx}|${year}-${month}-${day}` → Status
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const names = deptNames[deptKey];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const wd = new Date(year, month, day).getDay(); // 0=일 ~ 6=토
        return { day, wd };
      }),
    [year, month, daysInMonth],
  );

  function cellKey(empIdx: number, day: number) {
    return `${deptKey}|${empIdx}|${year}-${month}-${day}`;
  }
  function getStatus(empIdx: number, day: number): Status {
    return statuses[cellKey(empIdx, day)] ?? "work";
  }
  function toggleCell(empIdx: number, day: number) {
    const key = cellKey(empIdx, day);
    setStatuses((prev) => ({ ...prev, [key]: nextStatus(prev[key] ?? "work") }));
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

  // 이름별 한 달 요약 (근무/연차/오프 개수)
  const summary = names.map((name, empIdx) => {
    let leave = 0;
    let off = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const s = getStatus(empIdx, day);
      if (s === "leave") leave++;
      else if (s === "off") off++;
    }
    return { name, work: daysInMonth - leave - off, leave, off };
  });

  return (
    <MemberShell slug="eom-yoseb">
      {/* 소개 */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-900">
        <h2 className="text-2xl font-bold">🗓️ 부서별 월간 직원 스케줄표</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          부서를 고르고, 각 날짜 칸을 클릭하면{" "}
          <b>근무 → 연차 → 오프</b> 순으로 상태가 바뀝니다. 직원 이름은 바로
          수정할 수 있어요.
        </p>
      </section>

      {/* 부서 선택 (파란 박스) */}
      <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <h3 className="mb-3 text-xs font-semibold text-blue-600 dark:text-blue-300">
          부서 선택
        </h3>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDeptKey(d.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                deptKey === d.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-neutral-600 hover:bg-blue-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* 월 이동 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            ◀
          </button>
          <span className="text-lg font-bold">
            {year}년 {month + 1}월
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            ▶
          </button>
        </div>
        <span className="text-xs text-neutral-400">
          ✏️ 이름을 클릭하면 바로 수정돼요
        </span>
      </div>

      {/* 본문: 스케줄표 + 요약 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* 스케줄표 */}
        <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <table className="border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-28 bg-white px-2 py-1 text-left text-[11px] font-medium text-neutral-400 dark:bg-neutral-900">
                  이름 \ 날짜
                </th>
                {days.map(({ day, wd }) => (
                  <th
                    key={day}
                    className="min-w-[2.6rem] px-1 py-1 font-semibold"
                  >
                    <div className="text-sm">{day}</div>
                    <div
                      className={
                        wd === 0
                          ? "text-red-500"
                          : wd === 6
                            ? "text-blue-500"
                            : "text-neutral-400"
                      }
                    >
                      {WEEKDAYS[wd]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((name, empIdx) => (
                <tr key={empIdx}>
                  <th className="sticky left-0 z-10 bg-white px-1 py-1 dark:bg-neutral-900">
                    <input
                      value={name}
                      onChange={(e) => renameEmployee(empIdx, e.target.value)}
                      className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-left text-sm font-semibold outline-none hover:border-neutral-200 focus:border-blue-500 focus:bg-white dark:hover:border-neutral-700 dark:focus:bg-neutral-800"
                    />
                  </th>
                  {days.map(({ day }) => {
                    const status = getStatus(empIdx, day);
                    const meta = STATUS_META[status];
                    return (
                      <td key={day} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggleCell(empIdx, day)}
                          className={`h-9 w-full rounded-md font-medium transition-colors ${meta.cell}`}
                          aria-label={`${name} ${month + 1}월 ${day}일 ${meta.label}`}
                        >
                          {meta.abbr}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 한 달 요약 (빨간 박스) */}
        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-4 dark:border-red-900/60 dark:bg-red-950/20">
          <h3 className="mb-3 text-sm font-bold text-red-600 dark:text-red-300">
            {month + 1}월 요약 (이름별)
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th className="py-1 text-left font-medium">이름</th>
                <th className="py-1 text-center font-medium">근무</th>
                <th className="py-1 text-center font-medium">연차</th>
                <th className="py-1 text-center font-medium">오프</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-red-100 dark:border-red-900/40"
                >
                  <td className="py-1.5 text-left font-semibold">{row.name}</td>
                  <td className="py-1.5 text-center text-emerald-600 dark:text-emerald-400">
                    {row.work}
                  </td>
                  <td className="py-1.5 text-center text-amber-600 dark:text-amber-400">
                    {row.leave}
                  </td>
                  <td className="py-1.5 text-center text-neutral-500">
                    {row.off}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-neutral-400">
            * 이번 달 총 {daysInMonth}일 기준 (근무 = 전체일 − 연차 − 오프)
          </p>
        </section>
      </div>

      {/* 범례 */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          범례
        </h3>
        <div className="flex flex-wrap gap-5">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white ${STATUS_META[s].swatch}`}
              >
                {STATUS_META[s].abbr}
              </span>
              <span className="text-sm">{STATUS_META[s].label}</span>
            </div>
          ))}
        </div>
      </section>
    </MemberShell>
  );
}
