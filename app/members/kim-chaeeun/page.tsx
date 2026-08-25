"use client";

import { useEffect, useState, type FormEvent } from "react";
import MemberShell from "@/components/MemberShell";
import { supabase, isSupabaseConfigured, type Work } from "@/lib/supabase";

const SLUG = "kim-chaeeun";

// ✏️ 이 파일이 "kim-chaeeun" 님의 페이지입니다.
// 앞으로 만들 작업물을 이 페이지에서 직접 등록하고 목록으로 확인할 수 있습니다.
export default function Page() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    loadWorks();
  }, []);

  async function loadWorks() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .eq("member_slug", SLUG)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setWorks(data ?? []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !title.trim()) return;

    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from("works").insert({
      member_slug: SLUG,
      title: title.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      image_url: imageUrl.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setTitle("");
      setDescription("");
      setLink("");
      setImageUrl("");
      await loadWorks();
    }
    setSubmitting(false);
  }

  if (!isSupabaseConfigured) {
    return (
      <MemberShell slug={SLUG}>
        <section className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <div className="text-4xl">🔌</div>
          <h2 className="mt-3 text-xl font-semibold">Supabase 미연결</h2>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            작업물을 등록하려면 관리자가 Supabase 환경변수를 연결해야 합니다.
            연결되면 이 페이지에서 바로 작업물을 올릴 수 있어요.
          </p>
        </section>
      </MemberShell>
    );
  }

  return (
    <MemberShell slug={SLUG}>
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2 className="text-lg font-semibold">새 작업물 올리기</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              제목 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="예) 나만의 To-do 앱"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="어떤 작업물인지 간단히 소개해주세요"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              링크
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              이미지 URL
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </form>

        <section>
          <h2 className="mb-3 text-lg font-semibold">내 작업물</h2>

          {loading ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              불러오는 중...
            </p>
          ) : works.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <div className="text-4xl">🚧</div>
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                아직 등록한 작업물이 없어요. 위 폼으로 첫 작업물을 올려보세요!
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {works.map((work) => (
                <li
                  key={work.id}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  {work.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={work.image_url}
                      alt={work.title}
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold">{work.title}</h3>
                    {work.description && (
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {work.description}
                      </p>
                    )}
                    {work.link && (
                      <a
                        href={work.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                      >
                        바로가기 →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </MemberShell>
  );
}
