import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useScrollProgress } from "../hooks/useScrollProgress";

export type PlanetType = "gas" | "rocky" | "ice" | "ocean" | "ringed";

export interface PlanetCinematicProps {
  /** Which side the planet enters from */
  side?: "left" | "right" | "top" | "bottom";
  /** Procedural planet look */
  type?: PlanetType;
  /** Band / surface colors, top to bottom */
  colors?: string[];
  /** Atmosphere rim glow color */
  accent?: string;
  /** Ring color (used when type === "ringed") */
  ringColor?: string;
  /** Extra CSS classes for the absolutely-positioned canvas wrapper */
  className?: string;
  /** When true, animation is disabled entirely (eco mode) */
  disabled?: boolean;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Generate a seamless equirectangular planet texture on a 2D canvas.
function makePlanetTexture(type: PlanetType, colors: string[]): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bands = colors.map(hexToRgb);

  if (type === "gas" || type === "ice") {
    // Horizontal banded planet: smooth gradient rows with a soft noise wobble.
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    const step = 1 / Math.max(1, bands.length - 1);
    bands.forEach((c, i) => {
      grad.addColorStop(i * step, `rgb(${c[0]},${c[1]},${c[2]})`);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Horizontal streaks that wobble with x, giving a gas-giant feel.
    for (let i = 0; i < 180; i++) {
      const y = Math.floor(Math.random() * H);
      const x = Math.floor(Math.random() * W);
      const len = 40 + Math.random() * 140;
      const wave = Math.sin(y * 0.35 + x * 0.02) * 6;
      const c = bands[Math.floor(Math.random() * bands.length)];
      const shade = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(${c[0] * shade | 0},${c[1] * shade | 0},${c[2] * shade | 0},0.28)`;
      ctx.beginPath();
      ctx.ellipse(x, y + wave, len, 2 + Math.random() * 3, Math.sin(x) * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "rocky" || type === "ocean") {
    // Base fill (dark for rocky, deep blue for ocean).
    ctx.fillStyle = `rgb(${bands[0][0]},${bands[0][1]},${bands[0][2]})`;
    ctx.fillRect(0, 0, W, H);

    // Speckle noise for rock / ocean depth variation.
    for (let i = 0; i < 9000; i++) {
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * H);
      const c = bands[1 + Math.floor(Math.random() * (bands.length - 1))];
      const a = 0.12 + Math.random() * 0.3;
      const r = type === "rocky" ? 1 + Math.random() * 3 : 2 + Math.random() * 5;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type === "rocky") {
      // Craters: darker rings with a lighter rim.
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(Math.random() * W);
        const y = Math.floor(Math.random() * H);
        const r = 6 + Math.random() * 22;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20,16,10,0.5)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(200,180,150,0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (type === "ocean") {
      // Light continental-ish shapes.
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(Math.random() * W);
        const y = Math.floor(Math.random() * H);
        ctx.fillStyle = `rgba(${bands[2][0]},${bands[2][1]},${bands[2][2]},0.35)`;
        for (let j = 0; j < 30; j++) {
          const dx = (Math.random() - 0.5) * 90;
          const dy = (Math.random() - 0.5) * 60;
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 6 + Math.random() * 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else {
    ctx.fillStyle = `rgb(${bands[0][0]},${bands[0][1]},${bands[0][2]})`;
    ctx.fillRect(0, 0, W, H);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRingTexture(color: string): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const [r, g, b] = hexToRgb(color);
  const grad = ctx.createRadialGradient(S / 2, S / 2, S * 0.32, S / 2, S / 2, S * 0.48);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(0.62, `rgba(${r},${g},${b},0.3)`);
  grad.addColorStop(0.78, `rgba(${r},${g},${b},0.75)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const DEFAULT_COLORS: Record<PlanetType, string[]> = {
  gas: ["#c68a5b", "#e0b06a", "#d08a5a", "#b8693f", "#e2c08a"],
  ice: ["#9fd8f0", "#c9ecf7", "#8fc8e4", "#dff5fb"],
  rocky: ["#5a4632", "#8a6a48", "#6e5638", "#a08563"],
  ocean: ["#0a2540", "#1a5c8a", "#3a9ecb", "#2c7fb0", "#4fc3e8"],
  ringed: ["#e6c07a", "#d9a45f", "#f2d69a", "#c78a4f"]
};

const ACCENTS: Record<PlanetType, string> = {
  gas: "#e0a06a",
  ice: "#bfe9fb",
  rocky: "#c08a5a",
  ocean: "#3a9ecb",
  ringed: "#f2c06a"
};

export default function PlanetCinematic({
  side = "left",
  type = "gas",
  colors,
  accent,
  ringColor = "#d9a45f",
  className = "",
  disabled = false
}: PlanetCinematicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(wrapRef);
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const pal = colors || DEFAULT_COLORS[type];
  const accentColor = accent || ACCENTS[type];

  useEffect(() => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window !== "undefined" && !window.WebGLRenderingContext) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
    renderer.setClearColor(0x0a0a0b, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(0, 0, 260);

    // Faint deep-space stars.
    const starCount = isMobile ? 500 : 1200;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1800;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1800;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1800;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x9aa5c0,
      size: 0.7,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Planet.
    const segments = isMobile ? 48 : 96;
    const planetGeo = new THREE.SphereGeometry(46, segments, segments);
    const planetTex = makePlanetTexture(type, pal);
    const planetMat = new THREE.MeshPhongMaterial({
      map: planetTex,
      shininess: type === "ice" ? 30 : 12,
      specular: new THREE.Color(type === "ice" ? 0x88bbcc : 0x223344)
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.rotation.x = 0.35;
    planet.rotation.z = 0.12;
    scene.add(planet);

    // Atmosphere rim.
    const atmoGeo = new THREE.SphereGeometry(46.6, segments, segments);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmosphere);

    // Rings.
    let ring: THREE.Mesh | null = null;
    if (type === "ringed") {
      const ringGeo = new THREE.RingGeometry(56, 88, 80, 1);
      const ringTex = makeRingTexture(ringColor);
      const ringMat = new THREE.MeshBasicMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
      });
      ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.4;
      ring.rotation.z = 0.1;
      scene.add(ring);
    }

    // Lighting.
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(120, 80, 160);
    scene.add(sun);

    // Entry side: offsets the planet's on-screen position during the entrance.
    const sideOffset: Record<string, { x: number; y: number }> = {
      left: { x: -1.15, y: 0 },
      right: { x: 1.15, y: 0 },
      top: { x: 0, y: 1.15 },
      bottom: { x: 0, y: -1.15 }
    };
    const off = sideOffset[side] || sideOffset.left;

    // End resting spot (slightly off-center toward the entry side, like planets
    // hanging on the edge of the frame).
    const rest: Record<string, { x: number; y: number }> = {
      left: { x: -0.68, y: 0.05 },
      right: { x: 0.68, y: 0.05 },
      top: { x: 0, y: 0.62 },
      bottom: { x: 0, y: -0.62 }
    };
    const rPos = rest[side] || rest.left;

    let raf = 0;
    let running = false;

    const render = (time: number) => {
      if (!running) return;
      raf = requestAnimationFrame(render);
      const p = progressRef.current;

      // Entrance: slide in from the chosen side during the first ~45% of scroll.
      const easeIn = clamp01(p / 0.45);
      const easeOut = clamp01((p - 0.82) / 0.18);
      const inT = easeIn * easeIn * (3 - 2 * easeIn);
      const outT = easeOut * easeOut * (3 - 2 * easeOut);

      const x = off.x + (rPos.x - off.x) * inT;
      const y = off.y + (rPos.y - off.y) * inT;
      planet.position.set(x * 150, y * 150, 0);
      atmosphere.position.copy(planet.position);
      if (ring) ring.position.copy(planet.position);

      // Visibility: fully hidden at the start, fades in while sliding, out at end.
      const visIn = clamp01((p - 0.04) / 0.25);
      const visOut = 1 - outT;
      const opacity = visIn * visOut;
      planetMat.opacity = opacity;
      planetMat.transparent = true;
      atmoMat.opacity = 0.22 * opacity;
      starMat.opacity = 0.7 * Math.min(1, 1 - easeIn * 0.5);
      if (ring) (ring.material as THREE.MeshBasicMaterial).opacity = opacity * 0.9;

      // Rotation + gentle drift.
      planet.rotation.y = -gmstRot(time) + p * 1.8;
      const drift = Math.sin(time * 0.0004) * 0.02;
      planet.position.y += drift;
      atmosphere.position.y += drift;
      if (ring) ring.position.y += drift;
      stars.rotation.y = time * 0.000012;
      stars.rotation.x = Math.sin(time * 0.000005) * 0.02;

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

    // Only render while the section is anywhere near the viewport (with margin)
    // so the several planet canvases on the page don't all spin off-screen.
    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(wrapRef.current as Element);
    start();

    const onResize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      const m = w < 768;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, m ? 1.25 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    onResize();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      planetGeo.dispose();
      planetTex.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      if (ring) {
        (ring as THREE.Mesh).geometry.dispose();
        ((ring as THREE.Mesh).material as THREE.Material).dispose();
      }
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, type, side, colors?.join(","), accent, ringColor]);

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {disabled ? (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 60%, ${accentColor}14 0%, transparent 55%)`
          }}
        />
      ) : (
        <canvas ref={canvasRef} className="w-full h-full block" />
      )}
    </div>
  );
}

// Reuse a tiny GMST-like rotation so the spin looks consistent with the Earth scene.
function gmstRot(time: number): number {
  return (time * 0.00028) % (Math.PI * 2);
}
