import MemberShell from "@/components/MemberShell";

// ✏️ 이 파일이 "hong-jiho" 님의 페이지입니다.
// 아래 내용을 자유롭게 바꿔서 나만의 작업물을 만들어보세요!
// (Claude Code 에게 "이 페이지에 ___ 만들어줘" 라고 말해보세요.)
export default function Page() {
  return (
    <MemberShell slug="hong-jiho">
      <section className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <div className="text-4xl">🚧</div>
        <h2 className="mt-3 text-xl font-semibold">아직 작업물이 없어요</h2>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          이 페이지 파일을 열어서 자유롭게 꾸며보세요:
        </p>
        <p className="mt-1">
          <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm dark:bg-neutral-800">
            app/members/hong-jiho/page.tsx
          </code>
        </p>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          예) Claude Code 에게 <b>&quot;이 페이지에 내 소개와 내가 만든 것들을 카드로 보여줘&quot;</b>
        </p>
      </section>
    </MemberShell>
  );
}
