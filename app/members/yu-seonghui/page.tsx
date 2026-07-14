"use client";

import { useEffect, useRef, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "yu-seonghui" 님의 작업물 페이지 — 임상 약어 챗봇 (MVP)
//
// 🩺 초음파 주사(정형외과·마취통증·재활의학) 약어 + 기본 간호 약어를 검색하는 챗봇입니다.
// - 실제 AI 연동/문서 학습 없음. 아래 TERMS 배열에 등록된 약어만 정해진 답변을 냅니다.
// - 데이터 출처: 프로젝트에 올려둔 "초음파주사_약어_근육포함_v4.xlsx" 를 코드에 반영.
// - 약어(예: SSP), 한글명(극상근), 영문명(Supraspinatus), 발음(수프라스피나터스) 무엇으로 쳐도 검색됩니다.

type Term = {
  abbr: string;
  ko: string;
  eng: string;
  pron: string;
  regions: string[];
  notes: string[];
};

const TERMS: Term[] = [
  {
    "abbr": "NPO",
    "ko": "금식",
    "eng": "Nil Per Os",
    "pron": "",
    "regions": [
      "기본 간호"
    ],
    "notes": [
      "임상: 수술·검사 등을 위해 입으로 아무것도 섭취하지 않는 상태"
    ]
  },
  {
    "abbr": "PRN",
    "ko": "필요시 투여",
    "eng": "Pro Re Nata",
    "pron": "",
    "regions": [
      "기본 간호"
    ],
    "notes": [
      "임상: 정해진 시간이 아니라 필요할 때마다 투여"
    ]
  },
  {
    "abbr": "BID",
    "ko": "하루 2회",
    "eng": "Bis In Die",
    "pron": "",
    "regions": [
      "기본 간호"
    ],
    "notes": [
      "임상: 약을 하루 두 번 투여 (보통 아침·저녁)"
    ]
  },
  {
    "abbr": "IV",
    "ko": "정맥 주사",
    "eng": "Intravenous",
    "pron": "",
    "regions": [
      "기본 간호"
    ],
    "notes": [
      "임상: 약물·수액을 정맥으로 직접 주입"
    ]
  },
  {
    "abbr": "V/S",
    "ko": "활력징후",
    "eng": "Vital Signs",
    "pron": "",
    "regions": [
      "기본 간호"
    ],
    "notes": [
      "임상: 혈압·맥박·호흡·체온"
    ]
  },
  {
    "abbr": "STAT",
    "ko": "즉시",
    "eng": "Statim",
    "pron": "",
    "regions": [
      "기본 간호"
    ],
    "notes": [
      "임상: 지체 없이 즉시 시행 (응급)"
    ]
  },
  {
    "abbr": "GH",
    "ko": "견관절",
    "eng": "Glenohumeral Joint",
    "pron": "글레노휴머럴",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉거나 옆누워 / 팔 중립",
      "임상: 어깨 주 관절; 후방 또는 전방 접근"
    ]
  },
  {
    "abbr": "AC",
    "ko": "견봉쇄골관절",
    "eng": "Acromioclavicular Joint",
    "pron": "아크로미오클라비큘러",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 내려놓고",
      "임상: 쇄골 끝·견봉 사이 좁은 관절"
    ]
  },
  {
    "abbr": "SA-SD bursa",
    "ko": "견봉하-삼각근하 점액낭",
    "eng": "Subacromial-Subdeltoid Bursa",
    "pron": "섭아크로미얼-섭델토이드 버사",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 내회전(뒤로 돌려 허리 뒤)",
      "임상: 가장 흔한 어깨 주사; long-axis 접근"
    ]
  },
  {
    "abbr": "SSP",
    "ko": "극상근",
    "eng": "Supraspinatus",
    "pron": "수프라스피나터스",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 내회전 (Crass position)",
      "임상: RC 중 손상 가장 많음",
      "기능: 외전 초기(0-15°)",
      "포지션: Crass position (팔 내회전·등 뒤)",
      "임상: RC 중 가장 흔한 손상; full-thickness tear 多"
    ]
  },
  {
    "abbr": "ISP",
    "ko": "극하근",
    "eng": "Infraspinatus",
    "pron": "인프라스피나터스",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 중립·내회전",
      "임상: 후방 어깨; 외회전",
      "기능: 외회전",
      "임상: 후방 어깨 접근; 외회전 약화"
    ]
  },
  {
    "abbr": "SSC",
    "ko": "견갑하근",
    "eng": "Subscapularis",
    "pron": "섭스캐퓰라리스",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 외회전",
      "임상: 전방 어깨; 내회전",
      "기능: 내회전·내전",
      "임상: 전방 어깨; 내회전 약화 시 의심"
    ]
  },
  {
    "abbr": "TM",
    "ko": "소원근",
    "eng": "Teres Minor",
    "pron": "테레스 마이너",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 중립",
      "임상: ISP 아래; 외회전 보조",
      "기능: 외회전 보조",
      "임상: ISP 아래; Quadrilateral space 관련"
    ]
  },
  {
    "abbr": "LHB",
    "ko": "상완이두근 장두건",
    "eng": "Long Head of Biceps Tendon",
    "pron": "롱 헤드 오브 바이셉스",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 약간 외회전",
      "임상: Bicipital groove 내 건초 주사"
    ]
  },
  {
    "abbr": "Pec min",
    "ko": "소흉근",
    "eng": "Pectoralis Minor",
    "pron": "펙토랄리스 마이너",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 누워서(supine) 팔 약간 외전",
      "임상: 오훼돌기 아래 부착부",
      "기능: 견갑골 하방회전·전인",
      "임상: 오훼돌기 아래 부착부; 소흉근 증후군"
    ]
  },
  {
    "abbr": "Coracobrachialis",
    "ko": "오훼완근",
    "eng": "Coracobrachialis",
    "pron": "코라코브라키알리스",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 누워서(supine) 팔 외전·외회전",
      "임상: 오훼돌기 내측",
      "기능: 굴곡·내전",
      "임상: 오훼돌기 내측; 근피신경 관통"
    ]
  },
  {
    "abbr": "SA",
    "ko": "전거근",
    "eng": "Serratus Anterior",
    "pron": "세라터스 안테리어",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 팔 올리거나 옆누워",
      "임상: 날개뼈 전방 고정근",
      "기능: 견갑골 전인·상방회전",
      "임상: 날개견갑(winged scapula); 장흉신경 마비"
    ]
  },
  {
    "abbr": "DSNB",
    "ko": "견갑배신경 차단술",
    "eng": "Dorsal Scapular Nerve Block",
    "pron": "도설 스캐퓰러 너브 블락",
    "regions": [
      "어깨 (Shoulder)"
    ],
    "notes": [
      "포지션: 앉아서 등 노출",
      "임상: 중사각근 통과 신경"
    ]
  },
  {
    "abbr": "CHL",
    "ko": "오훼상완인대",
    "eng": "Coracohumeral Ligament",
    "pron": "코라코휴머럴 리가먼트",
    "regions": [
      "어깨 (Shoulder)",
      "어깨"
    ],
    "notes": [
      "포지션: 앉아서 팔 중립·내회전",
      "임상: 오십견 때 두꺼워짐; 전방 관절낭",
      "위치: 오훼돌기→대결절·소결절",
      "손상: 오십견 시 두꺼워짐; 전방 관절낭"
    ]
  },
  {
    "abbr": "SGHL",
    "ko": "상부 관절상완인대",
    "eng": "Superior Glenohumeral Ligament",
    "pron": "수피리어 글레노휴머럴 리가먼트",
    "regions": [
      "어깨 (Shoulder)",
      "어깨"
    ],
    "notes": [
      "포지션: 앉아서 전방 접근",
      "임상: 상방 관절낭 안정화",
      "위치: 상방 관절낭 전방부",
      "손상: 상방 불안정"
    ]
  },
  {
    "abbr": "IGHL",
    "ko": "하부 관절상완인대",
    "eng": "Inferior Glenohumeral Ligament",
    "pron": "인페리어 글레노휴머럴 리가먼트",
    "regions": [
      "어깨 (Shoulder)",
      "어깨"
    ],
    "notes": [
      "포지션: 앉아서 전방·하방 접근",
      "임상: Bankart 병변 관련",
      "위치: 하방 관절낭",
      "손상: Bankart 병변; 전방 불안정"
    ]
  },
  {
    "abbr": "CAL",
    "ko": "오훼견봉인대",
    "eng": "Coracoacromial Ligament",
    "pron": "코라코아크로미얼 리가먼트",
    "regions": [
      "어깨 (Shoulder)",
      "어깨"
    ],
    "notes": [
      "포지션: 앉아서 전방",
      "임상: 충돌증후군 관련 인대",
      "위치: 오훼돌기→견봉",
      "손상: 충돌증후군 관련"
    ]
  },
  {
    "abbr": "EDC",
    "ko": "총지신근",
    "eng": "Extensor Digitorum Communis",
    "pron": "익스텐서 디지토럼 커뮤니스",
    "regions": [
      "팔꿈치 (Elbow)",
      "팔꿈치·팔 (Elbow/Arm)"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 90° 굴곡·전완 회내",
      "임상: 외상과; 테니스엘보 핵심",
      "기능: 손가락 신전",
      "임상: 테니스엘보 핵심 근육; 외상과 부착부"
    ]
  },
  {
    "abbr": "FCU",
    "ko": "척측수근굴근",
    "eng": "Flexor Carpi Ulnaris",
    "pron": "플렉서 카파이 울나리스",
    "regions": [
      "팔꿈치 (Elbow)",
      "손목·손 (Wrist/Hand)",
      "팔꿈치·팔 (Elbow/Arm)"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 굴곡·전완 회외",
      "임상: 내상과; 골퍼엘보",
      "포지션: 앉아서 손 회외",
      "임상: 손목 척측 굴곡건",
      "기능: 손목 굴곡·척측 편위",
      "임상: 골퍼엘보 핵심; 척골신경 인접"
    ]
  },
  {
    "abbr": "FCR",
    "ko": "요측수근굴근",
    "eng": "Flexor Carpi Radialis",
    "pron": "플렉서 카파이 레이디얼리스",
    "regions": [
      "팔꿈치 (Elbow)",
      "손목·손 (Wrist/Hand)",
      "팔꿈치·팔 (Elbow/Arm)"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 굴곡·전완 회외",
      "임상: 내상과 요측",
      "포지션: 앉아서 손 회외",
      "임상: 손목 요측 굴곡건",
      "기능: 손목 굴곡·요측 편위",
      "임상: 골퍼엘보 내상과 요측; CTS 관련"
    ]
  },
  {
    "abbr": "Tri lat",
    "ko": "삼두근 외측두",
    "eng": "Triceps Lateral Head",
    "pron": "트라이셉스 래터럴 헤드",
    "regions": [
      "팔꿈치 (Elbow)",
      "팔꿈치·팔 (Elbow/Arm)"
    ],
    "notes": [
      "포지션: 앉아서 팔 뻗거나 엎드려",
      "임상: 주두 부착부 건염",
      "기능: 팔꿈치 신전",
      "임상: 주두 부착부 건염; 주두 점액낭 인접"
    ]
  },
  {
    "abbr": "UN",
    "ko": "척골신경",
    "eng": "Ulnar Nerve",
    "pron": "울너 너브",
    "regions": [
      "팔꿈치 (Elbow)",
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 90° 굴곡",
      "임상: 주관증후군; 내상과 후방 홈",
      "포지션: 앉아서 팔꿈치 굴곡 90°",
      "임상: 팔꿈치 내측 홈 또는 손목 척측"
    ]
  },
  {
    "abbr": "RCL elbow",
    "ko": "요측측부인대 (팔꿈치)",
    "eng": "Radial Collateral Ligament (Elbow)",
    "pron": "레이디얼 콜래터럴 리가먼트 (엘보)",
    "regions": [
      "팔꿈치 (Elbow)",
      "팔꿈치"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 굴곡·회내",
      "임상: 외측 팔꿈치 안정 인대",
      "위치: 외상과→윤상인대",
      "손상: 외측 팔꿈치 불안정"
    ]
  },
  {
    "abbr": "UCL elbow",
    "ko": "척측측부인대 (팔꿈치)",
    "eng": "Ulnar Collateral Ligament (Elbow)",
    "pron": "울너 콜래터럴 리가먼트 (엘보)",
    "regions": [
      "팔꿈치 (Elbow)",
      "팔꿈치"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 굴곡·회외",
      "임상: 내측 안정 인대; 투수 손상",
      "위치: 내상과→구상돌기·올레크라논",
      "손상: 투수 내측 팔꿈치; 반복 외반 스트레스"
    ]
  },
  {
    "abbr": "Olecranon bursa",
    "ko": "주두 점액낭",
    "eng": "Olecranon Bursa",
    "pron": "올레크라논 버사",
    "regions": [
      "팔꿈치 (Elbow)"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 굴곡",
      "임상: 주두 돌출부 흡인·주사"
    ]
  },
  {
    "abbr": "MN",
    "ko": "정중신경",
    "eng": "Median Nerve",
    "pron": "미디언 너브",
    "regions": [
      "손목·손 (Wrist/Hand)",
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 앉아서 손 회외",
      "임상: CTS 핵심 주사 구조물",
      "임상: 손목 수근관; CTS"
    ]
  },
  {
    "abbr": "CTS",
    "ko": "수근관증후군",
    "eng": "Carpal Tunnel Syndrome",
    "pron": "카팔 터널 신드롬",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 손 회외·손목 약간 신전",
      "임상: 정중신경 감압 주사 대표 적응증"
    ]
  },
  {
    "abbr": "PL",
    "ko": "장장근",
    "eng": "Palmaris Longus",
    "pron": "팔마리스 롱거스",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 손 회외",
      "임상: 중앙 가느다란 힘줄; 없는 경우도 있음",
      "기능: 손목 굴곡 보조",
      "임상: 중앙 가느다란 건; 10~15%에서 없음"
    ]
  },
  {
    "abbr": "De Quervain",
    "ko": "드퀘르뱅 건초염",
    "eng": "De Quervain Tenosynovitis",
    "pron": "드퀘르뱅",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 엄지 위로 새끼 쪽 기울여",
      "임상: APL·EPB 건초; 1구획"
    ]
  },
  {
    "abbr": "CMC",
    "ko": "수근중수관절",
    "eng": "Carpometacarpal Joint",
    "pron": "카포메타카팔",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 엄지 위로",
      "임상: 엄지 기저부 관절염"
    ]
  },
  {
    "abbr": "Trigger finger",
    "ko": "방아쇠수지",
    "eng": "Trigger Finger (Stenosing Tenosynovitis)",
    "pron": "트리거 핑거",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 손 회외",
      "임상: A1 pulley 주사"
    ]
  },
  {
    "abbr": "PIP",
    "ko": "근위지간관절",
    "eng": "Proximal Interphalangeal Joint",
    "pron": "프록시멀 인터팔랜지얼",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 손 올려놓기",
      "임상: 손가락 중간 관절"
    ]
  },
  {
    "abbr": "DIP",
    "ko": "원위지간관절",
    "eng": "Distal Interphalangeal Joint",
    "pron": "디스탈 인터팔랜지얼",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "포지션: 앉아서 손 올려놓기",
      "임상: 손가락 끝 관절"
    ]
  },
  {
    "abbr": "UCL thumb",
    "ko": "엄지 척측측부인대",
    "eng": "Ulnar Collateral Ligament (Thumb MCP)",
    "pron": "울너 콜래터럴 리가먼트 (엄지)",
    "regions": [
      "손목·손 (Wrist/Hand)",
      "손목·손"
    ],
    "notes": [
      "포지션: 앉아서 엄지 노출",
      "임상: Skier's thumb; MCP 내측",
      "위치: 엄지 MCP 내측",
      "손상: 스키어 엄지; 외반 손상"
    ]
  },
  {
    "abbr": "TFCC",
    "ko": "삼각섬유연골복합체",
    "eng": "Triangular Fibrocartilage Complex",
    "pron": "트라이앵귤러 파이브로카틸리지 컴플렉스",
    "regions": [
      "손목·손 (Wrist/Hand)",
      "손목·손"
    ],
    "notes": [
      "포지션: 앉아서 손 회내 또는 중립",
      "임상: 손목 척측 통증 핵심 구조물",
      "위치: 척골두→척측 손목",
      "손상: 척측 손목 통증; 회전 부하"
    ]
  },
  {
    "abbr": "SLL",
    "ko": "주상월상인대",
    "eng": "Scapholunate Ligament",
    "pron": "스캐포루네이트 리가먼트",
    "regions": [
      "손목·손 (Wrist/Hand)",
      "손목·손"
    ],
    "notes": [
      "포지션: 앉아서 손 약간 회내",
      "임상: 손목 등쪽; 손목 불안정 주요 인대",
      "위치: 주상골↔월상골 사이",
      "손상: 낙상 시 손목 신전 손상; DISI"
    ]
  },
  {
    "abbr": "Hip IA",
    "ko": "고관절 내 주사",
    "eng": "Hip Intra-Articular",
    "pron": "힙 인트라-아티큘러",
    "regions": [
      "고관절 (Hip)"
    ],
    "notes": [
      "포지션: 누워서(supine) 다리 약간 외회전",
      "임상: 전방 접근; 대퇴동맥 외측"
    ]
  },
  {
    "abbr": "GT bursa",
    "ko": "대전자 점액낭",
    "eng": "Greater Trochanter Bursa",
    "pron": "그레이터 트로칸터 버사",
    "regions": [
      "고관절 (Hip)"
    ],
    "notes": [
      "포지션: 옆으로 누워서(lateral decubitus)",
      "임상: GTPS 대표 주사"
    ]
  },
  {
    "abbr": "TFL",
    "ko": "대퇴근막장근",
    "eng": "Tensor Fasciae Latae",
    "pron": "텐서 패시이 레이티",
    "regions": [
      "고관절 (Hip)",
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 장경인대 기시부",
      "기능: 고관절 굴곡·외전·내회전",
      "임상: ITB 기시부; 대전자 외측"
    ]
  },
  {
    "abbr": "ITB",
    "ko": "장경인대",
    "eng": "Iliotibial Band",
    "pron": "일리오티비얼 밴드",
    "regions": [
      "고관절 (Hip)",
      "무릎·대퇴 (Knee/Thigh)"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 허벅지 외측 전체",
      "기능: 무릎 안정화",
      "임상: 러너즈니; 무릎 외측 마찰 증후군"
    ]
  },
  {
    "abbr": "LFCN",
    "ko": "외측대퇴피신경",
    "eng": "Lateral Femoral Cutaneous Nerve",
    "pron": "래터럴 페모럴 큐테이니어스 너브",
    "regions": [
      "고관절 (Hip)",
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: ASIS 내측 2cm; 이상감각대퇴통증",
      "임상: ASIS 내측; 이상감각대퇴통증"
    ]
  },
  {
    "abbr": "PSIS",
    "ko": "후상장골극",
    "eng": "Posterior Superior Iliac Spine",
    "pron": "포스티어리어 수피리어 일리악 스파인",
    "regions": [
      "고관절 (Hip)"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: SIJ 진입 랜드마크"
    ]
  },
  {
    "abbr": "SIJ",
    "ko": "천장관절",
    "eng": "Sacroiliac Joint",
    "pron": "에스아이제이",
    "regions": [
      "고관절 (Hip)",
      "척추·목·허리 (Spine)"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 골반 후방 통증"
    ]
  },
  {
    "abbr": "PENG",
    "ko": "고관절 신경절 차단술",
    "eng": "Pericapsular Nerve Group Block",
    "pron": "펭 블락",
    "regions": [
      "고관절 (Hip)",
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 고관절 골절 급성 통증",
      "임상: 고관절 급성 통증"
    ]
  },
  {
    "abbr": "IFL",
    "ko": "장골대퇴인대",
    "eng": "Iliofemoral Ligament",
    "pron": "일리오페모럴 리가먼트",
    "regions": [
      "고관절 (Hip)",
      "고관절"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 고관절 전방 가장 강한 인대; Y자 인대",
      "위치: AIIS→전자간선",
      "손상: 전방 불안정; 과신전"
    ]
  },
  {
    "abbr": "PFL",
    "ko": "치골대퇴인대",
    "eng": "Pubofemoral Ligament",
    "pron": "푸보페모럴 리가먼트",
    "regions": [
      "고관절 (Hip)",
      "고관절"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 고관절 전하방 인대",
      "위치: 치골→소전자 하방",
      "손상: 전하방 불안정"
    ]
  },
  {
    "abbr": "IsFL",
    "ko": "좌골대퇴인대",
    "eng": "Ischiofemoral Ligament",
    "pron": "이스키오페모럴 리가먼트",
    "regions": [
      "고관절 (Hip)",
      "고관절"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 고관절 후방 인대",
      "위치: 좌골→대전자 내측",
      "손상: 후방 불안정; 내회전 제한"
    ]
  },
  {
    "abbr": "Knee IA",
    "ko": "슬관절 내 주사",
    "eng": "Knee Intra-Articular",
    "pron": "니 인트라-아티큘러",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 누워서 무릎 약간 굴곡(pillow)",
      "임상: 외측 슬개상부 or 내측 슬개하 접근"
    ]
  },
  {
    "abbr": "ACB",
    "ko": "내전근관 차단술",
    "eng": "Adductor Canal Block",
    "pron": "어덕터 커낼 블락",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 누워서(supine) 다리 약간 외회전",
      "임상: 복재신경 차단; TKA 후 통증 조절"
    ]
  },
  {
    "abbr": "IPACK",
    "ko": "슬와동맥-관절낭 침윤",
    "eng": "Infiltration between Popliteal Artery and Capsule of Knee",
    "pron": "아이팩",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 엎드려서(prone) 또는 무릎 굴곡",
      "임상: 무릎 후방 통증; TKA 후"
    ]
  },
  {
    "abbr": "MCL",
    "ko": "내측측부인대",
    "eng": "Medial Collateral Ligament",
    "pron": "미디얼 콜래터럴 리가먼트",
    "regions": [
      "무릎 (Knee)",
      "무릎"
    ],
    "notes": [
      "포지션: 누워서 무릎 약간 굴곡",
      "임상: 무릎 내측 안정 인대; 장축 주사",
      "위치: 대퇴내측과→경골내측",
      "손상: 외반 손상; Gr I~III"
    ]
  },
  {
    "abbr": "LCL",
    "ko": "외측측부인대",
    "eng": "Lateral Collateral Ligament",
    "pron": "래터럴 콜래터럴 리가먼트",
    "regions": [
      "무릎 (Knee)",
      "무릎"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 무릎 바깥쪽 인대",
      "위치: 대퇴외측과→비골두",
      "손상: 내반 손상"
    ]
  },
  {
    "abbr": "PT",
    "ko": "슬개건",
    "eng": "Patellar Tendon",
    "pron": "패텔라 텐던",
    "regions": [
      "무릎 (Knee)",
      "무릎"
    ],
    "notes": [
      "포지션: 누워서 무릎 신전",
      "임상: 슬개골 하극; 점프무릎",
      "위치: 슬개골 하극→경골 조면",
      "손상: 점프무릎; 반복 스트레스"
    ]
  },
  {
    "abbr": "PES",
    "ko": "거위발건",
    "eng": "Pes Anserinus",
    "pron": "페스 앤서라이너스",
    "regions": [
      "무릎 (Knee)",
      "무릎·대퇴 (Knee/Thigh)"
    ],
    "notes": [
      "포지션: 누워서 무릎 약간 굴곡",
      "임상: 무릎 내측 하방 3개 건 복합체",
      "기능: 무릎 굴곡·내회전",
      "임상: 내측 무릎 하방; 거위발 건염·점액낭"
    ]
  },
  {
    "abbr": "Popliteal cyst",
    "ko": "슬와낭종 (베이커 낭종)",
    "eng": "Popliteal (Baker) Cyst",
    "pron": "파플리티얼 시스트",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 무릎 뒤쪽 흡인·주사"
    ]
  },
  {
    "abbr": "ITB knee",
    "ko": "장경인대 (무릎 외측)",
    "eng": "Iliotibial Band (Knee)",
    "pron": "일리오티비얼 밴드 (무릎)",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 무릎 외측 통증; 러너즈니"
    ]
  },
  {
    "abbr": "Prepatellar bursa",
    "ko": "슬개전 점액낭",
    "eng": "Prepatellar Bursa",
    "pron": "프리패텔라 버사",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 누워서 무릎 신전",
      "임상: 슬개골 앞 물혹 흡인"
    ]
  },
  {
    "abbr": "Infrapatellar bursa",
    "ko": "슬개하 점액낭",
    "eng": "Infrapatellar Bursa",
    "pron": "인프라패텔라 버사",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 누워서 무릎 약간 굴곡",
      "임상: 슬개건 아래 점액낭"
    ]
  },
  {
    "abbr": "POL",
    "ko": "후사위인대",
    "eng": "Posterior Oblique Ligament",
    "pron": "포스티어리어 오블리크 리가먼트",
    "regions": [
      "무릎 (Knee)",
      "무릎"
    ],
    "notes": [
      "포지션: 누워서 또는 옆으로",
      "임상: 내측 후방 무릎 안정",
      "위치: 반막양근 연장선; 후내방",
      "손상: 내측 후방 불안정"
    ]
  },
  {
    "abbr": "LCL+PLC",
    "ko": "외측측부인대+후외측 복합체",
    "eng": "LCL + Posterolateral Corner",
    "pron": "래터럴 콜래터럴+포스테로래터럴 코너",
    "regions": [
      "무릎 (Knee)"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 무릎 후외방 불안정"
    ]
  },
  {
    "abbr": "Ankle IA",
    "ko": "발목 관절 내 주사",
    "eng": "Ankle Intra-Articular",
    "pron": "앵클 인트라-아티큘러",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 누워서(supine) 발목 중립",
      "임상: 전방 접근; EHL 외측"
    ]
  },
  {
    "abbr": "ATFL",
    "ko": "전거비인대",
    "eng": "Anterior Talofibular Ligament",
    "pron": "안테리어 탈로피뷸러 리가먼트",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목"
    ],
    "notes": [
      "포지션: 누워서 발목 약간 족저굴곡·내번",
      "임상: 발목 외측 염좌 가장 흔한 인대",
      "위치: 비골 전방→거골 외측",
      "손상: 발목 내번 염좌 1순위"
    ]
  },
  {
    "abbr": "CFL",
    "ko": "종비인대",
    "eng": "Calcaneofibular Ligament",
    "pron": "칼케이니오피뷸러 리가먼트",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목"
    ],
    "notes": [
      "포지션: 옆으로 누워서 또는 내번",
      "임상: 발목 외측 두 번째 인대",
      "위치: 비골 원위→종골 외측",
      "손상: 내번 염좌 2순위"
    ]
  },
  {
    "abbr": "PTFL",
    "ko": "후거비인대",
    "eng": "Posterior Talofibular Ligament",
    "pron": "포스티어리어 탈로피뷸러 리가먼트",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 발목 외측 세 번째 인대; 중증 염좌",
      "위치: 비골 후방→거골 후방",
      "손상: 중증 외측 염좌"
    ]
  },
  {
    "abbr": "Deltoid lig",
    "ko": "삼각인대 (내측)",
    "eng": "Deltoid Ligament (Medial)",
    "pron": "델토이드 리가먼트",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 누워서 발목 외번",
      "임상: 발목 내측 강한 인대 복합체"
    ]
  },
  {
    "abbr": "Spring lig",
    "ko": "종골주상인대",
    "eng": "Spring Ligament (Plantar Calcaneonavicular)",
    "pron": "스프링 리가먼트",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목"
    ],
    "notes": [
      "포지션: 누워서 또는 옆으로",
      "임상: 평발 관련 내측 인대",
      "위치: 종골 재거突기→주상골",
      "손상: 평발 변형; 후경골건 기능부전 동반"
    ]
  },
  {
    "abbr": "AT",
    "ko": "아킬레스건",
    "eng": "Achilles Tendon",
    "pron": "아킬리즈 텐던",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목·하퇴 (Ankle/Leg)"
    ],
    "notes": [
      "포지션: 엎드려서(prone) 발 침대 밖으로",
      "임상: 장축·단축 스캔 후 건 주변 주사",
      "기능: 족저굴곡",
      "임상: 가장 큰 건; 장축·단축 스캔 후 건 주변"
    ]
  },
  {
    "abbr": "Retrocalcaneal bursa",
    "ko": "종골후 점액낭",
    "eng": "Retrocalcaneal Bursa",
    "pron": "레트로칼케이니얼 버사",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 아킬레스건 삽입부 앞 점액낭"
    ]
  },
  {
    "abbr": "PF",
    "ko": "족저근막",
    "eng": "Plantar Fascia",
    "pron": "플랜터 패시아",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 엎드려서(prone) 또는 옆으로",
      "임상: 종골 내측 기시부; 족저근막염"
    ]
  },
  {
    "abbr": "Peroneal tendon",
    "ko": "비골건",
    "eng": "Peroneal Tendon",
    "pron": "페로니얼 텐던",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 옆으로 누워서",
      "임상: 외복사뼈 뒤쪽; 비골건염·탈구"
    ]
  },
  {
    "abbr": "TA",
    "ko": "전경골근",
    "eng": "Tibialis Anterior",
    "pron": "티비알리스 안테리어",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목·하퇴 (Ankle/Leg)"
    ],
    "notes": [
      "포지션: 누워서 발목 중립",
      "임상: 발목 앞쪽 건염",
      "기능: 배측굴곡·내번",
      "임상: 발목 앞쪽 건염; 족하수(foot drop)"
    ]
  },
  {
    "abbr": "Morton's neuroma",
    "ko": "모턴 신경종",
    "eng": "Morton's Neuroma",
    "pron": "모턴스 뉴로마",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 누워서(supine) 발 세워",
      "임상: 3~4번 지간; 배측 접근"
    ]
  },
  {
    "abbr": "MTP",
    "ko": "중족지관절",
    "eng": "Metatarsophalangeal Joint",
    "pron": "메타타소-팔랜지얼",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 발가락 뿌리 관절; 통풍·관절염"
    ]
  },
  {
    "abbr": "SPN",
    "ko": "천비골신경",
    "eng": "Superficial Peroneal Nerve",
    "pron": "수퍼피셜 페로니얼 너브",
    "regions": [
      "발목·발 (Ankle/Foot)"
    ],
    "notes": [
      "포지션: 누워서 발목 중립",
      "임상: 발등 외측 감각신경"
    ]
  },
  {
    "abbr": "Lisfranc lig",
    "ko": "리스프랑 인대",
    "eng": "Lisfranc Ligament",
    "pron": "리스프랑 리가먼트",
    "regions": [
      "발목·발 (Ankle/Foot)",
      "발목"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 중족근 관절 안정 인대",
      "위치: 내측 설상골→2중족골 기저부",
      "손상: 중족근 관절 손상; Fleck sign"
    ]
  },
  {
    "abbr": "FJ",
    "ko": "후관절",
    "eng": "Facet Joint (Zygapophyseal Joint)",
    "pron": "패싯 조인트",
    "regions": [
      "척추·목·허리 (Spine)"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 척추 후방 관절"
    ]
  },
  {
    "abbr": "MBB",
    "ko": "내측지 차단술",
    "eng": "Medial Branch Block",
    "pron": "미디얼 브랜치 블락",
    "regions": [
      "척추·목·허리 (Spine)",
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 후관절 신경; RF 전 진단 주사",
      "임상: 후관절 신경; RF 전 진단"
    ]
  },
  {
    "abbr": "ESPB",
    "ko": "척추기립근 평면 차단술",
    "eng": "Erector Spinae Plane Block",
    "pron": "이렉터 스피니 플레인 블락",
    "regions": [
      "척추·목·허리 (Spine)",
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 엎드려서 또는 앉아서",
      "임상: 흉·요부 광범위 통증",
      "임상: 흉·요추 광범위 차단"
    ]
  },
  {
    "abbr": "ICNB",
    "ko": "늑간신경 차단술",
    "eng": "Intercostal Nerve Block",
    "pron": "인터코스탈 너브 블락",
    "regions": [
      "척추·목·허리 (Spine)"
    ],
    "notes": [
      "포지션: 앉아서 등 노출 또는 옆으로",
      "임상: 갈비뼈 아래 경계 주사"
    ]
  },
  {
    "abbr": "SCM",
    "ko": "흉쇄유돌근",
    "eng": "Sternocleidomastoid",
    "pron": "스터노클라이도마스토이드",
    "regions": [
      "척추·목·허리 (Spine)",
      "어깨 (Shoulder)",
      "척추·몸통 (Spine/Trunk)"
    ],
    "notes": [
      "포지션: 누워서(supine) 고개 반대로",
      "임상: 목 앞쪽 굵은 근육; 사경 보톡스",
      "기능: 머리 굴곡·회전",
      "임상: 사경 보톡스 대표 근육",
      "임상: 사경 보톡스; 목 통증"
    ]
  },
  {
    "abbr": "SSL",
    "ko": "극상인대",
    "eng": "Supraspinous Ligament",
    "pron": "수프라스피너스 리가먼트",
    "regions": [
      "척추·목·허리 (Spine)",
      "척추"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 척추 극돌기 위 정중선 인대",
      "위치: 극돌기 끝 정중선",
      "손상: 굴곡 과부하"
    ]
  },
  {
    "abbr": "ISL",
    "ko": "극간인대",
    "eng": "Interspinous Ligament",
    "pron": "인터스피너스 리가먼트",
    "regions": [
      "척추·목·허리 (Spine)",
      "척추"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 극돌기 사이 인대",
      "위치: 인접 극돌기 사이",
      "손상: 굴곡 손상; Baastrup"
    ]
  },
  {
    "abbr": "LF",
    "ko": "황색인대",
    "eng": "Ligamentum Flavum",
    "pron": "리가멘텀 플라붐",
    "regions": [
      "척추·목·허리 (Spine)",
      "척추"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 척추관 후방; 경막외 접근 랜드마크",
      "위치: 추궁판 사이 후방",
      "손상: LF 비후 → 척추관 협착"
    ]
  },
  {
    "abbr": "ALL",
    "ko": "전종인대",
    "eng": "Anterior Longitudinal Ligament",
    "pron": "안테리어 롱지튜디널 리가먼트",
    "regions": [
      "척추·목·허리 (Spine)",
      "척추"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 척추체 전방; 과신전 손상",
      "위치: 척추체 전면 전체",
      "손상: 과신전 손상"
    ]
  },
  {
    "abbr": "PLL",
    "ko": "후종인대",
    "eng": "Posterior Longitudinal Ligament",
    "pron": "포스티어리어 롱지튜디널 리가먼트",
    "regions": [
      "척추·목·허리 (Spine)",
      "척추"
    ],
    "notes": [
      "포지션: 엎드려서(prone)",
      "임상: 척추관 전방; OPLL 관련",
      "위치: 척추체 후면 척추관 내",
      "손상: OPLL; 경부 척수증"
    ]
  },
  {
    "abbr": "SN",
    "ko": "좌골신경",
    "eng": "Sciatic Nerve",
    "pron": "사이아틱 너브",
    "regions": [
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 엎드려서(prone) 또는 옆으로",
      "임상: 엉덩이 아래; 대전자~좌골결절 중점"
    ]
  },
  {
    "abbr": "FN",
    "ko": "대퇴신경",
    "eng": "Femoral Nerve",
    "pron": "페모럴 너브",
    "regions": [
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 누워서(supine) 다리 약간 외회전",
      "임상: 서혜부 인대 아래; 대퇴동맥 외측"
    ]
  },
  {
    "abbr": "RN",
    "ko": "요골신경",
    "eng": "Radial Nerve",
    "pron": "레이디얼 너브",
    "regions": [
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 앉아서 팔꿈치 신전·회내",
      "임상: 팔꿈치 외측"
    ]
  },
  {
    "abbr": "GN",
    "ko": "슬개 신경",
    "eng": "Genicular Nerve",
    "pron": "제니큘러 너브",
    "regions": [
      "신경 (Nerve Block)"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 무릎 통증; 고주파 열응고 전 진단"
    ]
  },
  {
    "abbr": "IA injection",
    "ko": "관절 내 주사",
    "eng": "Intra-Articular Injection",
    "pron": "인트라-아티큘러 인젝션",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 부위별 상이",
      "임상: 관절강 내 직접 주사"
    ]
  },
  {
    "abbr": "PRP",
    "ko": "혈소판 풍부 혈장",
    "eng": "Platelet-Rich Plasma",
    "pron": "피알피",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 부위별 상이",
      "임상: 자가혈 원심분리 재생 주사"
    ]
  },
  {
    "abbr": "HA",
    "ko": "히알루론산",
    "eng": "Hyaluronic Acid",
    "pron": "하이알루로닉 애시드",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 부위별 상이",
      "임상: 관절 윤활 보충; 무릎·어깨"
    ]
  },
  {
    "abbr": "Aspiration",
    "ko": "흡인술",
    "eng": "Aspiration",
    "pron": "어스피레이션",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 부위별 상이",
      "임상: 관절액·낭종·석회 제거"
    ]
  },
  {
    "abbr": "Hydrodissection",
    "ko": "수압박리술",
    "eng": "Hydrodissection",
    "pron": "하이드로디섹션",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 부위별 상이",
      "임상: 신경·건 유착 박리; NS or D5W"
    ]
  },
  {
    "abbr": "Hydrodilatation",
    "ko": "수압팽창술",
    "eng": "Hydrodilatation",
    "pron": "하이드로다이레이테이션",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 앉아서 또는 누워서 (어깨)",
      "임상: 오십견 관절낭 팽창"
    ]
  },
  {
    "abbr": "Barbotage",
    "ko": "석회흡인술",
    "eng": "Barbotage",
    "pron": "바보타쥐",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 앉아서 팔 내회전 (어깨)",
      "임상: 석회성건염 반복 천자·흡인"
    ]
  },
  {
    "abbr": "Fenestration",
    "ko": "건 천자술 / 건침술",
    "eng": "Fenestration / Dry Needling",
    "pron": "페네스트레이션",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 부위별 상이",
      "임상: 건 반복 천자 재생 자극"
    ]
  },
  {
    "abbr": "Genicular nerve block",
    "ko": "슬개 신경 차단술",
    "eng": "Genicular Nerve Block",
    "pron": "제니큘러 너브 블락",
    "regions": [
      "시술 종류 (Procedure)"
    ],
    "notes": [
      "포지션: 누워서(supine)",
      "임상: 무릎 통증 조절; RFA 전 진단"
    ]
  },
  {
    "abbr": "LUCL",
    "ko": "외측척측측부인대",
    "eng": "Lateral Ulnar Collateral Ligament",
    "pron": "래터럴 울너 콜래터럴 리가먼트",
    "regions": [
      "팔꿈치"
    ],
    "notes": [
      "위치: 외상과→척골 외측",
      "손상: PLRI (후외측 회전불안정)"
    ]
  },
  {
    "abbr": "LTL",
    "ko": "월상삼각인대",
    "eng": "Lunotriquetral Ligament",
    "pron": "루노트리케트럴 리가먼트",
    "regions": [
      "손목·손"
    ],
    "notes": [
      "위치: 월상골↔삼각골",
      "손상: 척측 손목 통증; VISI 변형"
    ]
  },
  {
    "abbr": "RCL thumb",
    "ko": "엄지 요측측부인대",
    "eng": "Radial Collateral Ligament (Thumb MCP)",
    "pron": "레이디얼 콜래터럴 리가먼트 (엄지)",
    "regions": [
      "손목·손"
    ],
    "notes": [
      "위치: 엄지 MCP 외측",
      "손상: 내반 손상"
    ]
  },
  {
    "abbr": "LT",
    "ko": "원형인대",
    "eng": "Ligamentum Teres",
    "pron": "리가멘텀 테레스",
    "regions": [
      "고관절"
    ],
    "notes": [
      "위치: 비구와→대퇴골두 와",
      "손상: 비구순 병변 동반 가능"
    ]
  },
  {
    "abbr": "ACL",
    "ko": "전방십자인대",
    "eng": "Anterior Cruciate Ligament",
    "pron": "안테리어 크루시에이트 리가먼트",
    "regions": [
      "무릎"
    ],
    "notes": [
      "위치: 경골 전방→대퇴 외측과",
      "손상: 전방 불안정; pivot shift"
    ]
  },
  {
    "abbr": "PCL",
    "ko": "후방십자인대",
    "eng": "Posterior Cruciate Ligament",
    "pron": "포스티어리어 크루시에이트 리가먼트",
    "regions": [
      "무릎"
    ],
    "notes": [
      "위치: 경골 후방→대퇴 내측과",
      "손상: 후방 불안정; 계기판 손상"
    ]
  },
  {
    "abbr": "PLC",
    "ko": "후외측 복합체",
    "eng": "Posterolateral Corner",
    "pron": "포스테로래터럴 코너",
    "regions": [
      "무릎"
    ],
    "notes": [
      "위치: LCL+슬와건+PFL 복합",
      "손상: 내반+외회전 불안정"
    ]
  },
  {
    "abbr": "QT",
    "ko": "대퇴사두근건",
    "eng": "Quadriceps Tendon",
    "pron": "쿼드리셉스 텐던",
    "regions": [
      "무릎"
    ],
    "notes": [
      "위치: 4두근→슬개골 상극",
      "손상: 퇴행성 파열; 고령"
    ]
  },
  {
    "abbr": "Deltoid",
    "ko": "삼각인대 (내측 복합체)",
    "eng": "Deltoid Ligament (Medial Complex)",
    "pron": "델토이드 리가먼트",
    "regions": [
      "발목"
    ],
    "notes": [
      "위치: 내복사뼈→거골·종골·주상골",
      "손상: 외번 손상; 삼과 골절 동반"
    ]
  },
  {
    "abbr": "Bifurcate lig",
    "ko": "이분인대",
    "eng": "Bifurcate Ligament",
    "pron": "바이퍼케이트 리가먼트",
    "regions": [
      "발목"
    ],
    "notes": [
      "위치: 종골 전방→입방골·주상골",
      "손상: 발목 전외측 손상 동반"
    ]
  },
  {
    "abbr": "ILL",
    "ko": "장요인대",
    "eng": "Iliolumbar Ligament",
    "pron": "일리오럼바 리가먼트",
    "regions": [
      "척추"
    ],
    "notes": [
      "위치: L4·L5 횡돌기→장골능",
      "손상: L4-5 하부 요통; SIJ 전방 안정"
    ]
  },
  {
    "abbr": "Biceps",
    "ko": "상완이두근",
    "eng": "Biceps Brachii",
    "pron": "바이셉스",
    "regions": [
      "팔꿈치·팔 (Elbow/Arm)"
    ],
    "notes": [
      "기능: 팔꿈치 굴곡·전완 회외",
      "포지션: 앉아서 팔 약간 외회전",
      "임상: LHB 건초염·탈구; Popeye sign"
    ]
  },
  {
    "abbr": "APL",
    "ko": "장무지외전근",
    "eng": "Abductor Pollicis Longus",
    "pron": "앱덕터 폴리시스 롱거스",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "기능: 엄지 외전",
      "포지션: 앉아서 엄지 위로",
      "임상: De Quervain 1구획; EPB와 함께"
    ]
  },
  {
    "abbr": "EPB",
    "ko": "단무지신근",
    "eng": "Extensor Pollicis Brevis",
    "pron": "익스텐서 폴리시스 브레비스",
    "regions": [
      "손목·손 (Wrist/Hand)"
    ],
    "notes": [
      "기능: 엄지 신전",
      "포지션: 앉아서 엄지 위로",
      "임상: De Quervain 1구획; APL과 함께"
    ]
  },
  {
    "abbr": "Glute med",
    "ko": "중둔근",
    "eng": "Gluteus Medius",
    "pron": "글루테우스 미디어스",
    "regions": [
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "기능: 외전·내회전",
      "포지션: 옆으로 누워서 (lateral decubitus)",
      "임상: GTPS 핵심 근육; 주사 가장 흔한 위치"
    ]
  },
  {
    "abbr": "Glute min",
    "ko": "소둔근",
    "eng": "Gluteus Minimus",
    "pron": "글루테우스 미니머스",
    "regions": [
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "기능: 외전·내회전",
      "포지션: 옆으로 누워서",
      "임상: 중둔근 아래; GTPS 동반 손상"
    ]
  },
  {
    "abbr": "Piriformis",
    "ko": "이상근",
    "eng": "Piriformis",
    "pron": "피리포미스",
    "regions": [
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "기능: 외회전·외전",
      "포지션: 엎드려서(prone) 또는 옆으로",
      "임상: 이상근 증후군; 좌골신경 관련"
    ]
  },
  {
    "abbr": "Hamstring",
    "ko": "햄스트링 (대퇴이두근·반막양근·반건양근)",
    "eng": "Hamstrings (BF/SM/ST)",
    "pron": "햄스트링",
    "regions": [
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "기능: 무릎 굴곡·고관절 신전",
      "포지션: 엎드려서(prone)",
      "임상: 좌골결절 부착부 건병증; 근육 파열"
    ]
  },
  {
    "abbr": "Add longus",
    "ko": "장내전근",
    "eng": "Adductor Longus",
    "pron": "어덕터 롱거스",
    "regions": [
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "기능: 고관절 내전",
      "포지션: 누워서(supine) 다리 약간 외전",
      "임상: 서혜부 통증; 스포츠 탈장 관련"
    ]
  },
  {
    "abbr": "Iliopsoas",
    "ko": "장요근",
    "eng": "Iliopsoas",
    "pron": "일리오사아스",
    "regions": [
      "고관절·골반 (Hip/Pelvis)"
    ],
    "notes": [
      "기능: 고관절 굴곡",
      "포지션: 누워서(supine) 다리 약간 외회전",
      "임상: 장요근건염; Snapping hip (내측형)"
    ]
  },
  {
    "abbr": "Quad",
    "ko": "대퇴사두근",
    "eng": "Quadriceps Femoris",
    "pron": "쿼드리셉스",
    "regions": [
      "무릎·대퇴 (Knee/Thigh)"
    ],
    "notes": [
      "기능: 무릎 신전",
      "포지션: 누워서 무릎 약간 굴곡",
      "임상: QT 파열; 슬개골 상방 접근"
    ]
  },
  {
    "abbr": "Gastroc",
    "ko": "비복근",
    "eng": "Gastrocnemius",
    "pron": "개스트로크니미어스",
    "regions": [
      "무릎·대퇴 (Knee/Thigh)"
    ],
    "notes": [
      "기능: 발목 족저굴곡·무릎 굴곡",
      "포지션: 엎드려서(prone) 또는 누워서",
      "임상: Plantaris 파열 혼동; 종아리 통증"
    ]
  },
  {
    "abbr": "Popliteus",
    "ko": "슬와근",
    "eng": "Popliteus",
    "pron": "포플리테우스",
    "regions": [
      "무릎·대퇴 (Knee/Thigh)"
    ],
    "notes": [
      "기능: 무릎 내회전·굴곡 잠금해제",
      "포지션: 엎드려서(prone) 또는 누워서",
      "임상: 무릎 잠금해제; PLC 구성 요소"
    ]
  },
  {
    "abbr": "Soleus",
    "ko": "가자미근",
    "eng": "Soleus",
    "pron": "솔레우스",
    "regions": [
      "발목·하퇴 (Ankle/Leg)"
    ],
    "notes": [
      "기능: 족저굴곡",
      "포지션: 엎드려서(prone)",
      "임상: 비복근 아래; 심부 종아리 통증"
    ]
  },
  {
    "abbr": "Peroneal",
    "ko": "비골근 (장·단)",
    "eng": "Peroneus Longus & Brevis",
    "pron": "페로니얼",
    "regions": [
      "발목·하퇴 (Ankle/Leg)"
    ],
    "notes": [
      "기능: 족저굴곡·외번",
      "포지션: 옆으로 누워서",
      "임상: 외복사뼈 뒤; 비골건염·탈구"
    ]
  },
  {
    "abbr": "PTT",
    "ko": "후경골근건",
    "eng": "Posterior Tibialis Tendon",
    "pron": "포스티어리어 티비알리스 텐던",
    "regions": [
      "발목·하퇴 (Ankle/Leg)"
    ],
    "notes": [
      "기능: 배측굴곡·내번",
      "포지션: 누워서 발목 외번",
      "임상: PTT 기능부전 → 후천성 평발; 내측 복사 뒤"
    ]
  },
  {
    "abbr": "FHL",
    "ko": "장무지굴근",
    "eng": "Flexor Hallucis Longus",
    "pron": "플렉서 할루시스 롱거스",
    "regions": [
      "발목·하퇴 (Ankle/Leg)"
    ],
    "notes": [
      "기능: 엄지 굴곡·족저굴곡",
      "포지션: 엎드려서 또는 내번 자세",
      "임상: 발레리나 건염; 내측 복사 뒤 터널"
    ]
  },
  {
    "abbr": "ES",
    "ko": "척추기립근",
    "eng": "Erector Spinae",
    "pron": "이렉터 스피니",
    "regions": [
      "척추·몸통 (Spine/Trunk)"
    ],
    "notes": [
      "기능: 척추 신전·측굴",
      "포지션: 엎드려서(prone) 또는 앉아서",
      "임상: ESPB 블락 대상; 흉·요부 광범위 통증"
    ]
  },
  {
    "abbr": "QL",
    "ko": "요방형근",
    "eng": "Quadratus Lumborum",
    "pron": "쿼드라터스 럼보럼",
    "regions": [
      "척추·몸통 (Spine/Trunk)"
    ],
    "notes": [
      "기능: 요추 측굴·안정화",
      "포지션: 옆으로 누워서 또는 엎드려",
      "임상: QL 차단술; 만성 요통·복부 수술 통증"
    ]
  },
  {
    "abbr": "Multifidus",
    "ko": "다열근",
    "eng": "Multifidus",
    "pron": "멀티피더스",
    "regions": [
      "척추·몸통 (Spine/Trunk)"
    ],
    "notes": [
      "기능: 척추 안정화·신전",
      "포지션: 엎드려서(prone)",
      "임상: 만성 요통 재활 핵심; 위축 평가 초음파"
    ]
  },
  {
    "abbr": "Scalenes",
    "ko": "사각근",
    "eng": "Scalene Muscles",
    "pron": "스케일린즈",
    "regions": [
      "척추·몸통 (Spine/Trunk)"
    ],
    "notes": [
      "기능: 경추 굴곡·측굴·흡기 보조",
      "포지션: 앉아서 목 측면 노출",
      "임상: 흉곽출구증후군; DSNB 관련 구조"
    ]
  }
];

type Msg = { who: "bot" | "user"; text: string };

// 정규화: 대소문자·공백·점·슬래시·괄호·중점 무시
function norm(s: string): string {
  return s.toUpperCase().replace(/[.\s/()·\-]/g, "");
}

// 약어/한글명/영문명/발음 중 무엇으로 입력해도 매칭
function findTerm(text: string): Term | null {
  const q = norm(text);
  if (!q) return null;
  // 1) 정확히 일치 우선
  for (const t of TERMS) {
    for (const a of [t.abbr, t.ko, t.eng, t.pron]) {
      if (a && norm(a) === q) return t;
    }
  }
  // 2) 문장 안에 포함 (짧은 오매칭 방지: 약어≥3, 한글≥2, 영문≥4)
  for (const t of TERMS) {
    const cands: string[] = [];
    if (t.abbr && norm(t.abbr).length >= 3) cands.push(norm(t.abbr));
    if (t.ko && norm(t.ko).length >= 2) cands.push(norm(t.ko));
    if (t.eng && norm(t.eng).length >= 4) cands.push(norm(t.eng));
    if (t.pron && norm(t.pron).length >= 3) cands.push(norm(t.pron));
    for (const c of cands) if (q.includes(c)) return t;
  }
  return null;
}

function answer(text: string): string {
  const t = findTerm(text);
  if (!t) return "아직 등록되지 않은 용어입니다.";
  let head = t.abbr;
  if (t.ko) head += ` — ${t.ko}`;
  const sub: string[] = [];
  if (t.eng) sub.push(t.eng);
  if (t.pron) sub.push(t.pron);
  const lines = [head];
  if (sub.length) lines.push(`(${sub.join(" · ")})`);
  if (t.regions.length) lines.push(`부위: ${t.regions.join(", ")}`);
  for (const n of t.notes) lines.push(n);
  return lines.join("\n");
}

const CHIPS = ["NPO", "GH", "SSP", "ISP", "CTS", "MCL", "ACL", "ATFL"];

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      who: "bot",
      text:
        "안녕하세요! 임상 약어 도우미예요. 🩺\n초음파 주사 약어(어깨·팔꿈치·손목·고관절·무릎·발목·척추 등)와 기본 간호 약어를 등록해뒀어요.\n약어·한글명·영문명 무엇이든 입력해보세요. (예: SSP, 극상근, Supraspinatus)",
    },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setMessages((p) => [...p, { who: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { who: "bot", text: answer(text) }]);
    }, 200);
  }

  return (
    <MemberShell slug="yu-seonghui">
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          🩺 내 작업물 · 임상 약어 챗봇 (MVP)
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          정형외과·마취통증·재활의학 초음파 주사 약어와 기본 간호 약어를 검색할 수 있어요.
          현재 <b>{TERMS.length}개</b> 약어가 등록돼 있고, 등록 안 된 용어는 안내 메시지가 나옵니다.
        </p>
      </section>

      <div className="mx-auto flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center gap-3 bg-teal-600 px-5 py-4 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xl">🩺</div>
          <div>
            <h2 className="text-[15px] font-bold">임상 약어 도우미</h2>
            <p className="text-xs opacity-85">{TERMS.length}개 약어 등록 · 무엇이든 물어보세요</p>
          </div>
        </div>

        <div ref={chatRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-950">
          {messages.map((m, i) => (
            <div key={i} className={m.who === "user" ? "max-w-[88%] self-end" : "max-w-[88%] self-start"}>
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
          {messages.length === 1 && (
            <div className="mt-1 flex flex-wrap gap-2 self-start">
              {CHIPS.map((k) => (
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
            placeholder="예) SSP / 극상근 / Supraspinatus"
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
        ※ 실제 AI 연동 없이, 업로드한 엑셀의 약어 {TERMS.length}개에만 정해진 답변을 제공하는 MVP입니다.
      </p>
    </MemberShell>
  );
}
