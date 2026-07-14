"use client";

import { useEffect, useRef, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ✏️ "yu-seonghui" 님의 작업물 — 임상 의학용어·주사 약어 챗봇 (MVP)
// 데이터: 초음파주사_약어_근육포함_v4.xlsx + 임상실무_의학용어_주사약어_가이드_신경외과포함.pptx
// 실제 AI 연동 없음. 검색 시 해당 "부위"를 인체 도해(SVG)로 함께 표시합니다.

type Term = { abbr: string; ko: string; eng: string; dept: string; info: string[]; region: string };

const TERMS: Term[] = [
 {
  "abbr": "GH",
  "ko": "견관절",
  "eng": "Glenohumeral Joint",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 글레노휴머럴",
   "포지션: 앉거나 옆누워 / 팔 중립",
   "임상: 어깨 주 관절; 후방 또는 전방 접근"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "AC",
  "ko": "견봉쇄골관절",
  "eng": "Acromioclavicular Joint",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 아크로미오클라비큘러",
   "포지션: 앉아서 팔 내려놓고",
   "임상: 쇄골 끝·견봉 사이 좁은 관절"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "SA-SD bursa",
  "ko": "견봉하-삼각근하 점액낭",
  "eng": "Subacromial-Subdeltoid Bursa",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 섭아크로미얼-섭델토이드 버사",
   "포지션: 앉아서 팔 내회전(뒤로 돌려 허리 뒤)",
   "임상: 가장 흔한 어깨 주사; long-axis 접근"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "SSP",
  "ko": "극상근",
  "eng": "Supraspinatus",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 수프라스피나터스",
   "포지션: 앉아서 팔 내회전 (Crass position)",
   "임상: RC 중 손상 가장 많음",
   "기능: 외전 초기(0-15°)",
   "포지션: Crass position (팔 내회전·등 뒤)",
   "임상: RC 중 가장 흔한 손상; full-thickness tear 多"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "ISP",
  "ko": "극하근",
  "eng": "Infraspinatus",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 인프라스피나터스",
   "포지션: 앉아서 팔 중립·내회전",
   "임상: 후방 어깨; 외회전",
   "기능: 외회전",
   "임상: 후방 어깨 접근; 외회전 약화"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "SSC",
  "ko": "견갑하근",
  "eng": "Subscapularis",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 섭스캐퓰라리스",
   "포지션: 앉아서 팔 외회전",
   "임상: 전방 어깨; 내회전",
   "기능: 내회전·내전",
   "임상: 전방 어깨; 내회전 약화 시 의심"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "TM",
  "ko": "소원근",
  "eng": "Teres Minor",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 테레스 마이너",
   "포지션: 앉아서 팔 중립",
   "임상: ISP 아래; 외회전 보조",
   "기능: 외회전 보조",
   "임상: ISP 아래; Quadrilateral space 관련"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "LHB",
  "ko": "상완이두근 장두건",
  "eng": "Long Head of Biceps Tendon",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 롱 헤드 오브 바이셉스",
   "포지션: 앉아서 팔 약간 외회전",
   "임상: Bicipital groove 내 건초 주사"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "Pec min",
  "ko": "소흉근",
  "eng": "Pectoralis Minor",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 펙토랄리스 마이너",
   "포지션: 누워서(supine) 팔 약간 외전",
   "임상: 오훼돌기 아래 부착부",
   "기능: 견갑골 하방회전·전인",
   "임상: 오훼돌기 아래 부착부; 소흉근 증후군"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "Coracobrachialis",
  "ko": "오훼완근",
  "eng": "Coracobrachialis",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 코라코브라키알리스",
   "포지션: 누워서(supine) 팔 외전·외회전",
   "임상: 오훼돌기 내측",
   "기능: 굴곡·내전",
   "임상: 오훼돌기 내측; 근피신경 관통"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "SA",
  "ko": "전거근",
  "eng": "Serratus Anterior",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 세라터스 안테리어",
   "포지션: 앉아서 팔 올리거나 옆누워",
   "임상: 날개뼈 전방 고정근",
   "기능: 견갑골 전인·상방회전",
   "임상: 날개견갑(winged scapula); 장흉신경 마비"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "DSNB",
  "ko": "견갑배신경 차단술",
  "eng": "Dorsal Scapular Nerve Block",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 도설 스캐퓰러 너브 블락",
   "포지션: 앉아서 등 노출",
   "임상: 중사각근 통과 신경"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "CHL",
  "ko": "오훼상완인대",
  "eng": "Coracohumeral Ligament",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 코라코휴머럴 리가먼트",
   "포지션: 앉아서 팔 중립·내회전",
   "임상: 오십견 때 두꺼워짐; 전방 관절낭",
   "위치: 오훼돌기→대결절·소결절",
   "손상: 오십견 시 두꺼워짐; 전방 관절낭"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "SGHL",
  "ko": "상부 관절상완인대",
  "eng": "Superior Glenohumeral Ligament",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 수피리어 글레노휴머럴 리가먼트",
   "포지션: 앉아서 전방 접근",
   "임상: 상방 관절낭 안정화",
   "위치: 상방 관절낭 전방부",
   "손상: 상방 불안정"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "IGHL",
  "ko": "하부 관절상완인대",
  "eng": "Inferior Glenohumeral Ligament",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 인페리어 글레노휴머럴 리가먼트",
   "포지션: 앉아서 전방·하방 접근",
   "임상: Bankart 병변 관련",
   "위치: 하방 관절낭",
   "손상: Bankart 병변; 전방 불안정"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "CAL",
  "ko": "오훼견봉인대",
  "eng": "Coracoacromial Ligament",
  "dept": "초음파주사 · 어깨 (Shoulder)",
  "info": [
   "발음: 코라코아크로미얼 리가먼트",
   "포지션: 앉아서 전방",
   "임상: 충돌증후군 관련 인대",
   "위치: 오훼돌기→견봉",
   "손상: 충돌증후군 관련"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "EDC",
  "ko": "총지신근",
  "eng": "Extensor Digitorum Communis",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 익스텐서 디지토럼 커뮤니스",
   "포지션: 앉아서 팔꿈치 90° 굴곡·전완 회내",
   "임상: 외상과; 테니스엘보 핵심",
   "기능: 손가락 신전",
   "임상: 테니스엘보 핵심 근육; 외상과 부착부"
  ],
  "region": "arm"
 },
 {
  "abbr": "FCU",
  "ko": "척측수근굴근",
  "eng": "Flexor Carpi Ulnaris",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 플렉서 카파이 울나리스",
   "포지션: 앉아서 팔꿈치 굴곡·전완 회외",
   "임상: 내상과; 골퍼엘보",
   "포지션: 앉아서 손 회외",
   "임상: 손목 척측 굴곡건",
   "기능: 손목 굴곡·척측 편위",
   "임상: 골퍼엘보 핵심; 척골신경 인접"
  ],
  "region": "arm"
 },
 {
  "abbr": "FCR",
  "ko": "요측수근굴근",
  "eng": "Flexor Carpi Radialis",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 플렉서 카파이 레이디얼리스",
   "포지션: 앉아서 팔꿈치 굴곡·전완 회외",
   "임상: 내상과 요측",
   "포지션: 앉아서 손 회외",
   "임상: 손목 요측 굴곡건",
   "기능: 손목 굴곡·요측 편위",
   "임상: 골퍼엘보 내상과 요측; CTS 관련"
  ],
  "region": "arm"
 },
 {
  "abbr": "Tri lat",
  "ko": "삼두근 외측두",
  "eng": "Triceps Lateral Head",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 트라이셉스 래터럴 헤드",
   "포지션: 앉아서 팔 뻗거나 엎드려",
   "임상: 주두 부착부 건염",
   "기능: 팔꿈치 신전",
   "임상: 주두 부착부 건염; 주두 점액낭 인접"
  ],
  "region": "arm"
 },
 {
  "abbr": "UN",
  "ko": "척골신경",
  "eng": "Ulnar Nerve",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 울너 너브",
   "포지션: 앉아서 팔꿈치 90° 굴곡",
   "임상: 주관증후군; 내상과 후방 홈",
   "포지션: 앉아서 팔꿈치 굴곡 90°",
   "임상: 팔꿈치 내측 홈 또는 손목 척측"
  ],
  "region": "arm"
 },
 {
  "abbr": "RCL elbow",
  "ko": "요측측부인대 (팔꿈치)",
  "eng": "Radial Collateral Ligament (Elbow)",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 레이디얼 콜래터럴 리가먼트 (엘보)",
   "포지션: 앉아서 팔꿈치 굴곡·회내",
   "임상: 외측 팔꿈치 안정 인대",
   "위치: 외상과→윤상인대",
   "손상: 외측 팔꿈치 불안정"
  ],
  "region": "arm"
 },
 {
  "abbr": "UCL elbow",
  "ko": "척측측부인대 (팔꿈치)",
  "eng": "Ulnar Collateral Ligament (Elbow)",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 울너 콜래터럴 리가먼트 (엘보)",
   "포지션: 앉아서 팔꿈치 굴곡·회외",
   "임상: 내측 안정 인대; 투수 손상",
   "위치: 내상과→구상돌기·올레크라논",
   "손상: 투수 내측 팔꿈치; 반복 외반 스트레스"
  ],
  "region": "arm"
 },
 {
  "abbr": "Olecranon bursa",
  "ko": "주두 점액낭",
  "eng": "Olecranon Bursa",
  "dept": "초음파주사 · 팔꿈치 (Elbow)",
  "info": [
   "발음: 올레크라논 버사",
   "포지션: 앉아서 팔꿈치 굴곡",
   "임상: 주두 돌출부 흡인·주사"
  ],
  "region": "arm"
 },
 {
  "abbr": "MN",
  "ko": "정중신경",
  "eng": "Median Nerve",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 미디언 너브",
   "포지션: 앉아서 손 회외",
   "임상: CTS 핵심 주사 구조물",
   "임상: 손목 수근관; CTS"
  ],
  "region": "hand"
 },
 {
  "abbr": "CTS",
  "ko": "수근관증후군",
  "eng": "Carpal Tunnel Syndrome",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand) / 정형외과 · 진단",
  "info": [
   "발음: 카팔 터널 신드롬",
   "포지션: 앉아서 손 회외·손목 약간 신전",
   "임상: 정중신경 감압 주사 대표 적응증"
  ],
  "region": "hand"
 },
 {
  "abbr": "PL",
  "ko": "장장근",
  "eng": "Palmaris Longus",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 팔마리스 롱거스",
   "포지션: 앉아서 손 회외",
   "임상: 중앙 가느다란 힘줄; 없는 경우도 있음",
   "기능: 손목 굴곡 보조",
   "임상: 중앙 가느다란 건; 10~15%에서 없음"
  ],
  "region": "hand"
 },
 {
  "abbr": "De Quervain",
  "ko": "드퀘르뱅 건초염",
  "eng": "De Quervain Tenosynovitis",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 드퀘르뱅",
   "포지션: 앉아서 엄지 위로 새끼 쪽 기울여",
   "임상: APL·EPB 건초; 1구획"
  ],
  "region": "hand"
 },
 {
  "abbr": "CMC",
  "ko": "수근중수관절",
  "eng": "Carpometacarpal Joint",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 카포메타카팔",
   "포지션: 앉아서 엄지 위로",
   "임상: 엄지 기저부 관절염"
  ],
  "region": "hand"
 },
 {
  "abbr": "Trigger finger",
  "ko": "방아쇠수지",
  "eng": "Trigger Finger (Stenosing Tenosynovitis)",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 트리거 핑거",
   "포지션: 앉아서 손 회외",
   "임상: A1 pulley 주사"
  ],
  "region": "hand"
 },
 {
  "abbr": "PIP",
  "ko": "근위지간관절",
  "eng": "Proximal Interphalangeal Joint",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 프록시멀 인터팔랜지얼",
   "포지션: 앉아서 손 올려놓기",
   "임상: 손가락 중간 관절"
  ],
  "region": "hand"
 },
 {
  "abbr": "DIP",
  "ko": "원위지간관절",
  "eng": "Distal Interphalangeal Joint",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 디스탈 인터팔랜지얼",
   "포지션: 앉아서 손 올려놓기",
   "임상: 손가락 끝 관절"
  ],
  "region": "hand"
 },
 {
  "abbr": "UCL thumb",
  "ko": "엄지 척측측부인대",
  "eng": "Ulnar Collateral Ligament (Thumb MCP)",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 울너 콜래터럴 리가먼트 (엄지)",
   "포지션: 앉아서 엄지 노출",
   "임상: Skier's thumb; MCP 내측",
   "위치: 엄지 MCP 내측",
   "손상: 스키어 엄지; 외반 손상"
  ],
  "region": "hand"
 },
 {
  "abbr": "TFCC",
  "ko": "삼각섬유연골복합체",
  "eng": "Triangular Fibrocartilage Complex",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 트라이앵귤러 파이브로카틸리지 컴플렉스",
   "포지션: 앉아서 손 회내 또는 중립",
   "임상: 손목 척측 통증 핵심 구조물",
   "위치: 척골두→척측 손목",
   "손상: 척측 손목 통증; 회전 부하"
  ],
  "region": "hand"
 },
 {
  "abbr": "SLL",
  "ko": "주상월상인대",
  "eng": "Scapholunate Ligament",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 스캐포루네이트 리가먼트",
   "포지션: 앉아서 손 약간 회내",
   "임상: 손목 등쪽; 손목 불안정 주요 인대",
   "위치: 주상골↔월상골 사이",
   "손상: 낙상 시 손목 신전 손상; DISI"
  ],
  "region": "hand"
 },
 {
  "abbr": "Hip IA",
  "ko": "고관절 내 주사",
  "eng": "Hip Intra-Articular",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 힙 인트라-아티큘러",
   "포지션: 누워서(supine) 다리 약간 외회전",
   "임상: 전방 접근; 대퇴동맥 외측"
  ],
  "region": "hip"
 },
 {
  "abbr": "GT bursa",
  "ko": "대전자 점액낭",
  "eng": "Greater Trochanter Bursa",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 그레이터 트로칸터 버사",
   "포지션: 옆으로 누워서(lateral decubitus)",
   "임상: GTPS 대표 주사"
  ],
  "region": "hip"
 },
 {
  "abbr": "TFL",
  "ko": "대퇴근막장근",
  "eng": "Tensor Fasciae Latae",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 텐서 패시이 레이티",
   "포지션: 옆으로 누워서",
   "임상: 장경인대 기시부",
   "기능: 고관절 굴곡·외전·내회전",
   "임상: ITB 기시부; 대전자 외측"
  ],
  "region": "hip"
 },
 {
  "abbr": "ITB",
  "ko": "장경인대",
  "eng": "Iliotibial Band",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 일리오티비얼 밴드",
   "포지션: 옆으로 누워서",
   "임상: 허벅지 외측 전체",
   "기능: 무릎 안정화",
   "임상: 러너즈니; 무릎 외측 마찰 증후군"
  ],
  "region": "hip"
 },
 {
  "abbr": "LFCN",
  "ko": "외측대퇴피신경",
  "eng": "Lateral Femoral Cutaneous Nerve",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 래터럴 페모럴 큐테이니어스 너브",
   "포지션: 누워서(supine)",
   "임상: ASIS 내측 2cm; 이상감각대퇴통증",
   "임상: ASIS 내측; 이상감각대퇴통증"
  ],
  "region": "hip"
 },
 {
  "abbr": "PSIS",
  "ko": "후상장골극",
  "eng": "Posterior Superior Iliac Spine",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 포스티어리어 수피리어 일리악 스파인",
   "포지션: 엎드려서(prone)",
   "임상: SIJ 진입 랜드마크"
  ],
  "region": "trunk"
 },
 {
  "abbr": "SIJ",
  "ko": "천장관절",
  "eng": "Sacroiliac Joint",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 에스아이제이",
   "포지션: 엎드려서(prone)",
   "임상: 골반 후방 통증"
  ],
  "region": "trunk"
 },
 {
  "abbr": "PENG",
  "ko": "고관절 신경절 차단술",
  "eng": "Pericapsular Nerve Group Block",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 펭 블락",
   "포지션: 누워서(supine)",
   "임상: 고관절 골절 급성 통증",
   "임상: 고관절 급성 통증"
  ],
  "region": "hip"
 },
 {
  "abbr": "IFL",
  "ko": "장골대퇴인대",
  "eng": "Iliofemoral Ligament",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 일리오페모럴 리가먼트",
   "포지션: 누워서(supine)",
   "임상: 고관절 전방 가장 강한 인대; Y자 인대",
   "위치: AIIS→전자간선",
   "손상: 전방 불안정; 과신전"
  ],
  "region": "hip"
 },
 {
  "abbr": "PFL",
  "ko": "치골대퇴인대",
  "eng": "Pubofemoral Ligament",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 푸보페모럴 리가먼트",
   "포지션: 누워서(supine)",
   "임상: 고관절 전하방 인대",
   "위치: 치골→소전자 하방",
   "손상: 전하방 불안정"
  ],
  "region": "hip"
 },
 {
  "abbr": "IsFL",
  "ko": "좌골대퇴인대",
  "eng": "Ischiofemoral Ligament",
  "dept": "초음파주사 · 고관절 (Hip)",
  "info": [
   "발음: 이스키오페모럴 리가먼트",
   "포지션: 엎드려서(prone)",
   "임상: 고관절 후방 인대",
   "위치: 좌골→대전자 내측",
   "손상: 후방 불안정; 내회전 제한"
  ],
  "region": "hip"
 },
 {
  "abbr": "Knee IA",
  "ko": "슬관절 내 주사",
  "eng": "Knee Intra-Articular",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 니 인트라-아티큘러",
   "포지션: 누워서 무릎 약간 굴곡(pillow)",
   "임상: 외측 슬개상부 or 내측 슬개하 접근"
  ],
  "region": "knee"
 },
 {
  "abbr": "ACB",
  "ko": "내전근관 차단술",
  "eng": "Adductor Canal Block",
  "dept": "초음파주사 · 무릎 (Knee) / 마취통증 · 신경차단부위",
  "info": [
   "발음: 어덕터 커낼 블락",
   "포지션: 누워서(supine) 다리 약간 외회전",
   "임상: 복재신경 차단; TKA 후 통증 조절"
  ],
  "region": "hip"
 },
 {
  "abbr": "IPACK",
  "ko": "슬와동맥-관절낭 침윤",
  "eng": "Infiltration between Popliteal Artery and Capsule of Knee",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 아이팩",
   "포지션: 엎드려서(prone) 또는 무릎 굴곡",
   "임상: 무릎 후방 통증; TKA 후"
  ],
  "region": "knee"
 },
 {
  "abbr": "MCL",
  "ko": "내측측부인대",
  "eng": "Medial Collateral Ligament",
  "dept": "초음파주사 · 무릎 (Knee) / 정형외과 · 해부/검사",
  "info": [
   "발음: 미디얼 콜래터럴 리가먼트",
   "포지션: 누워서 무릎 약간 굴곡",
   "임상: 무릎 내측 안정 인대; 장축 주사",
   "위치: 대퇴내측과→경골내측",
   "손상: 외반 손상; Gr I~III"
  ],
  "region": "knee"
 },
 {
  "abbr": "LCL",
  "ko": "외측측부인대",
  "eng": "Lateral Collateral Ligament",
  "dept": "초음파주사 · 무릎 (Knee) / 정형외과 · 해부/검사",
  "info": [
   "발음: 래터럴 콜래터럴 리가먼트",
   "포지션: 옆으로 누워서",
   "임상: 무릎 바깥쪽 인대",
   "위치: 대퇴외측과→비골두",
   "손상: 내반 손상"
  ],
  "region": "knee"
 },
 {
  "abbr": "PT",
  "ko": "슬개건",
  "eng": "Patellar Tendon",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 패텔라 텐던",
   "포지션: 누워서 무릎 신전",
   "임상: 슬개골 하극; 점프무릎",
   "위치: 슬개골 하극→경골 조면",
   "손상: 점프무릎; 반복 스트레스"
  ],
  "region": "knee"
 },
 {
  "abbr": "PES",
  "ko": "거위발건",
  "eng": "Pes Anserinus",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 페스 앤서라이너스",
   "포지션: 누워서 무릎 약간 굴곡",
   "임상: 무릎 내측 하방 3개 건 복합체",
   "기능: 무릎 굴곡·내회전",
   "임상: 내측 무릎 하방; 거위발 건염·점액낭"
  ],
  "region": "knee"
 },
 {
  "abbr": "Popliteal cyst",
  "ko": "슬와낭종 (베이커 낭종)",
  "eng": "Popliteal (Baker) Cyst",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 파플리티얼 시스트",
   "포지션: 엎드려서(prone)",
   "임상: 무릎 뒤쪽 흡인·주사"
  ],
  "region": "knee"
 },
 {
  "abbr": "ITB knee",
  "ko": "장경인대 (무릎 외측)",
  "eng": "Iliotibial Band (Knee)",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 일리오티비얼 밴드 (무릎)",
   "포지션: 옆으로 누워서",
   "임상: 무릎 외측 통증; 러너즈니"
  ],
  "region": "knee"
 },
 {
  "abbr": "Prepatellar bursa",
  "ko": "슬개전 점액낭",
  "eng": "Prepatellar Bursa",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 프리패텔라 버사",
   "포지션: 누워서 무릎 신전",
   "임상: 슬개골 앞 물혹 흡인"
  ],
  "region": "knee"
 },
 {
  "abbr": "Infrapatellar bursa",
  "ko": "슬개하 점액낭",
  "eng": "Infrapatellar Bursa",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 인프라패텔라 버사",
   "포지션: 누워서 무릎 약간 굴곡",
   "임상: 슬개건 아래 점액낭"
  ],
  "region": "knee"
 },
 {
  "abbr": "POL",
  "ko": "후사위인대",
  "eng": "Posterior Oblique Ligament",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 포스티어리어 오블리크 리가먼트",
   "포지션: 누워서 또는 옆으로",
   "임상: 내측 후방 무릎 안정",
   "위치: 반막양근 연장선; 후내방",
   "손상: 내측 후방 불안정"
  ],
  "region": "knee"
 },
 {
  "abbr": "LCL+PLC",
  "ko": "외측측부인대+후외측 복합체",
  "eng": "LCL + Posterolateral Corner",
  "dept": "초음파주사 · 무릎 (Knee)",
  "info": [
   "발음: 래터럴 콜래터럴+포스테로래터럴 코너",
   "포지션: 옆으로 누워서",
   "임상: 무릎 후외방 불안정"
  ],
  "region": "knee"
 },
 {
  "abbr": "Ankle IA",
  "ko": "발목 관절 내 주사",
  "eng": "Ankle Intra-Articular",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 앵클 인트라-아티큘러",
   "포지션: 누워서(supine) 발목 중립",
   "임상: 전방 접근; EHL 외측"
  ],
  "region": "foot"
 },
 {
  "abbr": "ATFL",
  "ko": "전거비인대",
  "eng": "Anterior Talofibular Ligament",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 안테리어 탈로피뷸러 리가먼트",
   "포지션: 누워서 발목 약간 족저굴곡·내번",
   "임상: 발목 외측 염좌 가장 흔한 인대",
   "위치: 비골 전방→거골 외측",
   "손상: 발목 내번 염좌 1순위"
  ],
  "region": "foot"
 },
 {
  "abbr": "CFL",
  "ko": "종비인대",
  "eng": "Calcaneofibular Ligament",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot) / 초음파주사 · 발목/발/인대",
  "info": [
   "발음: 칼케이니오피뷸러 리가먼트",
   "포지션: 옆으로 누워서 또는 내번",
   "임상: 발목 외측 두 번째 인대",
   "위치: 비골 원위→종골 외측",
   "손상: 내번 염좌 2순위"
  ],
  "region": "foot"
 },
 {
  "abbr": "PTFL",
  "ko": "후거비인대",
  "eng": "Posterior Talofibular Ligament",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 포스티어리어 탈로피뷸러 리가먼트",
   "포지션: 옆으로 누워서",
   "임상: 발목 외측 세 번째 인대; 중증 염좌",
   "위치: 비골 후방→거골 후방",
   "손상: 중증 외측 염좌"
  ],
  "region": "foot"
 },
 {
  "abbr": "Deltoid lig",
  "ko": "삼각인대 (내측)",
  "eng": "Deltoid Ligament (Medial)",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 델토이드 리가먼트",
   "포지션: 누워서 발목 외번",
   "임상: 발목 내측 강한 인대 복합체"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "Spring lig",
  "ko": "종골주상인대",
  "eng": "Spring Ligament (Plantar Calcaneonavicular)",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 스프링 리가먼트",
   "포지션: 누워서 또는 옆으로",
   "임상: 평발 관련 내측 인대",
   "위치: 종골 재거突기→주상골",
   "손상: 평발 변형; 후경골건 기능부전 동반"
  ],
  "region": "foot"
 },
 {
  "abbr": "AT",
  "ko": "아킬레스건",
  "eng": "Achilles Tendon",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 아킬리즈 텐던",
   "포지션: 엎드려서(prone) 발 침대 밖으로",
   "임상: 장축·단축 스캔 후 건 주변 주사",
   "기능: 족저굴곡",
   "임상: 가장 큰 건; 장축·단축 스캔 후 건 주변"
  ],
  "region": "foot"
 },
 {
  "abbr": "Retrocalcaneal bursa",
  "ko": "종골후 점액낭",
  "eng": "Retrocalcaneal Bursa",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 레트로칼케이니얼 버사",
   "포지션: 엎드려서(prone)",
   "임상: 아킬레스건 삽입부 앞 점액낭"
  ],
  "region": "foot"
 },
 {
  "abbr": "PF",
  "ko": "족저근막",
  "eng": "Plantar Fascia",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot) / 초음파주사 · 발목/발/인대",
  "info": [
   "발음: 플랜터 패시아",
   "포지션: 엎드려서(prone) 또는 옆으로",
   "임상: 종골 내측 기시부; 족저근막염"
  ],
  "region": "foot"
 },
 {
  "abbr": "Peroneal tendon",
  "ko": "비골건",
  "eng": "Peroneal Tendon",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 페로니얼 텐던",
   "포지션: 옆으로 누워서",
   "임상: 외복사뼈 뒤쪽; 비골건염·탈구"
  ],
  "region": "foot"
 },
 {
  "abbr": "TA",
  "ko": "전경골근",
  "eng": "Tibialis Anterior",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot) / 씨암주사(TPI) · 하퇴/발/관절",
  "info": [
   "발음: 티비알리스 안테리어",
   "포지션: 누워서 발목 중립",
   "임상: 발목 앞쪽 건염",
   "기능: 배측굴곡·내번",
   "임상: 발목 앞쪽 건염; 족하수(foot drop)"
  ],
  "region": "foot"
 },
 {
  "abbr": "Morton's neuroma",
  "ko": "모턴 신경종",
  "eng": "Morton's Neuroma",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 모턴스 뉴로마",
   "포지션: 누워서(supine) 발 세워",
   "임상: 3~4번 지간; 배측 접근"
  ],
  "region": "foot"
 },
 {
  "abbr": "MTP",
  "ko": "중족지관절",
  "eng": "Metatarsophalangeal Joint",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 메타타소-팔랜지얼",
   "포지션: 누워서(supine)",
   "임상: 발가락 뿌리 관절; 통풍·관절염"
  ],
  "region": "foot"
 },
 {
  "abbr": "SPN",
  "ko": "천비골신경",
  "eng": "Superficial Peroneal Nerve",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 수퍼피셜 페로니얼 너브",
   "포지션: 누워서 발목 중립",
   "임상: 발등 외측 감각신경"
  ],
  "region": "foot"
 },
 {
  "abbr": "Lisfranc lig",
  "ko": "리스프랑 인대",
  "eng": "Lisfranc Ligament",
  "dept": "초음파주사 · 발목·발 (Ankle/Foot)",
  "info": [
   "발음: 리스프랑 리가먼트",
   "포지션: 누워서(supine)",
   "임상: 중족근 관절 안정 인대",
   "위치: 내측 설상골→2중족골 기저부",
   "손상: 중족근 관절 손상; Fleck sign"
  ],
  "region": "foot"
 },
 {
  "abbr": "FJ",
  "ko": "후관절",
  "eng": "Facet Joint (Zygapophyseal Joint)",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 패싯 조인트",
   "포지션: 엎드려서(prone)",
   "임상: 척추 후방 관절"
  ],
  "region": "trunk"
 },
 {
  "abbr": "MBB",
  "ko": "내측지 차단술",
  "eng": "Medial Branch Block",
  "dept": "초음파주사 · 척추·목·허리 (Spine) / 마취통증 · 진단/처치",
  "info": [
   "발음: 미디얼 브랜치 블락",
   "포지션: 엎드려서(prone)",
   "임상: 후관절 신경; RF 전 진단 주사",
   "임상: 후관절 신경; RF 전 진단"
  ],
  "region": "trunk"
 },
 {
  "abbr": "ESPB",
  "ko": "척추기립근 평면 차단술",
  "eng": "Erector Spinae Plane Block",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 이렉터 스피니 플레인 블락",
   "포지션: 엎드려서 또는 앉아서",
   "임상: 흉·요부 광범위 통증",
   "임상: 흉·요추 광범위 차단"
  ],
  "region": "trunk"
 },
 {
  "abbr": "ICNB",
  "ko": "늑간신경 차단술",
  "eng": "Intercostal Nerve Block",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 인터코스탈 너브 블락",
   "포지션: 앉아서 등 노출 또는 옆으로",
   "임상: 갈비뼈 아래 경계 주사"
  ],
  "region": "trunk"
 },
 {
  "abbr": "SCM",
  "ko": "흉쇄유돌근",
  "eng": "Sternocleidomastoid",
  "dept": "초음파주사 · 척추·목·허리 (Spine) / 씨암주사(TPI) · 경추/어깨/상지",
  "info": [
   "발음: 스터노클라이도마스토이드",
   "포지션: 누워서(supine) 고개 반대로",
   "임상: 목 앞쪽 굵은 근육; 사경 보톡스",
   "기능: 머리 굴곡·회전",
   "임상: 사경 보톡스 대표 근육",
   "임상: 사경 보톡스; 목 통증"
  ],
  "region": "neck"
 },
 {
  "abbr": "SSL",
  "ko": "극상인대",
  "eng": "Supraspinous Ligament",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 수프라스피너스 리가먼트",
   "포지션: 엎드려서(prone)",
   "임상: 척추 극돌기 위 정중선 인대",
   "위치: 극돌기 끝 정중선",
   "손상: 굴곡 과부하"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "ISL",
  "ko": "극간인대",
  "eng": "Interspinous Ligament",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 인터스피너스 리가먼트",
   "포지션: 엎드려서(prone)",
   "임상: 극돌기 사이 인대",
   "위치: 인접 극돌기 사이",
   "손상: 굴곡 손상; Baastrup"
  ],
  "region": "trunk"
 },
 {
  "abbr": "LF",
  "ko": "황색인대",
  "eng": "Ligamentum Flavum",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 리가멘텀 플라붐",
   "포지션: 엎드려서(prone)",
   "임상: 척추관 후방; 경막외 접근 랜드마크",
   "위치: 추궁판 사이 후방",
   "손상: LF 비후 → 척추관 협착"
  ],
  "region": "trunk"
 },
 {
  "abbr": "ALL",
  "ko": "전종인대",
  "eng": "Anterior Longitudinal Ligament",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 안테리어 롱지튜디널 리가먼트",
   "포지션: 엎드려서(prone)",
   "임상: 척추체 전방; 과신전 손상",
   "위치: 척추체 전면 전체",
   "손상: 과신전 손상"
  ],
  "region": "trunk"
 },
 {
  "abbr": "PLL",
  "ko": "후종인대",
  "eng": "Posterior Longitudinal Ligament",
  "dept": "초음파주사 · 척추·목·허리 (Spine)",
  "info": [
   "발음: 포스티어리어 롱지튜디널 리가먼트",
   "포지션: 엎드려서(prone)",
   "임상: 척추관 전방; OPLL 관련",
   "위치: 척추체 후면 척추관 내",
   "손상: OPLL; 경부 척수증"
  ],
  "region": "trunk"
 },
 {
  "abbr": "SN",
  "ko": "좌골신경",
  "eng": "Sciatic Nerve",
  "dept": "초음파주사 · 신경 (Nerve Block)",
  "info": [
   "발음: 사이아틱 너브",
   "포지션: 엎드려서(prone) 또는 옆으로",
   "임상: 엉덩이 아래; 대전자~좌골결절 중점"
  ],
  "region": "hip"
 },
 {
  "abbr": "FN",
  "ko": "대퇴신경",
  "eng": "Femoral Nerve",
  "dept": "초음파주사 · 신경 (Nerve Block)",
  "info": [
   "발음: 페모럴 너브",
   "포지션: 누워서(supine) 다리 약간 외회전",
   "임상: 서혜부 인대 아래; 대퇴동맥 외측"
  ],
  "region": "hip"
 },
 {
  "abbr": "RN",
  "ko": "요골신경",
  "eng": "Radial Nerve",
  "dept": "초음파주사 · 신경 (Nerve Block)",
  "info": [
   "발음: 레이디얼 너브",
   "포지션: 앉아서 팔꿈치 신전·회내",
   "임상: 팔꿈치 외측"
  ],
  "region": "arm"
 },
 {
  "abbr": "GN",
  "ko": "슬개 신경",
  "eng": "Genicular Nerve",
  "dept": "초음파주사 · 신경 (Nerve Block)",
  "info": [
   "발음: 제니큘러 너브",
   "포지션: 누워서(supine)",
   "임상: 무릎 통증; 고주파 열응고 전 진단"
  ],
  "region": "knee"
 },
 {
  "abbr": "IA injection",
  "ko": "관절 내 주사",
  "eng": "Intra-Articular Injection",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 인트라-아티큘러 인젝션",
   "포지션: 부위별 상이",
   "임상: 관절강 내 직접 주사"
  ],
  "region": ""
 },
 {
  "abbr": "PRP",
  "ko": "혈소판 풍부 혈장",
  "eng": "Platelet-Rich Plasma",
  "dept": "초음파주사 · 시술 종류 (Procedure) / 정형외과 · 처치/수술",
  "info": [
   "발음: 피알피",
   "포지션: 부위별 상이",
   "임상: 자가혈 원심분리 재생 주사"
  ],
  "region": ""
 },
 {
  "abbr": "HA",
  "ko": "히알루론산",
  "eng": "Hyaluronic Acid",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 하이알루로닉 애시드",
   "포지션: 부위별 상이",
   "임상: 관절 윤활 보충; 무릎·어깨"
  ],
  "region": ""
 },
 {
  "abbr": "Aspiration",
  "ko": "흡인술",
  "eng": "Aspiration",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 어스피레이션",
   "포지션: 부위별 상이",
   "임상: 관절액·낭종·석회 제거"
  ],
  "region": ""
 },
 {
  "abbr": "Hydrodissection",
  "ko": "수압박리술",
  "eng": "Hydrodissection",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 하이드로디섹션",
   "포지션: 부위별 상이",
   "임상: 신경·건 유착 박리; NS or D5W"
  ],
  "region": ""
 },
 {
  "abbr": "Hydrodilatation",
  "ko": "수압팽창술",
  "eng": "Hydrodilatation",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 하이드로다이레이테이션",
   "포지션: 앉아서 또는 누워서 (어깨)",
   "임상: 오십견 관절낭 팽창"
  ],
  "region": ""
 },
 {
  "abbr": "Barbotage",
  "ko": "석회흡인술",
  "eng": "Barbotage",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 바보타쥐",
   "포지션: 앉아서 팔 내회전 (어깨)",
   "임상: 석회성건염 반복 천자·흡인"
  ],
  "region": ""
 },
 {
  "abbr": "Fenestration",
  "ko": "건 천자술 / 건침술",
  "eng": "Fenestration / Dry Needling",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 페네스트레이션",
   "포지션: 부위별 상이",
   "임상: 건 반복 천자 재생 자극"
  ],
  "region": ""
 },
 {
  "abbr": "Genicular nerve block",
  "ko": "슬개 신경 차단술",
  "eng": "Genicular Nerve Block",
  "dept": "초음파주사 · 시술 종류 (Procedure)",
  "info": [
   "발음: 제니큘러 너브 블락",
   "포지션: 누워서(supine)",
   "임상: 무릎 통증 조절; RFA 전 진단"
  ],
  "region": "knee"
 },
 {
  "abbr": "LUCL",
  "ko": "외측척측측부인대",
  "eng": "Lateral Ulnar Collateral Ligament",
  "dept": "초음파주사 · 팔꿈치",
  "info": [
   "발음: 래터럴 울너 콜래터럴 리가먼트",
   "위치: 외상과→척골 외측",
   "손상: PLRI (후외측 회전불안정)"
  ],
  "region": "arm"
 },
 {
  "abbr": "LTL",
  "ko": "월상삼각인대",
  "eng": "Lunotriquetral Ligament",
  "dept": "초음파주사 · 손목·손",
  "info": [
   "발음: 루노트리케트럴 리가먼트",
   "위치: 월상골↔삼각골",
   "손상: 척측 손목 통증; VISI 변형"
  ],
  "region": "hand"
 },
 {
  "abbr": "RCL thumb",
  "ko": "엄지 요측측부인대",
  "eng": "Radial Collateral Ligament (Thumb MCP)",
  "dept": "초음파주사 · 손목·손",
  "info": [
   "발음: 레이디얼 콜래터럴 리가먼트 (엄지)",
   "위치: 엄지 MCP 외측",
   "손상: 내반 손상"
  ],
  "region": "hand"
 },
 {
  "abbr": "LT",
  "ko": "원형인대",
  "eng": "Ligamentum Teres",
  "dept": "초음파주사 · 고관절",
  "info": [
   "발음: 리가멘텀 테레스",
   "위치: 비구와→대퇴골두 와",
   "손상: 비구순 병변 동반 가능"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "ACL",
  "ko": "전방십자인대",
  "eng": "Anterior Cruciate Ligament",
  "dept": "초음파주사 · 무릎 / 정형외과 · 해부/검사",
  "info": [
   "발음: 안테리어 크루시에이트 리가먼트",
   "위치: 경골 전방→대퇴 외측과",
   "손상: 전방 불안정; pivot shift"
  ],
  "region": "knee"
 },
 {
  "abbr": "PCL",
  "ko": "후방십자인대",
  "eng": "Posterior Cruciate Ligament",
  "dept": "초음파주사 · 무릎 / 정형외과 · 해부/검사",
  "info": [
   "발음: 포스티어리어 크루시에이트 리가먼트",
   "위치: 경골 후방→대퇴 내측과",
   "손상: 후방 불안정; 계기판 손상"
  ],
  "region": "knee"
 },
 {
  "abbr": "PLC",
  "ko": "후외측 복합체",
  "eng": "Posterolateral Corner",
  "dept": "초음파주사 · 무릎",
  "info": [
   "발음: 포스테로래터럴 코너",
   "위치: LCL+슬와건+PFL 복합",
   "손상: 내반+외회전 불안정"
  ],
  "region": "knee"
 },
 {
  "abbr": "QT",
  "ko": "대퇴사두근건",
  "eng": "Quadriceps Tendon",
  "dept": "초음파주사 · 무릎",
  "info": [
   "발음: 쿼드리셉스 텐던",
   "위치: 4두근→슬개골 상극",
   "손상: 퇴행성 파열; 고령"
  ],
  "region": "hip"
 },
 {
  "abbr": "Deltoid",
  "ko": "삼각인대 (내측 복합체)",
  "eng": "Deltoid Ligament (Medial Complex)",
  "dept": "초음파주사 · 발목",
  "info": [
   "발음: 델토이드 리가먼트",
   "위치: 내복사뼈→거골·종골·주상골",
   "손상: 외번 손상; 삼과 골절 동반"
  ],
  "region": "shoulder"
 },
 {
  "abbr": "Bifurcate lig",
  "ko": "이분인대",
  "eng": "Bifurcate Ligament",
  "dept": "초음파주사 · 발목",
  "info": [
   "발음: 바이퍼케이트 리가먼트",
   "위치: 종골 전방→입방골·주상골",
   "손상: 발목 전외측 손상 동반"
  ],
  "region": "foot"
 },
 {
  "abbr": "ILL",
  "ko": "장요인대",
  "eng": "Iliolumbar Ligament",
  "dept": "초음파주사 · 척추",
  "info": [
   "발음: 일리오럼바 리가먼트",
   "위치: L4·L5 횡돌기→장골능",
   "손상: L4-5 하부 요통; SIJ 전방 안정"
  ],
  "region": "trunk"
 },
 {
  "abbr": "Biceps",
  "ko": "상완이두근",
  "eng": "Biceps Brachii",
  "dept": "초음파주사 · 팔꿈치·팔 (Elbow/Arm)",
  "info": [
   "발음: 바이셉스",
   "기능: 팔꿈치 굴곡·전완 회외",
   "포지션: 앉아서 팔 약간 외회전",
   "임상: LHB 건초염·탈구; Popeye sign"
  ],
  "region": "arm"
 },
 {
  "abbr": "APL",
  "ko": "장무지외전근",
  "eng": "Abductor Pollicis Longus",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 앱덕터 폴리시스 롱거스",
   "기능: 엄지 외전",
   "포지션: 앉아서 엄지 위로",
   "임상: De Quervain 1구획; EPB와 함께"
  ],
  "region": "hand"
 },
 {
  "abbr": "EPB",
  "ko": "단무지신근",
  "eng": "Extensor Pollicis Brevis",
  "dept": "초음파주사 · 손목·손 (Wrist/Hand)",
  "info": [
   "발음: 익스텐서 폴리시스 브레비스",
   "기능: 엄지 신전",
   "포지션: 앉아서 엄지 위로",
   "임상: De Quervain 1구획; APL과 함께"
  ],
  "region": "hand"
 },
 {
  "abbr": "Glute med",
  "ko": "중둔근",
  "eng": "Gluteus Medius",
  "dept": "초음파주사 · 고관절·골반 (Hip/Pelvis)",
  "info": [
   "발음: 글루테우스 미디어스",
   "기능: 외전·내회전",
   "포지션: 옆으로 누워서 (lateral decubitus)",
   "임상: GTPS 핵심 근육; 주사 가장 흔한 위치"
  ],
  "region": "hip"
 },
 {
  "abbr": "Glute min",
  "ko": "소둔근",
  "eng": "Gluteus Minimus",
  "dept": "초음파주사 · 고관절·골반 (Hip/Pelvis)",
  "info": [
   "발음: 글루테우스 미니머스",
   "기능: 외전·내회전",
   "포지션: 옆으로 누워서",
   "임상: 중둔근 아래; GTPS 동반 손상"
  ],
  "region": "hip"
 },
 {
  "abbr": "Piriformis",
  "ko": "이상근",
  "eng": "Piriformis",
  "dept": "초음파주사 · 고관절·골반 (Hip/Pelvis)",
  "info": [
   "발음: 피리포미스",
   "기능: 외회전·외전",
   "포지션: 엎드려서(prone) 또는 옆으로",
   "임상: 이상근 증후군; 좌골신경 관련"
  ],
  "region": "hip"
 },
 {
  "abbr": "Hamstring",
  "ko": "햄스트링 (대퇴이두근·반막양근·반건양근)",
  "eng": "Hamstrings (BF/SM/ST)",
  "dept": "초음파주사 · 고관절·골반 (Hip/Pelvis)",
  "info": [
   "발음: 햄스트링",
   "기능: 무릎 굴곡·고관절 신전",
   "포지션: 엎드려서(prone)",
   "임상: 좌골결절 부착부 건병증; 근육 파열"
  ],
  "region": "arm"
 },
 {
  "abbr": "Add longus",
  "ko": "장내전근",
  "eng": "Adductor Longus",
  "dept": "초음파주사 · 고관절·골반 (Hip/Pelvis)",
  "info": [
   "발음: 어덕터 롱거스",
   "기능: 고관절 내전",
   "포지션: 누워서(supine) 다리 약간 외전",
   "임상: 서혜부 통증; 스포츠 탈장 관련"
  ],
  "region": "hip"
 },
 {
  "abbr": "Iliopsoas",
  "ko": "장요근",
  "eng": "Iliopsoas",
  "dept": "초음파주사 · 고관절·골반 (Hip/Pelvis)",
  "info": [
   "발음: 일리오사아스",
   "기능: 고관절 굴곡",
   "포지션: 누워서(supine) 다리 약간 외회전",
   "임상: 장요근건염; Snapping hip (내측형)"
  ],
  "region": "hip"
 },
 {
  "abbr": "Quad",
  "ko": "대퇴사두근",
  "eng": "Quadriceps Femoris",
  "dept": "초음파주사 · 무릎·대퇴 (Knee/Thigh)",
  "info": [
   "발음: 쿼드리셉스",
   "기능: 무릎 신전",
   "포지션: 누워서 무릎 약간 굴곡",
   "임상: QT 파열; 슬개골 상방 접근"
  ],
  "region": "hip"
 },
 {
  "abbr": "Gastroc",
  "ko": "비복근",
  "eng": "Gastrocnemius",
  "dept": "초음파주사 · 무릎·대퇴 (Knee/Thigh)",
  "info": [
   "발음: 개스트로크니미어스",
   "기능: 발목 족저굴곡·무릎 굴곡",
   "포지션: 엎드려서(prone) 또는 누워서",
   "임상: Plantaris 파열 혼동; 종아리 통증"
  ],
  "region": "knee"
 },
 {
  "abbr": "Popliteus",
  "ko": "슬와근",
  "eng": "Popliteus",
  "dept": "초음파주사 · 무릎·대퇴 (Knee/Thigh)",
  "info": [
   "발음: 포플리테우스",
   "기능: 무릎 내회전·굴곡 잠금해제",
   "포지션: 엎드려서(prone) 또는 누워서",
   "임상: 무릎 잠금해제; PLC 구성 요소"
  ],
  "region": "knee"
 },
 {
  "abbr": "Soleus",
  "ko": "가자미근",
  "eng": "Soleus",
  "dept": "초음파주사 · 발목·하퇴 (Ankle/Leg)",
  "info": [
   "발음: 솔레우스",
   "기능: 족저굴곡",
   "포지션: 엎드려서(prone)",
   "임상: 비복근 아래; 심부 종아리 통증"
  ],
  "region": "foot"
 },
 {
  "abbr": "Peroneal",
  "ko": "비골근 (장·단)",
  "eng": "Peroneus Longus & Brevis",
  "dept": "초음파주사 · 발목·하퇴 (Ankle/Leg)",
  "info": [
   "발음: 페로니얼",
   "기능: 족저굴곡·외번",
   "포지션: 옆으로 누워서",
   "임상: 외복사뼈 뒤; 비골건염·탈구"
  ],
  "region": "foot"
 },
 {
  "abbr": "PTT",
  "ko": "후경골근건",
  "eng": "Posterior Tibialis Tendon",
  "dept": "초음파주사 · 발목·하퇴 (Ankle/Leg)",
  "info": [
   "발음: 포스티어리어 티비알리스 텐던",
   "기능: 배측굴곡·내번",
   "포지션: 누워서 발목 외번",
   "임상: PTT 기능부전 → 후천성 평발; 내측 복사 뒤"
  ],
  "region": "foot"
 },
 {
  "abbr": "FHL",
  "ko": "장무지굴근",
  "eng": "Flexor Hallucis Longus",
  "dept": "초음파주사 · 발목·하퇴 (Ankle/Leg)",
  "info": [
   "발음: 플렉서 할루시스 롱거스",
   "기능: 엄지 굴곡·족저굴곡",
   "포지션: 엎드려서 또는 내번 자세",
   "임상: 발레리나 건염; 내측 복사 뒤 터널"
  ],
  "region": "hand"
 },
 {
  "abbr": "ES",
  "ko": "척추기립근",
  "eng": "Erector Spinae",
  "dept": "초음파주사 · 척추·몸통 (Spine/Trunk) / 씨암주사(TPI) · 요추/둔부/하지",
  "info": [
   "발음: 이렉터 스피니",
   "기능: 척추 신전·측굴",
   "포지션: 엎드려서(prone) 또는 앉아서",
   "임상: ESPB 블락 대상; 흉·요부 광범위 통증"
  ],
  "region": "trunk"
 },
 {
  "abbr": "QL",
  "ko": "요방형근",
  "eng": "Quadratus Lumborum",
  "dept": "초음파주사 · 척추·몸통 (Spine/Trunk) / 씨암주사(TPI) · 요추/둔부/하지",
  "info": [
   "발음: 쿼드라터스 럼보럼",
   "기능: 요추 측굴·안정화",
   "포지션: 옆으로 누워서 또는 엎드려",
   "임상: QL 차단술; 만성 요통·복부 수술 통증"
  ],
  "region": "trunk"
 },
 {
  "abbr": "Multifidus",
  "ko": "다열근",
  "eng": "Multifidus",
  "dept": "초음파주사 · 척추·몸통 (Spine/Trunk)",
  "info": [
   "발음: 멀티피더스",
   "기능: 척추 안정화·신전",
   "포지션: 엎드려서(prone)",
   "임상: 만성 요통 재활 핵심; 위축 평가 초음파"
  ],
  "region": "trunk"
 },
 {
  "abbr": "Scalenes",
  "ko": "사각근",
  "eng": "Scalene Muscles",
  "dept": "초음파주사 · 척추·몸통 (Spine/Trunk)",
  "info": [
   "발음: 스케일린즈",
   "기능: 경추 굴곡·측굴·흡기 보조",
   "포지션: 앉아서 목 측면 노출",
   "임상: 흉곽출구증후군; DSNB 관련 구조"
  ],
  "region": "trunk"
 },
 {
  "abbr": "OA",
  "ko": "퇴행성 관절염",
  "eng": "Osteoarthritis",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "RA",
  "ko": "류마티스 관절염",
  "eng": "Rheumatoid Arthritis",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "HNP",
  "ko": "추간판 탈출증",
  "eng": "Herniated Nucleus Pulposus",
  "dept": "정형외과 · 진단 / 신경외과 · 진단",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "DJD",
  "ko": "퇴행성 관절 질환",
  "eng": "Degenerative Joint Disease",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "LBP",
  "ko": "요통",
  "eng": "Low Back Pain",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "RCT",
  "ko": "회전근개 파열",
  "eng": "Rotator Cuff Tear",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "AVN",
  "ko": "무혈성 괴사",
  "eng": "Avascular Necrosis",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Fx",
  "ko": "골절",
  "eng": "Fracture",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Lx",
  "ko": "탈구",
  "eng": "Luxation / Dislocation",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "TKA",
  "ko": "슬관절 전치환술",
  "eng": "Total Knee Arthroplasty",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": "knee"
 },
 {
  "abbr": "THA",
  "ko": "고관절 전치환술",
  "eng": "Total Hip Arthroplasty",
  "dept": "정형외과 · 진단",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "MRI",
  "ko": "자기공명영상",
  "eng": "Magnetic Resonance Imaging",
  "dept": "정형외과 · 해부/검사 / 신경외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ROM",
  "ko": "관절운동범위",
  "eng": "Range of Motion",
  "dept": "정형외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "MMT",
  "ko": "도수근력검사",
  "eng": "Manual Muscle Test",
  "dept": "정형외과 · 해부/검사",
  "info": [],
  "region": "hand"
 },
 {
  "abbr": "SLR",
  "ko": "하지직거상 검사",
  "eng": "Straight Leg Raise",
  "dept": "정형외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "BMD",
  "ko": "골밀도",
  "eng": "Bone Mineral Density",
  "dept": "정형외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "DEXA",
  "ko": "골밀도 측정법",
  "eng": "Dual Energy X-ray Absorptiometry",
  "dept": "정형외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "NCS",
  "ko": "신경전도검사",
  "eng": "Nerve Conduction Study",
  "dept": "정형외과 · 해부/검사 / 신경외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "EMG",
  "ko": "근전도 검사",
  "eng": "Electromyography",
  "dept": "정형외과 · 해부/검사 / 신경외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ORIF",
  "ko": "관혈적 정복 및 내고정술",
  "eng": "Open Reduction Internal Fixation",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "CRIF",
  "ko": "폐쇄적 정복 내고정술",
  "eng": "Closed Reduction Internal Fixation",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "TLIF",
  "ko": "요추 추체간 유합술",
  "eng": "Transforaminal Lumbar Interbody Fusion",
  "dept": "정형외과 · 처치/수술 / 신경외과 · 수술/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "ACDF",
  "ko": "경추 전방 유합술",
  "eng": "Anterior Cervical Discectomy & Fusion",
  "dept": "정형외과 · 처치/수술 / 신경외과 · 수술/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Arthro",
  "ko": "관절경 수술",
  "eng": "Arthroscopy",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "THR/TKR",
  "ko": "고관절/슬관절 전치환술",
  "eng": "Total Hip/Knee Replacement",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "IM Nail",
  "ko": "골수강내 정복고정",
  "eng": "Intramedullary Nailing",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ESWT",
  "ko": "체외충격파 치료",
  "eng": "Extracorporeal Shock Wave Therapy",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Prolo",
  "ko": "증식치료 주사",
  "eng": "Prolotherapy",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "NSAIDs",
  "ko": "비스테로이드성 소염제",
  "eng": "Non-Steroidal Anti-Inflammatory Drugs",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "PRN",
  "ko": "필요 시 처방",
  "eng": "Pro Re Nata",
  "dept": "정형외과 · 처치/수술 / 기본 간호",
  "info": [],
  "region": ""
 },
 {
  "abbr": "BID/TID",
  "ko": "하루 2회 / 하루 3회 복용",
  "eng": "",
  "dept": "정형외과 · 처치/수술",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ESI",
  "ko": "경막외 스테로이드 주사",
  "eng": "Epidural Steroid Injection",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "TFESI",
  "ko": "경추간공 경막외 주사",
  "eng": "Transforaminal ESI",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "ILI",
  "ko": "추간판간 경막외 주사",
  "eng": "Interlaminar Injection",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "SCI",
  "ko": "미추(꼬리뼈) 경막외 주사",
  "eng": "Sacrococcygeal (Caudal) Inj.",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "RFA",
  "ko": "고주파 열응고술",
  "eng": "Radiofrequency Ablation",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": ""
 },
 {
  "abbr": "SGB",
  "ko": "성상신경절 차단술",
  "eng": "Stellate Ganglion Block",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "CEB",
  "ko": "복강신경총 차단술",
  "eng": "Celiac (Plexus) Block",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "TPI",
  "ko": "통점 주사 (씨암주사)",
  "eng": "Trigger Point Injection",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": ""
 },
 {
  "abbr": "PNST",
  "ko": "말초신경 자극술",
  "eng": "Peripheral Nerve Stimulation",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": ""
 },
 {
  "abbr": "SCS",
  "ko": "척수 자극술",
  "eng": "Spinal Cord Stimulation",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": ""
 },
 {
  "abbr": "CRPS",
  "ko": "복합부위통증증후군",
  "eng": "Complex Regional Pain Syndrome",
  "dept": "마취통증 · 진단/처치",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ISB",
  "ko": "사각근간 차단 — 어깨·상완",
  "eng": "Interscalene Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "SCB",
  "ko": "쇄골상 차단 — 상지 전체",
  "eng": "Supraclavicular Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ICB",
  "ko": "쇄골하 차단 — 전완·손",
  "eng": "Infraclavicular Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "arm"
 },
 {
  "abbr": "AXB",
  "ko": "액와 차단 — 전완·손",
  "eng": "Axillary Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "arm"
 },
 {
  "abbr": "FNB",
  "ko": "대퇴신경 차단 — 대퇴 전면",
  "eng": "Femoral Nerve Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "SNB",
  "ko": "좌골신경 차단 — 하퇴·발",
  "eng": "Sciatic Nerve Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "PVB",
  "ko": "추체방 차단 — 흉부·복부",
  "eng": "Paravertebral Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "TAP",
  "ko": "복횡근 차단 — 복부 수술",
  "eng": "Transversus Abdominis Plane",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "PENG",
  "ko": "고관절 전면부 차단",
  "eng": "PENG Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "IPACK",
  "ko": "슬와 신경 차단 — TKA 후",
  "eng": "IPACK Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "knee"
 },
 {
  "abbr": "ESP",
  "ko": "척추기립근 평면 차단",
  "eng": "Erector Spinae Plane Block",
  "dept": "마취통증 · 신경차단부위",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "TA / Triam",
  "ko": "트리암시놀론 (스테로이드)",
  "eng": "Triamcinolone Acetonide",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Depo-Medrol",
  "ko": "주사용 스테로이드",
  "eng": "Methylprednisolone acetate",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Lido",
  "ko": "리도카인 국소마취제 (0.5%, 1%, 2%)",
  "eng": "Lidocaine",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Bupi",
  "ko": "부피바카인 (긴 작용 시간)",
  "eng": "Bupivacaine",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Ropi",
  "ko": "로피바카인 (심장독성 낮음)",
  "eng": "Ropivacaine",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Dexamethasone",
  "ko": "경막외 주사 시 사용",
  "eng": "덱사메타손",
  "dept": "마취통증 · 약제 / 신경외과 · 약제",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Hyaluronidase",
  "ko": "유착 박리, 확산 촉진",
  "eng": "히알루로니다아제",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "NRS",
  "ko": "통증 점수 (0~10)",
  "eng": "Numeric Rating Scale",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "VAS",
  "ko": "시각적 통증 척도",
  "eng": "Visual Analogue Scale",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "PRN",
  "ko": "통증 시 투여",
  "eng": "필요 시 처방",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "PCIA/PCEA",
  "ko": "자가통증조절",
  "eng": "Patient Controlled IV/Epidural Analgesia",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Gabapentin",
  "ko": "신경병증성 통증 치료제",
  "eng": "가바펜틴",
  "dept": "마취통증 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ADL",
  "ko": "일상생활활동 평가",
  "eng": "Activities of Daily Living",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "FIM",
  "ko": "기능적 독립 척도",
  "eng": "Functional Independence Measure",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "MBI",
  "ko": "수정 바델 지수",
  "eng": "Modified Barthel Index",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "CVA",
  "ko": "뇌졸중 (뇌혈관사고)",
  "eng": "Cerebrovascular Accident",
  "dept": "재활의학 · 평가/진단 / 신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "TBI",
  "ko": "외상성 뇌손상",
  "eng": "Traumatic Brain Injury",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "SCI",
  "ko": "척수 손상 (재활 맥락)",
  "eng": "Spinal Cord Injury",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ASIA",
  "ko": "척수손상 분류 (A~E)",
  "eng": "ASIA Impairment Scale",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "MMSE",
  "ko": "인지기능 간이검사",
  "eng": "Mini Mental State Exam",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "MAS",
  "ko": "근경직도 평가 척도",
  "eng": "Modified Ashworth Scale",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "BBS",
  "ko": "균형 기능 평가",
  "eng": "Berg Balance Scale",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "10MWT",
  "ko": "보행속도 평가",
  "eng": "10 Meter Walk Test",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "6MWT",
  "ko": "운동 지구력 평가",
  "eng": "6 Minute Walk Test",
  "dept": "재활의학 · 평가/진단",
  "info": [],
  "region": ""
 },
 {
  "abbr": "PT",
  "ko": "물리치료",
  "eng": "Physical Therapy",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "OT",
  "ko": "작업치료",
  "eng": "Occupational Therapy",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "ST",
  "ko": "언어치료",
  "eng": "Speech Therapy",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "TENS",
  "ko": "경피신경전기자극",
  "eng": "Transcutaneous Electrical NS",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "US Tx",
  "ko": "초음파 치료 (물리치료)",
  "eng": "Ultrasound Therapy",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "NMES",
  "ko": "신경근 전기자극",
  "eng": "Neuromuscular Electrical Stim.",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "FES",
  "ko": "기능적 전기자극",
  "eng": "Functional Electrical Stimulation",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "AFO",
  "ko": "발목-발 보조기",
  "eng": "Ankle Foot Orthosis",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "KAFO",
  "ko": "무릎-발목-발 보조기",
  "eng": "Knee Ankle Foot Orthosis",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": "knee"
 },
 {
  "abbr": "WC",
  "ko": "휠체어",
  "eng": "Wheelchair",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "W/W",
  "ko": "보행기",
  "eng": "Walker / Walking frame",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "BTX",
  "ko": "보툴리눔 독소 주사 (경직)",
  "eng": "Botulinum Toxin",
  "dept": "재활의학 · 치료/보조기",
  "info": [],
  "region": ""
 },
 {
  "abbr": "LSS",
  "ko": "요추 척추관협착증",
  "eng": "Lumbar Spinal Stenosis",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "CSS",
  "ko": "경추 척추관협착증",
  "eng": "Cervical Spinal Stenosis",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "SAH",
  "ko": "지주막하출혈",
  "eng": "Subarachnoid Hemorrhage",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "SDH",
  "ko": "경막하혈종",
  "eng": "Subdural Hematoma",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "EDH",
  "ko": "경막외혈종",
  "eng": "Epidural Hematoma",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "ICH",
  "ko": "뇌내출혈",
  "eng": "Intracerebral Hemorrhage",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "TIA",
  "ko": "일과성 뇌허혈 발작",
  "eng": "Transient Ischemic Attack",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "GBM",
  "ko": "다형성 교아종 (악성 뇌종양)",
  "eng": "Glioblastoma Multiforme",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "AVM",
  "ko": "뇌동정맥기형",
  "eng": "Arteriovenous Malformation",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "CPS",
  "ko": "경추성 통증 증후군",
  "eng": "Cervical Pain Syndrome",
  "dept": "신경외과 · 진단",
  "info": [],
  "region": "neck"
 },
 {
  "abbr": "ICP",
  "ko": "두개내압",
  "eng": "Intracranial Pressure",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "GCS",
  "ko": "글래스고 혼수 척도",
  "eng": "Glasgow Coma Scale",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "CT",
  "ko": "전산화단층촬영 (CT)",
  "eng": "Computed Tomography",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "MRA",
  "ko": "자기공명 혈관조영술",
  "eng": "MR Angiography",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "DSA",
  "ko": "디지털감산 혈관조영술",
  "eng": "Digital Subtraction Angiography",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": ""
 },
 {
  "abbr": "EEG",
  "ko": "뇌파 검사",
  "eng": "Electroencephalography",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "LP",
  "ko": "요추천자 (뇌척수액 검사)",
  "eng": "Lumbar Puncture",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "CSF",
  "ko": "뇌척수액",
  "eng": "Cerebrospinal Fluid",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "EVD",
  "ko": "외부 뇌실 배액",
  "eng": "External Ventricular Drain",
  "dept": "신경외과 · 해부/검사",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Crani",
  "ko": "개두술 (두개골 절개 수술)",
  "eng": "Craniotomy",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "DCF",
  "ko": "감압 두개골절제술",
  "eng": "Decompressive Craniectomy",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Laminectomy",
  "ko": "척추관 감압 (후방 접근)",
  "eng": "추궁절제술",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Discectomy",
  "ko": "디스크 탈출 제거",
  "eng": "추간판 절제술",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "VP Shunt",
  "ko": "뇌실-복강 단락술 (뇌압 조절)",
  "eng": "Ventriculoperitoneal Shunt",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Clipping",
  "ko": "뇌동맥류 결찰술",
  "eng": "Aneurysm Clipping",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Coiling",
  "ko": "뇌동맥류 코일색전술",
  "eng": "Endovascular Coiling",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "DBS",
  "ko": "뇌심부자극술 (파킨슨 등)",
  "eng": "Deep Brain Stimulation",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "SRS / Gamma",
  "ko": "방사선 수술",
  "eng": "Stereotactic Radiosurgery / Gamma Knife",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "ICP Monitor",
  "ko": "중증 뇌손상 후 두개내압 감시",
  "eng": "두개내압 모니터링",
  "dept": "신경외과 · 수술/처치",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Mannitol",
  "ko": "삼투압 이뇨제, 뇌압강하 목적 (20%, 1g/kg)",
  "eng": "만니톨",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Nimodipine",
  "ko": "지주막하출혈 후 혈관연축 예방",
  "eng": "니모디핀",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Phenytoin",
  "ko": "항경련제, 신경외과 수술 후 발작 예방",
  "eng": "페니토인",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "Levetiracetam",
  "ko": "항경련제 (케프라) — 신경외과 다용",
  "eng": "레베티라세탐",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "TXA",
  "ko": "트라넥삼산, 술 중 출혈 감소",
  "eng": "Tranexamic Acid",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "FFP",
  "ko": "신선동결혈장, 응고 보정",
  "eng": "Fresh Frozen Plasma",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "BP Control",
  "ko": "뇌출혈 시 목표 수축기 140mmHg 이하",
  "eng": "혈압 조절",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "CPP",
  "ko": "뇌관류압 (MAP - ICP)",
  "eng": "Cerebral Perfusion Pressure",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "WFNS",
  "ko": "세계신경외과연합 SAH 등급 (1~5등급)",
  "eng": "",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Fisher grade",
  "ko": "CT상 SAH 혈액 분포 등급 (혈관연축 위험 예측)",
  "eng": "",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": ""
 },
 {
  "abbr": "H&H grade",
  "ko": "뇌동맥류 파열 임상 등급 분류",
  "eng": "Hunt & Hess grade",
  "dept": "신경외과 · 약제",
  "info": [],
  "region": "head"
 },
 {
  "abbr": "UT",
  "ko": "상부 승모근 — 어깨 결림 1위",
  "eng": "Upper Trapezius",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "MT",
  "ko": "중부 승모근",
  "eng": "Middle Trapezius",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "LT",
  "ko": "하부 승모근",
  "eng": "Lower Trapezius",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "LS",
  "ko": "견갑거근 — 목 뒤",
  "eng": "Levator Scapulae",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "RhMa",
  "ko": "대능형근",
  "eng": "Rhomboid Major",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "RhMi",
  "ko": "소능형근",
  "eng": "Rhomboid Minor",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "SS",
  "ko": "극상근 — 어깨 외전",
  "eng": "Supraspinatus",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "IS",
  "ko": "극하근 — 외회전",
  "eng": "Infraspinatus",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Tmin",
  "ko": "소원근",
  "eng": "Teres Minor",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Tmaj",
  "ko": "대원근",
  "eng": "Teres Major",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Sub",
  "ko": "견갑하근 — 내회전",
  "eng": "Subscapularis",
  "dept": "씨암주사(TPI) · 경추/어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "IL",
  "ko": "장늑근",
  "eng": "Iliocostalis",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "LO",
  "ko": "최장근",
  "eng": "Longissimus",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "PM",
  "ko": "대요근 — 장요근의 일부",
  "eng": "Psoas Major",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "IL(m)",
  "ko": "장골근 — 고관절 굴곡",
  "eng": "Iliacus",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Gmax",
  "ko": "대둔근",
  "eng": "Gluteus Maximus",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Gmed",
  "ko": "중둔근",
  "eng": "Gluteus Medius",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Gmin",
  "ko": "소둔근",
  "eng": "Gluteus Minimus",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Pir",
  "ko": "이상근 — 좌골신경 주변",
  "eng": "Piriformis",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "BF",
  "ko": "대퇴이두근 — 햄스트링",
  "eng": "Biceps Femoris",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "arm"
 },
 {
  "abbr": "RF",
  "ko": "대퇴직근 — 무릎 신전",
  "eng": "Rectus Femoris",
  "dept": "씨암주사(TPI) · 요추/둔부/하지",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Gas(M/L)",
  "ko": "비복근 내/외측두",
  "eng": "Gastrocnemius Medial/Lateral Head",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "Sol",
  "ko": "가자미근",
  "eng": "Soleus",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "PL/PB",
  "ko": "장/단 비골근",
  "eng": "Peroneus Longus/Brevis",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "TP",
  "ko": "후경골근",
  "eng": "Tibialis Posterior",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "FHL/FDL",
  "ko": "장무지/장족지 굴곡근",
  "eng": "Flexor Hallucis/Digitorum Longus",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "hand"
 },
 {
  "abbr": "EDL/EHL",
  "ko": "장족지/무지 신전근",
  "eng": "Extensor Digitorum/Hallucis Longus",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "hand"
 },
 {
  "abbr": "Rt. / Lt.",
  "ko": "우측 / 좌측",
  "eng": "Right / Left",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "Prox./Dist.",
  "ko": "근위부 / 원위부",
  "eng": "Proximal / Distal",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "Med./Lat.",
  "ko": "내측 / 외측",
  "eng": "Medial / Lateral",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "Intra-art.",
  "ko": "관절강 내",
  "eng": "Intra-articular",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "Peri-art.",
  "ko": "관절 주위",
  "eng": "Periarticular",
  "dept": "씨암주사(TPI) · 하퇴/발/관절",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "AC Jt",
  "ko": "견봉쇄골관절 주사",
  "eng": "Acromioclavicular Joint",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "GH Jt",
  "ko": "견관절 관절강내 주사",
  "eng": "Glenohumeral Joint",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "SAS",
  "ko": "견봉하 공간 주사",
  "eng": "Subacromial Space",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "SASD",
  "ko": "견봉하-삼각근하 점액낭",
  "eng": "Subacromial-Subdeltoid Bursa",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "BG",
  "ko": "이두근 장두건 구 주사",
  "eng": "Bicipital Groove",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Bic LS",
  "ko": "이두근 건초 주사",
  "eng": "Biceps Long Head (tendon sheath)",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "LHBT",
  "ko": "이두근 장두건",
  "eng": "Long Head Biceps Tendon",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Elbow",
  "ko": "주관절 관절강내 주사",
  "eng": "Elbow Joint",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Lat Epi",
  "ko": "외측상과 (테니스 엘보)",
  "eng": "Lateral Epicondyle",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Med Epi",
  "ko": "내측상과 (골퍼 엘보)",
  "eng": "Medial Epicondyle",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "CTS",
  "ko": "손목터널 주사",
  "eng": "Carpal Tunnel — Injection",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "De Qv",
  "ko": "1구획 건초 주사",
  "eng": "De Quervain Tenosynovitis",
  "dept": "초음파주사 · 어깨/상지",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Caud EP",
  "ko": "미추(꼬리뼈) 경막외 주사",
  "eng": "Caudal Epidural",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "SI Jt",
  "ko": "천장관절 주사",
  "eng": "Sacroiliac Joint",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "FJ",
  "ko": "후관절 주사",
  "eng": "Facet Joint",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Hip Jt",
  "ko": "고관절 관절강내 주사",
  "eng": "Hip Joint",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "TrB",
  "ko": "전자부 점액낭 주사",
  "eng": "Trochanteric Bursa",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "IT Band",
  "ko": "장경인대 — 외측 무릎 통증",
  "eng": "Iliotibial Band",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Knee Jt",
  "ko": "슬관절 관절강내 주사",
  "eng": "Knee Joint (IA)",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Med Men",
  "ko": "내측 반월연골 주변 주사",
  "eng": "Medial Meniscus",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Lat Men",
  "ko": "외측 반월연골 주변 주사",
  "eng": "Lateral Meniscus",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Pes An",
  "ko": "거위발 점액낭 주사",
  "eng": "Pes Anserine Bursa",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Inf Pat B",
  "ko": "슬개인대 하 점액낭 주사",
  "eng": "Infrapatellar Bursa",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Baker's",
  "ko": "오금낭종 — 슬와부",
  "eng": "Baker's Cyst",
  "dept": "초음파주사 · 척추/고관절/무릎",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Ankle Jt",
  "ko": "족관절 관절강내 주사",
  "eng": "Ankle Joint (IA)",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "ATF",
  "ko": "전거비인대 주사",
  "eng": "Anterior Talofibular Ligament",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "Achilles T.",
  "ko": "아킬레스건 건초 주사",
  "eng": "Achilles Tendon (sheath)",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "Retrocal B",
  "ko": "종골후 점액낭",
  "eng": "Retrocalcaneal Bursa",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "Morton's",
  "ko": "지간신경종 주사",
  "eng": "Morton's Neuroma",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "hand"
 },
 {
  "abbr": "1st MTP",
  "ko": "무지 중족지절관절",
  "eng": "1st Metatarsophalangeal Joint",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "hand"
 },
 {
  "abbr": "Subcut.",
  "ko": "피하 주사",
  "eng": "Subcutaneous",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "Perineu.",
  "ko": "신경 주위 주사",
  "eng": "Perineural Injection",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "Tendon sh.",
  "ko": "건초 주사",
  "eng": "Tendon sheath",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "Lig.",
  "ko": "인대 주사 (프롤로 등)",
  "eng": "Ligament",
  "dept": "초음파주사 · 발목/발/인대",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "SCM",
  "ko": "흉쇄유돌근 / Sternocleidomastoid",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "neck"
 },
 {
  "abbr": "UT / MT / LT",
  "ko": "상/중/하 승모근 / Upper·Middle·Lower Trapezius",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "LS",
  "ko": "견갑거근 / Levator Scapulae",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "SS / IS",
  "ko": "Supraspinatus / Infraspinatus",
  "eng": "극상근 / 극하근",
  "dept": "근육 총정리",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Sub",
  "ko": "견갑하근 / Subscapularis",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Pec Maj/Min",
  "ko": "대/소흉근 / Pectoralis Major·Minor",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": ""
 },
 {
  "abbr": "Delt",
  "ko": "삼각근 / Deltoid (Ant/Mid/Post)",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Bic Br / Tri",
  "ko": "Biceps·Triceps Brachii",
  "eng": "상완이두근 / 삼두근",
  "dept": "근육 총정리",
  "info": [],
  "region": "arm"
 },
 {
  "abbr": "ES (IL/LO/SS)",
  "ko": "척추기립근 / Erector Spinae",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "QL",
  "ko": "요방형근 / Quadratus Lumborum",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Psoas/Iliacus",
  "ko": "장요근 (IP m.)",
  "eng": "대요근 / 장골근",
  "dept": "근육 총정리",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "Gmax/Gmed/Gmin",
  "ko": "대/중/소둔근 / Gluteus Max·Med·Min",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "Pir",
  "ko": "이상근 / Piriformis",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "RF/VI/VM/VL",
  "ko": "대퇴직근·중간·내측·외측광근 (대퇴사두근)",
  "eng": "",
  "dept": "근육 총정리",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "Gas / Sol",
  "ko": "Gastrocnemius·Soleus",
  "eng": "비복근 / 가자미근",
  "dept": "근육 총정리",
  "info": [],
  "region": "leg"
 },
 {
  "abbr": "TA / TP",
  "ko": "Tibialis Ant.·Post.",
  "eng": "전/후경골근",
  "dept": "근육 총정리",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "ACL / PCL",
  "ko": "무릎 손상 대표",
  "eng": "전/후방십자인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "knee"
 },
 {
  "abbr": "MCL / LCL",
  "ko": "무릎 내외측",
  "eng": "내/외측측부인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "knee"
 },
 {
  "abbr": "ATF / PTF",
  "ko": "발목 염좌",
  "eng": "전/후거비인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "CFL",
  "ko": "발목 외측",
  "eng": "종비인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "PL / Achilles",
  "ko": "족저근막 / 아킬레스건",
  "eng": "",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "RTC",
  "ko": "Rotator Cuff",
  "eng": "회전근개 (SS+IS+Tmin+Sub)",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "LHBT",
  "ko": "어깨 전면 통증",
  "eng": "이두근 장두건",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "CoracoHum L.",
  "ko": "동결견",
  "eng": "오구상완인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "IL / SL",
  "ko": "Iliolumbar·Sacroiliac Lig.",
  "eng": "장골인대 / 천장관절인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "PLL / ALL",
  "ko": "Posterior·Anterior Longitudinal Lig.",
  "eng": "후/전종인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Lig. Flavum",
  "ko": "척추관협착 관련",
  "eng": "황색인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "Interspinous L.",
  "ko": "요추 사이",
  "eng": "극간인대",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "trunk"
 },
 {
  "abbr": "SASD Bursa",
  "ko": "견봉하-삼각근하 점액낭",
  "eng": "",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "shoulder"
 },
 {
  "abbr": "Troch. Bursa",
  "ko": "고관절 외측",
  "eng": "전자부 점액낭",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "hip"
 },
 {
  "abbr": "Pes An. Bursa",
  "ko": "무릎 내측",
  "eng": "거위발 점액낭",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "knee"
 },
 {
  "abbr": "Retrocal. B.",
  "ko": "아킬레스건 주위",
  "eng": "종골후 점액낭",
  "dept": "인대·건·점액낭",
  "info": [],
  "region": "foot"
 },
 {
  "abbr": "NPO",
  "ko": "금식",
  "eng": "Nil Per Os",
  "dept": "기본 간호",
  "info": [],
  "region": ""
 },
 {
  "abbr": "BID",
  "ko": "하루 2회",
  "eng": "Bis In Die",
  "dept": "기본 간호",
  "info": [],
  "region": ""
 },
 {
  "abbr": "IV",
  "ko": "정맥 주사",
  "eng": "Intravenous",
  "dept": "기본 간호",
  "info": [],
  "region": ""
 },
 {
  "abbr": "V/S",
  "ko": "활력징후",
  "eng": "Vital Signs",
  "dept": "기본 간호",
  "info": [],
  "region": ""
 },
 {
  "abbr": "STAT",
  "ko": "즉시",
  "eng": "Statim",
  "dept": "기본 간호",
  "info": [],
  "region": ""
 }
];

const REGION_LABEL: Record<string, string> = {
  head: "머리·뇌", neck: "목", shoulder: "어깨", arm: "팔·팔꿈치", hand: "손·손목",
  trunk: "척추·몸통", hip: "고관절·골반", knee: "무릎", leg: "종아리", foot: "발·발목",
};

// 인체 도해 — 해당 부위를 색으로 강조
function BodyMap({ region }: { region: string }) {
  const ON = "#0d9488", OFF = "#e2e8f0", LN = "#94a3b8";
  const c = (g: string) => (g === region ? ON : OFF);
  const s = { stroke: LN, strokeWidth: 1 } as const;
  return (
    <svg viewBox="0 0 120 250" className="h-32 w-auto" role="img" aria-label={REGION_LABEL[region] ?? "부위 없음"}>
      {/* 머리 / 목 */}
      <circle cx="60" cy="20" r="13" fill={c("head")} {...s} />
      <rect x="54" y="31" width="12" height="9" rx="2" fill={c("neck")} {...s} />
      {/* 몸통(척추) */}
      <rect x="44" y="40" width="32" height="60" rx="7" fill={c("trunk")} {...s} />
      {/* 어깨 */}
      <circle cx="41" cy="48" r="9" fill={c("shoulder")} {...s} />
      <circle cx="79" cy="48" r="9" fill={c("shoulder")} {...s} />
      {/* 상완+팔꿈치 */}
      <rect x="30" y="48" width="9" height="33" rx="4" fill={c("arm")} {...s} />
      <rect x="81" y="48" width="9" height="33" rx="4" fill={c("arm")} {...s} />
      <circle cx="34" cy="83" r="5" fill={c("arm")} {...s} />
      <circle cx="86" cy="83" r="5" fill={c("arm")} {...s} />
      {/* 전완+손 */}
      <rect x="28" y="85" width="8" height="30" rx="4" fill={c("hand")} {...s} />
      <rect x="84" y="85" width="8" height="30" rx="4" fill={c("hand")} {...s} />
      <circle cx="32" cy="119" r="6" fill={c("hand")} {...s} />
      <circle cx="88" cy="119" r="6" fill={c("hand")} {...s} />
      {/* 골반 */}
      <rect x="46" y="99" width="28" height="21" rx="6" fill={c("hip")} {...s} />
      {/* 허벅지(구조용, 항상 회색) */}
      <rect x="48" y="119" width="12" height="42" rx="5" fill={OFF} {...s} />
      <rect x="60" y="119" width="12" height="42" rx="5" fill={OFF} {...s} />
      {/* 무릎 */}
      <circle cx="54" cy="165" r="7" fill={c("knee")} {...s} />
      <circle cx="66" cy="165" r="7" fill={c("knee")} {...s} />
      {/* 종아리 */}
      <rect x="49" y="171" width="10" height="42" rx="4" fill={c("leg")} {...s} />
      <rect x="61" y="171" width="10" height="42" rx="4" fill={c("leg")} {...s} />
      {/* 발 */}
      <ellipse cx="54" cy="219" rx="7" ry="5" fill={c("foot")} {...s} />
      <ellipse cx="66" cy="219" rx="7" ry="5" fill={c("foot")} {...s} />
    </svg>
  );
}

function TermCard({ t, compact }: { t: Term; compact?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 rounded-xl bg-neutral-50 px-1 pb-1 pt-0.5 dark:bg-neutral-800">
        <BodyMap region={t.region} />
        <div className="mt-0.5 text-center text-[10px] font-semibold text-teal-700 dark:text-teal-300">
          {REGION_LABEL[t.region] ?? "부위 특정 없음"}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-neutral-800 dark:text-neutral-100">
          {t.abbr} <span className="font-normal text-neutral-500 dark:text-neutral-400">— {t.ko}</span>
        </div>
        {t.eng ? <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.eng}</div> : null}
        <div className="mt-1 text-[11px] text-neutral-400">분류: {t.dept}</div>
        {!compact
          ? t.info.slice(0, 4).map((n, i) => (
              <div key={i} className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{n}</div>
            ))
          : null}
      </div>
    </div>
  );
}

type Msg = { who: "user" | "bot"; text?: string; terms?: Term[]; query?: string };

function nrm(s: string): string {
  return (s || "").toUpperCase().replace(/[.\s/()·\-]/g, "");
}
function aliasesOf(t: Term): string[] {
  const arr = t.abbr.split("/").map((x) => x.trim()).filter(Boolean);
  if (t.ko) arr.push(t.ko);
  if (t.eng) arr.push(t.eng);
  return arr;
}
function findTerms(text: string): Term[] {
  const q = nrm(text);
  if (!q) return [];
  const exact: Term[] = [];
  const sub: Term[] = [];
  for (const t of TERMS) {
    let isExact = false;
    for (const a of aliasesOf(t)) if (nrm(a) === q) { isExact = true; break; }
    if (isExact) { exact.push(t); continue; }
    let isSub = false;
    for (const a of aliasesOf(t)) {
      const na = nrm(a);
      const min = /[가-힣]/.test(a) ? 2 : 3;
      if (na.length >= min && q.includes(na)) { isSub = true; break; }
    }
    if (isSub) sub.push(t);
  }
  return exact.length ? exact : sub;
}

const CHIPS = ["OA", "HNP", "ESI", "MBB", "GCS", "ACL", "ATFL", "극상근", "이상근", "CTS", "NPO"];

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      who: "bot",
      text:
        "안녕하세요! 임상 의학용어·주사 약어 도우미예요. 🩺\n약어·한글명·영문명을 입력하면 뜻과 함께 해당 부위를 인체 그림으로 보여드려요.\n(예: HNP, 극상근, Supraspinatus)",
    },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  // 성능 최우선: 클릭 즉시 답변 (인위적 지연 없음)
  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    const list = findTerms(text);
    const bot: Msg = list.length
      ? { who: "bot", terms: list, query: text }
      : { who: "bot", text: "아직 등록되지 않은 용어입니다." };
    setMessages((p) => [...p, { who: "user", text }, bot]);
    setInput("");
  }

  return (
    <MemberShell slug="yu-seonghui">
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          🩺 내 작업물 · 임상 의학용어·주사 약어 챗봇 (MVP)
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          정형외과·마취통증·재활의학·신경외과와 씨암/초음파 주사, 근육·인대 약어 <b>{TERMS.length}개</b>를 검색할 수 있어요.
          검색하면 뜻과 함께 <b>해당 부위를 인체 그림</b>으로 표시하고, 같은 약어에 여러 뜻이 있으면 모두 보여줍니다.
        </p>
      </section>

      <div className="mx-auto flex h-[640px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center gap-3 bg-teal-600 px-5 py-4 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xl">🩺</div>
          <div>
            <h2 className="text-[15px] font-bold">임상 약어 도우미</h2>
            <p className="text-xs opacity-85">{TERMS.length}개 등록 · 부위 그림 · 즉시 검색</p>
          </div>
        </div>

        <div ref={chatRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-950">
          {messages.map((m, i) => {
            if (m.who === "user") {
              return (
                <div key={i} className="max-w-[90%] self-end">
                  <div className="whitespace-pre-wrap rounded-2xl rounded-br-sm bg-teal-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                    {m.text}
                  </div>
                </div>
              );
            }
            // bot
            if (m.terms && m.terms.length) {
              const multi = m.terms.length > 1;
              return (
                <div key={i} className="w-full max-w-[95%] self-start">
                  <div className="rounded-2xl rounded-bl-sm bg-white p-3 shadow-sm dark:bg-neutral-800">
                    {multi ? (
                      <div className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        &ldquo;{m.query}&rdquo; 은(는) {m.terms.length}가지 뜻이 있어요
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-3">
                      {m.terms.map((t, j) => (
                        <div key={j} className={j > 0 ? "border-t border-neutral-100 pt-3 dark:border-neutral-700" : ""}>
                          <TermCard t={t} compact={multi} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="max-w-[90%] self-start">
                <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-neutral-800 shadow-sm dark:bg-neutral-800 dark:text-neutral-100">
                  {m.text}
                </div>
              </div>
            );
          })}
          {messages.length === 1 ? (
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
          ) : null}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2 border-t border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예) HNP / 극상근 / Supraspinatus"
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
        ※ 실제 AI 연동 없이 등록된 약어 {TERMS.length}개에만 답합니다. 인체 그림은 부위를 안내하는 도해이며 실제 해부 사진이 아닙니다.
      </p>
    </MemberShell>
  );
}
