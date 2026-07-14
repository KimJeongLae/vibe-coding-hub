import MemberShell from "@/components/MemberShell";

// ✏️ 이 파일이 "jeong-sinwoo" 님의 페이지입니다.
//
// 📌 앞으로 만든 작업물을 여기에 "업로드"하세요!
//    아래 `works` 배열에 항목을 하나 추가하면 카드가 자동으로 생깁니다.
//    (별도 서버 없이, 이 파일만 수정하면 바로 화면에 반영됩니다.)
//
//    새 작업물 추가 예시 ↓ 를 복사해서 채우기만 하면 끝!
//    {
//      emoji: "🛠️",
//      title: "프로젝트 이름",
//      description: "무엇을 만들었는지 한 줄 설명",
//      tags: ["Next.js", "Tailwind"],
//      link: "https://...", // (선택) 없으면 지워도 됨
//      date: "2026-07",
//    },

type Work = {
  emoji: string;
  title: string;
  description: string;
  tags?: string[];
  link?: string;
  date?: string;
};

// 👇 여기에 작업물을 계속 추가하세요 (위쪽이 최신)
const works: Work[] = [
  // 아직 비어있어요. 첫 작업물을 추가해보세요!
];

export default function Page() {
  return (
    <MemberShell slug="jeong-sinwoo">
      {/* 소개 배너 */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-sm">
        <p className="text-sm font-medium text-white/80">🚀 나의 작업물 아카이브</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          여기에 내가 만든 것들을 하나씩 쌓아갑니다
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/90">
          바이브코딩으로 만든 프로젝트, 실험, 아이디어를 카드로 올려요.
          새 작업물이 생길 때마다 이 페이지에 추가됩니다.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
          <span className="text-lg">📦</span>
          현재 작업물 {works.length}개
        </div>
      </section>

      {/* 작업물 목록 */}
      <section className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">작업물</h3>

        {works.length === 0 ? (
          // 아직 작업물이 없을 때 보이는 안내
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-4xl">✨</div>
            <h4 className="mt-3 text-lg font-semibold">첫 작업물을 기다리는 중</h4>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              이 파일을 열어서 상단의{" "}
              <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm dark:bg-neutral-800">
                works
              </code>{" "}
              배열에 항목을 추가하면 여기에 카드로 나타나요.
            </p>
            <p className="mt-1">
              <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm dark:bg-neutral-800">
                app/members/jeong-sinwoo/page.tsx
              </code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {works.map((work, i) => {
              const card = (
                <article className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{work.emoji}</div>
                    {work.date && (
                      <span className="text-xs text-neutral-400">{work.date}</span>
                    )}
                  </div>
                  <h4 className="mt-3 text-base font-semibold">{work.title}</h4>
                  <p className="mt-1.5 flex-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {work.description}
                  </p>
                  {work.tags && work.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {work.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {work.link && (
                    <span className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      바로가기 →
                    </span>
                  )}
                </article>
              );

              return work.link ? (
                <a
                  key={i}
                  href={work.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {card}
                </a>
              ) : (
                <div key={i}>{card}</div>
              );
            })}
          </div>
        )}
      </section>
    </MemberShell>
  );
}
