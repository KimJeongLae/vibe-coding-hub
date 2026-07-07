// 클래스 참가자 명단 (팀별).
// slug 는 URL 주소가 됩니다 (예: /members/jang-jeongyun).
// 참가자를 추가하려면 MEMBERS 배열에 항목을 하나 더 넣으면 됩니다.
// 팀을 추가하려면 TEAMS 배열에도 팀 이름을 넣어주세요.

export type Member = {
  slug: string;
  name: string;
  team: string;
};

// 화면에 표시될 팀 순서
export const TEAMS = ["대표", "정형외과", "메디아", "스토어"] as const;

export const MEMBERS: Member[] = [
  { slug: "kim-jeongrae", name: "김정래", team: "대표" },

  { slug: "jeong-sinwoo", name: "정신우", team: "정형외과" },

  { slug: "eom-yoseb", name: "엄요셉", team: "메디아" },
  { slug: "yu-seonghui", name: "유성희", team: "메디아" },
  { slug: "park-yeji", name: "박예지", team: "메디아" },
  { slug: "jang-jeongyun", name: "장정윤", team: "메디아" },
  { slug: "oh-hyeonsu", name: "오현수", team: "메디아" },

  { slug: "hong-jiho", name: "홍지호", team: "스토어" },
  { slug: "jo-kwonil", name: "조권일", team: "스토어" },
  { slug: "ha-jiyoung", name: "하지영", team: "스토어" },
];

export function getMember(slug: string): Member | undefined {
  return MEMBERS.find((m) => m.slug === slug);
}

// 팀별로 묶어서 반환 (허브 페이지에서 사용)
export function membersByTeam(): { team: string; members: Member[] }[] {
  return TEAMS.map((team) => ({
    team,
    members: MEMBERS.filter((m) => m.team === team),
  }));
}
