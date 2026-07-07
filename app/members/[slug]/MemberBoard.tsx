"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, type Work } from "@/lib/supabase";

export default function MemberBoard({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 폼 입력값
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 이 사람의 작업물만 최신순으로 불러오기
  const loadWorks = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .eq("member_slug", slug)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setWorks(data as Work[]);
      setError(null);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !title.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("works").insert({
      member_slug: slug,
      title: title.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      image_url: imageUrl.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      // 입력값 비우고 목록 새로고침
      setTitle("");
      setDescription("");
      setLink("");
      setImageUrl("");
      await loadWorks();
    }
    setSubmitting(false);
  }

  // Supabase 미연결 안내
  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-semibold">아직 Supabase 가 연결되지 않았습니다.</p>
        <p className="mt-1">
          README 의 안내대로 <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code>{" "}
          (또는 Vercel 환경변수) 에 <code>NEXT_PUBLIC_SUPABASE_URL</code> 과{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를 넣어주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 작업물 등록 폼 */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="font-semibold">새 작업물 올리기</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (필수)"
          required
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (무엇을 만들었나요?)"
          rows={3}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="링크 URL (배포한 사이트 주소 등, 선택)"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="이미지 URL (스크린샷 등, 선택)"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "올리는 중..." : "올리기"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          오류: {error}
        </p>
      )}

      {/* 작업물 목록 */}
      <section className="space-y-4">
        {loading ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : works.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
            아직 올린 작업물이 없어요. {name} 님, 첫 작업물을 올려보세요! 🚀
          </p>
        ) : (
          works.map((work) => (
            <article
              key={work.id}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="text-lg font-semibold">{work.title}</h3>
              {work.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                  {work.description}
                </p>
              )}
              {work.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={work.image_url}
                  alt={work.title}
                  className="mt-3 max-h-64 rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
                />
              )}
              {work.link && (
                <a
                  href={work.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  🔗 {work.link}
                </a>
              )}
              <p className="mt-3 text-xs text-neutral-400">
                {new Date(work.created_at).toLocaleString("ko-KR")}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
