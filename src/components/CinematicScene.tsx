import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as satellite from "satellite.js";
import * as Astronomy from "astronomy-engine";
import { REAL_STARS } from "../data/realStarCatalog";
import { cachedSatellites, useSkyActivation } from "../hooks/useSkyActivation";

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
  progress?: number; // 0..1 scroll-driven cinematic progress (legacy, unused when progressRef given)
  progressRef?: { current: number }; // shared mutable progress, read per-frame without React re-render
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
  const size = Math.max(1.6, 5.5 - star.mag * 0.7);
  const alpha = Math.min(1, Math.max(0.45, 1.25 - star.mag * 0.12));
  return { size, alpha };
}

// Build a real-star Points layer from the catalog for a given set of constellations.
function buildStarLayer(codes: string[]): THREE.Points {
  const members = REAL_STARS.filter((s) => s.constellationCode && codes.includes(s.constellationCode));
  const positions = new Float32Array(members.length * 3);
  const sizes = new Float32Array(members.length);
  const alphas = new Float32Array(members.length);
  const colors = new Float32Array(members.length * 3);

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

    // Subtle temperature tint: blue-white / white / warm
    const t = fract(Math.sin(i * 12.9898 + star.ra) * 43758.5453);
    if (t < 0.4) {
      colors[i * 3] = 0.82;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 1;
    } else if (t < 0.8) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.86;
      colors[i * 3 + 2] = 0.68;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = aAlpha;
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(2.2, min(32.0, aSize * (620.0 / max(1.0, -mv.z))));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying float vAlpha;
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        float core = smoothstep(0.14, 0.0, d);
        float halo = smoothstep(0.5, 0.12, d);
        float a = (core + halo * 0.45) * vAlpha * uOpacity;
        if (a < 0.008) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });

  return new THREE.Points(geo, mat);
}

function fract(x: number) {
  return x - Math.floor(x);
}

// A realistic night sky, not uniform dots: thousands of faint stars with a proper
// brightness distribution, subtle color temperature variety and a bright Milky Way
// band crossing the sky. One distant shell that stays as the backdrop for the whole
// flight; the bright real catalog stars layer on top of it with parallax.
function buildBackgroundSky(count: number, radius: number): THREE.Points {
  const bandN = new THREE.Vector3(0.35, 0.78, 0.52).normalize();
  const bandP = new THREE.Vector3(1, 0, 0);
  const bandQ = new THREE.Vector3(0, 0, 1);

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const dir = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    // ~40% of stars cluster in the Milky Way band (a great circle band)
    if (Math.random() < 0.4) {
      const a = Math.random() * Math.PI * 2;
      const lat = (Math.random() - 0.5) * 0.5;
      dir.copy(bandP).multiplyScalar(Math.cos(a) * Math.cos(lat));
      dir.addScaledVector(bandQ, Math.sin(a) * Math.cos(lat));
      dir.addScaledVector(bandN, Math.sin(lat));
    } else {
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      dir.set(r * Math.cos(phi), u, r * Math.sin(phi));
    }
    dir.normalize();
    const r = radius * (0.92 + 0.16 * Math.random());
    positions[i * 3] = dir.x * r;
    positions[i * 3 + 1] = dir.y * r;
    positions[i * 3 + 2] = dir.z * r;

    // Brightness: many faint, few bright (magnitude 1.5..7)
    const mag = 1.5 + 5.5 * Math.pow(Math.random(), 0.55);
    sizes[i] = Math.max(0.7, 4.6 - mag * 0.62);
    alphas[i] = Math.min(1, Math.max(0.2, 1.05 - mag * 0.13));

    // Subtle color temperature: blue-white / white / warm
    const t = Math.random();
    if (t < 0.5) {
      const k = 0.82 + 0.15 * Math.random();
      colors[i * 3] = k;
      colors[i * 3 + 1] = k;
      colors[i * 3 + 2] = Math.min(1, k + 0.18);
    } else if (t < 0.85) {
      const k = 0.92 + 0.08 * Math.random();
      colors[i * 3] = k;
      colors[i * 3 + 1] = k;
      colors[i * 3 + 2] = k;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.85 + 0.1 * Math.random();
      colors[i * 3 + 2] = 0.62 + 0.15 * Math.random();
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = aAlpha;
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.8, min(5.0, aSize * (420.0 / max(1.0, -mv.z))));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying float vAlpha;
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        float a = smoothstep(0.5, 0.06, d) * vAlpha * uOpacity;
        if (a < 0.006) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });
  return new THREE.Points(geo, mat);
}

// Night-lights: a shader sphere that only shows city lights on the dark side.
function buildNightLights(segments: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.002, segments, segments);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uNight: { value: null },
      uSunDir: { value: new THREE.Vector3(0.35, 0.4, 0.85).normalize() },
      uOpacity: { value: 0 }
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
      uniform float uOpacity;
      void main() {
        float d = dot(normalize(vNormal), uSunDir);
        float nf = 1.0 - smoothstep(-0.12, 0.28, d);
        vec3 night = texture2D(uNight, vUv).rgb;
        float a = max(0.0, nf) * 0.95 * uOpacity;
        gl_FragColor = vec4(night * a, a);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(EARTH_R);
  return mesh;
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
const EARTH_R = 170;

interface Keyframe {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

export default function CinematicScene({ progress = 0, progressRef, phases, active = true }: CinematicSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRefInternal = useRef(progress);
  const activeRef = useRef(active);

  useSkyActivation(false);

  useEffect(() => {
    progressRefInternal.current = progress;
  }, [progress]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!isWebGLAvailable()) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    // Adaptive rendering: phones get a lower pixel ratio and fewer stars/segments,
    // tablets a middle tier, desktops full quality.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : isTablet ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x04050a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 6, 120);

    // Near-black ambient keeps the night side of Earth truly dark, with a crisp
    // day/night terminator like real photography.
    const ambient = new THREE.AmbientLight(0x33415e, 0.08);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 3.0);
    sun.position.set(90, 110, 220);
    sun.target.position.copy(EARTH_POS);
    scene.add(sun);
    scene.add(sun.target);

    // Real sky. One dense, realistic backdrop (faint stars, Milky Way band, color
    // temperature) is always on; the bright catalog stars layer on top with real
    // parallax so the flight flies past actual stars. No constellation lines.
    const bgCount = isMobile ? 2400 : isTablet ? 3800 : 5200;
    const background = buildBackgroundSky(bgCount, 1400);
    scene.add(background);
    const starsNorth = buildStarLayer(SKY_GROUP_NORTH);
    scene.add(starsNorth);
    const starsMid = buildStarLayer(SKY_GROUP_MID);
    scene.add(starsMid);
    const starsSouth = buildStarLayer(SKY_GROUP_SOUTH);
    scene.add(starsSouth);

    // Professional Earth: real satellite maps (Solar System Scope, CC BY 4.0, based on
// NASA imagery) — day + relief normal + ocean specular + clouds + night lights.
    const earthSeg = isMobile ? 64 : isTablet ? 96 : 128;
    const earthGeo = new THREE.SphereGeometry(EARTH_R, earthSeg, earthSeg);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x335577,
      shininess: 22,
      transparent: true,
      opacity: 0
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.copy(EARTH_POS);
    earth.rotation.z = (23.44 * Math.PI) / 180; // axial tilt
    earth.renderOrder = 1;
    scene.add(earth);

    const night = buildNightLights(earthSeg);
    night.position.copy(EARTH_POS);
    night.rotation.z = (23.44 * Math.PI) / 180;
    night.renderOrder = 3;
    scene.add(night);

    const cloudsGeo = new THREE.SphereGeometry(EARTH_R * 1.014, earthSeg, earthSeg);
    const cloudsMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      specular: 0x000000,
      shininess: 0
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    clouds.position.copy(EARTH_POS);
    clouds.rotation.z = (23.44 * Math.PI) / 180;
    clouds.renderOrder = 2;
    scene.add(clouds);

    const loader = new THREE.TextureLoader();
    const baseUrl = import.meta.env.BASE_URL;

    // The satellite maps are 8K (8192x4096). Some integrated/mobile GPUs cap
    // maxTextureSize at 4096 and silently reject the upload, so the planet would
    // render as a black sphere against black space (it looks "missing"). Downscale
    // any texture that exceeds the GPU limit so the Earth always appears.
    const maxTexSize = renderer.capabilities.maxTextureSize || 4096;
    const dayReady = { value: false };

    const loadSized = (path: string, onReady?: () => void): THREE.Texture => {
      const tex = loader.load(
        `${baseUrl}textures/${path}`,
        () => {
            const img = tex.image as HTMLImageElement | undefined;
          if (img && img.width > maxTexSize && maxTexSize >= 128) {
            const scale = maxTexSize / img.width;
            const canvas = document.createElement("canvas");
            canvas.width = maxTexSize;
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              tex.image = canvas as unknown as HTMLImageElement;
              tex.needsUpdate = true;
            }
          }
          onReady?.();
        },
        undefined,
        () => onReady?.()
      );
      return tex;
    };

    const dayTex = loadSized("earth_daymap_8k.jpg", () => {
      dayReady.value = true;
    });
    dayTex.colorSpace = THREE.SRGBColorSpace;
    dayTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    earthMat.map = dayTex;

    const normalTex = loadSized("earth_normal_8k.jpg");
    normalTex.wrapS = normalTex.wrapT = THREE.ClampToEdgeWrapping;
    earthMat.normalMap = normalTex;
    earthMat.normalScale.set(0.9, 0.9);

    const specTex = loadSized("earth_specular_8k.jpg");
    earthMat.specularMap = specTex;
    earthMat.needsUpdate = true;

    const cloudsTex = loadSized("earth_clouds_4k.jpg");
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    cloudsTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    cloudsMat.map = cloudsTex;
    cloudsMat.needsUpdate = true;

    const nightTex = loadSized("earth_nightmap_8k.jpg");
    nightTex.colorSpace = THREE.SRGBColorSpace;
    (night.material as THREE.ShaderMaterial).uniforms.uNight.value = nightTex;

    // ---- REAL SATELLITES + REAL SUN/MOON -------------------------------
    // Real LEO satellites from live TLE data (CelesTrak "visual" group) orbit the
    // planet on their actual orbital planes, and the Sun/Moon sit at their real
    // geocentric directions. The satellite clock is sped up so the orbits are
    // visible during the short cinematic, but the positions stay on the real TLE
    // tracks.
    const realNowBase = new Date();
    const startTime = performance.now();
    const SAT_TIME_MULT = 150; // 1 real second = 2.5 sim minutes (LEO orbit ~90min)

    // ECI/TEME frame: +z = north celestial pole. The scene frame has +y = north
    // (matching raDecDir below), so swap y/z when converting to scene coordinates.
    const toSceneDir = (x: number, y: number, z: number) => new THREE.Vector3(x, z, y).normalize();

    // Satellite point swarm
    const MAX_SATS = 40;
    const satPositions = new Float32Array(MAX_SATS * 3);
    const satGeo = new THREE.BufferGeometry();
    satGeo.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
    const satMat = new THREE.PointsMaterial({
      color: 0xfff2cc,
      size: 3.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const satellitePoints = new THREE.Points(satGeo, satMat);
    satellitePoints.renderOrder = 4;
    scene.add(satellitePoints);

    const realSunDir = new THREE.Vector3(0.35, 0.4, 0.85).normalize();
    const realMoonDir = new THREE.Vector3(0.4, -0.2, 0.9).normalize();
    let realSunOk = false;
    const updateSunMoonDirs = () => {
      try {
        const t = new Date();
        const sv = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const mv = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        realSunDir.copy(toSceneDir(sv.x, sv.y, sv.z));
        realMoonDir.copy(toSceneDir(mv.x, mv.y, mv.z));
        realSunOk = true;
      } catch {
        realSunOk = false;
      }
    };
    updateSunMoonDirs();
    const sunMoonTimer = window.setInterval(updateSunMoonDirs, 60000);

    // Soft radial glow texture for the Sun and Moon halos
    const makeGlowTex = (inner: string, outer: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      if (g) {
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, inner);
        grad.addColorStop(1, outer);
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Sun: real granulation map (Solar System Scope 8k, CC BY 4.0) on a bright core
    // + a large additive glow sprite, placed at the real direction. The additive
    // blend lets the texture's dark voids stay transparent against the stars.
    const sunTex = loadSized("sun_8k.jpg");
    sunTex.colorSpace = THREE.SRGBColorSpace;
    sunTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(16, 48, 48),
      new THREE.MeshBasicMaterial({
        map: sunTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      })
    );
    sunCore.renderOrder = 5;
    scene.add(sunCore);
    const sunGlowTex = makeGlowTex("rgba(255,244,200,0.9)", "rgba(255,214,120,0)");
    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunGlowTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      })
    );
    sunGlow.scale.set(220, 220, 1);
    sunGlow.renderOrder = 4;
    scene.add(sunGlow);

    // Moon: real surface map (Solar System Scope 8k, CC BY 4.0) lit by the same
    // sun light as Earth, so its terminator matches the real phase. A faint halo
    // sprite sits at the real direction too.
    const moonTex = loadSized("moon_8k.jpg");
    moonTex.colorSpace = THREE.SRGBColorSpace;
    moonTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(9, 48, 48),
      new THREE.MeshPhongMaterial({
        map: moonTex,
        color: 0xffffff,
        specular: 0x222222,
        shininess: 3,
        transparent: true,
        opacity: 0
      })
    );
    moonMesh.rotation.x = -0.06; // match the near-side face towards Earth (tidal lock)
    moonMesh.renderOrder = 5;
    scene.add(moonMesh);
    const moonGlowTex = makeGlowTex("rgba(210,215,230,0.5)", "rgba(200,210,230,0)");
    const moonGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: moonGlowTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      })
    );
    moonGlow.scale.set(70, 70, 1);
    moonGlow.renderOrder = 4;
    scene.add(moonGlow);

    const updateSatellites = () => {
      const sats = cachedSatellites;
      if (!sats || sats.length === 0) {
        satMat.opacity = 0;
        return;
      }
      const simNow = new Date(realNowBase.getTime() + (performance.now() - startTime) * SAT_TIME_MULT);
      let n = 0;
      for (let i = 0; i < sats.length && n < MAX_SATS; i++) {
        try {
          const pv = satellite.propagate(sats[i].satrec, simNow);
          if (!pv.position || typeof pv.position === "boolean") continue;
          const pos = pv.position;
          const rKm = Math.hypot(pos.x, pos.y, pos.z);
          const altKm = rKm - 6371;
          if (altKm < 250 || altKm > 4000) continue;
          const dir = toSceneDir(pos.x, pos.y, pos.z);
          const sceneR = EARTH_R * (1.07 + (altKm / 4000) * 0.55);
          satPositions[n * 3] = EARTH_POS.x + dir.x * sceneR;
          satPositions[n * 3 + 1] = EARTH_POS.y + dir.y * sceneR;
          satPositions[n * 3 + 2] = EARTH_POS.z + dir.z * sceneR;
          n++;
        } catch {
          // skip invalid TLE
        }
      }
      for (let i = n * 3; i < MAX_SATS * 3; i++) satPositions[i] = 0;
      satGeo.attributes.position.needsUpdate = true;
    };
    updateSatellites();
    const satTimer = window.setInterval(updateSatellites, 250);

    // Camera keyframes. Choreography: the flight starts in pure deep space with
    // NO Earth anywhere on screen. The TRUSTNODE logo assembles in front of the
    // stars while the camera hovers. Then the camera smoothly turns and glides
    // toward Earth (no warp, no streaks): Earth fades in far ahead, we approach it
    // and settle with the planet's top limb in the lower half of the frame (big,
    // crisp planet, constant distance from the top edge).
    const kf: Keyframe[] = [
      { p: 0, pos: new THREE.Vector3(0, 6, 120), look: new THREE.Vector3(0, 26, 0) },
      { p: phases.underEnd * 0.5, pos: new THREE.Vector3(0, 5, 70), look: new THREE.Vector3(0, 24, 0) },
      { p: phases.underEnd, pos: new THREE.Vector3(0, 4, 20), look: new THREE.Vector3(0, 14, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.5), pos: new THREE.Vector3(0, 3, -12), look: new THREE.Vector3(0, 6, 0) },
      { p: phases.orbitEnd, pos: new THREE.Vector3(0, 2, -38), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.orbitEnd, phases.throughEnd, 0.5), pos: new THREE.Vector3(0, 2, -40), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.throughEnd, pos: new THREE.Vector3(0, 2, -34), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.throughEnd, phases.assemblyEnd, 0.5), pos: new THREE.Vector3(0, 2, -26), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.assemblyEnd, pos: new THREE.Vector3(0, 2, -22), look: new THREE.Vector3(0, 0, 0) },
      // Smooth, gentle turn toward Earth: no warp, no streaks — the logo screen
      // stays pure space, then we ease forward as Earth fades in far ahead.
      { p: phases.turnEnd, pos: new THREE.Vector3(0, -2, 160), look: new THREE.Vector3(0, -30, 320) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.35), pos: new THREE.Vector3(0, -4, 300), look: new THREE.Vector3(0, -45, 800) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.6), pos: new THREE.Vector3(0, -8, 400), look: new THREE.Vector3(0, -35, 800) },
      // The final framing is reached and then held absolutely steady (identical
      // keyframes from approachEnd to 1) so the planet sits at the same distance
      // from the top edge of the screen while the intro cards settle over it.
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.8), pos: new THREE.Vector3(0, -12, 440), look: new THREE.Vector3(0, 40, 800) },
      { p: phases.approachEnd, pos: new THREE.Vector3(0, -12, 440), look: new THREE.Vector3(0, 180, 800) },
      { p: 1, pos: new THREE.Vector3(0, -12, 440), look: new THREE.Vector3(0, 180, 800) }
    ];

    // Camera path interpolation. The keyframes live at non-uniform progress values
    // (the flight lingers during the logo assembly, then sweeps into the turn), so a
    // plain Catmull-Rom normalised per segment is only C1 in its own local parameter:
    // across segment seams the speed in progress space jumps (and identical duplicate
    // keyframes would even stall the camera to zero). Instead we build a Hermite
    // spline whose tangents use the real progress spacing of the keyframes, which is
    // C1-continuous in progress itself — the camera glides at a continuous speed with
    // no stops and no jerks at keyframe boundaries.
    const currentLook = new THREE.Vector3(0, 0, 0);
    const tmp = new THREE.Vector3();
    const hermite = (out: THREE.Vector3, k0: Keyframe, k1: Keyframe, k2: Keyframe, k3: Keyframe, t: number, field: "pos" | "look") => {
      const t2 = t * t;
      const t3 = t2 * t;
      const h = Math.max(1e-5, k2.p - k1.p);
      for (let x = 0; x < 3; x++) {
        const P1 = k1[field].getComponent(x);
        const P2 = k2[field].getComponent(x);
        const m1 = (k2[field].getComponent(x) - k0[field].getComponent(x)) / (k2.p - k0.p);
        const m2 = (k3[field].getComponent(x) - k1[field].getComponent(x)) / (k3.p - k1.p);
        out.setComponent(x, (2 * t3 - 3 * t2 + 1) * P1 + (t3 - 2 * t2 + t) * h * m1 + (-2 * t3 + 3 * t2) * P2 + (t3 - t2) * h * m2);
      }
      return out;
    };
    const sampleCamera = (p: number) => {
      const n = kf.length;
      // Find the segment kf[i] -> kf[i+1] that p falls into.
      let i = 0;
      while (i < n - 2 && p > kf[i + 1].p) i++;
      const t = Math.min(1, Math.max(0, (p - kf[i].p) / Math.max(1e-5, kf[i + 1].p - kf[i].p)));
      const k0 = kf[Math.max(0, i - 1)];
      const k1 = kf[i];
      const k2 = kf[Math.min(i + 1, n - 1)];
      const k3 = kf[Math.min(i + 2, n - 1)];
      hermite(camera.position, k0, k1, k2, k3, t, "pos");
      hermite(tmp, k0, k1, k2, k3, t, "look");
      currentLook.copy(tmp);
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
      const p = progressRef ? progressRef.current : progressRefInternal.current;

      // Earth rotates strictly in sync with real time (GMST) + a gentle extra spin
      // so the motion is clearly visible even on a short flight.
      const gmst = gmstRadians(new Date());
      earth.rotation.y = -gmst + 3.2 + p * 2.2;
      night.rotation.y = earth.rotation.y;
      clouds.rotation.y = earth.rotation.y + 0.003 * (time / 1000);

      // Earth fades in only AFTER the logo screen is fully gone (cLogoOp ends at
      // 0.78 in App.tsx) so the planet is nowhere on screen while the logo shows.
      // It appears small ahead and we glide toward it, no warp. The day texture is
      // 8K and loads asynchronously — if it isn't ready yet the planet would fade
      // in as an empty black sphere, so the fade waits for it (and still shows a
      // plain lit sphere if the download ever fails, via the error fallback).
      const earthIn = dayReady.value ? smooth(0.82, 0.9, p) : 0;
      earthMat.opacity = earthIn;
      cloudsMat.opacity = earthIn * 0.7;
      (night.material as THREE.ShaderMaterial).uniforms.uOpacity.value = earthIn;

      // Sun/Moon orbit around the planet's position at their real directions,
      // fading in with the Earth so they never spoil the logo screen.
      if (realSunOk) {
        sun.position.copy(realSunDir).multiplyScalar(2000);
        sun.target.position.copy(EARTH_POS);
        (night.material as THREE.ShaderMaterial).uniforms.uSunDir.value.copy(realSunDir);
      }
      const sunDist = EARTH_R * 6.2;
      const moonDist = EARTH_R * 2.6;
      sunCore.position.copy(realSunDir).multiplyScalar(sunDist).add(EARTH_POS);
      sunGlow.position.copy(realSunDir).multiplyScalar(sunDist + 4).add(EARTH_POS);
      moonMesh.position.copy(realMoonDir).multiplyScalar(moonDist).add(EARTH_POS);
      moonGlow.position.copy(realMoonDir).multiplyScalar(moonDist + 2).add(EARTH_POS);
      // The Sun rotates slowly on its real ~25-day axis; the Moon stays tidally
      // locked to Earth. Both fade in with the Earth.
      sunCore.rotation.y = 0.02 * (time / 1000);
      sunCore.rotation.z = 0.006 * (time / 1000);
      sunCore.material.opacity = earthIn;
      (sunGlow.material as THREE.SpriteMaterial).opacity = earthIn * 0.8;
      moonMesh.material.opacity = earthIn * 0.85;
      (moonGlow.material as THREE.SpriteMaterial).opacity = earthIn * 0.5;
      satMat.opacity = earthIn * 0.9;

      // Sky reveal: the realistic backdrop is always on. The bright real stars are
      // grouped by sky region so the flight moves from the northern sky into the
      // mid/southern constellations; everything thins as Earth fills the view.
      const skyFade = (inA: number, inB: number, outA: number, outB: number) =>
        smooth(inA, inB, p) * (1 - smooth(outA, outB, p));
      (background.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 1;
      (starsNorth.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 1 - smooth(0.68, 0.9, p);
      (starsMid.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.42, 0.55, 0.85, 0.95);
      (starsSouth.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.55, 0.68, 0.87, 0.97);

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
      const onMobile = w < 768;
      const onTablet = w >= 768 && w < 1024;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, onMobile ? 1.25 : onTablet ? 1.5 : 2));
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
      clearInterval(sunMoonTimer);
      clearInterval(satTimer);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry?.dispose();
          const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      const skyPoints: THREE.Points[] = [background, starsNorth, starsMid, starsSouth];
      skyPoints.forEach((pt) => {
        pt.geometry.dispose();
        (pt.material as THREE.Material).dispose();
      });
      satGeo.dispose();
      satMat.dispose();
      sunGlowTex.dispose();
      moonGlowTex.dispose();
      sunTex.dispose();
      moonTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phases]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
