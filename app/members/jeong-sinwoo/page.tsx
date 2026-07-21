"use client";

import { useEffect, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "jeong-sinwoo" 님의 페이지 — 인사서식 자동 작성 MVP
// 상단 탭: 재직증명서 / 사직서 / 경력증명서 / 경위서 / 시말서 / 저장된 정보
// 왼쪽 폼 입력 → 오른쪽 미리보기 실시간 갱신 → [인쇄]로 브라우저 인쇄(PDF 저장 가능).
// [저장]하면 브라우저(localStorage)에 보관되고, "저장된 정보" 탭에서 버튼 한 번으로 다시 불러옵니다.
// 서버 DB/로그인/파일 다운로드 없음. 한 화면으로 끝.

type Tab =
  | "employment"
  | "resignation"
  | "career"
  | "incident"
  | "apology"
  | "saved";
type DocTab = Exclude<Tab, "saved">;

const TABS: { key: Tab; label: string }[] = [
  { key: "employment", label: "재직증명서" },
  { key: "resignation", label: "사직서" },
  { key: "career", label: "경력증명서" },
  { key: "incident", label: "경위서" },
  { key: "apology", label: "시말서" },
  { key: "saved", label: "저장된 정보" },
];

const STORE_KEY = "jeong-sinwoo:hr-forms";

const DOC_LABEL: Record<DocTab, string> = {
  employment: "재직증명서",
  resignation: "사직서",
  career: "경력증명서",
  incident: "경위서",
  apology: "시말서",
};

// 전자서명 사이트 (싸인투게더)
const SIGN_SERVICE = { name: "싸인투게더", url: "https://sign2gether.com/" };

// 상대방이 직접 작성·서명한 뒤 나에게 회신해야 하는 문서
const COUNTERPARTY_DOCS: DocTab[] = ["resignation", "incident", "apology"];

// yyyy-mm-dd → "YYYY년 M월 D일"
function formatKoreanDate(value: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return "";
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

// 사직서 작성 시 대표적인 금기사항(주의사항)
const RESIGN_TABOOS = [
  "회사·상사에 대한 비난, 불만, 감정적 표현을 적지 않는다.",
  "사직 사유는 구체적으로 나열하기보다 ‘일신상의 사유’로 간결하게 쓴다.",
  "퇴사 희망일은 인수인계를 고려해 최소 30일 전 여유 있게 정한다.",
  "구두 통보로 끝내지 말고 반드시 서면으로 제출·보관한다.",
  "허위·과장된 내용이나 회사 기밀을 적지 않는다.",
];

// 경위서·시말서 작성 시 대표적인 금기사항(주의사항)
const INCIDENT_TABOOS = [
  "변명이나 책임 회피성 표현을 늘어놓지 않는다.",
  "감정적 표현·타인 비방을 피하고 사실 위주로 작성한다.",
  "육하원칙(누가·언제·어디서·무엇을·어떻게·왜)에 따라 구체적으로 쓴다.",
  "시말서는 반성과 재발방지 의지를 분명하게 밝힌다.",
  "허위·과장 없이 사실 그대로 작성한다.",
];

type Fields = {
  name: string;
  rrn: string;
  address: string;
  dept: string;
  position: string;
  joinDate: string;
  leaveDate: string;
  duty: string;
  purpose: string;
  reason: string;
  // 경위서·시말서용
  incidentDate: string;
  place: string;
  subject: string;
  content: string;
  company: string;
  ceo: string;
};

const EMPTY: Fields = {
  name: "",
  rrn: "",
  address: "",
  dept: "",
  position: "",
  joinDate: "",
  leaveDate: "",
  duty: "",
  purpose: "",
  reason: "일신상의 사유",
  incidentDate: "",
  place: "",
  subject: "",
  content: "",
  company: "",
  ceo: "",
};

type Saved = { id: number; doc: DocTab; data: Fields };

// 작업물 갤러리에 올라가는 항목 (인사서식 앱 외에 앞으로 추가할 작업물들)
type Work = { id: number; title: string; desc: string; link: string; date: string };
const WORKS_KEY = "jeong-sinwoo:works";

export default function Page() {
  const [tab, setTab] = useState<Tab>("employment");
  const [lastDoc, setLastDoc] = useState<DocTab>("employment");
  const [f, setF] = useState<Fields>(EMPTY);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [toEmail, setToEmail] = useState("shinuing@naver.com");

  // 작업물 갤러리 (기본은 목록 화면, 인사서식 앱은 그 중 한 카드로 들어감)
  const [view, setView] = useState<"gallery" | "hr-app">("gallery");
  const [works, setWorks] = useState<Work[]>([]);
  const [newWork, setNewWork] = useState({ title: "", desc: "", link: "" });

  const up =
    (k: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));

  // 발급일(오늘)은 하이드레이션 불일치를 피하려고 마운트 후에 채웁니다.
  const [issueDate, setIssueDate] = useState("");
  useEffect(() => {
    const now = new Date();
    setIssueDate(
      `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
    );
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* 무시 */
    }
    try {
      const rawWorks = localStorage.getItem(WORKS_KEY);
      if (rawWorks) setWorks(JSON.parse(rawWorks));
    } catch {
      /* 무시 */
    }
  }, []);

  function persist(next: Saved[]) {
    setSaved(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* 무시 */
    }
  }

  function handleSave() {
    if (!f.name.trim()) {
      setSavedMsg("이름을 입력하면 저장할 수 있어요.");
      return;
    }
    const doc = (tab === "saved" ? lastDoc : (tab as DocTab)) || "employment";
    const label = DOC_LABEL[doc] || "문서";
    // 누를 때마다 새 항목으로 추가 (여러 건 저장)
    const next = [{ id: Date.now(), doc, data: { ...f } }, ...saved];
    persist(next);
    setSavedMsg(
      `‘${label} - ${f.name}’ 저장됨 (총 ${next.length}개). 여러 개 저장할 수 있어요.`
    );
  }

  function loadEntry(entry: Saved) {
    setF({ ...entry.data });
    const doc = (entry.doc ?? "employment") as DocTab;
    setLastDoc(doc);
    setTab(doc);
  }

  function removeEntry(id: number) {
    persist(saved.filter((s) => s.id !== id));
  }

  function persistWorks(next: Work[]) {
    setWorks(next);
    try {
      localStorage.setItem(WORKS_KEY, JSON.stringify(next));
    } catch {
      /* 무시 */
    }
  }

  function addWork() {
    if (!newWork.title.trim()) {
      setSavedMsg("작업물 제목을 입력하면 등록할 수 있어요.");
      return;
    }
    const today = new Date();
    const date = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    const next = [
      {
        id: Date.now(),
        title: newWork.title.trim(),
        desc: newWork.desc.trim(),
        link: newWork.link.trim(),
        date,
      },
      ...works,
    ];
    persistWorks(next);
    setNewWork({ title: "", desc: "", link: "" });
  }

  function removeWork(id: number) {
    persistWorks(works.filter((w) => w.id !== id));
  }

  // 현재 탭 문서 하나를 이메일/서명용 평문으로 변환
  function buildPlainText(): string {
    const sign = `\n\n${issueDate || ""}\n${f.company || "주식회사 ○○○○"}`;
    const writer = `\n\n${issueDate || ""}\n작성자 ${f.name || "___"} (서명 또는 인)`;
    const ceoName = f.ceo || "○ ○ ○";

    if (tab === "employment") {
      const period = f.joinDate ? `${formatKoreanDate(f.joinDate)} ~ 현재` : "-";
      return (
        `[재직증명서]\n\n` +
        `성명: ${f.name || "-"}\n주민등록번호: ${f.rrn || "-"}\n주소: ${f.address || "-"}\n` +
        `소속: ${f.dept || "-"}\n직위: ${f.position || "-"}\n재직기간: ${period}\n` +
        `담당업무: ${f.duty || "-"}\n용도: ${f.purpose || "-"}\n\n` +
        `위와 같이 재직하고 있음을 증명합니다.${sign}\n대표자 ${ceoName} (인)`
      );
    }
    if (tab === "career") {
      const period =
        f.joinDate || f.leaveDate
          ? `${formatKoreanDate(f.joinDate) || "____"} ~ ${formatKoreanDate(f.leaveDate) || "현재"}`
          : "-";
      return (
        `[경력증명서]\n\n` +
        `성명: ${f.name || "-"}\n주민등록번호: ${f.rrn || "-"}\n주소: ${f.address || "-"}\n\n` +
        `[경력사항]\n근무기간: ${period}\n부서: ${f.dept || "-"}\n직위: ${f.position || "-"}\n담당업무: ${f.duty || "-"}\n` +
        (f.purpose ? `용도: ${f.purpose}\n` : "") +
        `\n위와 같이 경력을 증명합니다.${sign}\n대표자 ${ceoName} (인)`
      );
    }
    if (tab === "resignation") {
      const leave = f.leaveDate ? formatKoreanDate(f.leaveDate) : "____년 __월 __일";
      const reason = f.reason || "일신상의 사유";
      return (
        `[사직서]\n\n` +
        `소속: ${f.dept || "-"}\n직위: ${f.position || "-"}\n성명: ${f.name || "-"}\n\n` +
        `본인은 ${reason}(으)로 인하여 ${leave}자로 사직하고자 하오니 재가하여 주시기 바랍니다.` +
        `${writer}\n\n${f.company || "주식회사 ○○○○"} 대표자 귀하`
      );
    }
    // incident / apology
    const title = tab === "apology" ? "시말서" : "경위서";
    const closing =
      tab === "apology"
        ? "본인은 위와 같은 사실에 대하여 깊이 반성하며, 다시는 이와 같은 일이 발생하지 않도록 하겠습니다. 만일 재발할 경우 어떠한 처분도 감수하겠습니다."
        : "위와 같이 사실 그대로 작성하였음을 확인합니다.";
    return (
      `[${title}]\n\n` +
      `소속: ${f.dept || "-"}\n직위: ${f.position || "-"}\n성명: ${f.name || "-"}\n` +
      `발생일자: ${formatKoreanDate(f.incidentDate) || "-"}\n발생장소: ${f.place || "-"}\n제목: ${f.subject || "-"}\n\n` +
      `[내용]\n${f.content || "-"}\n\n${closing}` +
      `${writer}\n\n${f.company || "주식회사 ○○○○"} 대표자 귀하`
    );
  }

  // 이메일 본문에 붙여넣을 표 서식 HTML 생성 (인라인 스타일 → 메일에서도 표 유지)
  function buildHtml(): string {
    const esc = (s: string) =>
      (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cell = (v: string, span = 1) =>
      `<td colspan="${span}" style="border:1px solid #555;padding:8px 12px;font-size:13px">${esc(v) || "&nbsp;"}</td>`;
    const head = (v: string, span = 1) =>
      `<th colspan="${span}" style="border:1px solid #555;padding:8px 12px;font-size:13px;background:#f3f4f6;font-weight:600;text-align:left">${v}</th>`;
    const title = (t: string) =>
      `<h1 style="text-align:center;font-size:26px;letter-spacing:8px;font-weight:700;margin:0 0 8px">${t}</h1>`;
    const center = (t: string, extra = "") =>
      `<p style="text-align:center;margin-top:24px;${extra}">${t}</p>`;
    const tOpen = `<table style="border-collapse:collapse;width:100%;margin-top:24px"><tbody>`;
    const wrap = (inner: string) =>
      `<div style="border:2px solid #1f2937;padding:32px;max-width:720px;margin:auto;font-family:'Malgun Gothic','맑은 고딕',sans-serif;color:#111827;background:#fff">${inner}</div>`;
    const signBlock = `${center(esc(company), "font-weight:600;font-size:18px;letter-spacing:2px")}${center("대표자 " + esc(ceo) + " (인)", "margin-top:6px")}`;

    if (tab === "employment") {
      const period = f.joinDate ? `${formatKoreanDate(f.joinDate)} ~ 현재` : "";
      return wrap(
        title("재 직 증 명 서") + tOpen +
          `<tr>${head("성 명")}${cell(f.name)}${head("주민등록번호")}${cell(f.rrn)}</tr>` +
          `<tr>${head("주 소")}${cell(f.address, 3)}</tr>` +
          `<tr>${head("소 속")}${cell(f.dept)}${head("직 위")}${cell(f.position)}</tr>` +
          `<tr>${head("재직기간")}${cell(period)}${head("담당업무")}${cell(f.duty)}</tr>` +
          `<tr>${head("용 도")}${cell(f.purpose, 3)}</tr>` +
          `</tbody></table>` +
          center("위와 같이 재직하고 있음을 증명합니다.") +
          center(issueDate, "margin-top:32px") + signBlock
      );
    }
    if (tab === "career") {
      const period =
        f.joinDate || f.leaveDate
          ? `${formatKoreanDate(f.joinDate) || "____"} ~ ${formatKoreanDate(f.leaveDate) || "현재"}`
          : "";
      return wrap(
        title("경 력 증 명 서") + tOpen +
          `<tr>${head("성 명")}${cell(f.name)}${head("주민등록번호")}${cell(f.rrn)}</tr>` +
          `<tr>${head("주 소")}${cell(f.address, 3)}</tr>` +
          `</tbody></table>` +
          `<p style="margin-top:20px;font-weight:600;font-size:13px">■ 경력사항</p>` +
          `<table style="border-collapse:collapse;width:100%;margin-top:6px;text-align:center"><tbody>` +
          `<tr>${head("근무기간")}${head("부서")}${head("직위")}${head("담당업무")}</tr>` +
          `<tr>${cell(period)}${cell(f.dept)}${cell(f.position)}${cell(f.duty)}</tr>` +
          `</tbody></table>` +
          (f.purpose ? `<p style="margin-top:20px;font-size:13px"><b>용도 : </b>${esc(f.purpose)}</p>` : "") +
          center("위와 같이 경력을 증명합니다.") +
          center(issueDate, "margin-top:32px") + signBlock
      );
    }
    if (tab === "resignation") {
      const leave = f.leaveDate ? formatKoreanDate(f.leaveDate) : "____년 __월 __일";
      const reason = f.reason || "일신상의 사유";
      return wrap(
        title("사 직 서") + tOpen +
          `<tr>${head("소 속")}${cell(f.dept)}${head("직 위")}${cell(f.position)}</tr>` +
          `<tr>${head("성 명")}${cell(f.name, 3)}</tr>` +
          `</tbody></table>` +
          center(
            `본인은 <b>${esc(reason)}</b>(으)로 인하여 <b>${leave}</b>자로<br>사직하고자 하오니 재가하여 주시기 바랍니다.`,
            "margin-top:36px;line-height:1.9"
          ) +
          center(issueDate, "margin-top:40px") +
          center(`작성자 ${esc(f.name)} (서명 또는 인)`, "margin-top:20px") +
          center(`${esc(company)} 대표자 귀하`, "margin-top:32px;font-weight:600;letter-spacing:2px")
      );
    }
    // incident / apology
    const isApology = tab === "apology";
    const closing = isApology
      ? "본인은 위와 같은 사실에 대하여 깊이 반성하며, 다시는 이와 같은 일이 발생하지 않도록 하겠습니다. 만일 재발할 경우 어떠한 처분도 감수하겠습니다."
      : "위와 같이 사실 그대로 작성하였음을 확인합니다.";
    const contentLabel = isApology ? "■ 사건 경위 및 반성 내용" : "■ 경위 내용";
    return wrap(
      title(isApology ? "시 말 서" : "경 위 서") + tOpen +
        `<tr>${head("소 속")}${cell(f.dept)}${head("직 위")}${cell(f.position)}</tr>` +
        `<tr>${head("성 명")}${cell(f.name)}${head("발생일자")}${cell(formatKoreanDate(f.incidentDate))}</tr>` +
        `<tr>${head("발생장소")}${cell(f.place, 3)}</tr>` +
        `<tr>${head("제 목")}${cell(f.subject, 3)}</tr>` +
        `</tbody></table>` +
        `<p style="margin-top:20px;font-weight:600;font-size:13px">${contentLabel}</p>` +
        `<div style="border:1px solid #555;padding:16px;min-height:120px;white-space:pre-wrap;font-size:13px;line-height:1.7;margin-top:6px">${esc(f.content) || "&nbsp;"}</div>` +
        center(closing, "margin-top:28px") +
        center(issueDate, "margin-top:36px") +
        center(`작성자 ${esc(f.name)} (서명 또는 인)`, "margin-top:20px") +
        center(`${esc(company)} 대표자 귀하`, "margin-top:28px;font-weight:600;letter-spacing:2px")
    );
  }

  // 이메일로 보내기 — 표 서식(HTML)을 복사한 뒤 Gmail 작성창을 열어 붙여넣기
  async function sendEmail() {
    const label = DOC_LABEL[tab as DocTab] || "문서";
    const subject = `${label}${f.name ? ` - ${f.name}` : ""}`;
    const to = toEmail || "shinuing@naver.com";
    let copied = false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([buildHtml()], { type: "text/html" }),
          "text/plain": new Blob([buildPlainText()], { type: "text/plain" }),
        }),
      ]);
      copied = true;
    } catch {
      copied = false;
    }
    setSavedMsg(
      copied
        ? `✅ 문서(표 서식)를 복사했어요. 열린 Gmail에서 ① 본문 클릭 → ② Ctrl+V 로 붙여넣으면 PDF처럼 표 그대로 들어갑니다. (받는사람: ${to})`
        : "표 복사가 지원되지 않는 브라우저예요. PDF로 저장해 메일에 첨부해 주세요."
    );
    const url =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(to)}` +
      `&su=${encodeURIComponent(subject)}`;
    window.open(url, "_blank", "noopener");
  }

  // 현재 문서를 PDF로 저장 — 브라우저 인쇄 엔진 사용(화면과 동일, 한글·표 깨짐/잘림 없음)
  function handlePdf() {
    const label = DOC_LABEL[tab as DocTab] || "문서";
    const prevTitle = document.title;
    // 저장 시 제안되는 파일명이 문서명이 되도록 title 임시 변경
    document.title = `${label}${f.name ? "_" + f.name : ""}`;
    setSavedMsg("인쇄 창에서 대상을 ‘PDF로 저장’으로 선택하면 문서가 그대로 저장됩니다.");
    window.print();
    window.setTimeout(() => {
      document.title = prevTitle;
    }, 800);
  }

  // 전자서명 사이트(싸인투게더)로 전달 — 내용+서명자 복사 후 사이트 열기
  async function sendToSign() {
    const isCounter = COUNTERPARTY_DOCS.includes(tab as DocTab);
    const receiver = toEmail ? `[서명자] ${toEmail}\n\n` : "";
    const payload = receiver + buildPlainText();
    const step = isCounter
      ? `${SIGN_SERVICE.name}를 열었어요. 새 서명요청 → 내용 붙여넣기/업로드 → 서명자에 상대방(받는사람) 지정 → 요청하면 상대방이 작성·서명 후 회신됩니다.`
      : `${SIGN_SERVICE.name}를 열었어요. 새 서명요청 → 내용 붙여넣기/업로드 → 서명자 지정 후 요청하세요.`;
    try {
      await navigator.clipboard.writeText(payload);
      setSavedMsg(`문서 내용을 복사했어요. ${step}`);
    } catch {
      setSavedMsg(step);
    }
    window.open(SIGN_SERVICE.url, "_blank", "noopener");
  }

  const company = f.company || "주식회사 ○○○○";
  const ceo = f.ceo || "○ ○ ○";

  const isCert = tab === "employment" || tab === "career";
  const isNarrative = tab === "incident" || tab === "apology";

  return (
    <MemberShell slug="jeong-sinwoo">
      {view === "gallery" ? (
        <GalleryView
          works={works}
          onOpenHr={() => setView("hr-app")}
          newWork={newWork}
          setNewWork={setNewWork}
          onAddWork={addWork}
          onRemoveWork={removeWork}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setView("gallery")}
            className="print:hidden mb-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            ← 작업물 목록으로
          </button>

          {/* 인쇄 시 미리보기(#cert-print)만 남기고 나머지는 숨김 */}
          <style>{`
        /* PDF 캡처 시 최신 색상함수(oklch) 파싱 오류를 피하려고 색을 hex로 고정 */
        .pdf-capture, .pdf-capture * { color: #111827 !important; border-color: #4b5563 !important; }
        .pdf-capture { background: #ffffff !important; box-shadow: none !important; }
        .pdf-capture th { background: #f3f4f6 !important; }
        .pdf-capture .text-neutral-300 { color: #d1d5db !important; }
        @media print {
          body * { visibility: hidden !important; }
          #cert-print, #cert-print * { visibility: visible !important; }
          #cert-print {
            position: absolute; left: 0; top: 0;
            width: 100%; margin: 0; padding: 48px;
            box-shadow: none !important;
            background: #fff !important; color: #000 !important;
          }
        }
      `}</style>

      {/* ─── 상단 탭 ─── */}
      <div className="print:hidden mb-5 flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              if (t.key !== "saved") setLastDoc(t.key);
            }}
            className={
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
              (tab === t.key
                ? "bg-white text-indigo-600 shadow-sm dark:bg-neutral-950 dark:text-indigo-400"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200")
            }
          >
            {t.label}
            {t.key === "saved" && saved.length > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                {saved.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── "저장된 정보" 탭 ─── */}
      {tab === "saved" ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold">저장된 정보</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            문서마다 여러 건 저장할 수 있어요. 항목을 누르면 그 문서·정보가 폼에
            바로 채워집니다.
          </p>

          {saved.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              아직 저장된 정보가 없어요. 문서 탭에서 정보를 입력하고
              <b> 💾 정보 저장</b>을 눌러보세요.
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {saved.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => loadEntry(s)}
                    className="flex flex-1 flex-wrap items-center gap-x-2 text-left"
                  >
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {DOC_LABEL[(s.doc ?? "employment") as DocTab]}
                    </span>
                    <span className="font-medium">
                      {s.data.name || "(이름 없음)"}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {[s.data.dept, s.data.position]
                        .filter(Boolean)
                        .join(" · ") || "정보 불러오기"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadEntry(s)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    불러오기
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(s.id)}
                    aria-label="삭제"
                    className="rounded-lg px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ─── 왼쪽: 입력 폼 ─── */}
          <section className="print:hidden rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">정보 입력</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              입력하면 오른쪽 문서가 실시간으로 완성됩니다.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="성명">
                <input value={f.name} onChange={up("name")} placeholder="홍길동" className={inputCls} />
              </Field>

              {isCert && (
                <>
                  <Field label="주민등록번호">
                    <input value={f.rrn} onChange={up("rrn")} placeholder="900101-1234567" className={inputCls} />
                  </Field>
                  <Field label="주소">
                    <input value={f.address} onChange={up("address")} placeholder="서울특별시 ○○구 ○○로 00" className={inputCls} />
                  </Field>
                </>
              )}

              <Field label={isCert ? "부서" : "소속"}>
                <input value={f.dept} onChange={up("dept")} placeholder="개발팀" className={inputCls} />
              </Field>
              <Field label={isCert ? "직급" : "직위"}>
                <input value={f.position} onChange={up("position")} placeholder="대리" className={inputCls} />
              </Field>

              {isCert && (
                <Field label="입사일">
                  <input type="date" value={f.joinDate} onChange={up("joinDate")} className={inputCls} />
                </Field>
              )}

              {tab === "career" && (
                <Field label="근무 종료일 (미입력 시 ‘현재’로 표기)">
                  <input type="date" value={f.leaveDate} onChange={up("leaveDate")} className={inputCls} />
                </Field>
              )}

              {isCert && (
                <>
                  <Field label="담당업무">
                    <input value={f.duty} onChange={up("duty")} placeholder="웹 서비스 개발" className={inputCls} />
                  </Field>
                  <Field label="용도">
                    <input value={f.purpose} onChange={up("purpose")} placeholder="관공서 제출용" className={inputCls} />
                  </Field>
                </>
              )}

              {tab === "resignation" && (
                <>
                  <Field label="사직 사유">
                    <input value={f.reason} onChange={up("reason")} placeholder="일신상의 사유" className={inputCls} />
                  </Field>
                  <Field label="사직 희망일">
                    <input type="date" value={f.leaveDate} onChange={up("leaveDate")} className={inputCls} />
                  </Field>
                </>
              )}

              {isNarrative && (
                <>
                  <Field label="발생일자">
                    <input type="date" value={f.incidentDate} onChange={up("incidentDate")} className={inputCls} />
                  </Field>
                  <Field label="발생장소">
                    <input value={f.place} onChange={up("place")} placeholder="본사 3층 회의실" className={inputCls} />
                  </Field>
                  <Field label="제목(사안)">
                    <input value={f.subject} onChange={up("subject")} placeholder="○○ 관련 건" className={inputCls} />
                  </Field>
                  <Field
                    label={
                      tab === "apology"
                        ? "사건 경위 및 반성 내용"
                        : "경위 내용"
                    }
                  >
                    <textarea
                      value={f.content}
                      onChange={up("content")}
                      rows={5}
                      placeholder="육하원칙에 따라 사실대로 작성하세요."
                      className={inputCls + " min-h-28 resize-y"}
                    />
                  </Field>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="회사명">
                  <input value={f.company} onChange={up("company")} placeholder="주식회사 ○○○○" className={inputCls} />
                </Field>
                <Field label="대표자">
                  <input value={f.ceo} onChange={up("ceo")} placeholder="○ ○ ○" className={inputCls} />
                </Field>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                💾 정보 저장
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                🖨️ 인쇄
              </button>
              <button
                type="button"
                onClick={handlePdf}
                className="rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
              >
                📄 PDF 저장
              </button>
            </div>
            {savedMsg && (
              <p className="mt-2 text-center text-sm text-indigo-600 dark:text-indigo-400">
                {savedMsg}
              </p>
            )}

            {/* 전달하기 — 현재 탭 문서 하나만 이메일/서명 사이트로 보냄 */}
            <div className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-sm font-semibold">📤 이 문서 전달하기</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                지금 보고 있는 <b>{DOC_LABEL[tab as DocTab] ?? "문서"}</b> 한 건만
                전달됩니다. (다른 문서는 해당 탭에서 따로 보내세요.) 이메일은 표
                서식이 복사되어 Gmail 본문에 <b>붙여넣기(Ctrl+V)</b>하는 방식입니다.
              </p>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="받는사람 이메일 (예: hong@company.com)"
                className={inputCls + " mt-3"}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={sendEmail}
                  className="flex-1 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                >
                  📧 이메일로 보내기
                </button>
                <button
                  type="button"
                  onClick={sendToSign}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  ✍️ {SIGN_SERVICE.name}로 전달
                </button>
              </div>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {COUNTERPARTY_DOCS.includes(tab as DocTab)
                  ? "이 문서는 상대방이 싸인투게더에서 직접 작성·서명한 뒤 나에게 회신하는 방식입니다."
                  : "이 문서는 완성본을 싸인투게더에서 서명받아 상대방에게 전달합니다."}
                {" "}모든 문서 탭에서 이메일·싸인투게더로 보낼 수 있어요.
              </p>
            </div>

            {/* 사직서/경위서/시말서 금기사항 — 화면 안내용, 문서에는 인쇄되지 않음 */}
            {(tab === "resignation" || isNarrative) && (
              <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/30">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  ⚠️{" "}
                  {tab === "resignation"
                    ? "사직서"
                    : "경위서·시말서"}{" "}
                  작성 시 금기사항
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800/90 dark:text-amber-200/90">
                  {(tab === "resignation" ? RESIGN_TABOOS : INCIDENT_TABOOS).map(
                    (t) => (
                      <li key={t}>{t}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </section>

          {/* ─── 오른쪽: 실시간 미리보기 ─── */}
          <section>
            <h2 className="mb-2 text-sm font-medium text-neutral-500 print:hidden dark:text-neutral-400">
              미리보기
            </h2>
            <div
              id="cert-print"
              className="border-2 border-neutral-800 bg-white p-10 text-neutral-900 shadow-sm"
            >
              {tab === "employment" && (
                <EmploymentDoc f={f} issueDate={issueDate} company={company} ceo={ceo} />
              )}
              {tab === "career" && (
                <CareerDoc f={f} issueDate={issueDate} company={company} ceo={ceo} />
              )}
              {tab === "resignation" && (
                <ResignationDoc f={f} issueDate={issueDate} company={company} />
              )}
              {tab === "incident" && (
                <NarrativeDoc kind="incident" f={f} issueDate={issueDate} company={company} />
              )}
              {tab === "apology" && (
                <NarrativeDoc kind="apology" f={f} issueDate={issueDate} company={company} />
              )}
            </div>
          </section>
        </div>
          )}
        </>
      )}
    </MemberShell>
  );
}

/* ───────────── 작업물 갤러리 ───────────── */

function GalleryView({
  works,
  onOpenHr,
  newWork,
  setNewWork,
  onAddWork,
  onRemoveWork,
}: {
  works: Work[];
  onOpenHr: () => void;
  newWork: { title: string; desc: string; link: string };
  setNewWork: React.Dispatch<
    React.SetStateAction<{ title: string; desc: string; link: string }>
  >;
  onAddWork: () => void;
  onRemoveWork: (id: number) => void;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">내 작업물</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          지금까지 만든 작업물과, 앞으로 새로 올릴 작업물을 여기에 모아둡니다.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 고정 카드: 이미 만들어 둔 작업물 */}
          <button
            type="button"
            onClick={onOpenHr}
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-indigo-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              완성
            </span>
            <h3 className="mt-3 font-semibold">📄 인사서식 자동작성</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              재직증명서 · 사직서 · 경력증명서 · 경위서 · 시말서를 실시간
              미리보기로 작성하고, 인쇄 · PDF · 이메일 · 전자서명으로 전달까지
              되는 도구.
            </p>
            <span className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              열어보기 →
            </span>
          </button>

          {/* 새로 등록한 작업물 카드들 */}
          {works.map((w) => (
            <div
              key={w.id}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{w.title}</h3>
                <button
                  type="button"
                  onClick={() => onRemoveWork(w.id)}
                  aria-label="삭제"
                  className="rounded-lg px-1.5 py-1 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
                >
                  ✕
                </button>
              </div>
              {w.desc && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {w.desc}
                </p>
              )}
              {w.link && (
                <a
                  href={w.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  링크 열기 →
                </a>
              )}
              <span className="mt-3 text-xs text-neutral-400">{w.date}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-neutral-300 p-6 dark:border-neutral-700">
        <h2 className="text-base font-semibold">➕ 새 작업물 올리기</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          제목과 설명, (있다면) 링크를 적고 등록하면 위 목록에 카드로
          추가됩니다. 이 브라우저에 저장돼요.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={newWork.title}
            onChange={(e) =>
              setNewWork((s) => ({ ...s, title: e.target.value }))
            }
            placeholder="작업물 제목"
            className={inputCls}
          />
          <input
            value={newWork.link}
            onChange={(e) =>
              setNewWork((s) => ({ ...s, link: e.target.value }))
            }
            placeholder="링크 (선택, 예: https://...)"
            className={inputCls}
          />
        </div>
        <textarea
          value={newWork.desc}
          onChange={(e) => setNewWork((s) => ({ ...s, desc: e.target.value }))}
          placeholder="간단한 설명 (선택)"
          rows={2}
          className={inputCls + " mt-3 min-h-16 resize-y"}
        />
        <button
          type="button"
          onClick={onAddWork}
          className="mt-3 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          작업물 등록
        </button>
      </section>
    </div>
  );
}

/* ───────────── 문서 컴포넌트들 ───────────── */

function V({ v }: { v: string }) {
  return v ? <>{v}</> : <span className="text-neutral-300">　　　　</span>;
}

function DocTitle({ text }: { text: string }) {
  return (
    <h1 className="text-center text-3xl font-bold tracking-[0.35em]">{text}</h1>
  );
}

function SignBlock({
  issueDate,
  company,
  ceo,
}: {
  issueDate: string;
  company: string;
  ceo?: string;
}) {
  return (
    <div className="mt-12 text-center">
      <p className="text-base">{issueDate}</p>
      <p className="mt-8 text-lg font-semibold tracking-widest">{company}</p>
      {ceo && (
        <p className="mt-2 text-base">
          대표자　{ceo}
          <span className="ml-1 text-neutral-400">(인)</span>
        </p>
      )}
    </div>
  );
}

function EmploymentDoc({
  f,
  issueDate,
  company,
  ceo,
}: {
  f: Fields;
  issueDate: string;
  company: string;
  ceo: string;
}) {
  const period = f.joinDate ? `${formatKoreanDate(f.joinDate)} ~ 현재` : "";
  return (
    <>
      <DocTitle text="재 직 증 명 서" />
      <table className="mt-10 w-full border-collapse text-sm">
        <tbody>
          <Row>
            <Th>성　명</Th>
            <Td><V v={f.name} /></Td>
            <Th>주민등록번호</Th>
            <Td><V v={f.rrn} /></Td>
          </Row>
          <Row>
            <Th>주　소</Th>
            <Td colSpan={3}><V v={f.address} /></Td>
          </Row>
          <Row>
            <Th>소　속</Th>
            <Td><V v={f.dept} /></Td>
            <Th>직　위</Th>
            <Td><V v={f.position} /></Td>
          </Row>
          <Row>
            <Th>재직기간</Th>
            <Td><V v={period} /></Td>
            <Th>담당업무</Th>
            <Td><V v={f.duty} /></Td>
          </Row>
          <Row>
            <Th>용　도</Th>
            <Td colSpan={3}><V v={f.purpose} /></Td>
          </Row>
        </tbody>
      </table>

      <p className="mt-10 text-center text-base leading-8">
        위와 같이 재직하고 있음을 증명합니다.
      </p>
      <SignBlock issueDate={issueDate} company={company} ceo={ceo} />
    </>
  );
}

function CareerDoc({
  f,
  issueDate,
  company,
  ceo,
}: {
  f: Fields;
  issueDate: string;
  company: string;
  ceo: string;
}) {
  const period =
    f.joinDate || f.leaveDate
      ? `${formatKoreanDate(f.joinDate) || "____"} ~ ${
          formatKoreanDate(f.leaveDate) || "현재"
        }`
      : "";
  return (
    <>
      <DocTitle text="경 력 증 명 서" />

      <table className="mt-10 w-full border-collapse text-sm">
        <tbody>
          <Row>
            <Th>성　명</Th>
            <Td><V v={f.name} /></Td>
            <Th>주민등록번호</Th>
            <Td><V v={f.rrn} /></Td>
          </Row>
          <Row>
            <Th>주　소</Th>
            <Td colSpan={3}><V v={f.address} /></Td>
          </Row>
        </tbody>
      </table>

      <p className="mt-6 text-sm font-semibold">■ 경력사항</p>
      <table className="mt-2 w-full border-collapse text-center text-sm">
        <thead>
          <tr>
            <Th center>근무기간</Th>
            <Th center>부서</Th>
            <Th center>직위</Th>
            <Th center>담당업무</Th>
          </tr>
        </thead>
        <tbody>
          <Row>
            <Td center><V v={period} /></Td>
            <Td center><V v={f.dept} /></Td>
            <Td center><V v={f.position} /></Td>
            <Td center><V v={f.duty} /></Td>
          </Row>
        </tbody>
      </table>

      {f.purpose && (
        <p className="mt-6 text-sm">
          <span className="font-semibold">용도 : </span>
          {f.purpose}
        </p>
      )}

      <p className="mt-10 text-center text-base leading-8">
        위와 같이 경력을 증명합니다.
      </p>
      <SignBlock issueDate={issueDate} company={company} ceo={ceo} />
    </>
  );
}

function ResignationDoc({
  f,
  issueDate,
  company,
}: {
  f: Fields;
  issueDate: string;
  company: string;
}) {
  const leave = f.leaveDate ? formatKoreanDate(f.leaveDate) : "____년 __월 __일";
  const reason = f.reason || "일신상의 사유";
  return (
    <>
      <DocTitle text="사 직 서" />

      <table className="mt-10 w-full border-collapse text-sm">
        <tbody>
          <Row>
            <Th>소　속</Th>
            <Td><V v={f.dept} /></Td>
            <Th>직　위</Th>
            <Td><V v={f.position} /></Td>
          </Row>
          <Row>
            <Th>성　명</Th>
            <Td colSpan={3}><V v={f.name} /></Td>
          </Row>
        </tbody>
      </table>

      <p className="mt-12 text-center text-base leading-9">
        본인은 <b>{reason}</b>(으)로 인하여 <b>{leave}</b>자로
        <br />
        사직하고자 하오니 재가하여 주시기 바랍니다.
      </p>

      <div className="mt-14 text-center">
        <p className="text-base">{issueDate}</p>
        <p className="mt-8 text-base">
          작성자　<V v={f.name} />
          <span className="ml-1 text-neutral-400">(서명 또는 인)</span>
        </p>
      </div>

      <p className="mt-12 text-center text-lg font-semibold tracking-widest">
        {company} 대표자 귀하
      </p>
    </>
  );
}

// 경위서 / 시말서 (사유 서술형 + 서명)
function NarrativeDoc({
  kind,
  f,
  issueDate,
  company,
}: {
  kind: "incident" | "apology";
  f: Fields;
  issueDate: string;
  company: string;
}) {
  const title = kind === "apology" ? "시 말 서" : "경 위 서";
  const contentLabel =
    kind === "apology" ? "■ 사건 경위 및 반성 내용" : "■ 경위 내용";
  const closing =
    kind === "apology"
      ? "본인은 위와 같은 사실에 대하여 깊이 반성하며, 다시는 이와 같은 일이 발생하지 않도록 하겠습니다. 만일 재발할 경우 어떠한 처분도 감수하겠습니다."
      : "위와 같이 사실 그대로 작성하였음을 확인합니다.";

  return (
    <>
      <DocTitle text={title} />

      <table className="mt-10 w-full border-collapse text-sm">
        <tbody>
          <Row>
            <Th>소　속</Th>
            <Td><V v={f.dept} /></Td>
            <Th>직　위</Th>
            <Td><V v={f.position} /></Td>
          </Row>
          <Row>
            <Th>성　명</Th>
            <Td><V v={f.name} /></Td>
            <Th>발생일자</Th>
            <Td><V v={formatKoreanDate(f.incidentDate)} /></Td>
          </Row>
          <Row>
            <Th>발생장소</Th>
            <Td colSpan={3}><V v={f.place} /></Td>
          </Row>
          <Row>
            <Th>제　목</Th>
            <Td colSpan={3}><V v={f.subject} /></Td>
          </Row>
        </tbody>
      </table>

      <p className="mt-6 text-sm font-semibold">{contentLabel}</p>
      <div className="mt-2 min-h-40 whitespace-pre-wrap border border-neutral-500 p-4 text-sm leading-7">
        {f.content ? (
          f.content
        ) : (
          <span className="text-neutral-300">내용을 입력하세요.</span>
        )}
      </div>

      <p className="mt-8 text-center text-base leading-8">{closing}</p>

      <div className="mt-12 text-center">
        <p className="text-base">{issueDate}</p>
        <p className="mt-8 text-base">
          작성자　<V v={f.name} />
          <span className="ml-1 text-neutral-400">(서명 또는 인)</span>
        </p>
      </div>

      <p className="mt-10 text-center text-lg font-semibold tracking-widest">
        {company} 대표자 귀하
      </p>
    </>
  );
}

/* ───────────── 공통 UI 조각 ───────────── */

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

function Th({
  children,
  colSpan,
  center,
}: {
  children: React.ReactNode;
  colSpan?: number;
  center?: boolean;
}) {
  return (
    <th
      colSpan={colSpan}
      className={
        "w-28 border border-neutral-500 bg-neutral-100 px-3 py-2.5 font-medium text-neutral-800 " +
        (center ? "text-center" : "text-left")
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  colSpan,
  center,
}: {
  children: React.ReactNode;
  colSpan?: number;
  center?: boolean;
}) {
  return (
    <td
      colSpan={colSpan}
      className={
        "border border-neutral-500 px-3 py-2.5 " +
        (center ? "text-center" : "text-left")
      }
    >
      {children}
    </td>
  );
}
