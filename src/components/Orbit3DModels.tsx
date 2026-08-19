import { useEffect, useRef, type MutableRefObject } from "react";
import type { PlanetData } from "./ExplorePagesSection";

/* ---- WebGL planet-model layer: real GLB models parked on the blue orbit
   rings in place of the flat 2D discs.

   The parent owns all geometry: it computes each planet's ring radius from
   `radiusPct * ORBIT_SCALE * orbitHalf` and its angle from the resolved
   heliocentric longitude, then writes the resulting CSS-pixel centre into
   poseRef. This canvas only ever reads that pose and renders — so the 3D
   body and the (invisible once ready) DOM disc can never disagree.

   Camera: PerspectiveCamera fov 40 with z0 = h/(2·tan(fov/2)) places the
   z=0 plane exactly 1:1 with container pixels (1 world unit == 1 CSS px at
   orbit depth). Poses are centre-relative CSS px (y down); the world flips
   y on the way in (+y up). With the camera above the plane, a body set at
   (x, -y, 0) projects onto the same pixel the disc occupies. No perspective
   stretch is applied — the old `orbitFovComp` overshot the ring by 5-10%
   radially and read as "flying planets"; the raw pose lands on the ring
   (verified analytically and by isolated render, all 7 bodies on-ring).

   Models are STATIC: no axial self-spin, no orbital drift (the client asked
   to keep just the 3D models). Hover only scales the hovered body 1.05 and
   dims the rest, mirroring the 2D disc feedback.

   Input stays on the DOM: this canvas is pointer-events-none; the parent's
   buttons keep hover/click/keyboard. If WebGL or a model fails, that planet
   simply keeps its flat 2D disc. ---- */

type PageRef = { id: string; labelKey: string };

export type Orbit3DModelProps = {
  planets: Array<{ page: PageRef; data: PlanetData }>;
  width: number;
  height: number;
  activeId: string | null;
  /** Live centre-relative pixel positions (CSS axes), written by the parent
      from the same orbit math that positions the DOM discs. */
  poseRef: MutableRefObject<Record<string, { x: number; y: number }>>;
  inViewRef: MutableRefObject<boolean>;
  /** Called once with the ids whose models finished loading and are drawn. */
  onReadyChange: (ids: string[]) => void;
  /** Called when the whole WebGL boot fails — the parent keeps 2D discs. */
  onWebGLFailed: () => void;
};

/* The combined FyorDev "solar system REAL SCALE 2K" model — one GLB whose
   nodes are named per body (`Saturn_5` + `SaturnRing_14`, ...). */
const SOLAR_SYSTEM_GLB = "models/solar_system_real_scale_2k_textures.glb";

/* Node-name prefix per page used to find that planet inside the combined
   model (case-insensitive; `Saturn` also captures `SaturnRing_14`, so the
   model's own ring travels with the body). */
const MODEL_NODE_PREFIX: Record<string, string> = {
  download: "Mercury",
  comparison: "Venus",
  roadmap: "Mars",
  tech: "Jupiter",
  about: "Saturn",
  news: "Uranus",
  "how-it-works": "Neptune",
};

const SUN_FOV = 40;

export default function Orbit3DModels(props: Orbit3DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep every prop on a ref so the single boot effect never restarts from
  // parent re-renders (only the frame loop reads the live values).
  const planetsRef = useRef(props.planets);
  planetsRef.current = props.planets;
  const widthRef = useRef(props.width);
  widthRef.current = props.width;
  const heightRef = useRef(props.height);
  heightRef.current = props.height;
  const activeIdRef = useRef<string | null>(props.activeId);
  activeIdRef.current = props.activeId;
  const poseRef = props.poseRef;
  const inViewRef = props.inViewRef;
  const onReadyRef = useRef(props.onReadyChange);
  onReadyRef.current = props.onReadyChange;
  const onFailedRef = useRef(props.onWebGLFailed);
  onFailedRef.current = props.onWebGLFailed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;
    let onContextLost: ((e: Event) => void) | null = null;
    const disposables: Array<{ dispose: () => void }> = [];

    type Rec = {
      pageId: string;
      data: PlanetData;
      axis: import("three").Group;
      body: import("three").Group;
      baseScale: number;
      dimmed?: boolean;
    };
    let records: Rec[] = [];

    const boot = async () => {
      const log = (msg: string) => console.warn("[orbit3d]", msg);
      const THREE = await import("three");
      if (cancelled) return;
      const w = Math.max(1, Math.round(widthRef.current));
      const h = Math.max(1, Math.round(heightRef.current));
      scene = new THREE.Scene();
      scene.background = null;
      // Top-down camera whose z=0 plane maps container pixels 1:1 (z0 derived
      // from the vertical half; poses already hold CSS-pixel ring radii).
      camera = new THREE.PerspectiveCamera(SUN_FOV, w / h, 100, 8000);
      camera.position.z = h / (2 * Math.tan((SUN_FOV * Math.PI) / 360));
      camera.updateProjectionMatrix();

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      if (!renderer.getContext() || typeof renderer.getContext() === null) throw new Error("WebGL2 context unavailable");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      // Deep-space PMREM environment so the GLB's PBR materials read as
      // "lit" instead of flat grey, without a plastic studio sheen.
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envCanvas = document.createElement("canvas");
        envCanvas.width = 1024;
        envCanvas.height = 512;
        const ectx = envCanvas.getContext("2d")!;
        const grad = ectx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, "#060814");
        grad.addColorStop(0.5, "#0c1020");
        grad.addColorStop(1, "#050610");
        ectx.fillStyle = grad;
        ectx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 90; i++) {
          ectx.fillStyle = `rgba(255,255,255,${(0.25 + Math.random() * 0.7).toFixed(2)})`;
          ectx.beginPath();
          ectx.arc(Math.random() * 1024, Math.random() * 512, 0.4 + Math.random() * 1.8, 0, Math.PI * 2);
          ectx.fill();
        }
        const envTex = new THREE.CanvasTexture(envCanvas);
        envTex.colorSpace = THREE.SRGBColorSpace;
        const envScene = new THREE.Scene();
        const envGeo = new THREE.SphereGeometry(50, 32, 32);
        const envMat = new THREE.MeshBasicMaterial({ map: envTex, side: THREE.BackSide });
        envScene.add(new THREE.Mesh(envGeo, envMat));
        scene.environment = pmrem.fromScene(envScene, 0.04).texture;
        pmrem.dispose();
        envGeo.dispose();
        envMat.dispose();
        envTex.dispose();
      } catch {
        /* environment is optional — the lights alone still give terminators */
      }

      if (onContextLost) canvas.removeEventListener("webglcontextlost", onContextLost, false);
      // If the GPU drops the context, fall back to the flat 2D discs instead
      // of leaving an empty black canvas.
      onContextLost = (e: Event) => {
        e.preventDefault();
        if (!cancelled) onFailedRef.current();
      };
      canvas.addEventListener("webglcontextlost", onContextLost, false);

      // Soft, near-frontal lighting: light comes mostly FROM the viewer (the
      // same direction as the camera), so the lit face stays facing us and no
      // day/night terminator sweeps across a body. A faint warm point light at
      // the Sun's centre only hints depth; ambient keeps the far side visible.
      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      const sunLight = new THREE.PointLight(0xfff0d6, 0.5, 0, 0);
      const frontKey = new THREE.DirectionalLight(0xffffff, 0.85);
      frontKey.position.set(0, 0, 1); // straight out of the camera plane
      scene.add(ambient, sunLight, frontKey);

      // ---- Load the combined model and pull each planet subtree out by
      // node-name prefix. Each subtree is normalised so its bounding box
      // matches the planet's `sizePx` (Saturn's ring included) — the same
      // footprint the 2D layout reserves on the orbit. ----
      const modelByPage = new Map<string, import("three").Group>();
      const normaliseModel = (root: import("three").Object3D, sizePx: number) => {
        const holder = new THREE.Group();
        holder.add(root);
        holder.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const s = sizePx / maxDim;
        const c = box.getCenter(new THREE.Vector3());
        holder.scale.setScalar(s);
        holder.position.set(-c.x * s, -c.y * s, -c.z * s);
        disposables.push({
          dispose: () => {
            holder.traverse((o) => {
              const m = o as import("three").Mesh;
              if (!m.isMesh) return;
              m.geometry?.dispose();
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              for (const mm of mats) {
                const withMap = mm as import("three").Material & { map?: import("three").Texture };
                if (withMap.map) withMap.map.dispose();
                mm.dispose();
              }
            });
          },
        });
        return holder;
      };

      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const gltf = await new Promise<{ scene: import("three").Group }>((res, rej) => {
          new GLTFLoader().load(
            `${import.meta.env.BASE_URL}${SOLAR_SYSTEM_GLB}`,
            (g) => res(g),
            () => undefined,
            (err) => rej(err)
          );
        });
        if (cancelled) return;
        for (const { page, data } of planetsRef.current) {
          const prefix = MODEL_NODE_PREFIX[page.id];
          if (!prefix) continue;
          const matches: import("three").Object3D[] = [];
          gltf.scene.traverse((o) => {
            const nm = o.name.toLowerCase();
            if (nm && nm.startsWith(prefix.toLowerCase())) matches.push(o);
          });
          if (matches.length === 0) continue;
          const group = new THREE.Group();
          for (const m of matches) group.add(m);
          modelByPage.set(page.id, normaliseModel(group, data.sizePx));
        }
      } catch (err) {
        log(`GLB load failed: ${String(err).slice(0, 120)}`);
        /* model failed to load — planets keep their 2D discs */
      }

      // ---- One recorded transform node per planet. The orbit position is
      // written every frame from the parent's poseRef, so model and DOM hit
      // zone never disagree. Models stand upright and never move once parked.
      const readyIds: string[] = [];
      for (const { page, data } of planetsRef.current) {
        const body = modelByPage.get(page.id);
        if (!body) continue;
        const axis = new THREE.Group();
        axis.add(body);
        scene.add(axis);
        records.push({
          pageId: page.id,
          data,
          axis,
          body,
          baseScale: body.scale.x,
        });
        readyIds.push(page.id);
      }
      if (readyIds.length > 0 && !cancelled) {
        onReadyRef.current(readyIds);
        console.debug("[orbit3d]", `ready ${readyIds.length} models`);
      } else if (!cancelled) {
        log("no models matched in GLB — keeping 2D discs");
      }

      renderer.compile(scene, camera);

      let lastW = -1;
      const frame = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(frame);
        const wCur = Math.max(1, Math.round(widthRef.current));
        const hCur = Math.max(1, Math.round(heightRef.current));
        if (renderer && camera && lastW !== wCur) {
          lastW = wCur;
          renderer.setSize(wCur, hCur, false);
          camera.aspect = wCur / hCur;
          // z0 from the VERTICAL half (h/2) so a world unit at z=0 projects
          // exactly to one CSS pixel. The parent derives every orbit radius
          // from the same axis (radiusPx = radiusPct*ORBIT_SCALE*min(w,h)/2),
          // so pose values ARE ring radii in CSS px and map 1:1 here.
          camera.position.z = hCur / (2 * Math.tan((SUN_FOV * Math.PI) / 360));
          camera.updateProjectionMatrix();
        }
        const hovered = activeIdRef.current;
        for (const rec of records) {
          const pose = poseRef.current[rec.pageId];
          // Park the model at the raw DOM orbit pixel — pose x/y are
          // centre-relative CSS axes; the 3D world +y points up, CSS y points
          // down, hence the sign flip. No perspective stretch: with the camera
          // above, world == CSS pixel exactly on z=0, matching the ring.
          const ox = pose ? pose.x : rec.axis.position.x;
          const oy = pose ? -pose.y : rec.axis.position.y;
          rec.axis.position.set(ox, oy, 0);

          // Static models: the body is parked on its ring and does NOT rotate
          // around its own axis (client asked to keep just the 3D models).
          const isHovered = rec.pageId === hovered;
          const dim = hovered !== null && !isHovered;
          const s = rec.baseScale * (isHovered ? 1.05 : 1);
          if (rec.body.scale.x !== s) rec.body.scale.setScalar(s);

          if (rec.dimmed !== dim) {
            rec.dimmed = dim;
            rec.body.traverse((o) => {
              const node = o as import("three").Mesh;
              if (!node.isMesh) return;
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              for (const mm of mats) {
                mm.transparent = true;
                mm.opacity = dim ? 0.35 : 1;
                mm.needsUpdate = true;
              }
            });
          }
        }
        if (inViewRef.current && renderer) renderer.render(scene!, camera!);
      };
      raf = requestAnimationFrame(frame);
    };

    void boot().catch((e) => {
      if (!cancelled) {
        console.error("[orbit3d]", "boot failed:", e);
        onFailedRef.current();
      }
    });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (onContextLost) canvas.removeEventListener("webglcontextlost", onContextLost, false);
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
      renderer = null;
      scene = null;
      camera = null;
      records = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[24] pointer-events-none w-full h-full" aria-hidden="true" />;
}