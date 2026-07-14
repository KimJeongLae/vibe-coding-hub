"use client";

import { useEffect, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ 엄요셉(eom-yoseb) 님의 작업물 업로드 페이지입니다.
// 앞으로 만든 작업물을 아래 폼으로 추가하면 카드로 정리됩니다.
// (브라우저에 저장되어 새로고침해도 유지됩니다.)

type Work = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  link: string;
  createdAt: string;
};

const STORAGE_KEY = "eom-yoseb-works";
const EMOJIS = ["🎨", "🚀", "💡", "🧩", "📦", "🎬", "🖥️", "📱", "🎯", "✨"];

export default function Page() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 폼 입력값
  const [emoji, setEmoji] = useState("🎨");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  // 최초 로드: 저장된 작업물 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWorks(JSON.parse(saved));
    } catch {
      /* 저장된 값이 없거나 손상됨 — 무시 */
    }
    setLoaded(true);
  }, []);

  // 변경 시 저장
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
  }, [works, loaded]);

  function addWork(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const newWork: Work = {
      id: `${Date.now()}-${Math.round(Math.random() * 1000)}`,
      emoji,
      title: title.trim(),
      description: description.trim(),
      link: link.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setWorks((prev) => [newWork, ...prev]);
    setTitle("");
    setDescription("");
    setLink("");
    setEmoji("🎨");
  }

  function removeWork(id: string) {
    setWorks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <MemberShell slug="eom-yoseb">
      {/* 소개 */}
      <section className="mb-8 rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-900">
        <h2 className="text-2xl font-bold">👋 엄요셉의 작업물 아카이브</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          바이브코딩 클래스에서 만든 작업물을 하나씩 쌓아가는 공간입니다.
          아래 폼으로 새 작업물을 추가하면 카드로 정리돼요. 링크가 있으면
          카드에서 바로 열어볼 수 있습니다.
        </p>
      </section>

      {/* 작업물 추가 폼 */}
      <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-4 text-lg font-semibold">➕ 새 작업물 올리기</h3>
        <form onSubmit={addWork} className="space-y-4">
          {/* 아이콘 선택 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              아이콘
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`h-10 w-10 rounded-lg border text-lg transition-colors ${
                    emoji === em
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              제목 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 내 첫 랜딩 페이지"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 작업물인지 간단히 적어주세요"
              rows={2}
              className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* 링크 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              링크 (선택)
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            작업물 추가
          </button>
        </form>
      </section>

      {/* 작업물 목록 */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          📂 내 작업물
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {works.length}
          </span>
        </h3>

        {works.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-4xl">🗂️</div>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              아직 올린 작업물이 없어요. 위 폼으로 첫 작업물을 추가해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {works.map((w) => (
              <div
                key={w.id}
                className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
              >
                <button
                  onClick={() => removeWork(w.id)}
                  aria-label="삭제"
                  className="absolute right-3 top-3 text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  ✕
                </button>
                <div className="text-3xl">{w.emoji}</div>
                <h4 className="mt-3 font-semibold">{w.title}</h4>
                {w.description && (
                  <p className="mt-1 flex-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {w.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
                  <span>{w.createdAt}</span>
                  {w.link && (
                    <a
                      href={w.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      열어보기 →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberShell>
  );
}
