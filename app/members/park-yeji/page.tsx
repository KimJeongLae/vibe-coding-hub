"use client";

import { useEffect, useRef, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "park-yeji" 님의 페이지 — 디자인 컨펌 사이트 (MVP)
// ───────────────────────────────────────────────────────────────
// 역할이 나뉩니다.
//   🎨 디자이너 모드 : 이미지 업로드 / 삭제 (업로드 버튼은 우측 상단에 조용히)
//   ✅ 컨펌 모드     : 이미지 확대 보기 / 코멘트 / 컨펌완료 표시
// 이미지는 아래 카테고리(그룹)별로 분류해서 봅니다.
// * MVP 라서 데이터는 이 브라우저(localStorage)에 저장됩니다.
// ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "봉투 및 명함",
  "초진기록지·주차치료안내문",
  "이벤트 디자인",
  "사이니지",
  "리플렛",
  "그외 인쇄물",
] as const;

const FALLBACK_CATEGORY = "그외 인쇄물";

type Comment = { id: string; text: string; at: string };
type Design = {
  id: string;
  src: string; // data URL
  name: string;
  category: string;
  confirmed: boolean;
  comments: Comment[];
};
type Role = "designer" | "reviewer";

const STORAGE_KEY = "park-yeji-design-confirm-v2";
const DESIGNER_PASSWORD = "1234"; // 디자이너 모드 진입 비밀번호 (MVP: 클라이언트 확인용)
const DEFAULT_TITLE = "박예지님의 작업물";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function Page() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<Role>("reviewer");
  const [activeCat, setActiveCat] = useState<string>("전체");
  const [uploadCat, setUploadCat] = useState<string>(CATEGORIES[0]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 편집 가능한 제목
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // 디자이너 모드 비밀번호 잠금
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  // 최초 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Design[];
        // 카테고리가 없거나 목록에 없는 값은 기본 그룹으로 보정
        setDesigns(
          parsed.map((d) => ({
            ...d,
            category: CATEGORIES.includes(d.category as (typeof CATEGORIES)[number])
              ? d.category
              : FALLBACK_CATEGORY,
          })),
        );
      }
      const savedTitle = localStorage.getItem(`${STORAGE_KEY}-title`);
      if (savedTitle) setTitle(savedTitle);
      // 역할(role)은 저장하지 않습니다 → 새로고침하면 항상 컨펌 모드로 시작(비밀번호 재확인)
    } catch {
      // 손상된 데이터 무시
    }
    setLoaded(true);
  }, []);

  // 변경 시 저장
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    } catch {
      setError("저장 공간이 부족해요. 큰 이미지를 줄이거나 삭제해 주세요.");
    }
  }, [designs, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(`${STORAGE_KEY}-title`, title);
  }, [title, loaded]);

  const opened = designs.find((d) => d.id === openId) ?? null;
  const isDesigner = role === "designer";

  function openDesignerGate() {
    setPwd("");
    setPwdError(false);
    setPwdOpen(true);
  }

  function submitPassword() {
    if (pwd === DESIGNER_PASSWORD) {
      setRole("designer");
      setPwdOpen(false);
      setPwd("");
      setPwdError(false);
    } else {
      setPwdError(true);
    }
  }

  function saveTitle() {
    const t = titleDraft.trim();
    setTitle(t || DEFAULT_TITLE);
    setEditingTitle(false);
  }

  function countOf(cat: string) {
    return designs.filter((d) => d.category === cat).length;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) {
      setError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setDesigns((prev) => [
          ...prev,
          {
            id: makeId(),
            src: reader.result as string,
            name: file.name,
            category: uploadCat,
            confirmed: false,
            comments: [],
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeDesign(id: string) {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    if (openId === id) setOpenId(null);
  }

  function toggleConfirm(id: string) {
    setDesigns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, confirmed: !d.confirmed } : d)),
    );
  }

  function addComment(id: string) {
    const text = draft.trim();
    if (!text) return;
    setDesigns((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              comments: [
                ...d.comments,
                { id: makeId(), text, at: new Date().toLocaleString("ko-KR") },
              ],
            }
          : d,
      ),
    );
    setDraft("");
  }

  function removeComment(designId: string, commentId: string) {
    setDesigns((prev) =>
      prev.map((d) =>
        d.id === designId
          ? { ...d, comments: d.comments.filter((c) => c.id !== commentId) }
          : d,
      ),
    );
  }

  // 화면에 보여줄 카테고리 목록 (전체면 내용이 있는 그룹만 섹션으로)
  const visibleCats =
    activeCat === "전체"
      ? CATEGORIES.filter((c) => countOf(c) > 0)
      : [activeCat];

  return (
    <MemberShell slug="park-yeji">
      {/* 상단 바: 좌측 제목/역할, 우측 끝에 조용한 업로드 버튼 */}
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-rose-50 to-white p-6 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-rose-500">DESIGN CONFIRM</p>

            {/* 편집 가능한 제목 */}
            {editingTitle ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  placeholder={DEFAULT_TITLE}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-2xl font-bold outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={saveTitle}
                  className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTitle(false)}
                  className="rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-2xl font-bold">{title}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(title);
                    setEditingTitle(true);
                  }}
                  className="rounded-md px-1.5 py-0.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                  title="제목 수정"
                >
                  ✏️
                </button>
              </div>
            )}

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              카테고리별 시안을 클릭해 크게 보고, 코멘트를 남겨 컨펌하세요.
            </p>

            {/* 역할 전환 (디자이너 모드는 비밀번호 필요) */}
            <div className="mt-4 inline-flex rounded-lg border border-neutral-300 p-0.5 text-sm dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setRole("reviewer");
                  setPwdOpen(false);
                }}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  !isDesigner
                    ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                ✅ 컨펌 모드
              </button>
              <button
                type="button"
                onClick={() => (isDesigner ? undefined : openDesignerGate())}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  isDesigner
                    ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                🎨 디자이너 모드 {!isDesigner && "🔒"}
              </button>
            </div>

            {/* 비밀번호 입력 */}
            {pwdOpen && !isDesigner && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  type="password"
                  value={pwd}
                  onChange={(e) => {
                    setPwd(e.target.value);
                    setPwdError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitPassword();
                    if (e.key === "Escape") setPwdOpen(false);
                  }}
                  placeholder="비밀번호"
                  className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={submitPassword}
                  className="rounded-md bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600"
                >
                  확인
                </button>
                {pwdError && (
                  <span className="text-xs text-red-500">
                    비밀번호가 틀려요.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 우측 상단 끝: 디자이너 모드에서만 보이는 조용한 업로드 */}
          {isDesigner && (
            <div className="flex items-center gap-1.5 self-start text-xs text-neutral-500 dark:text-neutral-400">
              <select
                value={uploadCat}
                onChange={(e) => setUploadCat(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800"
                title="업로드할 그룹"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-neutral-300 px-2.5 py-1 transition-colors hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:hover:text-neutral-200"
              >
                + 업로드
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </section>

      {/* 카테고리 탭 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {["전체", ...CATEGORIES].map((c) => {
          const n = c === "전체" ? designs.length : countOf(c);
          const active = activeCat === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCat(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-rose-400 bg-rose-500 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              }`}
            >
              {c}
              <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 text-neutral-400"}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* 갤러리 */}
      {designs.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <div className="text-4xl">🖼️</div>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            아직 올린 디자인이 없어요.{" "}
            {isDesigner ? (
              <>우측 상단의 <b>+ 업로드</b>로 시안을 올려보세요.</>
            ) : (
              <>디자이너 모드로 전환하면 이미지를 올릴 수 있어요.</>
            )}
          </p>
        </section>
      ) : (
        <div className="mt-6 space-y-8">
          {visibleCats.map((cat) => {
            const items = designs.filter((d) => d.category === cat);
            if (items.length === 0) {
              return (
                <section key={cat}>
                  <h3 className="mb-3 text-sm font-semibold text-neutral-500">
                    {cat}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    이 그룹에는 아직 시안이 없어요.
                  </p>
                </section>
              );
            }
            const doneN = items.filter((d) => d.confirmed).length;
            return (
              <section key={cat}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  {cat}
                  <span className="text-xs font-normal text-neutral-400">
                    {items.length}개 · 컨펌 {doneN}/{items.length}
                  </span>
                </h3>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((d) => (
                    <li
                      key={d.id}
                      className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(d.id)}
                        className="block w-full"
                        title="크게 보기"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={d.src}
                          alt={d.name}
                          className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>

                      {d.confirmed && (
                        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                          ✓ 컨펌완료
                        </span>
                      )}

                      {isDesigner && (
                        <button
                          type="button"
                          onClick={() => removeDesign(d.id)}
                          className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                          title="삭제"
                        >
                          삭제
                        </button>
                      )}

                      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                        <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {d.name}
                        </span>
                        {d.comments.length > 0 && (
                          <span className="shrink-0 text-xs text-neutral-400">
                            💬 {d.comments.length}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* 확대 + 코멘트 라이트박스 */}
      {opened && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-1 items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={opened.src}
                alt={opened.name}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>

            <div className="flex w-full flex-col border-t border-neutral-200 dark:border-neutral-800 md:w-80 md:border-l md:border-t-0">
              <div className="flex items-start justify-between gap-2 border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="min-w-0">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {opened.category}
                  </span>
                  <h3 className="mt-1 truncate font-semibold">{opened.name}</h3>
                  {opened.confirmed && (
                    <span className="text-xs font-medium text-green-600">
                      ✓ 컨펌완료
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="shrink-0 rounded-full px-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                  title="닫기"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {opened.comments.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    아직 코멘트가 없어요.
                    {!isDesigner && " 아래에 첫 코멘트를 남겨보세요."}
                  </p>
                ) : (
                  opened.comments.map((c) => (
                    <div
                      key={c.id}
                      className="group/c rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {c.text}
                        </p>
                        {!isDesigner && (
                          <button
                            type="button"
                            onClick={() => removeComment(opened.id, c.id)}
                            className="shrink-0 text-xs text-neutral-400 opacity-0 hover:text-red-500 group-hover/c:opacity-100"
                            title="코멘트 삭제"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <time className="mt-1 block text-[11px] text-neutral-400">
                        {c.at}
                      </time>
                    </div>
                  ))
                )}
              </div>

              {/* 컨펌 모드에서만 코멘트/컨펌, 디자이너 모드에서는 삭제 */}
              <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
                {isDesigner ? (
                  <button
                    type="button"
                    onClick={() => removeDesign(opened.id)}
                    className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                  >
                    이 이미지 삭제
                  </button>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addComment(opened.id);
                        }}
                        placeholder="코멘트를 입력하고 Enter"
                        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => addComment(opened.id)}
                        className="rounded-lg bg-neutral-800 px-3 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
                      >
                        등록
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleConfirm(opened.id)}
                      className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        opened.confirmed
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      }`}
                    >
                      {opened.confirmed ? "✓ 컨펌완료 (해제하려면 클릭)" : "컨펌완료로 표시"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MemberShell>
  );
}
