import { useEffect, useRef } from "react";
import * as THREE from "three";
import { REAL_STARS } from "../data/realStarCatalog";

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
        gl_PointSize = min(30.0, aSize * (620.0 / max(1.0, -mv.z)));
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
        float core = smoothstep(0.12, 0.0, d);
        float halo = smoothstep(0.5, 0.1, d);
        float a = (core + halo * 0.45) * vAlpha * uOpacity;
        if (a < 0.02) discard;
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
        gl_PointSize = min(5.0, aSize * (420.0 / max(1.0, -mv.z)));
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
        if (a < 0.015) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });
  return new THREE.Points(geo, mat);
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

    // Real sky. One dense, realistic backdrop (faint stars, Milky Way band, color
    // temperature) is always on; the bright catalog stars layer on top with real
    // parallax so the flight flies past actual stars. No constellation lines.
    const background = buildBackgroundSky(5200, 1400);
    scene.add(background);
    const starsNorth = buildStarLayer(SKY_GROUP_NORTH);
    scene.add(starsNorth);
    const starsMid = buildStarLayer(SKY_GROUP_MID);
    scene.add(starsMid);
    const starsSouth = buildStarLayer(SKY_GROUP_SOUTH);
    scene.add(starsSouth);

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
    const dayTex = loadTex("earth.jpg");
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
    // sky (camera tilted up into the northern constellations) -> we fly INTO the
    // stars (constellation lines fall away) -> new constellations open as the logo
    // assembles, with a brief hover -> then a turn toward Earth and an approach
    // that ends on a large, crisp planet.
    const kf: Keyframe[] = [
      { p: 0, pos: new THREE.Vector3(0, 6, 120), look: new THREE.Vector3(0, 26, 0) },
      { p: phases.underEnd * 0.5, pos: new THREE.Vector3(0, 5, 70), look: new THREE.Vector3(0, 24, 0) },
      { p: phases.underEnd, pos: new THREE.Vector3(0, 4, 20), look: new THREE.Vector3(0, 14, 0) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.4), pos: new THREE.Vector3(9, 3, -14), look: new THREE.Vector3(0, -2, 8) },
      { p: lerp(phases.underEnd, phases.orbitEnd, 0.75), pos: new THREE.Vector3(0, 2, -38), look: new THREE.Vector3(0, -4, 6) },
      { p: phases.orbitEnd, pos: new THREE.Vector3(-8, 2, -14), look: new THREE.Vector3(0, 0, 4) },
      { p: phases.throughEnd, pos: new THREE.Vector3(0, 3, 10), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.throughEnd, phases.assemblyEnd, 0.5), pos: new THREE.Vector3(0, 3, 0), look: new THREE.Vector3(0, 0, 0) },
      { p: phases.assemblyEnd, pos: new THREE.Vector3(0, 3, -6), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.assemblyEnd, phases.turnEnd, 0.45), pos: new THREE.Vector3(0, 3, -6), look: new THREE.Vector3(0, 0, 0) },
      { p: lerp(phases.assemblyEnd, phases.turnEnd, 0.85), pos: new THREE.Vector3(0, 3, -6), look: new THREE.Vector3(0, -15, 120) },
      { p: phases.turnEnd, pos: new THREE.Vector3(0, -2, 40), look: new THREE.Vector3(0, -45, 800) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.35), pos: new THREE.Vector3(0, -4, 180), look: new THREE.Vector3(0, -45, 800) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.6), pos: new THREE.Vector3(0, -2, 300), look: new THREE.Vector3(0, -45, 800) },
      { p: lerp(phases.turnEnd, phases.approachEnd, 0.82), pos: new THREE.Vector3(0, -1, 370), look: new THREE.Vector3(0, -45, 800) },
      { p: phases.approachEnd, pos: new THREE.Vector3(0, 0, 430), look: new THREE.Vector3(0, -45, 800) },
      { p: 1, pos: new THREE.Vector3(0, 0, 430), look: new THREE.Vector3(0, -45, 800) }
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

      // Sky reveal: the realistic backdrop is always on. The bright real stars are
      // grouped by sky region so the flight moves from the northern sky into the
      // mid/southern constellations; everything thins as Earth fills the view.
      const skyFade = (inA: number, inB: number, outA: number, outB: number) =>
        smooth(inA, inB, p) * (1 - smooth(outA, outB, p));
      (background.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 1;
      (starsNorth.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 1 - smooth(0.6, 0.85, p);
      (starsMid.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.42, 0.55, 0.85, 0.95);
      (starsSouth.material as THREE.ShaderMaterial).uniforms.uOpacity.value = skyFade(0.55, 0.68, 0.87, 0.97);

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
      const skyPoints: THREE.Points[] = [background, starsNorth, starsMid, starsSouth];
      skyPoints.forEach((pt) => {
        pt.geometry.dispose();
        (pt.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phases]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
