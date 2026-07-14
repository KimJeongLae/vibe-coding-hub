"use client";

import { useEffect, useRef, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ 이 파일이 "yu-seonghui" 님의 작업물 페이지입니다.
//
// 🩺 작업물: 간호 임상 약어 챗봇 (MVP)
// - 실제 AI 연동/문서 학습은 하지 않습니다. 아래 DICTIONARY 에 정의된 약어만 정해진 답변을 내보냅니다.
// - 새 약어를 추가하려면 DICTIONARY 에 항목을 하나 더 넣으면 됩니다.

type Entry = { full: string; ko: string; desc: string };

const DICTIONARY: Record<string, Entry> = {
  NPO: {
    full: "Nil Per Os (라틴어)",
    ko: "금식",
    desc: "수술·검사 등을 위해 입으로 음식과 물을 포함해 아무것도 섭취하지 않는 상태예요.",
  },
  PRN: {
    full: "Pro Re Nata (라틴어)",
    ko: "필요시 투여",
    desc: "정해진 시간이 아니라, 환자에게 필요할 때마다 투여하라는 처방이에요. (예: 통증 있을 때)",
  },
  BID: {
    full: "Bis In Die (라틴어)",
    ko: "하루 2회",
    desc: "약을 하루에 두 번 투여한다는 뜻이에요. (보통 아침·저녁)",
  },
  IV: {
    full: "Intravenous",
    ko: "정맥 주사",
    desc: "약물이나 수액을 정맥으로 직접 주입하는 방법이에요.",
  },
  "V/S": {
    full: "Vital Signs",
    ko: "활력징후",
    desc: "환자의 기본 생체 신호로 혈압·맥박·호흡·체온을 말해요.",
  },
  STAT: {
    full: "Statim (라틴어)",
    ko: "즉시",
    desc: "지시를 지체 없이 즉시 시행하라는 뜻이에요. (응급 상황에서 자주 사용)",
  },
};

type Msg = { who: "bot" | "user"; text: string };

// 입력에서 등록된 약어 찾기 (대소문자·점·공백 무시)
function findAbbrev(text: string): string | null {
  const norm = text.toUpperCase().replace(/[.\s]/g, "");
  for (const key of Object.keys(DICTIONARY)) {
    const keyNorm = key.replace(/[.\s]/g, "");
    if (norm.includes(keyNorm)) return key;
  }
  return null;
}

// 정해진 답변만 생성
function answer(text: string): string {
  const key = findAbbrev(text);
  if (!key) return "아직 등록되지 않은 용어입니다.";
  const d = DICTIONARY[key];
  return `${key} — ${d.ko} (${d.full})\n${d.desc}`;
}

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      who: "bot",
      text: "안녕하세요! 간호 약어 도우미예요. 🩺\n아래 약어를 누르거나 직접 입력해서 물어보세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { who: "user", text }]);
    setInput("");
    // 살짝 지연 후 봇 답변 (대화 느낌)
    setTimeout(() => {
      setMessages((prev) => [...prev, { who: "bot", text: answer(text) }]);
    }, 250);
  }

  return (
    <MemberShell slug="yu-seonghui">
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          🩺 내 작업물 · 간호 임상 약어 챗봇 (MVP)
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          병동에서 자주 쓰는 임상 약어를 물어보면 뜻을 알려주는 챗봇이에요.
          등록된 약어만 정해진 답변을 드리고, 모르는 용어는 안내 메시지가 나옵니다.
        </p>
      </section>

      {/* 챗봇 카드 */}
      <div className="mx-auto flex h-[560px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        {/* 헤더 */}
        <div className="flex items-center gap-3 bg-teal-600 px-5 py-4 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xl">
            🩺
          </div>
          <div>
            <h2 className="text-[15px] font-bold">간호 약어 도우미</h2>
            <p className="text-xs opacity-85">임상 약어를 물어보세요</p>
          </div>
        </div>

        {/* 대화 영역 */}
        <div
          ref={chatRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-950"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.who === "user"
                  ? "max-w-[85%] self-end"
                  : "max-w-[85%] self-start"
              }
            >
              <div
                className={
                  m.who === "user"
                    ? "whitespace-pre-wrap rounded-2xl rounded-br-sm bg-teal-600 px-4 py-2.5 text-sm leading-relaxed text-white"
                    : "whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-neutral-800 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                }
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* 약어 빠른 버튼 (첫 화면에만) */}
          {messages.length === 1 && (
            <div className="mt-1 flex flex-wrap gap-2 self-start">
              {Object.keys(DICTIONARY).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => send(k)}
                  className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-800 dark:bg-neutral-800 dark:text-teal-300"
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 입력창 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예) NPO가 뭐야?"
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-neutral-600 dark:bg-neutral-800"
          />
          <button
            type="submit"
            aria-label="보내기"
            className="grid w-12 place-items-center rounded-full bg-teal-600 text-lg text-white transition-colors hover:bg-teal-700"
          >
            ➤
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-xs text-neutral-400">
        ※ 실제 AI 연동 없이, 코드에 등록된 약어(NPO·PRN·BID·IV·V/S·STAT)에만 정해진 답변을 제공하는 MVP입니다.
      </p>
    </MemberShell>
  );
}
