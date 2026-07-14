"use client";

import { useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ 엄요셉(eom-yoseb) 님의 페이지 — 직원 주간 스케줄표 MVP
// 각 칸을 클릭하면 근무 → 연차 → 휴무 순으로 상태가 바뀝니다.
// (저장/DB/로그인 없이 화면에서만 동작합니다.)

const EMPLOYEES = ["김서연", "이준호", "박지민", "최유진", "정민수"];
const DAYS = ["월", "화", "수", "목", "금"];

// 상태 순환: 근무 → 연차 → 휴무 → (다시) 근무
type Status = "work" | "leave" | "off";
const STATUS_ORDER: Status[] = ["work", "leave", "off"];

const STATUS_META: Record<
  Status,
  { label: string; cell: string; swatch: string }
> = {
  work: {
    label: "근무",
    cell: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60",
    swatch: "bg-emerald-400",
  },
  leave: {
    label: "연차",
    cell: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60",
    swatch: "bg-amber-400",
  },
  off: {
    label: "휴무",
    cell: "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700",
    swatch: "bg-neutral-300 dark:bg-neutral-600",
  },
};

function nextStatus(current: Status): Status {
  const i = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

export default function Page() {
  // 초기값: 모두 근무. grid[직원][요일]
  const [grid, setGrid] = useState<Status[][]>(() =>
    EMPLOYEES.map(() => DAYS.map(() => "work" as Status)),
  );

  function toggleCell(empIdx: number, dayIdx: number) {
    setGrid((prev) =>
      prev.map((row, r) =>
        r === empIdx
          ? row.map((s, c) => (c === dayIdx ? nextStatus(s) : s))
          : row,
      ),
    );
  }

  return (
    <MemberShell slug="eom-yoseb">
      {/* 소개 */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-900">
        <h2 className="text-2xl font-bold">🗓️ 직원 주간 스케줄표</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          각 칸을 클릭하면 <b>근무 → 연차 → 휴무</b> 순으로 상태가 바뀝니다.
        </p>
      </section>

      {/* 스케줄 표 */}
      <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="w-24 px-2 py-2 text-left text-xs font-medium text-neutral-400">
                이름 \ 요일
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="px-2 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMPLOYEES.map((name, empIdx) => (
              <tr key={name}>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">
                  {name}
                </th>
                {DAYS.map((d, dayIdx) => {
                  const status = grid[empIdx][dayIdx];
                  const meta = STATUS_META[status];
                  return (
                    <td key={d} className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleCell(empIdx, dayIdx)}
                        className={`h-12 w-full rounded-lg font-medium transition-colors ${meta.cell}`}
                        aria-label={`${name} ${d}요일 ${meta.label}`}
                      >
                        {meta.label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 범례 */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          범례
        </h3>
        <div className="flex flex-wrap gap-5">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`inline-block h-4 w-4 rounded ${STATUS_META[s].swatch}`}
              />
              <span className="text-sm">{STATUS_META[s].label}</span>
            </div>
          ))}
        </div>
      </section>
    </MemberShell>
  );
}
