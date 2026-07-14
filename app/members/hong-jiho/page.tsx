"use client";

import { useEffect, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "hong-jiho" 님의 페이지 — 내가 만든 작업물을 등록/업로드하는 공간입니다.
// 등록한 작업물은 이 브라우저에 저장되어 새로고침해도 유지됩니다.
// (나중에 Supabase 를 연결하면 이 저장 부분만 바꿔서 모두에게 공유할 수 있어요.)

const SLUG = "hong-jiho";
const STORAGE_KEY = `works:${SLUG}`;

type Work = {
  id: string;
  title: string;
  category: string;
  description: string;
  link: string;
  createdAt: string;
};

const CATEGORIES = ["웹", "앱", "디자인", "문서", "기타"] as const;

export default function Page() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  // 저장된 작업물 불러오기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWorks(JSON.parse(raw) as Work[]);
    } catch {
      // 저장된 데이터가 손상된 경우 무시
    }
    setLoaded(true);
  }, []);

  // 작업물이 바뀔 때마다 저장 (첫 로드 이후에만)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
  }, [works, loaded]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const newWork: Work = {
      id: crypto.randomUUID(),
      title: trimmed,
      category,
      description: description.trim(),
      link: link.trim(),
      createdAt: new Date().toISOString(),
    };

    setWorks((prev) => [newWork, ...prev]);
    setTitle("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setLink("");
  }

  function handleDelete(id: string) {
    setWorks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <MemberShell slug={SLUG}>
      {/* 작업물 등록 폼 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-lg font-semibold">➕ 새 작업물 등록</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          내가 만든 작업물의 정보를 입력하고 등록해보세요.
        </p>

        <form onSubmit={handleAdd} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">제목 *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 나만의 포트폴리오 사이트"
                className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700"
                required
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">분류</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-black">
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">설명</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 작업물인지 간단히 적어주세요."
              rows={3}
              className="resize-y rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">링크 (선택)</span>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700"
            />
          </label>

          <div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              disabled={!title.trim()}
            >
              등록하기
            </button>
          </div>
        </form>
      </section>

      {/* 등록된 작업물 목록 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            📦 내 작업물
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {works.length}개
            </span>
          </h2>
        </div>

        {works.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-4xl">🗂️</div>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              아직 등록한 작업물이 없어요. 위에서 첫 작업물을 등록해보세요!
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {works.map((work) => (
              <li
                key={work.id}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                      {work.category}
                    </span>
                    <h3 className="mt-2 truncate text-base font-semibold">
                      {work.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDelete(work.id)}
                    aria-label="삭제"
                    className="shrink-0 rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  >
                    ✕
                  </button>
                </div>

                {work.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                    {work.description}
                  </p>
                )}

                {work.link && (
                  <a
                    href={work.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block truncate text-sm text-blue-600 hover:underline"
                  >
                    🔗 {work.link}
                  </a>
                )}

                <time className="mt-auto pt-3 text-xs text-neutral-400">
                  {new Date(work.createdAt).toLocaleDateString("ko-KR")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MemberShell>
  );
}
