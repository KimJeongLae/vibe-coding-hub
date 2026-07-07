import Link from "next/link";
import { getMember } from "@/lib/members";

// 참가자 페이지 공통 틀 (뒤로가기 + 이름/팀 헤더).
// 각 참가자는 이 안(children)에 자기 작업물을 자유롭게 채웁니다.
export default function MemberShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const member = getMember(slug);
  const name = member?.name ?? slug;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link
        href="/"
        className="text-sm text-neutral-500 transition-colors hover:text-blue-600 dark:text-neutral-400"
      >
        ← 전체 목록으로
      </Link>

      <header className="mt-4 mb-8">
        {member?.team && (
          <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {member.team}
          </span>
        )}
        <h1 className="mt-2 text-3xl font-bold">
          {name}
          <span className="ml-2 text-lg font-normal text-neutral-400">
            님의 작업물
          </span>
        </h1>
      </header>

      {/* 👇 각자 만든 작업물이 여기에 들어갑니다 */}
      {children}
    </main>
  );
}
