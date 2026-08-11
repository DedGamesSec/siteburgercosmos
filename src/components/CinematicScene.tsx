import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as satellite from "satellite.js";
import * as Astronomy from "astronomy-engine";
import { REAL_STARS } from "../data/realStarCatalog";
import { cachedSatellites, useSkyActivation } from "../hooks/useSkyActivation";
import { isWebGLAvailable, type CinematicPhases } from "./cinematicShared";

export { isWebGLAvailable };
export type { CinematicPhases };

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
    // Nearest stars fly past with real parallax; distant ones sit on the far shell.
    // The flight path runs z 120->440, so stars closer than ~400 would sit right on
    // the camera rail and whoosh past full-screen (gl_PointSize caps at 24px) at
    // the title/надпись beat — reading as a burst of stars that appears then
    // vanishes. The floor shell is kept out past the deepest camera point so every
    // star passes at a distance where the fly-by reads as gentle parallax.
    const distLy = star.distLy || 400;
    const radius = lerp(520, 900, clamp01(distLy / 1200));
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
        gl_PointSize = max(1.8, min(14.0, aSize * (560.0 / max(1.0, -mv.z))));
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
        // Single smoothstep (was core + halo): one fewer texture-free blend per
        // point - the real-star layer is on screen the whole flight, so this
        // shaves a measurable fraction off every frame's fragment work.
        float a = smoothstep(0.5, 0.08, d) * vAlpha * uOpacity;
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
  // Neutral 1x1 placeholder so the uNight sampler is never null while the real
  // night map is still loading (three.js errors on null sampler uniforms).
  const neutralTexture = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1
  );
  neutralTexture.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uNight: { value: neutralTexture },
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
// Real solar-system proportions with Earth's radius as the reference unit:
// Moon ~0.27 Earth radii in radius at ~60 Earth radii distance; the Sun (~109
// Earth radii across, ~23,000 Earth radii away) lies far beyond the camera far
// plane, so it renders as a glowing light source at its real direction instead
// of a scaled mesh.
const MOON_R = EARTH_R * 0.2727;
const MOON_DIST = EARTH_R * 60.3;

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

    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    // No MSAA on any tier: the corridor is mostly additive-blended overlays
    // (stars, satellites, the night-lights shell, clouds) redrawing the same
    // pixels several times, so MSAA multiplies that overdraw for zero visible
    // gain on a moving starfield. The 1.5x pixel-ratio buffer (below) already
    // supersamples, so dropping MSAA removes a constant bandwidth/resolve tax
    // on every frame of the flight.
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance"
    });
    // Adaptive rendering: phones get 1x pixel ratio and no MSAA (the biggest
    // mobile fill-rate win), tablets a middle tier. Desktops are capped at 1.5x
    // (not 2x): the shot is mostly additive-blended overlays (stars, satellites,
    // the night-lights shell, clouds) that redraw the same pixels several times,
    // so every DPR point costs that many overdraws — 1.5x keeps it crisp while
    // cutting the fragment workload ~44% vs 2x, which is what keeps the corridor
    // at 60fps instead of spilling frames late in the approach.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x04050a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Far plane is raised so the real-scale Moon (~10,250 scene units out) stays
    // in view. Depth precision near the Earth is unaffected (it is set by the near
    // plane, which stays at 0.1).
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 12000);
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
    // Counts are trimmed a bit so the additive point overdraw stays cheap.
    const bgCount = isMobile ? 900 : isTablet ? 2000 : 2600;
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
    // Segment counts are trimmed (desktop 96, tablet 80, mobile 48): the planet —
    // and the two shells over it — are tiny on screen for most of the flight, so
    // the higher poly counts bought nothing visible while costing vertex work on
    // the weak GPUs where the intro was stuttering.
    const earthSeg = isMobile ? 48 : isTablet ? 80 : 96;
    const earthGeo = new THREE.SphereGeometry(EARTH_R, earthSeg, earthSeg);
    // Neutral 1x1 texture shared as a stand-in for every map slot until the real
    // images land. Wiring these in at boot means the shaders compile ONCE (during
    // the renderer.compile() warm-up below) with their full uniform set, and the
    // onAdopt swap only uploads the real pixels — no mid-flight recompile when
    // the late maps show up at ~6.4-7.6s (a recompile was another main-thread
    // stall exactly where the Earth phase begins).
    const neutralTex = new THREE.DataTexture(
      new Uint8Array([128, 128, 255, 255]),
      1,
      1
    );
    neutralTex.needsUpdate = true;
    const neutralSpec = new THREE.DataTexture(
      new Uint8Array([128, 128, 128, 255]),
      1,
      1
    );
    neutralSpec.needsUpdate = true;
    const neutralMap = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1,
      1
    );
    neutralMap.needsUpdate = true;
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x335577,
      shininess: 22,
      transparent: true,
      opacity: 0,
      normalMap: isMobile ? null : neutralTex,
      normalScale: isMobile ? new THREE.Vector2(1, 1) : new THREE.Vector2(0.9, 0.9),
      specularMap: isMobile ? null : neutralSpec
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
      shininess: 0,
      map: neutralMap
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    clouds.position.copy(EARTH_POS);
    clouds.rotation.z = (23.44 * Math.PI) / 180;
    clouds.renderOrder = 2;
    scene.add(clouds);

    const baseUrl = import.meta.env.BASE_URL;

    // The satellite maps are 8K (8192x4096). Uploading a full 8K RGBA map to the
    // GPU is ~134MB of synchronous main-thread work, and all five maps land in
    // the first seconds of the flight — each upload stalled a frame. Cap desktop
    // at 2048 and phones at 1024 (the planet fills well under 1000px on screen,
    // so 8K was ~8x oversampled — no visible difference, ~16x smaller uploads),
    // and decode each map directly at that size in a worker. Also clamp to the
    // GPU maxTextureSize (some integrated GPUs cap at 4096 and would silently
    // render the planet black).
    const maxTexSize = renderer.capabilities.maxTextureSize || 4096;
    // Textures are pre-scaled at build time (WebP): the daymap ships at 2560
    // and the support maps at 1536 — exactly the caps below — so the runtime
    // decode is a straight pass-through with NO downscale work on the client.
    // Phones still decode at 1024 (a downscale, but from a 2560/1536 WebP that
    // is ~20x lighter than the old 8K JPGs, so it's far cheaper than before).
    const mobileTexCap = isMobile ? 1024 : 2560;
    // Support maps (normal/spec/night/clouds) are subtle per-pixel modifiers on
    // a planet that fills under 1000px on screen — 1536 keeps each synchronous
    // upload+mipmap ~1.5x smaller than the daymap with no visible loss, and the
    // source files are now exactly 1536 so nothing gets thrown away.
    const overlayCap = 1536;
    const dayReady = { value: false };
    const cloudsReady = { value: false };
    const nightReady = { value: false };

    // Decode (and resize) textures off the main thread. The old path used an
    // <img> + TextureLoader: each 8K JPEG was decoded synchronously on the main
    // thread the moment it arrived, and all five maps land in the first seconds
    // of the intro — those stalls read as freezes at the very start of the
    // flight. createImageBitmap decodes + resizes on worker threads instead, and
    // only the final GPU upload touches the main thread (spread over frames).
    // The blob is also decoded ONCE, straight to the capped size, instead of a
    // full 8K decode followed by a second resize pass (two worker decodes per
    // map = double the memory and double the decode time at scene boot).
    //
    // Fetch and decode are split: every map's FETCH starts at mount, in
    // parallel (async I/O, no main-thread cost), while DECODE runs one JPG at a
    // time through a serial queue whose spacing eats up the (now longer) intro.
    // The daymap decodes first, so its continents are up before
    // the Earth fade-in at p~0.82 on the auto-play.
const loadSized = (path: string, onReady?: () => void, onAdopt?: (tex: THREE.Texture) => void, late = false, capOverride = 0): THREE.Texture => {
      const tex = new THREE.Texture();
      const url = `${baseUrl}textures/${path}`;
      // Overlay/support maps (normal/spec/night/clouds) are capped tighter than the
      // daymap: they are subtle per-pixel modifiers on a planet that fills under
      // 1000px on screen, and each stays a synchronous texImage2D + full mipmap
      // chain on the main thread the moment it lands. Shrinking them cuts that
      // upload cost ~2.5x, which is precisely the three post-logo stalls before
      // the Earth fade.
      const cap = Math.min(capOverride > 0 ? capOverride : mobileTexCap, mobileTexCap, maxTexSize);
      // FETCH is kicked immediately, in parallel, for every map: it is pure
      // async I/O so it costs nothing on the main thread, and the bytes are on
      // disk long before the serial decode queue reaches this map — the daymap
      // gets the full intro of headroom while the smaller maps download behind
      // it. DECODE + GPU upload stay in the serial queue so only one JPG is ever
      // being decoded at once (overlapping decodes were the CPU spike that read
      // as a stall).
      let blob: Blob | null = null;
      let fetchDone = false;
      let fetchedOk = false;
      if (typeof fetch === "function") {
        fetch(url)
          .then((r) => {
            if (!r.ok) throw new Error(String(r.status));
            return r.blob();
          })
          .then((b) => {
            blob = b;
            fetchedOk = true;
          })
          .catch(() => {
            fetchedOk = false;
          })
          .then(() => {
            fetchDone = true;
          });
      } else {
        fetchDone = true;
        fetchedOk = false;
      }

      const adopt = (img: ImageBitmap | HTMLImageElement) => {
        tex.image = img;
        tex.needsUpdate = true;
        onAdopt?.(tex); // materials are wired HERE, once the image is real
        onReady?.();
      };

      // Serial decode step, driven one-at-a-time by the decode queue below.
      const decode = (): Promise<void> =>
        new Promise((resolve) => {
          const decodeFallback = () => {
            const img = new Image();
            img.onload = () => {
              adopt(img);
              resolve();
            };
            img.onerror = () => {
              onReady?.(); // a dead map still settles quietly, no chain stall
              resolve();
            };
            img.src = url;
          };
          if (fetchDone && fetchedOk && blob && typeof createImageBitmap === "function") {
            createImageBitmap(blob, {
              resizeWidth: Math.max(128, cap),
              resizeQuality: "medium"
            })
              .then((img) => {
                adopt(img);
                resolve();
              })
              .catch(decodeFallback);
          } else if (fetchDone) {
            decodeFallback();
          } else {
            // Bytes not here yet — hold the queue until this map's fetch lands.
            window.setTimeout(() => {
              decode()
                .then(resolve)
                .catch(resolve);
            }, 100);
          }
        });

      // Every texture registers in one of two serial decode queues (see the
      // schedule below). Only the daymap decodes in the opening seconds; the
      // polish maps (clouds/night/normal/spec) + the moon are wired in onAdopt
      // once their image is real — handing three.js an empty texture would
      // compile the shader against garbage (a zero normal map blacks the planet).
      // `late` maps start after the logo assembly so their GPU upload + mipmap
      // generation never hit the first beats of the flight.
      if (late) lateDecodes.push(decode);
      else decodes.push(decode);
      return tex;
    };
    const decodes: Array<() => Promise<void>> = [];
    const lateDecodes: Array<() => Promise<void>> = [];

    const dayTex = loadSized("earth_daymap.webp", () => {
      dayReady.value = true;
    });
    dayTex.colorSpace = THREE.SRGBColorSpace;
    dayTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    earthMat.map = dayTex;

    // Moon rides in the early chain too: its 2k map is small (fast decode, low
    // upload cost) and the Moon starts fading in at p~0.79, right after the logo.
    // The moon is only visible from p~0.79, so its map rides the late (post-logo)
    // decode queue — no reason to spend a GPU upload+mipmap in the opening beats.
    const moonTex = loadSized("moon.webp", undefined, undefined, true, 2048);
    moonTex.colorSpace = THREE.SRGBColorSpace;
    moonTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    // Normal/specular maps are a per-pixel cost in the phong shader; phones skip
    // them entirely (the daymap already carries the shading). All of these ride
    // the same late serial chain so they're real before Earth fades in at p~0.82.
    // The material already holds neutral 1x1 placeholders in every slot (wired at
    // boot so the shaders compiled with the full uniform set during the
    // renderer.compile() warm-up), so onAdopt only swaps in the decoded pixels —
    // no material.needsUpdate, no mid-flight recompile by the freezes.
    if (!isMobile) {
      const normalTex = loadSized(
        "earth_normal.webp",
        undefined,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          earthMat.normalMap = tex;
          earthMat.normalScale.set(0.9, 0.9);
        },
        true,
        overlayCap
      );

      const specTex = loadSized(
        "earth_specular.webp",
        undefined,
        (tex) => {
          earthMat.specularMap = tex;
        },
        true,
        overlayCap
      );
    }

    const cloudsTex = loadSized(
      "earth_clouds.webp",
      () => {
        cloudsReady.value = true;
      },
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        cloudsMat.map = tex;
      },
      true,
      overlayCap
    );

    const nightTex = loadSized(
      "earth_nightmap.webp",
      () => {
        nightReady.value = true;
      },
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        (night.material as THREE.ShaderMaterial).uniforms.uNight.value = tex;
      },
      true,
      overlayCap
    );

    // ---- REAL SATELLITES + REAL SUN/MOON -------------------------------
    // The FULL active payload catalog from live TLE data (CelesTrak "active"
    // group, ~12k+ real satellites) orbits the planet on its true TLE tracks,
    // and the Sun/Moon sit at their real geocentric directions. The satellite
    // clock is sped up so the orbits are visible during the short cinematic,
    // but the positions stay on the real TLE tracks.
    const realNowBase = new Date();
    const startTime = performance.now();
    const SAT_TIME_MULT = 150; // 1 real second = 2.5 sim minutes (LEO orbit ~90min)

    // ECI/TEME frame: +z = north celestial pole. The scene frame has +y = north
    // (matching raDecDir below), so swap y/z when converting to scene coordinates.
    const toSceneDir = (x: number, y: number, z: number) => new THREE.Vector3(x, z, y).normalize();

    // Satellite point swarm. SGP4 propagation for the whole catalog (deep-space
    // GEO/MEO sats are ~200x more expensive than LEO ones) runs in a Web Worker
    // so it never blocks the main thread; a small main-thread fallback covers the
    // moment before the worker is ready (and any worker failure).
    const MAX_SATS = 20000;
    const ALT_MIN = 200; // above the atmosphere
    const ALT_MAX = 42000; // include GEO + graveyard orbits
    const satPositions = new Float32Array(MAX_SATS * 3);
    const satGeo = new THREE.BufferGeometry();
    satGeo.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
    satGeo.setDrawRange(0, 0);
    const satMat = new THREE.PointsMaterial({
      color: 0xfff2cc,
      size: 1.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const satellitePoints = new THREE.Points(satGeo, satMat);
    satellitePoints.renderOrder = 4;
    scene.add(satellitePoints);

    const defaultSunDir = new THREE.Vector3(0.35, 0.4, 0.85).normalize();
    const realSunDir = defaultSunDir.clone();
    // The visual sun is blended part-way toward a fixed, frame-friendly direction:
    // the real direction can sit ~45° off the flight axis and fall outside the
    // viewport on 16:9 screens, which made it read as a flat blob stuck to the
    // frame edge. Lighting keeps the fully real direction so the day/night
    // terminator on Earth stays astronomically correct.
    const visualSunDir = defaultSunDir.clone();
    const realMoonDir = new THREE.Vector3(0.4, -0.2, 0.9).normalize();
    let realSunOk = false;
    let sunMoonRequested = false;
    // Main-thread fallback for the real Sun/Moon directions. Only ever used when
    // the satellite worker is unavailable: the astronomy solve blocks the main
    // thread for tens of ms, so it must not run during the opening frames — it is
    // deferred until the flight is already approaching Earth (p~0.75), and even
    // then only once.
    const updateSunMoonDirs = () => {
      if (sunMoonRequested) return;
      sunMoonRequested = true;
      try {
        const t = new Date();
        const sv = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const mv = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        realSunDir.copy(toSceneDir(sv.x, sv.y, sv.z));
        visualSunDir.copy(realSunDir).lerp(defaultSunDir, 0.4).normalize();
        realMoonDir.copy(toSceneDir(mv.x, mv.y, mv.z));
        realSunOk = true;
      } catch {
        realSunOk = false;
      }
    };

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

    // Sun: a real sun reads as a blinding glowing object, not a solid textured
    // ball. Its true radius and distance are far beyond the camera range, so it
    // is rendered as a bright core plus a soft halo along the real direction — a
    // glowing "thing" in the sky, ~8,000 units out (well beyond the star shell).
    const sunCoreTex = makeGlowTex("rgba(255,255,252,1)", "rgba(255,244,210,0)");
    const sunCoreGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunCoreTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      })
    );
    sunCoreGlow.scale.set(120, 120, 1);
    sunCoreGlow.renderOrder = 5;
    scene.add(sunCoreGlow);
    const sunHaloTex = makeGlowTex("rgba(255,246,210,0.5)", "rgba(255,210,110,0)");
    const sunHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunHaloTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      })
    );
    sunHalo.scale.set(280, 280, 1);
    sunHalo.renderOrder = 4;
    scene.add(sunHalo);

    // Moon: real surface map (Solar System Scope 2k, CC BY 4.0), true size
    // (0.27 Earth radii) at its real ~60 Earth-radii distance, lit by the same
    // sun light as Earth so its terminator matches the real phase. A faint halo
    // sprite makes the small distant disc readable.
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_R, 40, 40),
      new THREE.MeshPhongMaterial({
        map: moonTex,
        color: 0xffffff,
        specular: 0x222222,
        shininess: 3,
        // A faint self-glow keeps the unlit side of the tiny disc visible
        // against black space, like real astrophotography.
        emissive: 0x1a2230,
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
    moonGlow.scale.set(200, 200, 1);
    moonGlow.renderOrder = 4;
    scene.add(moonGlow);

    const commitSatCount = (n: number) => {
      satGeo.setDrawRange(0, n);
      satGeo.attributes.position.needsUpdate = true;
    };

    let satWorker: Worker | null = null;
    let satWorkerReady = false;
    let satWorkerBusy = false;
    let workerInitSent = false;

    const makeSatWorker = () => {
      try {
        const w = new Worker(new URL("../workers/satelliteWorker.ts", import.meta.url), { type: "module" });
        w.onmessage = (e: MessageEvent) => {
          const d = e.data;
          if (d && d.type === "ready") {
            satWorkerReady = true;
          } else if (d && d.type === "positions") {
            satWorkerBusy = false;
            const arr = d.positions as Float32Array;
            const count = Math.min(d.count as number, MAX_SATS);
            satPositions.set(arr.subarray(0, count * 3));
            commitSatCount(count);
          } else if (d && d.type === "sunmoon") {
            realSunDir.fromArray(d.sun);
            visualSunDir.copy(realSunDir).lerp(defaultSunDir, 0.4).normalize();
            realMoonDir.fromArray(d.moon);
            realSunOk = true;
          }
        };
        w.onerror = () => {
          w.terminate();
          if (satWorker === w) satWorker = null;
          satWorkerReady = false;
          satWorkerBusy = false;
          workerInitSent = false;
        };
        return w;
      } catch {
        return null;
      }
    };

    // Main-thread fallback (runs only until the worker is ready, or if it fails):
    // a rolling window over the catalog keeps each update's cost bounded. The
    // budget is kept small — SGP4 is run synchronously here, and a large window
    // over the ~12k catalog (incl. expensive GEO/MEO sats) stalls the flight.
    // The worker is now seeded as soon as the TLEs land (see useSkyActivation),
    // so on a fast connection this never runs at all during the 8-10s window;
    // when the download is slow it still bounds each main-thread tick.
    const FALLBACK_BUDGET = 100;
    let fallbackIndex = 0;
    const updateSatellitesFallback = () => {
      const sats = cachedSatellites;
      if (!sats || sats.length === 0) {
        commitSatCount(0);
        return;
      }
      const simNow = new Date(realNowBase.getTime() + (performance.now() - startTime) * SAT_TIME_MULT);
      let n = 0;
      const total = sats.length;
      for (let k = 0; k < FALLBACK_BUDGET && n < MAX_SATS; k++) {
        const s = sats[(fallbackIndex + k) % total];
        try {
          const pv = satellite.propagate(s.satrec, simNow);
          if (!pv.position || typeof pv.position === "boolean") continue;
          const pos = pv.position;
          const rKm = Math.hypot(pos.x, pos.y, pos.z);
          const altKm = rKm - 6371;
          if (altKm < ALT_MIN || altKm > ALT_MAX) continue;
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
      fallbackIndex = (fallbackIndex + FALLBACK_BUDGET) % total;
      commitSatCount(n);
    };

    // On phones the satellite swarm is decimated (~1/4 of the catalog) and the
    // updates run at a third of the cadence — the shell reads the same, but the
    // phone CPU/GPU do a fraction of the work.
    const SAT_DECIMATE = isMobile ? 4 : 1;
    const SAT_INTERVAL_MS = isMobile ? 800 : 250;

    // Fetches all run in parallel from mount (async I/O, near-zero main-thread
    // cost — see loadSized above). DECODE + GPU upload are strictly serialized
    // and entirely front-loaded: the logo assembly (p~0.44-0.50 = 4.4-5.0s) is a
    // busy DOM/SVG window and the Earth fades at p~0.82 (8.2s), so ALL six maps
    // are decoded and uploaded well before the logo ever starts — the opening
    // beats are dark space, so the early cadence reads as free loading time
    // rather than visible stalls.
    const TEX_DECODE_DELAY_MS = 200; // daymap, right after boot/parse/compile
    // Moon starts right after, then one support map every ~0.5s — the last
    // upload lands ~3.5s, comfortably before the logo assembly begins at 4.4s.
    const TEX_LATE_DELAY_MS = 600; // first non-daymap slot
    const TEX_DECODE_GAP_MS = 500; // settle frames between decodes/uploads
    const runDecodeQueue = (list: Array<() => Promise<void>>, startDelay: number) => {
      if (list.length === 0) return;
      const step = (i: number) => {
        if (i >= list.length) return;
        list[i]()
          .catch(() => undefined)
          .then(() => {
            window.setTimeout(() => step(i + 1), TEX_DECODE_GAP_MS);
          });
      };
      window.setTimeout(() => step(0), startDelay);
    };
    runDecodeQueue(decodes, TEX_DECODE_DELAY_MS);
    runDecodeQueue(lateDecodes, TEX_LATE_DELAY_MS);

    const updateSatellites = () => {
      // Never propagate while the corridor is out of view: the worker would
      // otherwise keep SGP4-running the whole catalog (and structured-cloning
      // the positions back) every 250ms long after the intro has scrolled away.
      if (!activeRef.current) return;
      // Satellites fade in with the Earth at p~0.82; skip all propagation until
      // the flight approaches, so the logo/title phases don't burn CPU.
      const p = progressRef ? progressRef.current : progressRefInternal.current;
      // Ask the worker for the real Sun/Moon directions once, near the Earth
      // approach, so the astronomy solve stays off the main thread. Its reply
      // lands long before Sun/Moon become visible (fade starts at p~0.86).
      if (!sunMoonRequested && p >= 0.72) {
        if (satWorker && satWorkerReady) {
          sunMoonRequested = true;
          const reqNow = new Date(realNowBase.getTime() + (performance.now() - startTime) * SAT_TIME_MULT);
          satWorker.postMessage({ type: "sunmoon", time: reqNow.getTime() });
        } else {
          updateSunMoonDirs(); // worker: none / not ready — run the one-shot fallback
        }
      }
      // The whole texture chain is started by the early timer above and runs well
      // before the Earth-fade / satellite-activation / sun-moon-fade / card
      // beats (p 0.8-1), so no decode, GPU upload or shader re-compile can land
      // on the visible part of the flight.
      if (p < 0.8) return;
      if (satWorker && satWorkerReady) {
        if (satWorkerBusy) return;
        satWorkerBusy = true;
        const simNow = new Date(realNowBase.getTime() + (performance.now() - startTime) * SAT_TIME_MULT);
        satWorker.postMessage({ type: "tick", simTime: simNow.getTime() });
      } else {
        updateSatellitesFallback();
      }
    };

    // Seed the worker with the catalog as soon as it has loaded; until then the
    // main-thread fallback keeps satellites on screen. Init is sent EXACTLY once:
    // re-posting the ~12k-element catalog every 300ms until "ready" was a repeated
    // multi-ms structured-clone stall on the main thread during the first seconds
    // of the flight. The worker replies "ready" when its parse finishes; a
    // per-frame fallback keeps satellites drawn until then. Retry only happens
    // after a worker error (which resets workerInitSent).
    const initWorker = () => {
      if (workerInitSent || !satWorker) return;
      // Deferred past the opening decode window: posting ~12k TLE strings is a
      // multi-ms encode, and the worker's satrec build hammers a CPU core - both
      // used to land in the pre-logo beats. The catalog arrives around ~1.5-4s
      // (fetch starts at 1.2s, see useSkyActivation); starting at p 0.3 keeps
      // the encode clear of the daymap upload at ~1-2s while still giving the
      // worker several seconds to parse the satrecs off-thread, so it is ready
      // long before satellites fade in at p~0.82 (8.2s) and the main-thread
      // SGP4 fallback never has to run in the 8-10s window. The payload is a
      // single UTF-8 blob transfered zero-copy (instead of ~12k nested string
      // arrays, whose structured clone allocates tens of thousands of objects
      // on the main thread and gels GC exactly at the Earth approach).
      const p = progressRef ? progressRef.current : progressRefInternal.current;
      if (p < 0.3) return;
      const sats = cachedSatellites;
      if (!sats || sats.length === 0) return;
      workerInitSent = true;
      const sb: string[] = [];
      for (let i = 0; i < sats.length; i += SAT_DECIMATE) {
        const s = sats[i];
        sb.push(s.line1, s.line2); // line pairs, alternating per satellite
      }
      const bytes = new TextEncoder().encode(sb.join("\n"));
      satWorker.postMessage(
        {
          type: "init",
          tleBytes: bytes.buffer,
          earthPos: [EARTH_POS.x, EARTH_POS.y, EARTH_POS.z],
          earthR: EARTH_R,
          altMin: ALT_MIN,
          altMax: ALT_MAX
        },
        [bytes.buffer]
      );
    };

    satWorker = makeSatWorker();
    initWorker();
    updateSatellites();
    const satTimer = window.setInterval(updateSatellites, SAT_INTERVAL_MS);
    // Polls only for the worker to become ready so the init can be sent the moment
    // the catalog arrives; initWorker itself guards against duplicate sends.
    const satInitTimer = window.setInterval(() => {
      if (satWorkerReady || !satWorker) {
        clearInterval(satInitTimer);
        return;
      }
      initWorker();
    }, 300);

    // Camera keyframes. Choreography: ONE single straight push-in. The flight
    // starts in deep space with NO Earth on screen (Earth fades in far ahead at
    // p≈0.82), and the camera flies forward along a fixed axis while the look
    // target drifts along its own straight line toward the planet's top limb.
    // Every key (p from 0 up to approachEnd) lies exactly on that straight line —
    // pos descends linearly y:6→-12 while z:120→440, look rises y:26→180 while
    // z:200→800 — so the Hermite spline reproduces the linear motion exactly:
    // constant velocity, no overshoot, no flip, no turn. The camera never
    // reverses direction (the old path dived to z=-38 then had to swing all the
    // way back to z=440, which read as a cartwheel).
    const kf: Keyframe[] = [
      { p: 0, pos: new THREE.Vector3(0, 6, 120), look: new THREE.Vector3(0, 26, 200) },
      { p: phases.underEnd, pos: new THREE.Vector3(0, 3.6, 162), look: new THREE.Vector3(0, 46, 278) },
      { p: phases.orbitEnd, pos: new THREE.Vector3(0, 0.1, 224), look: new THREE.Vector3(0, 76, 396) },
      { p: phases.throughEnd, pos: new THREE.Vector3(0, -2.8, 276), look: new THREE.Vector3(0, 101, 494) },
      { p: phases.assemblyEnd, pos: new THREE.Vector3(0, -6.1, 336), look: new THREE.Vector3(0, 130, 604) },
      { p: phases.turnEnd, pos: new THREE.Vector3(0, -8.9, 384), look: new THREE.Vector3(0, 153, 696) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.5), pos: new THREE.Vector3(0, -10.4, 412), look: new THREE.Vector3(0, 167, 748) },
      // The final framing is reached and then held absolutely steady (identical
      // keyframes from approachEnd to 1) so the planet sits at the same distance
      // from the top edge of the screen while the intro cards settle over it.
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
    // Adaptive resolution: the corridor must stay smooth on ANY machine, so the
    // render loop watches its own average frame time and, when it drifts past
    // ~50fps, steps the pixel ratio down (1.5 -> 1.25 -> 1.0 -> 0.75), reallocating
    // the canvas buffers once per step. Low-end laptops / software WebGL / battery
    // saver all get a guaranteed frame budget instead of a wall of dropped frames;
    // the change is invisible because the whole scene is point/sticker-based.
    let curPr = pixelRatio;
    let resWindowStart = performance.now();
    let resWindowFrames = 0;
    let lastResChange = 0;
    // Reused per-frame Date: gmstRadians only reads getTime(), so a single
    // preallocated instance avoids ~60 small allocations per second of flight.
    const nowDate = new Date();
    // Tracks whether the corridor has ever become active. It starts false and
    // flips true a tick after mount (App's computeCinematic runs after render),
    // so the loop must NOT self-stop during that initial inactive window or the
    // intro would blank for up to the activeWatch poll delay. Once active has
    // been seen, an inactive scroll can halt the loop on the next frame.
    let hasBeenActive = false;

    const render = (time: number) => {
      if (!running) return;
      raf = requestAnimationFrame(render);
      const dt = Math.min(0.05, (time - prev) / 1000);
      prev = time;
      const p = progressRef ? progressRef.current : progressRefInternal.current;

      // The corridor can be scrolled past mid-frame: cancel the loop on the very
      // next frame instead of waiting for the 400ms activeWatch poll below, so
      // no extra frames are wasted behind the opaque landing content.
      if (hasBeenActive && !activeRef.current) {
        running = false;
        return;
      }
      if (activeRef.current) hasBeenActive = true;

      // Earth rotates strictly in sync with real time (GMST) + a gentle extra spin
      // so the motion is clearly visible even on a short flight.
      nowDate.setTime(Date.now());
      const gmst = gmstRadians(nowDate);
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
      // The planet is OFF-SCREEN / fully transparent for most of the flight —
      // toggle `visible` so three.js drops these entirely from the render list
      // (no draw call, no fragment shader over the alpha-0 sphere) until they
      // actually fade in. This removes the biggest constant GPU cost through
      // the title/logo phase.
      const eVis = earthIn > 0.001;
      earth.visible = eVis;
      clouds.visible = eVis;
      night.visible = eVis;
      satellitePoints.visible = eVis;
      sunCoreGlow.visible = eVis;
      sunHalo.visible = eVis;

      // clouds/night add overlays that only exist once their texture is loaded;
      // keep them at 0 until then so the planet never renders as a washed-out
      // white cloud shell or a black night layer.
      cloudsMat.opacity = cloudsReady.value ? earthIn * 0.7 : 0;
      (night.material as THREE.ShaderMaterial).uniforms.uOpacity.value = nightReady.value ? earthIn : 0;

      // Sun/Moon sit at their real geocentric directions and fade in with the
      // Earth so they never spoil the logo screen. The Sun is a glowing light
      // source far out beyond the star shell; the Moon is a true-scale small
      // sphere ~60 Earth radii away, reading as a small disc with a halo.
      if (realSunOk) {
        sun.position.copy(realSunDir).multiplyScalar(2000);
        sun.target.position.copy(EARTH_POS);
        (night.material as THREE.ShaderMaterial).uniforms.uSunDir.value.copy(realSunDir);
      }
      const SUN_RENDER_DIST = 8000;
      sunCoreGlow.position.copy(visualSunDir).multiplyScalar(SUN_RENDER_DIST).add(EARTH_POS);
      sunHalo.position.copy(visualSunDir).multiplyScalar(SUN_RENDER_DIST + 30).add(EARTH_POS);
      moonMesh.position.copy(realMoonDir).multiplyScalar(MOON_DIST).add(EARTH_POS);
      moonGlow.position.copy(realMoonDir).multiplyScalar(MOON_DIST + MOON_R).add(EARTH_POS);
      // A gentle shimmer makes the Sun feel like a living glow.
      const sunPulse = 0.85 + 0.15 * Math.sin(time / 320);
      (sunCoreGlow.material as THREE.SpriteMaterial).opacity = earthIn * sunPulse;
      (sunHalo.material as THREE.SpriteMaterial).opacity = earthIn * 0.5;
      // The Moon fades in slightly ahead of the Earth so it is clearly visible
      // alongside the planet while we close in (also culled off-screen before).
      const moonIn = smooth(0.79, 0.86, p);
      const moonVis = moonIn > 0.001;
      moonMesh.visible = moonVis;
      moonGlow.visible = moonVis;
      moonMesh.material.opacity = moonIn;
      (moonGlow.material as THREE.SpriteMaterial).opacity = moonIn * 0.8;
      satMat.opacity = earthIn * 0.8;

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

      // Cinematic life: a gentle lateral sway with a matching banking roll and a
      // soft vertical bob layered on top of the strictly-forward push-in. The
      // base path never reverses (no flip), but the camera reads as alive and
      // flying instead of riding a static rail. It ramps in once the logo clears
      // the frame and settles back to zero before the final held framing.
      const dyn = smooth(0.1, 0.24, p) * (1 - smooth(0.86, 0.94, p));
      if (dyn > 0) {
        const phase = p * Math.PI * 2 * 1.5;
        const lateralVel = Math.cos(phase);
        camera.position.x += Math.sin(phase) * 18 * dyn;
        camera.position.y += Math.sin(phase * 1.35) * 6 * dyn;
        camera.lookAt(currentLook);
        // Bank into the sway (roll ∝ lateral velocity), ~4° peak.
        camera.rotateZ(lateralVel * 0.07 * dyn);
      }

      renderer.render(scene, camera);

      // Adaptive resolution check: average the frame time over the last ~1s;
      // if it's past ~50fps, step the pixel ratio down (max once per ~1.6s so
      // the buffer realloc hitch doesn't itself stutter the flight).
      resWindowFrames++;
      if (performance.now() - resWindowStart > 1000 && resWindowFrames >= 30) {
        const avgMs = (performance.now() - resWindowStart) / resWindowFrames;
        resWindowStart = performance.now();
        resWindowFrames = 0;
        if (avgMs > 19 && curPr > 0.75 && performance.now() - lastResChange > 1600) {
          curPr = Math.max(0.75, curPr - 0.25);
          lastResChange = performance.now();
          renderer.setPixelRatio(curPr);
          renderer.setSize(window.innerWidth, window.innerHeight);
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        }
      }
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

    // Pre-compile every shader program up front. Earth/clouds/night/satellites/
    // sun-moon all start `visible=false` (culled until they fade in at p~0.79),
    // so their programs would otherwise be compiled synchronously on the very
    // frame they first appear — a multi-ms main-thread stall exactly where the
    // user sees the Earth fade-in stutter. compile() renders the scene once into
    // a 1px buffer, forcing each material's program to be built now (on the
    // already load-bound boot frames) instead of mid-flight. Stars/background
    // are already visible and compile anyway; we flip the hidden ones on around
    // it so their programs get built too, then restore every visibility.
    const visSnapshot: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!obj.visible) {
        visSnapshot.push(obj);
        obj.visible = true;
      }
    });
    renderer.compile(scene, camera);
    visSnapshot.forEach((obj) => {
      obj.visible = false;
    });

    // Start the loop unconditionally. `cinematicActive` starts false and only
    // flips true a tick later (after App's computeCinematic), so waiting for it
    // here left a visible ~400ms black/static stall at the very start of the
    // flight. The activeWatch poll below still stops the loop when the corridor
    // is scrolled past, so starting eagerly costs nothing in the long run.
    start();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const onMobile = w < 768;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, onMobile ? 1 : 1.5));
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
      clearInterval(satTimer);
      clearInterval(satInitTimer);
      if (satWorker) {
        satWorker.terminate();
        satWorker = null;
      }
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
      sunCoreTex.dispose();
      sunHaloTex.dispose();
      moonGlowTex.dispose();
      moonTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phases]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
