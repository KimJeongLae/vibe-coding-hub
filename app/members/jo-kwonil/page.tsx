"use client";

import { useEffect, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ 이 파일은 "jo-kwonil"(조권일) 님의 페이지입니다.
// 앞으로 만들 작업물을 등록·전시하는 갤러리 페이지입니다.
// 등록한 작업물은 이 브라우저(localStorage)에 저장됩니다.
// (Supabase 없이도 동작하는 데모용 저장 방식입니다.)

type Work = {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  createdAt: number;
};

const STORAGE_KEY = "works:jo-kwonil";

export default function Page() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");

  // 처음 렌더링 시 저장된 작업물 불러오기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWorks(JSON.parse(raw) as Work[]);
    } catch {
      // 저장된 데이터가 손상된 경우 무시
    }
    setLoaded(true);
  }, []);

  // 변경될 때마다 저장
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
  }, [works, loaded]);

  function addWork(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const newWork: Work = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      title: trimmedTitle,
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

  return (
    <MemberShell slug="jo-kwonil">
      {/* 작업물 등록 폼 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">➕ 새 작업물 등록</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          내가 만든 작업물을 등록하면 아래에 카드로 쌓입니다. (이 브라우저에 저장돼요)
        </p>

        <form onSubmit={addWork} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 사내 재고 관리 대시보드"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 작업물인지 간단히 설명해주세요."
              rows={3}
              className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">링크 (URL)</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                이미지 URL
              </label>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://.../thumbnail.png"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            작업물 등록하기
          </button>
        </form>
      </section>

      {/* 작업물 목록 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            내 작업물{" "}
            <span className="text-sm font-normal text-neutral-400">
              ({works.length})
            </span>
          </h2>
        </div>

        {loaded && works.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-4xl">🗂️</div>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              아직 등록한 작업물이 없어요. 위 폼에서 첫 작업물을 등록해보세요!
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {works.map((work) => (
            <article
              key={work.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              {work.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={work.image}
                  alt={work.title}
                  className="h-44 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{work.title}</h3>
                  <button
                    onClick={() => removeWork(work.id)}
                    aria-label="삭제"
                    className="shrink-0 rounded-md px-1.5 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
                {work.description && (
                  <p className="mt-2 flex-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
                    {work.description}
                  </p>
                )}
                {work.link && (
                  <a
                    href={work.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    바로가기 →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </MemberShell>
  );
}
