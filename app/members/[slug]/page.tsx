import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember } from "@/lib/members";
import MemberBoard from "./MemberBoard";

// Next 16 에서 params 는 Promise 입니다. 반드시 await 합니다.
export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getMember(slug);

  // 명단에 없는 slug 로 들어오면 404.
  if (!member) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="text-sm text-neutral-500 transition-colors hover:text-blue-600 dark:text-neutral-400"
      >
        ← 전체 목록으로
      </Link>

      <header className="mt-4 mb-8">
        <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {member.team}
        </span>
        <h1 className="mt-2 text-3xl font-bold">
          {member.name}
          <span className="ml-2 text-lg font-normal text-neutral-400">
            님의 작업물
          </span>
        </h1>
      </header>

      <MemberBoard slug={member.slug} name={member.name} />
    </main>
  );
}
