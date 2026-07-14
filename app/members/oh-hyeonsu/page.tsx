"use client";

import { useEffect, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "oh-hyeonsu" 님의 페이지 — 내가 만든 작업물을 업로드하는 공간입니다.
// 입력한 작업물은 브라우저(localStorage)에 저장되어 새로고침해도 유지됩니다.

type Work = {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  createdAt: number;
};

const STORAGE_KEY = "works:oh-hyeonsu";

export default function Page() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");

  // 저장된 작업물 불러오기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWorks(JSON.parse(raw));
    } catch {
      // 무시
    }
    setLoaded(true);
  }, []);

  // 변경될 때마다 저장
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
    } catch {
      // 무시
    }
  }, [works, loaded]);

  function addWork(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const newWork: Work = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      title: t,
      description: description.trim(),
      link: link.trim(),
      image: image.trim(),
      createdAt: Date.now(),
    };
    setWorks((prev) => [newWork, ...prev]);
    setTitle("");
    setDescription("");
    setLink("");
    setImage("");
  }

  function removeWork(id: string) {
    setWorks((prev) => prev.filter((w) => w.id !== id));
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <MemberShell slug="oh-hyeonsu">
      {/* 소개 */}
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white">
        <h2 className="text-2xl font-bold">👋 오현수의 작업물 갤러리</h2>
        <p className="mt-2 text-sm text-blue-50">
          앞으로 만들 작업물을 여기에 하나씩 업로드해서 모아둡니다. 아래 폼에
          제목·설명·링크·이미지 주소를 넣고 <b>추가</b>를 누르면 카드로 쌓여요.
        </p>
      </section>

      {/* 업로드 폼 */}
      <section className="mb-10 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="mb-4 text-lg font-semibold">➕ 새 작업물 업로드</h3>
        <form onSubmit={addWork} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">제목 *</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 나의 첫 웹사이트"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">설명</label>
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 작업물인지 간단히 적어보세요."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">링크 (선택)</label>
              <input
                className={inputClass}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                이미지 주소 (선택)
              </label>
              <input
                className={inputClass}
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://.../image.png"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            추가
          </button>
        </form>
      </section>

      {/* 작업물 목록 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">📦 내 작업물</h3>
          <span className="text-sm text-neutral-400">{works.length}개</span>
        </div>

        {!loaded ? null : works.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-4xl">🗂️</div>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              아직 업로드한 작업물이 없어요. 위 폼에서 첫 작업물을 올려보세요!
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {works.map((w) => (
              <article
                key={w.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
              >
                {w.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.image}
                    alt={w.title}
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h4 className="text-base font-semibold">{w.title}</h4>
                  {w.description && (
                    <p className="mt-2 flex-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                      {w.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    {w.link ? (
                      <a
                        href={w.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        바로가기 ↗
                      </a>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => removeWork(w.id)}
                      className="text-xs text-neutral-400 transition-colors hover:text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </MemberShell>
  );
}
