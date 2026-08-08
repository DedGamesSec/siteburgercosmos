import { useEffect, useRef } from "react";
import * as THREE from "three";
import { REAL_STARS, CONSTELLATION_LINES } from "../data/realStarCatalog";

export interface CinematicPhases {
  underEnd: number;
  orbitEnd: number;
  throughEnd: number;
  assemblyEnd: number;
  turnEnd: number;
  approachEnd: number;
}

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

interface CinematicSceneProps {
  progress: number; // 0..1 scroll-driven cinematic progress
  phases: CinematicPhases;
  active?: boolean; // when false the render loop pauses (intro scrolled past)
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Lowercase 5x7 block glyphs + capital N used for "TrustNode"
const GLYPHS: Record<string, string[]> = {
  t: ["..#..", "..#..", "####.", "..#..", "..#..", "..#..", ".##.."],
  r: [".....", "..##.", ".#..#", ".#...", ".#...", ".#...", "....."],
  u: [".....", ".#.#.", ".#.#.", ".#.#.", ".#.#.", ".####", "....."],
  s: [".####", ".#...", ".#...", "..##.", "...#.", ".#...", ".####"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  o: [".....", ".###.", ".#.#.", ".#.#.", ".#.#.", ".###.", "....."],
  d: ["....#", "....#", "..###", "..#.#", "..#.#", "..###", "....."],
  e: [".....", ".###.", ".#.#.", ".###.", ".#...", ".####", "....."]
};

const WORD = ["t", "r", "u", "s", "t", "N", "o", "d", "e"];

// Deterministic scatter offsets (in world units) used while letters converge
const LETTER_SCATTER = WORD.map((_, i) => ({
  x: Math.sin(i * 3.7 + 1.3) * 16,
  y: Math.cos(i * 2.3 + 0.6) * 11 + 5,
  z: Math.sin(i * 5.1 + 0.2) * 15 - 10
}));

const CELL = 0.55;
const PITCH = 3.4;

const TRUST_COLOR = new THREE.Color("#E8EAED");
const NODE_COLOR = new THREE.Color("#3B82F6");

// Region "A" = northern sky (visible at the start of the flight)
const REGION_A_CODES = ["UMA", "UMI", "CAS", "ORI", "TAU", "CMA", "CYG", "LYR"];
// Region "B" = far-southern sky (the constellations of that specific part of space)
const REGION_B_CODES = ["CRU", "CEN", "SCO", "AQL", "BOO", "VIR", "SGR", "PEG"];

const EARTH_POS = new THREE.Vector3(0, -70, 330);
const EARTH_R = 130;

interface Keyframe {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

function buildLogo(): { group: THREE.Group; letters: THREE.Group[] } {
  const group = new THREE.Group();
  const letters: THREE.Group[] = [];

  WORD.forEach((glyphKey, li) => {
    const glyph = GLYPHS[glyphKey];
    const letter = new THREE.Group();
    const color = li < 5 ? TRUST_COLOR : NODE_COLOR;
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.35),
      metalness: 0.55,
      roughness: 0.3,
      transparent: true
    });
    const geo = new THREE.BoxGeometry(CELL, CELL, CELL * 1.15);
    for (let row = 0; row < 7; row++) {
      const line = glyph[row];
      if (!line) continue;
      for (let col = 0; col < 5; col++) {
        if (line[col] !== "#") continue;
        const box = new THREE.Mesh(geo, mat);
        box.position.set(
          (col - 2) * (CELL + 0.06),
          (row - 3) * (CELL + 0.06),
          0
        );
        letter.add(box);
      }
    }
    const slotX = (li - 4) * PITCH;
    const scatter = LETTER_SCATTER[li];
    letter.userData.slotX = slotX;
    letter.userData.scatter = scatter;
    letter.position.set(slotX + scatter.x, scatter.y, scatter.z);
    letter.rotation.set(scatter.y * 0.05, scatter.x * 0.05, scatter.z * 0.04);
    group.add(letter);
    letters.push(letter);
  });

  group.rotation.set(0.08, 0.18, 0.04);
  return { group, letters };
}

function buildConstellationRegion(codes: string[], radius: number): THREE.Group {
  const group = new THREE.Group();
  const points: number[] = [];
  const lines: number[] = [];
  const starById = new Map(REAL_STARS.map((s) => [s.id, s]));

  const project = (star: (typeof REAL_STARS)[number]) => {
    const ra = (star.ra / 12) * Math.PI;
    const dec = (star.dec * Math.PI) / 180;
    return new THREE.Vector3(
      radius * Math.cos(dec) * Math.cos(ra),
      radius * Math.sin(dec),
      radius * Math.cos(dec) * Math.sin(ra)
    );
  };

  for (const code of codes) {
    const asterism = CONSTELLATION_LINES.find((c) => c.code === code);
    if (!asterism) continue;
    for (const [a, b] of asterism.lines) {
      const sa = starById.get(a);
      const sb = starById.get(b);
      if (!sa || !sb) continue;
      const pa = project(sa);
      const pb = project(sb);
      lines.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }
    for (const star of REAL_STARS) {
      if (star.constellationCode !== code) continue;
      const p = project(star);
      points.push(p.x, p.y, p.z);
    }
  }

  if (lines.length > 0) {
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4f8cff,
      transparent: true,
      opacity: 0.28
    });
    const seg = new THREE.LineSegments(lineGeo, lineMat);
    group.add(seg);
  }

  if (points.length > 0) {
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const ptMat = new THREE.PointsMaterial({
      color: 0xbcd3ff,
      size: 1.4,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });
    const pts = new THREE.Points(ptGeo, ptMat);
    group.add(pts);
  }

  return group;
}

function buildStarfield(count: number, radius: number, brightness: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.85 + Math.random() * 0.3);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.6 + Math.random() * 1.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(1, 1, 1).multiplyScalar(brightness),
    size: 1.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9
  });
  return new THREE.Points(geo, mat);
}

function buildOrbitRing(radius: number, count: number, color: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius * 0.25;
    positions[i * 3 + 2] = 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: 0.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
  });
  return new THREE.Points(geo, mat);
}

export default function CinematicScene({ progress, phases, active = true }: CinematicSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const activeRef = useRef(active);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!isWebGLAvailable()) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x05060a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1200);
    camera.position.set(0, 2, 80);

    scene.add(new THREE.AmbientLight(0x5566aa, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(30, 20, 40);
    scene.add(sun);
    const sunB = new THREE.DirectionalLight(0x3b82f6, 0.4);
    sunB.position.set(-20, -10, -30);
    scene.add(sunB);

    // Starfield (two layers: far shell + closer dust)
    const starCount = isMobile ? 2200 : 4200;
    const starsFar = buildStarfield(starCount, 600, 0.85);
    const starsNear = buildStarfield(isMobile ? 500 : 900, 260, 1);
    scene.add(starsFar);
    scene.add(starsNear);

    // 3D block logo "TrustNode" + cosmic stuff around it
    const { group: logoGroup, letters } = buildLogo();
    scene.add(logoGroup);

    const ringA = buildOrbitRing(11, 90, 0x3b82f6);
    ringA.position.set(0, 1, 0);
    ringA.rotation.x = 1.2;
    const ringB = buildOrbitRing(14, 70, 0x2dd4bf);
    ringB.position.set(0, -1, 0);
    ringB.rotation.x = -1.1;
    ringB.rotation.z = 0.7;
    scene.add(ringA);
    scene.add(ringB);

    // Constellations: region A visible first, region B fades in as we fly deeper
    const consA = buildConstellationRegion(REGION_A_CODES, 240);
    const consB = buildConstellationRegion(REGION_B_CODES, 240);
    scene.add(consA);
    scene.add(consB);
    const setConsOpacity = (group: THREE.Group, opacity: number) => {
      group.children.forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[];
        const target = Array.isArray(mat) ? mat[0] : mat;
        if (target && "opacity" in target) target.opacity = opacity;
      });
    };

    // Earth with NASA texture + atmosphere glow
    const earthGeo = new THREE.SphereGeometry(EARTH_R, isMobile ? 48 : 64, isMobile ? 48 : 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x4f7fcf,
      specular: 0x223344,
      shininess: 12,
      transparent: true,
      opacity: 0
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.copy(EARTH_POS);
    earth.rotation.z = 0.41; // axial tilt
    scene.add(earth);

    const loader = new THREE.TextureLoader();
    loader.load(`${import.meta.env.BASE_URL}textures/earth.jpg`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.color.set(0xffffff);
      earthMat.needsUpdate = true;
    });

    const atmoGeo = new THREE.SphereGeometry(EARTH_R * 1.045, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    atmo.position.copy(EARTH_POS);
    scene.add(atmo);

    // Camera keyframes (progress -> position/lookAt). Word faces +z.
    const kf: Keyframe[] = [
      { p: 0, pos: new THREE.Vector3(0, 2, 80), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.underEnd * 0.25, pos: new THREE.Vector3(0, -4, 40), look: new THREE.Vector3(0, -1, 0) },
      { p: phases.underEnd * 0.55, pos: new THREE.Vector3(0, -8, 16), look: new THREE.Vector3(0, -2, 0) },
      { p: phases.underEnd, pos: new THREE.Vector3(6, -7, -10), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.25), pos: new THREE.Vector3(18, 3, 6), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.5), pos: new THREE.Vector3(0, 5, -20), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.82), pos: new THREE.Vector3(-18, 1, 4), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.orbitEnd, phases.throughEnd, 0.15), pos: new THREE.Vector3(0, 1, 18), look: new THREE.Vector3(0, 1, 0) },
      { p: lerp(phases.orbitEnd, phases.throughEnd, 0.55), pos: new THREE.Vector3(0, 1, 3), look: new THREE.Vector3(0, 1, 0) },
      { p: phases.throughEnd, pos: new THREE.Vector3(0, 2, -12), look: new THREE.Vector3(0, 1, 0) },
      { p: lerp(phases.throughEnd, phases.assemblyEnd, 0.4), pos: new THREE.Vector3(0, 3, -19), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.assemblyEnd, pos: new THREE.Vector3(0, 3, -19), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.assemblyEnd, phases.turnEnd, 0.3), pos: new THREE.Vector3(0, 1, -14), look: new THREE.Vector3(0, -30, 140) },
      { p: phases.turnEnd, pos: new THREE.Vector3(0, -1, 8), look: new THREE.Vector3(0, -60, 300) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.45), pos: new THREE.Vector3(0, -4, 46), look: new THREE.Vector3(0, -40, 320) },
      { p: phases.approachEnd, pos: new THREE.Vector3(0, 4, 95), look: new THREE.Vector3(0, 60, 360) },
      { p: 1, pos: new THREE.Vector3(0, 4, 95), look: new THREE.Vector3(0, 60, 360) }
    ];

    const sampleCamera = (p: number) => {
      const i = Math.max(0, kf.findIndex((k, idx) => idx > 0 && p <= k.p && p >= kf[idx - 1].p) < 0
        ? kf.length - 2
        : Math.max(0, kf.findIndex((k) => p <= k.p) - 1));
      const a = kf[i];
      const b = kf[Math.min(i + 1, kf.length - 1)];
      const span = Math.max(1e-5, b.p - a.p);
      const t = smooth(a.p, b.p, p);
      camera.position.lerpVectors(a.pos, b.pos, t);
      camera.lookAt(b.look.clone().lerp(a.look, 1 - t));
    };

    let raf = 0;
    let prev = performance.now();
    let running = false;

    const render = (time: number) => {
      if (!running) return;
      raf = requestAnimationFrame(render);
      const dt = Math.min(0.05, (time - prev) / 1000);
      prev = time;
      const p = progressRef.current;

      // Earth rotates in real time (clearly visible, not real-world speed)
      earth.rotation.y += dt * 0.05;
      atmo.rotation.y = earth.rotation.y;

      // Ambient cosmic motion around the logo (subtle)
      ringA.rotation.y += dt * 0.08;
      ringB.rotation.y -= dt * 0.06;

      // Letters converge from scattered positions into the assembled word
      const asm = smooth(0.28, phases.assemblyEnd * 0.92, p);
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const slotX = letter.userData.slotX as number;
        const s = letter.userData.scatter as { x: number; y: number; z: number };
        const easeOut = 1 - Math.pow(1 - asm, 3);
        letter.position.set(
          lerp(slotX + s.x, slotX, easeOut),
          lerp(s.y, 0, easeOut),
          lerp(s.z, 0, easeOut)
        );
        letter.rotation.set(
          lerp(s.y * 0.05, 0, easeOut),
          lerp(s.x * 0.05, 0, easeOut),
          lerp(s.z * 0.04, 0, easeOut)
        );
        // Letters spread vertically during the "fly through" passage
        const spreadT = smooth(phases.orbitEnd, phases.throughEnd * 0.7, p) *
          (1 - smooth(phases.throughEnd * 0.7, phases.throughEnd * 1.15, p));
        letter.position.y += (i % 2 === 0 ? 1 : -1) * spreadT * 7;
      }

      // Logo material visibility (fades out after the ship turns)
      const logoFade = 1 - smooth(phases.assemblyEnd, phases.turnEnd * 1.05, p);
      letters.forEach((letter) => {
        letter.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            m.opacity = 0.25 + logoFade * 0.75;
          }
        });
      });

      // Constellations crossfade: region A -> region B
      const aFade = 1 - smooth(0.55, phases.assemblyEnd * 1.05, p);
      const bFade = smooth(0.62, phases.assemblyEnd * 1.15, p);
      setConsOpacity(consA, 0.28 * aFade);
      setConsOpacity(consB, 0.32 * bFade);

      // Earth fades in after the turn
      const earthIn = smooth(phases.turnEnd * 0.85, phases.turnEnd * 1.1, p);
      earthMat.opacity = earthIn;
      atmoMat.opacity = earthIn * 0.35;

      sampleCamera(p);
      renderer.render(scene, camera);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    if (activeRef.current) start();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const activeWatch = setInterval(() => {
      if (activeRef.current) start();
      else stop();
    }, 400);

    return () => {
      stop();
      clearInterval(activeWatch);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry?.dispose();
          const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phases]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
