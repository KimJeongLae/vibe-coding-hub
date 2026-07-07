import Link from "next/link";
import { membersByTeam } from "@/lib/members";

const STEPS = [
  { emoji: "🤖", label: "Claude Code" },
  { emoji: "🗄️", label: "Supabase" },
  { emoji: "🐙", label: "GitHub Push" },
  { emoji: "▲", label: "Vercel 배포" },
];

// 팀별 색상 토큰. 새 팀 추가 시 여기에 한 세트만 넣으면 됩니다.
const TEAM_STYLES: Record<
  string,
  { avatar: string; ring: string; accent: string; dot: string; glow: string }
> = {
  대표: {
    avatar: "from-amber-400 to-orange-600",
    ring: "group-hover:ring-amber-400/50",
    accent: "text-amber-600 dark:text-amber-400",
    dot: "bg-gradient-to-br from-amber-400 to-orange-600",
    glow: "group-hover:shadow-amber-500/25",
  },
  정형외과: {
    avatar: "from-emerald-400 to-teal-600",
    ring: "group-hover:ring-emerald-400/50",
    accent: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-gradient-to-br from-emerald-400 to-teal-600",
    glow: "group-hover:shadow-emerald-500/20",
  },
  메디아: {
    avatar: "from-sky-400 to-blue-600",
    ring: "group-hover:ring-sky-400/50",
    accent: "text-sky-600 dark:text-sky-400",
    dot: "bg-gradient-to-br from-sky-400 to-blue-600",
    glow: "group-hover:shadow-sky-500/20",
  },
  스토어: {
    avatar: "from-violet-400 to-purple-600",
    ring: "group-hover:ring-violet-400/50",
    accent: "text-violet-600 dark:text-violet-400",
    dot: "bg-gradient-to-br from-violet-400 to-purple-600",
    glow: "group-hover:shadow-violet-500/20",
  },
};

const FALLBACK_STYLE = {
  avatar: "from-neutral-400 to-neutral-600",
  ring: "group-hover:ring-neutral-400/50",
  accent: "text-neutral-600 dark:text-neutral-400",
  dot: "bg-gradient-to-br from-neutral-400 to-neutral-600",
  glow: "group-hover:shadow-neutral-500/20",
};

export default function Home() {
  const teams = membersByTeam();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      {/* 헤더 */}
      <header className="mb-12 text-center">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-blue-600 dark:text-blue-400">
          VIBE CODING CLASS
        </p>
        <h1 className="bg-gradient-to-b from-neutral-900 to-neutral-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl dark:from-white dark:to-neutral-400">
          우리 회사 바이브코딩 클래스
        </h1>
        <p className="mt-3 text-base text-neutral-500 dark:text-neutral-400">
          팀에서 본인 이름을 눌러 페이지로 들어가고, 만든 작업물을 올려보세요.
        </p>

        {/* 워크플로우 배지 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-200">
                <span>{s.emoji}</span>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="text-neutral-300 dark:text-neutral-600">→</span>
              )}
            </div>
          ))}
        </div>
      </header>

      {/* 팀별 섹션 */}
      <div className="space-y-12">
        {teams.map(({ team, members }) => {
          const style = TEAM_STYLES[team] ?? FALLBACK_STYLE;
          return (
            <section key={team}>
              <div className="mb-5 flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                <h2 className="text-base font-bold tracking-tight">{team}</h2>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-400 dark:bg-neutral-800">
                  {members.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {members.map((member) => (
                  <Link
                    key={member.slug}
                    href={`/members/${member.slug}`}
                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm ring-2 ring-transparent backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60 ${style.ring} ${style.glow}`}
                  >
                    {/* 아바타 (이름 첫 글자) */}
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${style.avatar}`}
                    >
                      {member.name[0]}
                    </span>

                    <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {member.name}
                    </span>

                    <span
                      className={`-mt-1.5 flex items-center gap-1 text-xs font-medium opacity-0 transition-all duration-300 group-hover:opacity-100 ${style.accent}`}
                    >
                      작업물 보기
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-16 text-center text-xs text-neutral-400">
        Claude Code · Supabase · GitHub · Vercel 로 만든 실습 프로젝트
      </footer>
    </main>
  );
}
