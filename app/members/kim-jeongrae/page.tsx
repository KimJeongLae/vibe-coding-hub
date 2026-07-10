"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MemberShell from "@/components/MemberShell";

// ─────────────────────────────────────────────────────────────
// 김정래 (대표) — 쿠션/베개 3D 시각화 도구
//
// 온라인으로 파는 쿠션·베개 제품을, 디자인 이미지를 올리고
// 크기를 바꿔가며 브라우저에서 실시간 3D로 돌려보는 도구입니다.
//
// ⚠️ 이 프로젝트에는 three.js 가 설치돼 있지 않고, package.json(공통 파일)은
//    수정하면 안 되므로 three.js 를 CDN(esm.sh)에서 런타임에 불러옵니다.
//    오빗(회전) 컨트롤은 외부 의존성 없이 직접 구현했습니다.
// ─────────────────────────────────────────────────────────────

const THREE_URL = "https://esm.sh/three@0.169.0";

// 번들러(webpack/turbopack)가 정적 분석하지 못하도록 감춰서
// 브라우저가 런타임에 CDN 모듈을 그대로 import 하게 만드는 트릭.
const loadModule = (url: string): Promise<any> =>
  (Function("u", "return import(u)") as (u: string) => Promise<any>)(url);

const FABRIC_COLORS = [
  "#f2ede4", // 아이보리
  "#d9d2c5", // 베이지
  "#9aa7a0", // 세이지
  "#5b6b73", // 블루그레이
  "#3a3f45", // 차콜
  "#c98b7e", // 테라코타
];

const SIZE_PRESETS = [
  { label: "50×50", w: 50, h: 50, d: 14 },
  { label: "45×45", w: 45, h: 45, d: 12 },
  { label: "60×40 럼바", w: 60, h: 40, d: 12 },
  { label: "베개 70×50", w: 70, h: 50, d: 16 },
];

const CM_TO_UNIT = 0.02; // 1cm = 0.02 씬 유닛

// 빵빵한 쿠션 형태의 지오메트리를 코드로 생성
function makeCushionGeometry(
  THREE: any,
  w: number,
  h: number,
  d: number,
  puff: number,
) {
  const seg = 48;
  const depthSeg = Math.max(6, Math.round(seg * (d / w)));
  const geo = new THREE.BoxGeometry(w, h, d, seg, seg, depthSeg);
  const pos = geo.attributes.position;
  const a = w / 2;
  const b = h / 2;
  const c = d / 2;
  const round = 0.28; // 모서리 둥글리기 정도
  const bulge = puff * w * 0.14; // 앞/뒤 면 중앙 부풀림

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const nx = vx / a;
    const ny = vy / b;
    const nz = vz / c;

    // 큐브 → 구 매핑 (표준 공식)
    const sx = nx * Math.sqrt(1 - (ny * ny) / 2 - (nz * nz) / 2 + (ny * ny * nz * nz) / 3);
    const sy = ny * Math.sqrt(1 - (nz * nz) / 2 - (nx * nx) / 2 + (nz * nz * nx * nx) / 3);
    const sz = nz * Math.sqrt(1 - (nx * nx) / 2 - (ny * ny) / 2 + (nx * nx * ny * ny) / 3);

    let x = a * (nx * (1 - round) + sx * round);
    let y = b * (ny * (1 - round) + sy * round);
    let z = c * (nz * (1 - round) + sz * round);

    const centerFalloff =
      Math.cos((nx * Math.PI) / 2) * Math.cos((ny * Math.PI) / 2);
    z += Math.sign(nz || 1) * bulge * Math.max(0, centerFalloff) * Math.abs(nz);

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}

// 텍스처를 면 비율(cover)에 맞춰 조정 (프린트 비율 유지)
function fitTexture(
  THREE: any,
  tex: any,
  imgW: number,
  imgH: number,
  faceW: number,
  faceH: number,
) {
  const imgAspect = imgW / imgH;
  const faceAspect = faceW / faceH;
  tex.center.set(0.5, 0.5);
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  if (imgAspect > faceAspect) {
    tex.repeat.x = faceAspect / imgAspect;
  } else {
    tex.repeat.y = imgAspect / faceAspect;
  }
  tex.offset.x = (1 - tex.repeat.x) / 2;
  tex.offset.y = (1 - tex.repeat.y) / 2;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
}

type SceneCtx = {
  THREE: any;
  renderer: any;
  scene: any;
  camera: any;
  mesh: any;
  ground: any;
  matSide: any;
  matFront: any;
  matBack: any;
  dispose: () => void;
};

export default function Page() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<SceneCtx | null>(null);
  // src -> THREE.Texture 캐시 (슬라이더 조작 시 재로딩 방지)
  const texCacheRef = useRef<Record<string, any>>({});

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(50);
  const [depth, setDepth] = useState(14);
  const [puff, setPuff] = useState(0.6);
  const [fabricColor, setFabricColor] = useState(FABRIC_COLORS[0]);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [frontSrc, setFrontSrc] = useState<string | null>(null);
  const [backSrc, setBackSrc] = useState<string | null>(null);

  // ── 3D 씬 초기 세팅 (마운트 시 1회) ──
  useEffect(() => {
    let alive = true;
    let raf = 0;

    (async () => {
      let THREE: any;
      try {
        THREE = await loadModule(THREE_URL);
      } catch {
        if (alive) setLoadError("3D 엔진(three.js)을 불러오지 못했어요. 인터넷 연결을 확인해주세요.");
        return;
      }
      if (!alive || !mountRef.current) return;

      const mount = mountRef.current;
      const width0 = mount.clientWidth || 800;
      const height0 = mount.clientHeight || 500;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // PNG 저장용
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width0, height0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, width0 / height0, 0.1, 100);

      // 조명
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbcbcc4, 0.65));
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(3, 5, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.bias = -0.0001;
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 20;
      key.shadow.camera.left = -3;
      key.shadow.camera.right = 3;
      key.shadow.camera.top = 3;
      key.shadow.camera.bottom = -3;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5);
      fill.position.set(-4, 2, -3);
      scene.add(fill);

      // 소재 (옆면 / 앞면 / 뒷면)
      const matSide = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
      const matFront = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 });
      const matBack = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 });

      const mesh = new THREE.Mesh(
        makeCushionGeometry(THREE, 50, 50, 14, 0.6),
        [matSide, matSide, matSide, matSide, matFront, matBack],
      );
      mesh.scale.setScalar(CM_TO_UNIT);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // 바닥 그림자
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({ opacity: 0.25 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.55;
      ground.receiveShadow = true;
      scene.add(ground);

      // ── 직접 구현한 오빗 컨트롤 ──
      let az = 0.6; // 방위각
      let pol = 1.15; // 고도각
      let rad = 2.7; // 거리
      const target = new THREE.Vector3(0, 0, 0);
      const updateCam = () => {
        pol = Math.max(0.15, Math.min(Math.PI - 0.15, pol));
        rad = Math.max(1.5, Math.min(6, rad));
        camera.position.set(
          target.x + rad * Math.sin(pol) * Math.sin(az),
          target.y + rad * Math.cos(pol),
          target.z + rad * Math.sin(pol) * Math.cos(az),
        );
        camera.lookAt(target);
      };
      updateCam();

      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const el = renderer.domElement;
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        el.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        az -= (e.clientX - lastX) * 0.008;
        pol -= (e.clientY - lastY) * 0.008;
        lastX = e.clientX;
        lastY = e.clientY;
        updateCam();
      };
      const onUp = (e: PointerEvent) => {
        dragging = false;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        rad *= 1 + e.deltaY * 0.001;
        updateCam();
      };
      el.style.touchAction = "none";
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointerleave", onUp);
      el.addEventListener("wheel", onWheel, { passive: false });

      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      const animate = () => {
        raf = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      const dispose = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointerleave", onUp);
        el.removeEventListener("wheel", onWheel);
        renderer.dispose();
        mesh.geometry.dispose();
        matSide.dispose();
        matFront.dispose();
        matBack.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
      };

      ctxRef.current = {
        THREE,
        renderer,
        scene,
        camera,
        mesh,
        ground,
        matSide,
        matFront,
        matBack,
        dispose,
      };
      setReady(true);
    })();

    return () => {
      alive = false;
      ctxRef.current?.dispose();
      ctxRef.current = null;
    };
  }, []);

  // ── 크기/볼륨 변경 → 지오메트리 재생성 ──
  useEffect(() => {
    const S = ctxRef.current;
    if (!S || !ready) return;
    const geo = makeCushionGeometry(S.THREE, width, height, depth, puff);
    S.mesh.geometry.dispose();
    S.mesh.geometry = geo;
    // 바닥을 쿠션 밑면에 맞춤
    const minY = geo.boundingBox.min.y * CM_TO_UNIT;
    S.ground.position.y = minY - 0.02;
  }, [ready, width, height, depth, puff]);

  // ── 색상/텍스처 변경 → 소재 갱신 ──
  useEffect(() => {
    const S = ctxRef.current;
    if (!S || !ready) return;
    const { THREE } = S;

    S.matSide.color.set(fabricColor);

    const applyFace = (mat: any, src: string | null) => {
      if (!src) {
        mat.map = null;
        mat.color.set(fabricColor);
        mat.needsUpdate = true;
        return;
      }
      const cached = texCacheRef.current[src];
      if (cached && cached.image) {
        fitTexture(THREE, cached, cached.image.width, cached.image.height, width, height);
        mat.map = cached;
        mat.color.set("#ffffff");
        mat.needsUpdate = true;
      } else {
        const loader = new THREE.TextureLoader();
        loader.load(src, (tex: any) => {
          texCacheRef.current[src] = tex;
          if (!ctxRef.current) return;
          fitTexture(THREE, tex, tex.image.width, tex.image.height, width, height);
          mat.map = tex;
          mat.color.set("#ffffff");
          mat.needsUpdate = true;
        });
      }
    };

    applyFace(S.matFront, frontSrc);
    applyFace(S.matBack, backSrc);
  }, [ready, fabricColor, frontSrc, backSrc, width, height]);

  // ── 이미지 업로드 ──
  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        if (activeSide === "front") setFrontSrc(src);
        else setBackSrc(src);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [activeSide],
  );

  // ── 현재 각도 PNG 저장 ──
  const handleExport = useCallback(() => {
    const S = ctxRef.current;
    if (!S) return;
    S.renderer.render(S.scene, S.camera);
    const url = S.renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `cushion-${width}x${height}.png`;
    a.click();
  }, [width, height]);

  return (
    <MemberShell slug="kim-jeongrae">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">🛋️ 쿠션 3D 시각화</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            디자인 이미지를 올리고 크기를 바꿔가며, 실제 쿠션이 어떤 모습일지
            여러 각도로 돌려보세요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          {/* 3D 뷰포트 */}
          <div className="relative h-[60vh] min-h-[380px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            <div ref={mountRef} className="absolute inset-0" />
            {!ready && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
                3D 엔진을 불러오는 중…
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-red-500">
                {loadError}
              </div>
            )}
            {ready && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs text-neutral-500 dark:bg-black/50 dark:text-neutral-300">
                드래그: 회전 · 휠: 확대/축소
              </div>
            )}
          </div>

          {/* 컨트롤 패널 */}
          <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            {/* 디자인 업로드 */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                디자인
              </div>
              <div className="mb-2 flex gap-1.5">
                {(["front", "back"] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => setActiveSide(side)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      activeSide === side
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {side === "front" ? "앞면" : "뒷면"}
                  </button>
                ))}
              </div>
              <label className="block cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700">
                {activeSide === "front" ? "앞면" : "뒷면"} 이미지 업로드
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 크기 */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                크기 (cm)
              </div>
              <Slider label="가로" value={width} min={20} max={90} onChange={setWidth} unit="cm" />
              <Slider label="세로" value={height} min={20} max={90} onChange={setHeight} unit="cm" />
              <Slider label="두께" value={depth} min={4} max={30} onChange={setDepth} unit="cm" />
              <div className="flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setWidth(p.w);
                      setHeight(p.h);
                      setDepth(p.d);
                    }}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 볼륨 */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                속통 볼륨 (빵빵함)
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={puff}
                onChange={(e) => setPuff(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* 원단 색상 */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                원단 색상
              </div>
              <div className="flex flex-wrap gap-2">
                {FABRIC_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFabricColor(c)}
                    style={{ background: c }}
                    aria-label={`색상 ${c}`}
                    className={`h-7 w-7 rounded-lg border-2 transition-transform ${
                      fabricColor === c
                        ? "border-blue-600 scale-110"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={!ready}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              현재 각도 이미지 저장
            </button>
          </div>
        </div>
      </div>
    </MemberShell>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
        <span>{label}</span>
        <span className="tabular-nums text-neutral-400">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}
