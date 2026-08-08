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

// RA (hours 0..24) + Dec (deg -90..90) -> unit direction on the celestial sphere
function raDecDir(ra: number, dec: number): THREE.Vector3 {
  const raRad = (ra / 24) * Math.PI * 2;
  const decRad = (dec * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(decRad) * Math.cos(raRad),
    Math.sin(decRad),
    Math.cos(decRad) * Math.sin(raRad)
  );
}

// Real star layers grouped by region of the sky, so the flight gradually reveals
// new constellations the deeper we go: north (seen from the start, like the original
// sky) -> mid declinations -> far south.
const SKY_GROUP_NORTH = ["UMA", "UMI", "CAS", "DRA", "CEP", "CYG", "LYR", "AND", "AUR", "PER", "BOO", "HER", "CRB", "GEM"];
const SKY_GROUP_MID = ["ORI", "TAU", "CMA", "CMI", "LEO", "VIR", "AQL"];
const SKY_GROUP_SOUTH = ["SCO", "SGR", "CEN", "CRU", "PEG"];

// Brightness/size from real magnitude (smaller mag = brighter star)
function starVisual(star: (typeof REAL_STARS)[number]) {
  const size = Math.max(0.7, 3.4 - star.mag * 0.5);
  const alpha = Math.min(1, Math.max(0.18, 1.1 - star.mag * 0.2));
  return { size, alpha };
}

// Build a real-star Points layer from the catalog for a given set of constellations.
function buildStarLayer(codes: string[]): THREE.Points {
  const members = REAL_STARS.filter((s) => s.constellationCode && codes.includes(s.constellationCode));
  const positions = new Float32Array(members.length * 3);
  const sizes = new Float32Array(members.length);
  const alphas = new Float32Array(members.length);

  for (let i = 0; i < members.length; i++) {
    const star = members[i];
    const dir = raDecDir(star.ra, star.dec);
    // Nearest stars fly past close to the camera; distant ones sit on the far shell
    const distLy = star.distLy || 400;
    const radius = lerp(240, 860, clamp01(distLy / 900));
    positions[i * 3] = dir.x * radius;
    positions[i * 3 + 1] = dir.y * radius;
    positions[i * 3 + 2] = dir.z * radius;
    const v = starVisual(star);
    sizes[i] = v.size;
    alphas[i] = v.alpha;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (300.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying float vAlpha;
      uniform float uOpacity;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        float core = smoothstep(0.12, 0.0, d);
        float halo = smoothstep(0.5, 0.1, d);
        float a = (core + halo * 0.45) * vAlpha * uOpacity;
        if (a < 0.02) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a);
      }
    `
  });

  return new THREE.Points(geo, mat);
}

// Deep-space dust revealed as the flight deepens: two far shells of faint stars that
// come into view after the catalog constellations have opened up.
function buildDeepDust(count: number, radius: number, seedMul: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = fract(Math.sin(i * 12.9898 + seedMul) * 43758.5453);
    const v = fract(Math.sin(i * 78.233 + seedMul * 1.7) * 12543.123);
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.9 + 0.2 * fract(Math.sin(i * 39.19 + seedMul) * 2345.7));
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.5 + 0.8 * fract(Math.sin(i * 91.3 + seedMul) * 5432.1);
    alphas[i] = 0.25 + 0.5 * fract(Math.sin(i * 27.4 + seedMul) * 9123.5);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (240.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying float vAlpha;
      uniform float uOpacity;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        float a = smoothstep(0.5, 0.06, d) * vAlpha * uOpacity;
        if (a < 0.015) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a);
      }
    `
  });
  return new THREE.Points(geo, mat);
}

function fract(x: number) {
  return x - Math.floor(x);
}

// Real constellation asterisms drawn from the same catalog, for a set of codes.
function buildConstellationLayer(codes: string[]): THREE.LineSegments {
  const starById = new Map(REAL_STARS.map((s) => [s.id, s]));
  const R = 820;
  const lines: number[] = [];
  for (const asterism of CONSTELLATION_LINES) {
    if (!codes.includes(asterism.code)) continue;
    for (const [a, b] of asterism.lines) {
      const sa = starById.get(a);
      const sb = starById.get(b);
      if (!sa || !sb) continue;
      const pa = raDecDir(sa.ra, sa.dec).multiplyScalar(R);
      const pb = raDecDir(sb.ra, sb.dec).multiplyScalar(R);
      lines.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x7fa8ff,
    transparent: true,
    opacity: 0
  });
  return new THREE.LineSegments(geo, mat);
}

// Night-lights: a shader sphere that only shows city lights on the dark side.
function buildNightLights(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.002, 96, 96);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uNight: { value: null },
      uSunDir: { value: new THREE.Vector3(0.35, 0.4, 0.85).normalize() }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform sampler2D uNight;
      uniform vec3 uSunDir;
      void main() {
        float d = dot(normalize(vNormal), uSunDir);
        float nf = 1.0 - smoothstep(-0.12, 0.28, d);
        vec3 night = texture2D(uNight, vUv).rgb;
        float a = max(0.0, nf) * 0.95;
        gl_FragColor = vec4(night * a, a);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(1.0);
  return mesh;
}

// Fresnel atmosphere glow around the limb.
function buildAtmosphere(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.06, 96, 96);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#3b82f6") }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying vec3 vNormal;
      varying vec3 vView;
      uniform vec3 uColor;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
        gl_FragColor = vec4(uColor, rim * 0.55);
      }
    `
  });
  return new THREE.Mesh(geo, mat);
}

// Greenwich Mean Sidereal Time in radians for a given date. This is the real,
// continuous rotation of the Earth relative to the stars.
function gmstRadians(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const gmstDeg = (280.46061837 + 360.98564736629 * d) % 360;
  return (gmstDeg * Math.PI) / 180;
}

const EARTH_POS = new THREE.Vector3(0, -45, 800);
const EARTH_R = 130;

interface Keyframe {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
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
    renderer.setClearColor(0x04050a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 6, 120);

    const ambient = new THREE.AmbientLight(0x33415e, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(90, 110, 220);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x3b82f6, 0.35);
    fill.position.set(-60, -30, -80);
    scene.add(fill);

    // Real sky, revealed in layers as the flight deepens: the north constellations
    // (the same ones as the original landing page sky) are visible from the start,
    // then mid declinations open up, then the far south, then deep-space dust.
    const starsNorth = buildStarLayer(SKY_GROUP_NORTH);
    scene.add(starsNorth);
    const starsMid = buildStarLayer(SKY_GROUP_MID);
    scene.add(starsMid);
    const starsSouth = buildStarLayer(SKY_GROUP_SOUTH);
    scene.add(starsSouth);
    const consNorth = buildConstellationLayer(SKY_GROUP_NORTH);
    scene.add(consNorth);
    const consMid = buildConstellationLayer(SKY_GROUP_MID);
    scene.add(consMid);
    const consSouth = buildConstellationLayer(SKY_GROUP_SOUTH);
    scene.add(consSouth);
    const deepA = buildDeepDust(900, 880, 0.31);
    scene.add(deepA);
    const deepB = buildDeepDust(1600, 1180, 3.71);
    scene.add(deepB);

    // Professional Earth: day texture + relief + ocean specular + clouds + night lights
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 128, 128);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x334455,
      shininess: 18,
      transparent: true,
      opacity: 0
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.copy(EARTH_POS);
    earth.rotation.z = (23.44 * Math.PI) / 180; // axial tilt
    scene.add(earth);

    const night = buildNightLights();
    night.position.copy(EARTH_POS);
    night.rotation.z = (23.44 * Math.PI) / 180;
    scene.add(night);

    const atmo = buildAtmosphere();
    atmo.position.copy(EARTH_POS);
    scene.add(atmo);

    const cloudsGeo = new THREE.SphereGeometry(EARTH_R * 1.014, 96, 96);
    const cloudsMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      specular: 0x111111,
      shininess: 4
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    clouds.position.copy(EARTH_POS);
    clouds.rotation.z = (23.44 * Math.PI) / 180;
    scene.add(clouds);

    const loader = new THREE.TextureLoader();
    const baseUrl = import.meta.env.BASE_URL;

    const loadTex = (path: string) => loader.load(`${baseUrl}textures/${path}`);
    const dayTex = loadTex("earth_atmos_2048.jpg");
    dayTex.colorSpace = THREE.SRGBColorSpace;
    earthMat.map = dayTex;

    const normalTex = loadTex("earth_normal_2048.jpg");
    normalTex.wrapS = normalTex.wrapT = THREE.ClampToEdgeWrapping;
    earthMat.normalMap = normalTex;
    earthMat.normalScale = new THREE.Vector2(1.4, 1.4);

    const specTex = loadTex("earth_specular_2048.jpg");
    earthMat.specularMap = specTex;
    earthMat.needsUpdate = true;

    const cloudsTex = loadTex("earth_clouds_1024.png");
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    cloudsMat.map = cloudsTex;
    cloudsMat.needsUpdate = true;

    const nightTex = loadTex("earth_lights_2048.png");
    nightTex.colorSpace = THREE.SRGBColorSpace;
    (night.material as THREE.ShaderMaterial).uniforms.uNight.value = nightTex;

    // Camera keyframes. Narrative: the TRUSTNODE title sits in the original starry
    // sky -> we fly INTO the stars (constellation lines fall away) -> new
    // constellations open as the logo assembles, with a brief hover -> then a turn
    // toward Earth and a close approach until the planet fills the frame.
    const kf: Keyframe[] = [
      { p: 0, pos: new THREE.Vector3(0, 6, 120), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.underEnd * 0.5, pos: new THREE.Vector3(0, 5, 70), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.underEnd, pos: new THREE.Vector3(0, 4, 20), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.4), pos: new THREE.Vector3(9, 3, -14), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.75), pos: new THREE.Vector3(0, 2, -38), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.orbitEnd, pos: new THREE.Vector3(-8, 2, -14), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.throughEnd, pos: new THREE.Vector3(0, 3, 10), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.throughEnd, phases.assemblyEnd, 0.5), pos: new THREE.Vector3(0, 3, 0), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.assemblyEnd, pos: new THREE.Vector3(0, 3, -6), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.assemblyEnd, phases.turnEnd, 0.45), pos: new THREE.Vector3(0, 3, -6), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.assemblyEnd, phases.turnEnd, 0.85), pos: new THREE.Vector3(0, 3, -6), look: new THREE.Vector3(0, -15, 120) },
      { p: phases.turnEnd, pos: new THREE.Vector3(0, -2, 40), look: new THREE.Vector3(0, -45, 800) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.45), pos: new THREE.Vector3(0, -8, 300), look: new THREE.Vector3(0, -40, 800) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.8), pos: new THREE.Vector3(0, -14, 520), look: new THREE.Vector3(0, -42, 800) },
      { p: phases.approachEnd, pos: new THREE.Vector3(0, -10, 650), look: new THREE.Vector3(0, 90, 800) },
      { p: 1, pos: new THREE.Vector3(0, -10, 650), look: new THREE.Vector3(0, 90, 800) }
    ];

    const currentLook = new THREE.Vector3(0, 0, 0);
    const sampleCamera = (p: number) => {
      let i = Math.max(0, kf.findIndex((k) => p <= k.p) - 1);
      if (i < 0) i = 0;
      const a = kf[i];
      const b = kf[Math.min(i + 1, kf.length - 1)];
      const span = Math.max(1e-5, b.p - a.p);
      const t = smooth(a.p, b.p, p);
      camera.position.lerpVectors(a.pos, b.pos, t);
      currentLook.lerpVectors(a.look, b.look, t);
      camera.lookAt(currentLook);
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

      // Earth rotates strictly in sync with real time (GMST) + a gentle extra spin
      // so the motion is clearly visible even on a short flight.
      const gmst = gmstRadians(new Date());
      earth.rotation.y = -gmst + 3.2 + p * 2.2;
      night.rotation.y = earth.rotation.y;
      clouds.rotation.y = earth.rotation.y + 0.003 * (time / 1000);

      // Earth fades in after the turn
      const earthIn = smooth(phases.turnEnd * 0.9, phases.turnEnd * 1.1, p);
      earthMat.opacity = earthIn;
      cloudsMat.opacity = earthIn * 0.85;
      (atmo.material as THREE.ShaderMaterial).opacity = earthIn;
      (night.material as THREE.ShaderMaterial).opacity = earthIn;

      // Progressive sky reveal, tied to the narrative:
      // - The original north sky (constellation lines included) is the backdrop for
      //   the TRUSTNODE title; its lines fall away as we fly into the deep.
      // - New constellations open while the logo assembles and hovers.
      // - Deep dust appears during the turn; everything thins as Earth fills the view.
      const skyFade = (inA: number, inB: number, outA: number, outB: number) =>
        smooth(inA, inB, p) * (1 - smooth(outA, outB, p));
      (starsNorth.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 1 - smooth(0.6, 0.85, p);
      (starsMid.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.42, 0.55, 0.82, 0.94);
      (starsSouth.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.55, 0.68, 0.84, 0.95);
      (deepA.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.68, 0.8, 1, 1);
      (deepB.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.75, 0.88, 1, 1);
      (consNorth.material as THREE.LineBasicMaterial).opacity = skyFade(0, 0.06, 0.08, 0.22);
      (consMid.material as THREE.LineBasicMaterial).opacity = skyFade(0.45, 0.58, 0.82, 0.94);
      (consSouth.material as THREE.LineBasicMaterial).opacity = skyFade(0.6, 0.72, 0.84, 0.95);

      sampleCamera(p);

      // Gentle float while hovering at the assembled logo
      const hover = smooth(0.58, 0.66, p) * (1 - smooth(0.74, 0.82, p));
      if (hover > 0) {
        camera.position.y += Math.sin(time * 0.0012) * 1.2 * hover;
        camera.position.x += Math.cos(time * 0.0009) * 0.8 * hover;
        camera.lookAt(currentLook);
      }

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
      const skyPoints: THREE.Points[] = [starsNorth, starsMid, starsSouth, deepA, deepB];
      skyPoints.forEach((pt) => {
        pt.geometry.dispose();
        (pt.material as THREE.Material).dispose();
      });
      const skyLines: THREE.LineSegments[] = [consNorth, consMid, consSouth];
      skyLines.forEach((ln) => {
        ln.geometry.dispose();
        (ln.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phases]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
