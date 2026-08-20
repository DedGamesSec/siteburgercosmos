import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation, type PageId } from "../navigation/NavigationContext";
import { PAGES_CONFIG } from "../navigation/pages.config";
import { motion, AnimatePresence } from "motion/react";
import type { LanguageCode } from "../i18n/languages";
import { useEcoMode } from "../context/EcoModeContext";
import ScanCard from "./ScanCard";
import * as Astronomy from "astronomy-engine";
import { resolvePlanetCollisions } from "../utils/planetCollisions";
import CosmosScene from "./CosmosScene";

/* ---- Layered living Sun ----
   A shared granulated surface canvas is used both by the WebGL core sphere
   (as a texture) and by the 2D fallback disc (as a background image to the
   rotating granulation layer). Item 10: the surface is now UNIFORMLY bright —
   the old radial gradient that darkened/oranged the edge is gone from this
   texture, because a 2D radial gradient physically rotates with a sphere's
   UV wrap and produced the periodic "yellowing". Limb darkening is instead
   applied by a separate, non-rotating billboard overlay (WebGL) and by the
   static base disc underneath the turning granulation layer (2D). Generated
   once and cached so re-renders never rebuild it. */
let sunSurfaceCache: HTMLCanvasElement | null = null;
function buildSunSurface(): HTMLCanvasElement {
  if (sunSurfaceCache) return sunSurfaceCache;
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  // Flat, uniformly bright base (no baked radial gradient): rotating this
  // texture can never swing a dark/orange phase past the camera — the whole
  // disc is the same warm tone, only the granulation cells below vary.
  ctx.fillStyle = "#FFE9A8";
  ctx.fillRect(0, 0, size, size);
  // Granulation: faint hot/cold cells spread across the disc (kept away from
  // the very bright core so the surface reads as textured without harsh
  // per-frame flicker on the brightest region).
  for (let i = 0; i < 340; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const x = size / 2 + Math.cos(a) * rr * size * 0.42;
    const y = size / 2 + Math.sin(a) * rr * size * 0.42;
    const rad = 1.5 + Math.random() * 5;
    const hot = Math.random() > 0.5;
    ctx.globalAlpha = 0.05 + Math.random() * 0.11;
    ctx.fillStyle = hot ? "#FFF8E0" : "#B45309";
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  sunSurfaceCache = c;
  return c;
}

const HEADER_PAGES = PAGES_CONFIG.filter((p) => p.showInHeader).sort((a, b) => a.order - b.order);

type LangDict = Record<LanguageCode, string>;

/* ---- Real heliocentric position lookup (astronomy-engine) ----
   Each page maps to one planet; its current position on the orbit is its real
   heliocentric ecliptic longitude for the moment the section is shown. */
const BODY_BY_PAGE: Record<string, Astronomy.Body> = {
  "how-it-works": Astronomy.Body.Neptune,
  tech: Astronomy.Body.Jupiter,
  roadmap: Astronomy.Body.Mars,
  about: Astronomy.Body.Saturn,
  comparison: Astronomy.Body.Venus,
  news: Astronomy.Body.Uranus,
  download: Astronomy.Body.Mercury,
};

/** Current heliocentric ecliptic longitude (degrees, 0..360) of a body. */
function helioLongitude(body: Astronomy.Body, date: Date): number {
  try {
    const ecl = Astronomy.Ecliptic(Astronomy.HelioVector(body, date));
    return ((ecl.elon % 360) + 360) % 360;
  } catch {
    return 0;
  }
}

/* ---- Optional Saturn-style ring overlay (SVG), shared by the 2D fallback
   disc and the 3D-mode overlay stack. ---- */
const PlanetRings = ({ color, size, lit = false }: { color: string; size: number; lit?: boolean }) => (
  <>
    <svg
      viewBox="0 0 120 60"
      width={size * 1.7}
      height={size * 0.9}
      fill="none"
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] pointer-events-none ${lit ? "ring-lit" : ""}`}
      style={{ "--ring-glow": color } as React.CSSProperties}
    >
      <ellipse cx="60" cy="30" rx="56" ry="16" stroke={color} strokeWidth="3" opacity="0.95" />
      <ellipse cx="60" cy="30" rx="48" ry="11" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
    <svg
      viewBox="0 0 120 60"
      width={size * 1.7}
      height={size * 0.9}
      fill="none"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] pointer-events-none"
    >
      <path d="M 16 37 Q 60 58 104 37" stroke={color} strokeWidth="2.5" opacity="0.75" fill="none" />
    </svg>
  </>
);

/* ---- Planet disc: real NASA-based surface texture in a shaded circle,
   with an optional SVG ring overlay (Saturn) and an optional slow texture
   spin. Kept tiny (256px maps). Used for the small thumbnails in cards and
   as the planets themselves on the desktop solar system (the planet IS the
   trigger button, so visual and hit area can never drift apart). ---- */
const PlanetDisc = ({
  planet,
  size,
  ring = false,
  className = "",
  spin = false,
  lit = false,
}: {
  planet: { color: string; textureUrl: string };
  size: number;
  ring?: boolean;
  className?: string;
  spin?: boolean;
  /** Hover state for the solar-system disc: strengthens the halo and lights
      the ring. Plain thumbnails in cards stay passive (default false). */
  lit?: boolean;
}) => (
  <span
    className={`relative inline-flex items-center justify-center ${className}`}
    style={{ width: size * 1.25, height: size * 1.25 }}
    aria-hidden="true"
  >
    {ring && <PlanetRings color={planet.color} size={size} lit={lit} />}
    {/* atmospheric halo — a faint wash of the planet's own colour behind the
        disc; brightens on hover (reference request). Sized ~1.45x the disc. */}
    <span
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none ${lit ? "planet-halo-on" : "planet-halo"}`}
      style={{
        width: size * 1.45,
        height: size * 1.45,
        background: `radial-gradient(circle, ${planet.color}55 0%, ${planet.color}1f 45%, ${planet.color}00 70%)`,
      }}
    />
    <span className="relative block rounded-full overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.55)]" style={{ width: size, height: size }}>
      {/* real surface map */}
      <span
        className={`absolute inset-0 ${spin ? "planet-spin" : ""}`}
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}${planet.textureUrl})`,
          // Mars's 2:1 map carries near-white polar caps on its top/bottom
          // rows; with `cover` on the round disc those edges land exactly on
          // the circle's poles and read as a broken texture at thumbnail size.
          // Slightly overscaled height crops those rows out (kept for Mars
          // only — every other map's poles are dark and look fine).
          backgroundSize: planet.textureUrl.includes("mars") ? "200% 118%" : "cover",
          backgroundPosition: "center",
        }}
      />
      {/* fake-volume shading: lit side + terminator shadow */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </span>
  </span>
);

/* ---- Solar System layout config ----
   Sizes are compressed from real diameters (min ~30px Mercury ... max 62px
   Jupiter). Orbit radii mirror the relative distances, compressed non-linearly
   so everything fits the block. Real positions come from astronomy-engine. */
// Multiplier applied to every orbit so the whole system sits a touch closer
// together and no planet reaches the very edges of the block.
const ORBIT_SCALE = 0.92;
export type PlanetData = {
  name: LangDict;
  fact: LangDict;
  color: string;
  sizePx: number;
  radiusPct: number;
  orbitalPeriodDays: number;
  textureUrl: string;
  /** Higher-resolution surface map (Solar System Scope 2K) used by the 3D
      spheres; the small `textureUrl` stays for the flat 2D discs/card thumbs
      so the fallback never downloads 2K maps for a 40px circle. */
  textureUrlHi?: string;
  /** Real ring map (Solar System Scope) for Saturn; Uranus keeps the
      procedural faint ring (SSS ships no Uranus ring texture). */
  ringTextureUrl?: string;
  /** Cloud layer map drawn over the surface (Venus atmosphere). */
  atmosphereTextureUrl?: string;
  hasRings?: boolean;
};

/* Real diameters relative to Earth: Mercury 0.383 · Venus 0.950 · Mars 0.533
   · Jupiter 11.22 · Saturn 9.46 · Uranus 4.01 · Neptune 3.89. `sizePx` is a
   LOG-compressed curve: the small inner planets used to collapse to 4-9px dots
   where no texture was readable. The curve was raised once (item 10) so
   Mercury stayed at a readable 18px; item 11 re-bases it on Uranus — the NEW
   minimum (78px) is the former size of Uranus, so Mercury itself is now drawn
   that large and every other planet sits above it, preserving the relative
   order (Jupiter largest, at the 164px anchor). */
const DIAMETER_BY_PAGE: Record<string, number> = {
  download: 0.383, // Mercury
  comparison: 0.95, // Venus
  roadmap: 0.533, // Mars
  tech: 11.22, // Jupiter
  about: 9.46, // Saturn
  news: 4.01, // Uranus
  "how-it-works": 3.89, // Neptune
};
function planetSizePx(diameter: number): number {
  const MIN_PX = 78;
  const MAX_PX = 164;
  const minD = 0.383; // Mercury — the smallest body
  const maxD = 11.22; // Jupiter — the largest body
  const t = (Math.log(diameter) - Math.log(minD)) / (Math.log(maxD) - Math.log(minD));
  return Math.round(MIN_PX + (MAX_PX - MIN_PX) * t);
}

const PLANET_DATA: Record<string, PlanetData> = {
  "how-it-works": {
    color: "#3B82F6",
    sizePx: planetSizePx(DIAMETER_BY_PAGE["how-it-works"]),
    radiusPct: 0.9,
    orbitalPeriodDays: 60182,
    textureUrl: "textures/planets/neptune.jpg",
    textureUrlHi: "textures/planets/2k_neptune.jpg",
    name: { ru: "Нептун", en: "Neptune", es: "Neptuno", zh: "海王星", tr: "Neptün", hi: "नेपच्यून", ar: "نبتون", pt: "Netuno", fr: "Neptune", de: "Neptun", ja: "海王星" },
    fact: {
      ru: "Нептун был открыт математически до того, как его увидели – сначала предсказан расчетами, и только потом найден с помощью телескопа. Точно так же, как ML обнаруживает аномалию до того, как ее заметит человек.",
      en: "Neptune was discovered mathematically before it was seen - first predicted by calculations, and only then found through a telescope. Just as ML detects an anomaly before a human notices it.",
      es: "Neptuno fue descubierto matemáticamente antes de ser visto: primero predicho mediante cálculos y sólo luego encontrado a través de un telescopio. Así como ML detecta una anomalía antes de que un humano la note.",
      zh: "海王星在被发现之前就被数学发现了——首先通过计算预测，然后才通过望远镜发现。就像机器学习在人类注意到异常之前就检测到异常一样。",
      tr: "Neptün, görülmeden önce matematiksel olarak keşfedildi; ilk önce hesaplamalarla tahmin edildi ve ancak daha sonra bir teleskop aracılığıyla bulundu. Tıpkı ML'nin bir anormalliği insan fark etmeden önce tespit etmesi gibi.",
      hi: "नेप्च्यून को देखने से पहले गणितीय रूप से खोजा गया था - पहले गणना द्वारा भविष्यवाणी की गई थी, और उसके बाद ही दूरबीन के माध्यम से पाया गया था। जिस प्रकार एमएल किसी विसंगति का पता मानव के ध्यान देने से पहले ही लगा लेता है।",
      ar: "تم اكتشاف نبتون رياضيا قبل رؤيته، حيث تم التنبؤ به لأول مرة من خلال الحسابات، وبعد ذلك فقط تم اكتشافه من خلال التلسكوب. تمامًا كما يكتشف ML الشذوذ قبل أن يلاحظه الإنسان.",
      pt: "Netuno foi descoberto matematicamente antes de ser visto - primeiro previsto por cálculos e só então encontrado através de um telescópio. Assim como o ML detecta uma anomalia antes que um ser humano perceba.",
      fr: "Neptune a été découverte mathématiquement avant d'être vue - d'abord prédite par des calculs, puis découverte ensuite grâce à un télescope. Tout comme le ML détecte une anomalie avant qu'un humain ne la remarque.",
      de: "Neptun wurde mathematisch entdeckt, bevor er gesehen wurde – zunächst durch Berechnungen vorhergesagt und erst dann durch ein Teleskop gefunden. So wie ML eine Anomalie erkennt, bevor ein Mensch sie bemerkt.",
      ja: "海王星は、観測される前に数学的に発見されました。最初は計算によって予測され、その後、望遠鏡を通して初めて発見されました。ちょうど、ML が人間が気づく前に異常を検出するのと同じです。",
    },
  },
  tech: {
    color: "#D97706",
    sizePx: planetSizePx(DIAMETER_BY_PAGE.tech),
    radiusPct: 0.64,
    orbitalPeriodDays: 4332.6,
    textureUrl: "textures/planets/jupiter.jpg",
    textureUrlHi: "textures/planets/2k_jupiter.jpg",
    name: { ru: "Юпитер", en: "Jupiter", es: "Júpiter", zh: "木星", tr: "Jüpiter", hi: "बृहस्पति", ar: "كوكب المشتري", pt: "Júpiter", fr: "Jupiter", de: "Jupiter", ja: "木星" },
    fact: {
      ru: "Юпитер — гравитационный щит Солнечной системы: он притягивает и нейтрализует большинство комет и астероидов, точно так же, как купол TrustNode нейтрализует угрозы.",
      en: "Jupiter is the gravitational shield of the Solar System: it attracts and neutralizes most comets and asteroids, just like the TrustNode dome neutralizes threats.",
      es: "Júpiter es el escudo gravitacional del Sistema Solar: atrae y neutraliza la mayoría de los cometas y asteroides, al igual que la cúpula de TrustNode neutraliza las amenazas.",
      zh: "木星是太阳系的引力盾：它吸引并中和大多数彗星和小行星，就像 TrustNode 穹顶中和威胁一样。",
      tr: "Jüpiter, Güneş Sisteminin yerçekimsel kalkanıdır: tıpkı TrustNode kubbesinin tehditleri etkisiz hale getirmesi gibi, çoğu kuyruklu yıldız ve asteroiti çeker ve etkisiz hale getirir.",
      hi: "बृहस्पति सौर मंडल का गुरुत्वाकर्षण कवच है: यह अधिकांश धूमकेतुओं और क्षुद्रग्रहों को आकर्षित और निष्क्रिय कर देता है, ठीक उसी तरह जैसे ट्रस्टनोड गुंबद खतरों को बेअसर करता है।",
      ar: "كوكب المشتري هو درع الجاذبية للنظام الشمسي: فهو يجذب معظم المذنبات والكويكبات ويحيدها، تمامًا كما تعمل قبة TrustNode على تحييد التهديدات.",
      pt: "Júpiter é o escudo gravitacional do Sistema Solar: atrai e neutraliza a maioria dos cometas e asteroides, assim como a cúpula do TrustNode neutraliza as ameaças.",
      fr: "Jupiter est le bouclier gravitationnel du système solaire : il attire et neutralise la plupart des comètes et astéroïdes, tout comme le dôme TrustNode neutralise les menaces.",
      de: "Jupiter ist der Gravitationsschild des Sonnensystems: Er zieht die meisten Kometen und Asteroiden an und neutralisiert sie, genau wie die TrustNode-Kuppel Bedrohungen neutralisiert.",
      ja: "木星は太陽系の重力シールドです。TrustNode ドームが脅威を無力化するのと同じように、木星はほとんどの彗星や小惑星を引き寄せて無力化します。",
    },
  },
  roadmap: {
    color: "#EF4444",
    sizePx: planetSizePx(DIAMETER_BY_PAGE.roadmap),
    radiusPct: 0.45,
    orbitalPeriodDays: 687,
    textureUrl: "textures/planets/mars.jpg",
    textureUrlHi: "textures/planets/2k_mars.jpg",
    name: { ru: "Марс", en: "Mars", es: "Marte", zh: "火星", tr: "Mars", hi: "मंगल ग्रह", ar: "المريخ", pt: "Marte", fr: "Mars", de: "Mars", ja: "火星" },
    fact: {
      ru: "Марс – вечная цель исследователей: от первых пролетов до высадки. Точно так же TrustNode переходит от MVP к полноценной экосистеме.",
      en: "Mars is the eternal goal of explorers: from first flybys to landings. In the same way TrustNode moves from MVP to a full ecosystem.",
      es: "Marte es el eterno objetivo de los exploradores: desde los primeros sobrevuelos hasta los aterrizajes. De la misma manera, TrustNode pasa de MVP a un ecosistema completo.",
      zh: "火星是探险家永恒的目标：从第一次飞越到登陆。同样，TrustNode 从 MVP 转变为完整的生态系统。",
      tr: "Mars, kaşiflerin ebedi hedefidir: ilk uçuşlardan inişlere kadar. Aynı şekilde TrustNode da MVP'den tam bir ekosisteme geçiyor.",
      hi: "मंगल ग्रह खोजकर्ताओं का शाश्वत लक्ष्य है: पहली उड़ान से लेकर लैंडिंग तक। उसी तरह ट्रस्टनोड एमवीपी से पूर्ण पारिस्थितिकी तंत्र की ओर बढ़ता है।",
      ar: "المريخ هو الهدف الأبدي للمستكشفين: من أول تحليق إلى الهبوط. بنفس الطريقة تنتقل TrustNode من MVP إلى نظام بيئي كامل.",
      pt: "Marte é o eterno objetivo dos exploradores: desde os primeiros sobrevôos até os pousos. Da mesma forma, o TrustNode passa de MVP para um ecossistema completo.",
      fr: "Mars est le but éternel des explorateurs : des premiers survols aux atterrissages. De la même manière, TrustNode passe du MVP à un écosystème complet.",
      de: "Der Mars ist das ewige Ziel der Entdecker: vom ersten Vorbeiflug bis zur Landung. Auf die gleiche Weise entwickelt sich TrustNode vom MVP zu einem vollständigen Ökosystem.",
      ja: "火星は、最初の接近から着陸まで、探検家の永遠の目標です。同様に、TrustNode は MVP から完全なエコシステムに移行します。",
    },
  },
  about: {
    color: "#EAB308",
    sizePx: planetSizePx(DIAMETER_BY_PAGE.about),
    radiusPct: 0.74,
    orbitalPeriodDays: 10759.2,
    textureUrl: "textures/planets/saturn.jpg",
    textureUrlHi: "textures/planets/2k_saturn.jpg",
    ringTextureUrl: "textures/planets/2k_saturn_ring_alpha.png",
    hasRings: true,
    name: { ru: "Сатурн", en: "Saturn", es: "Saturno", zh: "土星", tr: "Satürn", hi: "शनि ग्रह", ar: "زحل", pt: "Saturno", fr: "Saturne", de: "Saturn", ja: "土星" },
    fact: {
      ru: "Сатурн — самая узнаваемая планета благодаря своим кольцам. Признание приходит тогда, когда ваш проект невозможно спутать с другими — например, с патентом и медалью TrustNode.",
      en: "Saturn is the most recognizable planet thanks to its rings. Recognition comes when your project cannot be confused with others - like the TrustNode patent and medal.",
      es: "Saturno es el planeta más reconocible gracias a sus anillos. El reconocimiento llega cuando su proyecto no se puede confundir con otros, como la patente y la medalla de TrustNode.",
      zh: "土星因其光环而成为最知名的行星。当您的项目不能与其他项目混淆时（例如 TrustNode 专利和奖章），就会获得认可。",
      tr: "Satürn halkaları sayesinde en tanınabilen gezegendir. Tanınma, projeniz TrustNode patenti ve madalyası gibi başkalarıyla karıştırılamadığında gelir.",
      hi: "शनि अपने छल्लों के कारण सबसे अधिक पहचाना जाने वाला ग्रह है। मान्यता तब मिलती है जब आपके प्रोजेक्ट को दूसरों के साथ भ्रमित नहीं किया जा सकता - जैसे कि ट्रस्टनोड पेटेंट और मेडल।",
      ar: "زحل هو الكوكب الأكثر شهرة بفضل حلقاته. يأتي التقدير عندما لا يمكن الخلط بين مشروعك ومشاريع أخرى - مثل براءة اختراع TrustNode والميدالية.",
      pt: "Saturno é o planeta mais reconhecível graças aos seus anéis. O reconhecimento vem quando o seu projeto não pode ser confundido com outros – como a patente e medalha do TrustNode.",
      fr: "Saturne est la planète la plus reconnaissable grâce à ses anneaux. La reconnaissance vient lorsque votre projet ne peut pas être confondu avec d'autres - comme le brevet et la médaille TrustNode.",
      de: "Saturn ist dank seiner Ringe der am besten erkennbare Planet. Anerkennung erhalten Sie, wenn Ihr Projekt nicht mit anderen verwechselt werden kann – wie zum Beispiel mit dem TrustNode-Patent und der TrustNode-Medaille.",
      ja: "土星は、その輪のおかげで最も認識しやすい惑星です。 TrustNode の特許やメダルなど、あなたのプロジェクトが他のプロジェクトと混同されない場合に評価が得られます。",
    },
  },
  comparison: {
    color: "#FDE68A",
    sizePx: planetSizePx(DIAMETER_BY_PAGE.comparison),
    radiusPct: 0.34,
    orbitalPeriodDays: 224.7,
    textureUrl: "textures/planets/venus.jpg",
    textureUrlHi: "textures/planets/2k_venus_surface.jpg",
    atmosphereTextureUrl: "textures/planets/2k_venus_atmosphere.jpg",
    name: { ru: "Венера", en: "Venus", es: "Venus", zh: "金星", tr: "Venüs", hi: "शुक्र", ar: "الزهرة", pt: "Vênus", fr: "Vénus", de: "Venus", ja: "金星" },
    fact: {
      ru: "Венеру называют близнецом Земли по размерам, но при ближайшем рассмотрении это совершенно другой мир – так выглядит сравнение с конкурентами.",
      en: "Venus is called the twin of Earth by size, but upon closer study it is a completely different world - this is what comparison with competitors looks like.",
      es: "A Venus se le llama gemelo de la Tierra por su tamaño, pero si lo estudiamos más de cerca, es un mundo completamente diferente: así es como se ve la comparación con sus competidores.",
      zh: "金星被称为地球的双胞胎，但经过仔细研究，它是一个完全不同的世界——这就是与竞争对手相比的样子。",
      tr: "Venüs, boyutuna göre Dünya'nın ikizi olarak adlandırılır, ancak daha yakından incelendiğinde tamamen farklı bir dünya ortaya çıkar - rakiplerle karşılaştırma böyle görünür.",
      hi: "आकार में शुक्र को पृथ्वी का जुड़वां कहा जाता है, लेकिन करीब से अध्ययन करने पर यह पूरी तरह से अलग दुनिया है - प्रतिस्पर्धियों के साथ तुलना कुछ ऐसी ही दिखती है।",
      ar: "يُطلق على كوكب الزهرة اسم توأم الأرض من حيث الحجم، ولكن عند الدراسة الدقيقة يكون عالمًا مختلفًا تمامًا - هكذا تبدو المقارنة مع المنافسين.",
      pt: "Vênus é chamado de gêmeo da Terra em tamanho, mas após um estudo mais detalhado é um mundo completamente diferente - é assim que se parece a comparação com os concorrentes.",
      fr: "Vénus est appelée la jumelle de la Terre en termes de taille, mais après une étude plus approfondie, c'est un monde complètement différent - c'est à cela que ressemble la comparaison avec ses concurrents.",
      de: "Venus wird ihrer Größe nach als Zwilling der Erde bezeichnet, doch bei näherer Betrachtung handelt es sich um eine völlig andere Welt – so sieht ein Vergleich mit Konkurrenten aus.",
      ja: "金星はその大きさから地球の双子と呼ばれていますが、詳しく調べるとまったく異なる世界です。これが競合他社との比較です。",
    },
  },
  news: {
    color: "#22D3EE",
    sizePx: planetSizePx(DIAMETER_BY_PAGE.news),
    radiusPct: 0.84,
    orbitalPeriodDays: 30688.5,
    textureUrl: "textures/planets/uranus.jpg",
    textureUrlHi: "textures/planets/2k_uranus.jpg",
    name: { ru: "Уран", en: "Uranus", es: "Urano", zh: "天王星", tr: "Uranüs", hi: "यूरेनस", ar: "أورانوس", pt: "Urano", fr: "Uranus", de: "Uranus", ja: "天王星" },
    fact: {
      ru: "Уран постоянно удивляет астрономов: он вращается, лежа на боку. Будьте первым, кто узнает о новинках TrustNode.",
      en: "Uranus constantly surprises astronomers: it rotates lying on its side. Be the first to learn what is new at TrustNode.",
      es: "Urano sorprende constantemente a los astrónomos: gira tumbado de lado. Sea el primero en conocer las novedades de TrustNode.",
      zh: "天王星不断地让天文学家感到惊讶：它侧着旋转。成为第一个了解 TrustNode 最新动态的人。",
      tr: "Uranüs gökbilimcileri sürekli şaşırtıyor: yan yatarak dönüyor. TrustNode'daki yenilikleri ilk öğrenen siz olun.",
      hi: "यूरेनस लगातार खगोलविदों को आश्चर्यचकित करता है: यह अपनी तरफ झूठ बोलकर घूमता है। TrustNode पर नया क्या है, यह जानने वाले पहले व्यक्ति बनें।",
      ar: "يفاجئ أورانوس علماء الفلك باستمرار: فهو يدور على جانبه. كن أول من يتعلم ما هو الجديد في TrustNode.",
      pt: "Urano surpreende constantemente os astrônomos: ele gira deitado de lado. Seja o primeiro a saber o que há de novo no TrustNode.",
      fr: "Uranus surprend constamment les astronomes : il tourne en étant couché sur le côté. Soyez le premier à découvrir les nouveautés de TrustNode.",
      de: "Uranus überrascht Astronomen immer wieder: Er dreht sich auf der Seite liegend. Erfahren Sie als Erster, was es Neues bei TrustNode gibt.",
      ja: "天王星は常に天文学者を驚かせます。天王星は横向きに寝ながら回転します。 TrustNode の新機能を誰よりも早く学びましょう。",
    },
  },
  download: {
    color: "#9CA3AF",
    sizePx: planetSizePx(DIAMETER_BY_PAGE.download),
    radiusPct: 0.26,
    orbitalPeriodDays: 88,
    textureUrl: "textures/planets/mercury.jpg",
    textureUrlHi: "textures/planets/2k_mercury.jpg",
    name: { ru: "Меркурий", en: "Mercury", es: "Mercurio", zh: "水星", tr: "Merkür", hi: "बुध", ar: "عطارد", pt: "Mercúrio", fr: "Mercure", de: "Merkur", ja: "水星" },
    fact: {
      ru: "Меркурий — самая маленькая и быстрая планета: год на ней длится 88 дней. Быстрое и простое действие — например, установка TrustNode.",
      en: "Mercury is the smallest and fastest planet: a year there lasts 88 days. Fast and easy action - like installing TrustNode.",
      es: "Mercurio es el planeta más pequeño y más rápido: allí un año dura 88 días. Acción rápida y sencilla, como instalar TrustNode.",
      zh: "水星是最小且速度最快的行星：一年有 88 天。快速而简单的操作 - 例如安装 TrustNode。",
      tr: "Merkür en küçük ve en hızlı gezegendir: orada bir yıl 88 gün sürer. TrustNode'u yüklemek gibi hızlı ve kolay işlem.",
      hi: "बुध सबसे छोटा और तेज़ ग्रह है: वहाँ एक वर्ष 88 दिनों का होता है। तेज़ और आसान कार्रवाई - जैसे ट्रस्टनोड स्थापित करना।",
      ar: "عطارد هو أصغر وأسرع كوكب: السنة فيه 88 يومًا. إجراء سريع وسهل - مثل تثبيت TrustNode.",
      pt: "Mercúrio é o menor e mais rápido planeta: um ano lá dura 88 dias. Ação rápida e fácil - como instalar o TrustNode.",
      fr: "Mercure est la planète la plus petite et la plus rapide : une année y dure 88 jours. Action rapide et facile, comme installer TrustNode.",
      de: "Merkur ist der kleinste und schnellste Planet: Ein Jahr dauert dort 88 Tage. Schnelle und einfache Aktion – wie die Installation von TrustNode.",
      ja: "水星は最も小さくて最速の惑星です。水星での 1 年は 88 日です。迅速かつ簡単なアクション - TrustNode のインストールなど。",
    },
  },
};

/* Real axial tilt (°) and compressed sidereal rotation timings per planet are
   owned by CosmosScene now (the 3D rework). The flat 2D discs keep their
   spin-free look — only the layout constants below (orbit radii, angles)
   stay here, because they are the single source of truth for positions. */

const PAGE_DESCRIPTIONS: Record<string, LangDict> = {
  home: {
    ru: "Обзор платформы TrustNode: локальный AI-антифрид, защита конфиденциальности и полный контроль над вашими данными.",
    en: "TrustNode platform overview: local AI anti-fraud, privacy protection, and full control over your data.",
    es: "Descripción general de TrustNode: anti-fraude con IA local, protección de privacidad y control total de sus datos.",
    zh: "TrustNode 平台概览：本地 AI 反欺诈、隐私保护以及对数据的完全掌控。",
    tr: "TrustNode platforma genel bakış: yerel AI dolandırıcılık koruması, gizlilik ve verileriniz üzerinde tam kontrol.",
    hi: "TrustNode प्लेटफ़ॉर्म अवलोकन: स्थानीय AI एंटी-फ्रॉड, गोपनीयता सुरक्षा और आपके डेटा पर पूर्ण नियंत्रण।",
    ar: "نظرة عامة على منصة TrustNode: مكافحة احتيال محلية بالذكاء الاصطناعي، حماية الخصوصية، وتحكم كامل في بياناتك.",
    pt: "Visão geral da plataforma TrustNode: antifraude local com IA, proteção de privacidade e controle total dos seus dados.",
    fr: "Aperçu de TrustNode : anti-fraude IA local, protection de la vie privée et contrôle total de vos données.",
    de: "TrustNode-Plattformüberblick: lokaler KI-Anti-Fraud, Datenschutz und volle Kontrolle über Ihre Daten.",
    ja: "TrustNode プラットフォーム概要：ローカルAI不正防止、プライバシー保護、データの完全な管理。",
  },
  "how-it-works": {
    ru: "Техническая детализация защитного купола PHANTOM 2.0: акустический анализ и ML-классификация rubert-tiny2 работают на устройстве, остальные слои — в разработке (Roadmap).",
    en: "Technical breakdown of the PHANTOM 2.0 security dome: acoustic analysis and rubert-tiny2 ML classification run on-device, while the remaining layers are in development (Roadmap).",
    es: "Desglose técnico del domo de seguridad PHANTOM 2.0: el análisis acústico y la clasificación ML rubert-tiny2 funcionan en el dispositivo, y las capas restantes están en desarrollo (Roadmap).",
    zh: "PHANTOM 2.0 防护穹顶的技术解析：声学分析与 rubert-tiny2 ML 分类在设备端运行，其余层处于开发阶段（Roadmap）。",
    tr: "PHANTOM 2.0 güvenlik kubbesinin teknik analizi: akustik analiz ve rubert-tiny2 ML sınıflandırma cihazda çalışır, kalan katmanlar geliştirme aşamasındadır (Roadmap).",
    hi: "PHANTOM 2.0 सुरक्षा डोम का तकनीकी विवरण: ध्वनिक विश्लेषण और rubert-tiny2 ML वर्गीकरण डिवाइस पर चलते हैं, शेष परतें विकास में हैं (Roadmap)।",
    ar: "تفاصيل تقنية لقبة الحماية PHANTOM 2.0: التحليل الصوتي وتصنيف التعلم الآلي rubert-tiny2 يعملان على الجهاز، بينما الطبقات المتبقية قيد التطوير (Roadmap).",
    pt: "Detalhamento técnico do domo de segurança PHANTOM 2.0: a análise acústica e a classificação ML rubert-tiny2 rodam no dispositivo, e as demais camadas estão em desenvolvimento (Roadmap).",
    fr: "Analyse technique du dôme de sécurité PHANTOM 2.0 : l'analyse acoustique et la classification ML rubert-tiny2 fonctionnent sur l'appareil, tandis que les autres couches sont en cours de développement (Roadmap).",
    de: "Technische Aufschlüsselung der PHANTOM-2.0-Sicherheitskuppel: Akustikanalyse und ML-Klassifikation rubert-tiny2 laufen auf dem Gerät, die übrigen Ebenen befinden sich in Entwicklung (Roadmap).",
    ja: "PHANTOM 2.0 セキュリティドームの技術解説：音響解析と rubert-tiny2 のML分類は端末上で稼働し、その他のレイヤーは開発中（Roadmap）です。",
  },
  tech: {
    ru: "Глубокое погружение в архитектуру безопасности, мобильный AI-движок ruBERT и систему обнаружения мошенничества в реальном времени.",
    en: "Deep dive into the security architecture, mobile AI engine ruBERT, and real-time fraud detection system.",
    es: "Análisis profundo de la arquitectura de seguridad, el motor de IA móvil ruBERT y la detección de fraude en tiempo real.",
    zh: "深入探讨安全架构、移动 AI 引擎 ruBERT 和实时欺诈检测系统。",
    tr: "Güvenlik mimarisine, mobil AI motoru ruBERT'e ve gerçek zamanlı dolandırıcılık tespit sistemine derinlemesine bir bakış.",
    hi: "सुरक्षा आर्किटेक्चर, मोबाइल AI इंजन ruBERT और रीयल-टाइम धोखाधड़ी पहचान प्रणाली की गहन समीक्षा।",
    ar: "تعمق في بنية الأمان ومحرك الذكاء الاصطناعي المحمول ruBERT ونظام كشف الاحتيال في الوقت الفعلي.",
    pt: "Análise profunda da arquitetura de segurança, do mecanismo de IA móvel ruBERT e da detecção de fraudes em tempo real.",
    fr: "Plongée dans l'architecture de sécurité, le moteur IA mobile ruBERT et la détection de fraude en temps réel.",
    de: "Tiefer Einblick in die Sicherheitsarchitektur, die mobile KI-Engine ruBERT und die Echtzeit-Betrugserkennung.",
    ja: "セキュリティアーキテクチャ、モバイルAIエンジンruBERT、リアルタイム詐欺検知システムを深掘り。",
  },
  roadmap: {
    ru: "План развития проекта: от текущей MVP-версии до полноценной экосистемы с публичным аудитом и открытым API.",
    en: "Project development plan: from the current MVP to a full ecosystem with public audit and open API.",
    es: "Plan de desarrollo: desde el MVP actual hasta un ecosistema completo con auditoría pública y API abierta.",
    zh: "项目发展计划：从当前的 MVP 到拥有公共审计和开放 API 的完整生态系统。",
    tr: "Proje geliştirme planı: mevcut MVP'den genel denetimli ve açık API'li tam ekosisteme.",
    hi: "परियोजना विकास योजना: वर्तमान MVP से सार्वजनिक ऑडिट और ओपन API वाले पूर्ण इकोसिस्टम तक।",
    ar: "خطة تطوير المشروع: من النسخة الأولية الحالية إلى نظام بيئي كامل مع تدقيق عام وAPI مفتوح.",
    pt: "Plano de desenvolvimento do projeto: do MVP atual a um ecossistema completo com auditoria pública e API aberta.",
    fr: "Plan de développement : du MVP actuel à un écosystème complet avec audit public et API ouverte.",
    de: "Projektentwicklungsplan: vom aktuellen MVP zu einem vollständigen Ökosystem mit öffentlichem Audit und offener API.",
    ja: "プロジェクト開発計画：現在のMVPから、公開監査とオープンAPIを備えた完全なエコシステムへ。",
  },
  about: {
    ru: "Официальный патент ФИПС, золотая медаль на региональном НИР, участие во всероссийском финале в Москве и история создания проекта.",
    en: "Official patent filings, first place in regional IT research, national finals invitation, and our project development journey.",
    es: "Patentes oficiales, primer lugar en investigación regional de TI, invitación a la final nacional y nuestra trayectoria.",
    zh: "官方专利申报、地区信息技术研究第一名、全国总决赛邀请以及我们的项目发展历程。",
    tr: "Resmi patent başvuruları, bölgesel BT araştırmasında birincilik, ulusal final daveti ve proje geliştirme yolculuğumuz.",
    hi: "आधिकारिक पेटेंट दाखिल, क्षेत्रीय आईटी अनुसंधान में प्रथम स्थान, राष्ट्रीय फाइनल आमंत्रण और हमारी परियोजना यात्रा।",
    ar: "ملفات براءات اختراع رسمية، المركز الأول في الأبحاث التقنية الإقليمية، دعوة للنهائي الوطني ورحلة تطوير مشروعنا.",
    pt: "Registros oficiais de patente, primeiro lugar em pesquisa regional de TI, convite para a final nacional e nossa trajetória.",
    fr: "Dépôts de brevets officiels, première place en recherche régionale informatique, invitation à la finale nationale et notre parcours.",
    de: "Offizielle Patentanmeldungen, erster Platz in regionaler IT-Forschung, Einladung zum nationalen Finale und unsere Projektentwicklung.",
    ja: "公式特許出願、地域IT研究で第1位、全国大会ファイナルへの招待、そしてプロジェクトの歩み。",
  },
  comparison: {
    ru: "Объективная сравнительная таблица функциональности TrustNode с существующими на рынке аналогами по ключевым параметрам.",
    en: "An objective comparative analysis of TrustNode vs leading global security solutions across key parameters.",
    es: "Un análisis comparativo objetivo de TrustNode frente a las principales soluciones de seguridad globales.",
    zh: "TrustNode 与全球领先安全解决方案在关键参数上的客观对比分析。",
    tr: "TrustNode'un önde gelen küresel güvenlik çözümleriyle temel parametreler üzerinden objektif karşılaştırması.",
    hi: "प्रमुख मानकों पर TrustNode बनाम अग्रणी वैश्विक सुरक्षा समाधानों का निष्पक्ष तुलनात्मक विश्लेषण।",
    ar: "تحليل مقارن موضوعي بين TrustNode وحلول الأمان العالمية الرائدة عبر المعايير الأساسية.",
    pt: "Uma análise comparativa objetiva do TrustNode versus as principais soluções globais de segurança.",
    fr: "Une analyse comparative objective de TrustNode face aux principales solutions de sécurité mondiales.",
    de: "Eine objektive vergleichende Analyse von TrustNode gegenüber führenden globalen Sicherheitslösungen.",
    ja: "主要なパラメータに基づく、TrustNodeと世界の主要セキュリティソリューションの客観的比較分析。",
  },
  download: {
    ru: "Скачайте TrustNode бесплатно из RuStore или с GitHub и защитите свой смартфон от мошенников и спама.",
    en: "Download TrustNode for free from RuStore or GitHub and protect your smartphone from scammers and spam.",
    es: "Descargue TrustNode gratis desde RuStore o GitHub y proteja su smartphone de estafadores y spam.",
    zh: "从 RuStore 或 GitHub 免费下载 TrustNode，保护您的智能手机免受诈骗和垃圾信息骚扰。",
    tr: "TrustNode'u RuStore veya GitHub'dan ücretsiz indirin ve akıllı telefonunuzu dolandırıcılardan ve spam'lerden koruyun.",
    hi: "RuStore या GitHub से TrustNode मुफ्त में डाउनलोड करें और अपने स्मार्टफोन को स्कैमर्स और स्पैम से सुरक्षित रखें।",
    ar: "حمّل TrustNode مجاناً من RuStore أو GitHub واحمِ هاتفك الذكي من المحتالين والرسائل المزعجة.",
    pt: "Baixe o TrustNode gratuitamente na RuStore ou no GitHub e proteja seu smartphone contra golpes e spam.",
    fr: "Téléchargez TrustNode gratuitement depuis RuStore ou GitHub et protégez votre smartphone des arnaques et du spam.",
    de: "Laden Sie TrustNode kostenlos von RuStore oder GitHub herunter und schützen Sie Ihr Smartphone vor Betrügern und Spam.",
    ja: "RuStoreまたはGitHubからTrustNodeを無料でダウンロードして、詐欺やスパムからスマートフォンを守りましょう。",
  },
  news: {
    ru: "Последние публикации команды TrustNode из Telegram и VK: обновления разработки и анонсы.",
    en: "Latest posts from the TrustNode team on Telegram and VK: development updates and announcements.",
    es: "Últimas publicaciones del equipo TrustNode en Telegram y VK: actualizaciones de desarrollo y anuncios.",
    zh: "TrustNode 团队在 Telegram 和 VK 的最新发布：开发动态与公告。",
    tr: "TrustNode ekibinin Telegram ve VK'daki son gönderileri: geliştirme güncellemeleri ve duyurular.",
    hi: "Telegram और VK पर TrustNode टीम के नवीनतम पोस्ट: विकास अपडेट और घोषणाएँ।",
    ar: "أحدث منشورات فريق TrustNode على Telegram و VK: تحديثات التطوير والإعلانات.",
    pt: "Publicações mais recentes da equipe TrustNode no Telegram e VK: atualizações de desenvolvimento e anúncios.",
    fr: "Dernières publications de l'équipe TrustNode sur Telegram et VK : mises à jour de développement et annonces.",
    de: "Neueste Beiträge des TrustNode-Teams auf Telegram und VK: Entwicklungs-Updates und Ankündigungen.",
    ja: "Telegram と VK での TrustNode チームの最新投稿：開発情報とお知らせ。",
  },
};

const PAGE_CTA: Record<string, LangDict> = {
  home: {
    ru: "Открыть главную →", en: "Open Home →", es: "Abrir inicio →", zh: "打开首页 →", tr: "Ana Sayfayı Aç →",
    hi: "मुख्य खोलें →", ar: "افتح الرئيسية →", pt: "Abrir Início →", fr: "Ouvrir l'accueil →", de: "Startseite öffnen →", ja: "ホームを開く →",
  },
  "how-it-works": {
    ru: "Изучить технологии →", en: "Explore Technology →", es: "Explorar tecnología →", zh: "了解技术 →", tr: "Teknolojiyi Keşfet →",
    hi: "तकनीक देखें →", ar: "استكشف التقنية →", pt: "Explorar tecnologia →", fr: "Explorer la technologie →", de: "Technologie entdecken →", ja: "技術を探る →",
  },
  tech: {
    ru: "Перейти к защите →", en: "View Security →", es: "Ver seguridad →", zh: "查看安全 →", tr: "Güvenliği Gör →",
    hi: "सुरक्षा देखें →", ar: "عرض الأمان →", pt: "Ver segurança →", fr: "Voir la sécurité →", de: "Sicherheit ansehen →", ja: "セキュリティを見る →",
  },
  roadmap: {
    ru: "Смотреть Roadmap →", en: "View Roadmap →", es: "Ver hoja de ruta →", zh: "查看路线图 →", tr: "Yol Haritasını Gör →",
    hi: "रोडमैप देखें →", ar: "عرض خارطة الطريق →", pt: "Ver roteiro →", fr: "Voir la feuille de route →", de: "Roadmap ansehen →", ja: "ロードマップを見る →",
  },
  about: {
    ru: "О проекте и команде →", en: "About Us & Team →", es: "Sobre nosotros y equipo →", zh: "关于我们与团队 →", tr: "Hakkımızda ve Ekip →",
    hi: "हमारे बारे में और टीम →", ar: "من نحن والفريق →", pt: "Sobre nós e equipe →", fr: "À propos et équipe →", de: "Über uns & Team →", ja: "私たちとチームについて →",
  },
  comparison: {
    ru: "Открыть таблицу сравнения →", en: "Open Comparison →", es: "Abrir comparación →", zh: "打开对比 →", tr: "Karşılaştırmayı Aç →",
    hi: "तुलना खोलें →", ar: "افتح المقارنة →", pt: "Abrir comparação →", fr: "Ouvrir la comparaison →", de: "Vergleich öffnen →", ja: "比較を開く →",
  },
  download: {
    ru: "Выбрать платформу", en: "Choose Platform", es: "Elegir plataforma", zh: "选择平台", tr: "Platform Seç",
    hi: "प्लेटफ़ॉर्म चुनें", ar: "اختر المنصة", pt: "Escolher plataforma", fr: "Choisir la plateforme", de: "Plattform wählen", ja: "プラットフォームを選択",
  },
  news: {
    ru: "Читать новости →", en: "Read News →", es: "Leer noticias →", zh: "阅读新闻 →", tr: "Haberleri Oku →",
    hi: "समाचार पढ़ें →", ar: "اقرأ الأخبار →", pt: "Ler notícias →", fr: "Lire les actualités →", de: "Neuigkeiten lesen →", ja: "ニュースを読む →",
  },
};

/* Deterministic pseudo-random starfield layer. ~190 stars: the bulk is small
   faint dots, a fifth are medium, a few are noticeably larger/bright and act
   as constellation anchors. Item 9 — denser, more varied sky. */
const STAR_COUNT = 190;
/* Depth layers (reference request): a far field of tiny dim dots and a near
   field of a few bigger brighter ones. The three layers move at different
   parallax speeds, so the sky reads as a volume instead of a flat sheet. */
const DEEP_STAR_COUNT = 160;
const NEAR_STAR_COUNT = 42;
/* A couple of rare shooting stars crossing the starfield (item 8). They are
   pure decoration: staggered delays keep them from firing in sync, and the
   whole layer is disabled under eco-mode / prefers-reduced-motion. */
const SHOOTING_STARS = [
  { top: "12%", left: "4%", dist: "44vw", dur: 17, delay: 3 },
  { top: "34%", left: "52%", dist: "40vw", dur: 21, delay: 11 },
  { top: "58%", left: "10%", dist: "38vw", dur: 19, delay: 19 },
];

/* ---- Comets: rare background events on a truly random 30-60s cadence.
   Each comet gets its own entry point, travel angle, speed and tail length;
   the animation is finite (it flies once and is unmounted). Skipped entirely
   under eco-mode / prefers-reduced-motion. ---- */
type CometFx = {
  key: number;
  top: string;
  left: string;
  ang: string;
  dist: string;
  len: string;
  dur: string;
  /** Flight duration in milliseconds, kept in the object alongside the CSS
      `dur` string so the cleanup timer can match THIS comet exactly (item 11). */
  durMs: number;
};
const rand = (min: number, max: number) => min + Math.random() * (max - min);
function makeComet(key: number): CometFx {
  const durMs = rand(3800, 5200);
  return {
    key,
    top: `${Math.round(rand(8, 82))}%`,
    left: `${Math.round(rand(-14, 18))}%`,
    ang: `${Math.round(rand(-62, -24))}deg`,
    dist: `${Math.round(rand(520, 920))}px`,
    len: `${Math.round(rand(90, 190))}px`,
    dur: `${(durMs / 1000).toFixed(1)}s`,
    durMs,
  };
}

export default function ExplorePagesSection() {
  const { t, language } = useTranslation();
  const { activePage, navigateTo } = useNavigation();
  const { ecoMode } = useEcoMode();
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [comet, setComet] = useState<CometFx | null>(null);
  const solarRef = useRef<HTMLDivElement>(null);
  const starLayerRef = useRef<HTMLDivElement>(null);
  const starDeepRef = useRef<HTMLDivElement>(null);
  const starNearRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [solarW, setSolarW] = useState(0);
  const [solarH, setSolarH] = useState(0);
  const hideCard = () => {
    setHoveredPageId(null);
    setCardPos(null);
  };

  const cardRef = useRef<HTMLDivElement>(null);
  // The 3D scene feeds hover here: the projected planet position (already
  // relative to this container) drives the info card so it tracks the moving
  // planet. Clearing on pointer-leave / pointer-missed hides the card.
  const handleSceneHover = (id: string | null, pt?: { x: number; y: number }) => {
    setHoveredPageId(id);
    if (id && pt) {
      const cont = solarRef.current;
      const planet = PLANET_DATA[id];
      const pos = computeCardPos(
        pt.x,
        pt.y,
        cont?.clientWidth ?? solarW,
        cont?.clientHeight ?? solarH,
        planet ? planet.sizePx / 2 : 0
      );
      setCardPos(pos);
    } else {
      setCardPos(null);
    }
  };
  const hideCardIfLeavingCard = (e: React.PointerEvent) => {
    const rt = e.relatedTarget;
    if (cardRef.current && rt instanceof Node && cardRef.current.contains(rt)) return;
    hideCard();
  };

  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Current real heliocentric position of every planet, computed on mount and
  // refreshed every minute (visible motion is imperceptibly slow — this is
  // enough to keep the layout true to the current date). Skipped (single
  // compute) when ecoMode / prefers-reduced-motion is active.
  const [positions, setPositions] = useState<Record<string, number>>(() => {
    const now = new Date();
    const map: Record<string, number> = {};
    for (const [id, body] of Object.entries(BODY_BY_PAGE)) map[id] = helioLongitude(body, now);
    return map;
  });

  // Measure the solar container so orbit radii are exact pixels. Item 12: the
  // orbit radius must fit the SMALLER of width/height — a width-only radius
  // lets the top/bottom of a circular orbit outgrow a horizontally-stretched
  // section and visually "fly out" of the block.
  useEffect(() => {
    const el = solarRef.current;
    if (!el) return;
    const update = () => {
      setSolarW(el.clientWidth);
      setSolarH(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const motionless = ecoMode || reduceMotion;
  const motionlessRef = useRef(motionless);
  motionlessRef.current = motionless;

  // Comet scheduler: one comet every ~35-65s — its 4-5s flight plus a random
  // 30-60s gap. Frozen under eco-mode / prefers-reduced-motion (no timers).
  useEffect(() => {
    if (motionless) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = (ms: number) => {
      timer = setTimeout(step, ms);
    };
    const step = () => {
      if (!alive) return;
      const c = makeComet(Date.now());
      setComet(c);
      timer = setTimeout(() => {
        if (alive) setComet(null);
        later(rand(30000, 60000));
      }, c.durMs + 200);
    };
    later(rand(4000, 9000)); // a first comet shortly after load, then 30-60s apart
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      setComet(null); // never leave a half-flown comet when eco/motion toggles
    };
  }, [motionless]);

  // Planets are completely frozen (client request): positions are computed
  // once on mount and never re-synced, so nothing ever moves or jumps.

  // Deterministic pseudo-random star field. Sizes/opacities are skewed so a
  // few stars come out notably bigger and brighter (depth, not a uniform grid).
  const stars = useMemo(() => {
    type Star = { left: number; top: number; size: number; delay: number; opacity: number; bright: boolean };
    const arr: Star[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = rnd();
      const bright = r > 0.93;
      const size = bright ? 2.2 + rnd() * 1.8 : 0.6 + rnd() * (r > 0.7 ? 2.2 : 1.1);
      const opacity = bright ? 0.65 + rnd() * 0.35 : 0.15 + rnd() * 0.55;
      arr.push({
        left: rnd() * 100,
        top: rnd() * 100,
        size,
        delay: rnd() * 6,
        opacity,
        bright,
      });
    }
    return arr;
  }, []);

  // Deep background stars — tiny, dim, and almost static under the cursor
  // parallax (they sit furthest away), so the field has real depth.
  const deepStars = useMemo(() => {
    type Star = { left: number; top: number; size: number; delay: number; opacity: number };
    const arr: Star[] = [];
    let seed = 31;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < DEEP_STAR_COUNT; i++) {
      arr.push({
        left: rnd() * 100,
        top: rnd() * 100,
        size: 0.6 + rnd() * 0.9,
        delay: rnd() * 7,
        opacity: 0.08 + rnd() * 0.22,
      });
    }
    return arr;
  }, []);

  // Near stars — a few noticeably bigger, brighter points that move a bit
  // more than the mid layer, reinforcing the volume of the scene.
  const nearStars = useMemo(() => {
    type Star = { left: number; top: number; size: number; delay: number; opacity: number; bright: boolean };
    const arr: Star[] = [];
    let seed = 47;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < NEAR_STAR_COUNT; i++) {
      const bright = rnd() > 0.7;
      arr.push({
        left: rnd() * 100,
        top: rnd() * 100,
        size: bright ? 2.4 + rnd() * 1.6 : 1.2 + rnd() * 1.4,
        delay: rnd() * 6,
        opacity: bright ? 0.6 + rnd() * 0.35 : 0.2 + rnd() * 0.4,
        bright,
      });
    }
    return arr;
  }, []);

  const visiblePages = HEADER_PAGES.filter((p) => p.id !== activePage);
  const planets = visiblePages
    .map((page) => ({ page, data: PLANET_DATA[page.id] }))
    .filter((item) => item.data !== undefined);
  const hoveredPlanet = hoveredPageId ? PLANET_DATA[hoveredPageId] : null;
  const hoveredPage = visiblePages.find((p) => p.id === hoveredPageId);
  const halfW = solarW / 2;
  const halfH = solarH / 2;
  // Shared orbit half-dimension (item 12): every orbit radius derives from the
  // SMALLER of the two container halves, so a circular orbit always fits the
  // block in BOTH axes — planets can never leave the visible area vertically.
  const orbitHalf = Math.min(halfW, halfH) || 1;

  // Item 10: single source of truth for the layout. Real heliocentric angles
  // (`positions`) become screen-space discs (orbit radius x size), run through
  // the pure collision resolver, and come back as final angles. BOTH render
  // paths (WebGL 3D + 2D DOM fallback) consume exactly these resolved angles,
  // so the two can never disagree about where a planet sits.
  const resolvedAngles = useMemo(() => {
    const angles: Record<string, number> = {};
    if (halfW <= 0) return angles;
    const circles = planets.map(({ page, data }) => {
      const rad = ((positions[page.id] ?? 0) * Math.PI) / 180;
      const R = data.radiusPct * ORBIT_SCALE * orbitHalf;
      return { id: page.id, x: Math.cos(rad) * R, y: Math.sin(rad) * R, r: data.sizePx / 2 };
    });
    for (const c of resolvePlanetCollisions(circles, 8)) {
      const orbitR = Math.hypot(c.x, c.y);
      angles[c.id] = orbitR > 0 ? (Math.atan2(c.y, c.x) * 180) / Math.PI : 0;
    }
    return angles;
  }, [planets, positions, orbitHalf]);
  const resolvedAnglesRef = useRef(resolvedAngles);
  resolvedAnglesRef.current = resolvedAngles;

  // Starting angles for the 3D scene: the real heliocentric longitudes, run
  // through the same collision resolver as the 2D layout, so the orbiting
  // models begin parked where the rings point today (frozen under
  // eco-mode / reduced-motion).
  const initialAngles = useMemo(() => {
    const angles: Record<string, number> = {};
    for (const { page } of planets) {
      angles[page.id] = resolvedAngles[page.id] ?? positions[page.id] ?? 0;
    }
    return angles;
  }, [planets, resolvedAngles, positions]);

  // Position the info card beside the hovered planet: open it outwards from
  // the planet (towards the centre of the composition), clamped to bounds so
  // it never covers its own planet or spills beyond the container.
  const computeCardPos = (px: number, py: number, cW: number, cH: number, planetRadius = 0) => {
    const CARD_W = 340;
    const CARD_H = 540;
    // Keep a generous gap between the planet and its card so the frozen planet
    // stays fully visible next to the card instead of slipping behind it.
    const gap = 36 + planetRadius * 1.15;
    const fitsRight = px + gap + CARD_W <= cW - 18;
    const fitsLeft = px - gap - CARD_W >= 18;
    let left: number;
    if (fitsRight && (!fitsLeft || px <= cW - px)) {
      left = px + gap;
    } else {
      left = px - gap - CARD_W;
    }
    left = Math.max(18, Math.min(left, cW - CARD_W - 18));
    let top = py - CARD_H / 2;
    top = Math.max(18, Math.min(top, cH - CARD_H - 18));
    return { x: left, y: top };
  };

  // ---- Item 7 (final): hover leaves the planets completely frozen. The 3D
  //      scene reports the hovered planet's projected position to the card
  //      below, and nothing else reacts to the cursor.

  // ---- Item 9: real 3D planets — the R3F CosmosScene renders the 7
  //      textured spheres on their blue orbit rings; hover/click ride the
  //      scene's own raycast, so the rendered object IS the trigger. There is
  //      no DOM overlay that could drift from the visual.

  // ---- Item 8: "warp" burst on card click. A short decorative flash fans out
  //      from the click point, then navigation happens — never blocked for
  //      long, and skipped entirely under eco-mode / reduced-motion.
  const pointerRef = useRef({ nx: 0, ny: 0 });
  const [warp, setWarp] = useState<{ x: number; y: number; key: number } | null>(null);
  const warpTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (warpTimer.current !== null) window.clearTimeout(warpTimer.current);
  }, []);
  const warpNavigate = (id: PageId, pt?: { clientX: number; clientY: number }) => {
    if (motionless || !pt) {
      navigateTo(id);
      return;
    }
    const cont = solarRef.current;
    if (!cont) {
      navigateTo(id);
      return;
    }
    const r = cont.getBoundingClientRect();
    setWarp({ x: pt.clientX - r.left, y: pt.clientY - r.top, key: Date.now() });
    if (warpTimer.current !== null) window.clearTimeout(warpTimer.current);
    warpTimer.current = window.setTimeout(() => {
      setWarp(null);
      navigateTo(id);
    }, 320);
  };



  // Mobile: first tap reveals the fact, second tap navigates.
  const handleCardClick = (page: (typeof HEADER_PAGES)[number]) => (e?: React.MouseEvent) => {
    if (hoveredPageId !== page.id) {
      setHoveredPageId(page.id);
      e?.preventDefault();
      return;
    }
    if (e) warpNavigate(page.id, e);
  };

  // Shared planet-fact block (inside the desktop overlay card and the expanded
  // mobile card).
  const renderFact = (planet: PlanetData, compact = false) => (
    <div className="mt-4 pt-4 border-t border-[#3C404A]/40 flex items-start gap-3">
      <div className="shrink-0 mt-0.5">
        <PlanetDisc planet={planet} size={compact ? 30 : 34} ring={false} />
      </div>
      <div className="min-w-0">
        <span className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: planet.color }}>
          {planet.name[language]}
        </span>
        <p className="font-sans text-xs text-gray-300 leading-relaxed mt-1">{planet.fact[language]}</p>
      </div>
    </div>
  );

  // Desktop info card: section content first (badge / title / desc / CTA),
  // then the planet fact below.
  const renderOverlayCard = (page: (typeof HEADER_PAGES)[number], planet: PlanetData) => {
    const desc = PAGE_DESCRIPTIONS[page.id]?.[language] || "";
    const cta = PAGE_CTA[page.id]?.[language] || "";
    return (
      <div
        className="group flex flex-col h-full cursor-pointer"
        onClick={(e) => warpNavigate(page.id, e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            warpNavigate(page.id);
          }
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <PlanetDisc planet={planet} size={48} ring={planet.hasRings} />
          <span
            className="font-mono text-xs tracking-widest font-bold px-3 py-1.5 rounded border"
            style={{ color: planet.color, borderColor: `${planet.color}2E`, backgroundColor: `${planet.color}0D` }}
          >
            {planet.name[language]}
          </span>
        </div>
        <h4 className="font-display font-medium text-lg text-[#F5F5F0] mb-2">{t.pageNames[page.labelKey]}</h4>
        <p className="font-sans text-xs text-gray-400 leading-relaxed mb-4 flex-1">{desc}</p>
        <span className={`inline-block font-mono text-sm font-bold text-[#3B82F6] transition-transform duration-300 ${motionless ? "" : "group-hover:translate-x-1"}`}>{cta}</span>
        {renderFact(planet)}
      </div>
    );
  };

  // Mobile / tablet card: vertical list item, tap expands the fact in place.
  const renderMobileCard = (page: (typeof HEADER_PAGES)[number]) => {
    const planet = PLANET_DATA[page.id];
    if (!planet) return null;
    const isActive = hoveredPageId === page.id;
    const dimmed = !ecoMode && hoveredPageId !== null && !isActive;
    const desc = PAGE_DESCRIPTIONS[page.id]?.[language] || "";
    const cta = PAGE_CTA[page.id]?.[language] || "";

    return (
      <motion.div
        key={page.id}
        style={{ "--planet-color": planet.color, "--planet-border": `${planet.color}59` } as React.CSSProperties}
        animate={{ opacity: dimmed ? 0.45 : 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-full"
      >
        <ScanCard
          id={`explore-${page.id}-card`}
          onClick={handleCardClick(page)}
          cardClassName={`cursor-pointer shadow-[0_4px_30px_rgba(0,0,0,0.6)] h-full ${isActive ? "rounded-2xl border-[#3B82F6]/40" : ""}`}
          borderColor="border-[color:var(--planet-border)]"
          className="h-full justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div
                className="rounded-xl bg-[#0A0A0B]/80 border flex items-center justify-center overflow-hidden"
                style={{ borderColor: `${planet.color}26` }}
              >
                <PlanetDisc planet={planet} size={36} ring={planet.hasRings} />
              </div>
              <span
                className="font-mono text-xs tracking-widest font-bold px-3 py-1.5 rounded border"
                style={{ color: planet.color, borderColor: `${planet.color}2E`, backgroundColor: `${planet.color}0D` }}
              >
                {planet.name[language]}
              </span>
            </div>

            <h3 className="font-display font-medium text-lg sm:text-xl text-[#F5F5F0] mb-2">{t.pageNames[page.labelKey]}</h3>
            <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">{desc}</p>

            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  key="fact"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  {renderFact(planet, true)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className={`inline-flex justify-center w-full font-mono text-sm font-bold text-[#3B82F6] group-hover:text-white transition-all mt-4 ${motionless ? "" : "group-hover:translate-x-1"}`}>
            {cta}
          </span>
        </ScanCard>
      </motion.div>
    );
  };

  return (
    <section
      className="relative isolate w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] select-none"
      id="explore-portal-section"
    >
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#3B82F6]/5 filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#3B82F6]/5 filter blur-[120px] pointer-events-none" />

      {/* ---- Full-bleed starfield: spans the whole section edge-to-edge (both
           modes). The three depth layers sit here so surrounding space reaches
           the section borders while the solar-system square below keeps its
           own layout untouched. ---- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        {/* deepest sky — tiny, dim stars that barely move under the cursor
            parallax (reference request: the field reads as a volume). */}
        <div ref={starDeepRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out">
          {deepStars.map((s, i) => (
            <span
              key={`deep-${i}`}
              className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"}`}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  opacity: s.opacity,
                  boxShadow: "0 0 3px rgba(255,255,255,0.4)",
                  animationDelay: `${s.delay}s`,
                  "--star-base": s.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div ref={starLayerRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out">
          {/* faint nebula haze — two soft colour patches, static unless motion
               allowed, purely decorative */}
          <div
            className={`absolute w-[420px] h-[240px] rounded-full ${motionless ? "" : "nebula-drift"}`}
            style={{
              left: "18%",
              top: "22%",
              background: "radial-gradient(ellipse, rgba(120,110,220,0.16) 0%, rgba(120,110,220,0) 70%)",
              filter: "blur(30px)",
            }}
          />
          <div
            className={`absolute w-[380px] h-[220px] rounded-full ${motionless ? "" : "nebula-drift-slow"}`}
            style={{
              left: "58%",
              top: "58%",
              background: "radial-gradient(ellipse, rgba(60,170,220,0.13) 0%, rgba(60,170,220,0) 70%)",
              filter: "blur(34px)",
            }}
          />
          {stars.map((s, i) => (
            <span
              key={i}
              className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"} ${
                s.bright ? "star-bright" : ""
              }`}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  opacity: s.opacity,
                  boxShadow: s.bright
                    ? "0 0 8px 2px rgba(255,255,255,0.45)"
                    : "0 0 4px rgba(255,255,255,0.5)",
                  animationDelay: `${s.delay}s`,
                  "--star-base": s.opacity,
                } as React.CSSProperties
              }
            />
          ))}
          {!motionless &&
            SHOOTING_STARS.map((ss, i) => (
              <span
                key={`shoot-${i}`}
                className="shooting-star star-shooting"
                style={
                  {
                    "--star-top": ss.top,
                    "--star-left": ss.left,
                    "--star-dist": ss.dist,
                    "--star-dur": `${ss.dur}s`,
                    "--star-delay": `${ss.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
        </div>

        {/* nearest sky — a few larger/bright stars that lead the cursor a
            little (per-planet depth on the parallax stack). */}
        <div ref={starNearRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out">
          {nearStars.map((s, i) => (
            <span
              key={`near-${i}`}
              className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"} ${
                s.bright ? "star-bright" : ""
              }`}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  opacity: s.opacity,
                  boxShadow: s.bright
                    ? "0 0 8px 2px rgba(255,255,255,0.45)"
                    : "0 0 4px rgba(255,255,255,0.5)",
                  animationDelay: `${s.delay}s`,
                  "--star-base": s.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* comet — the rare background event, mounted for its one 4-5s flight */}
        {comet && (
          <div
            key={comet.key}
            className="comet"
            style={
              {
                top: comet.top,
                left: comet.left,
                "--comet-ang": comet.ang,
                "--comet-dist": comet.dist,
                "--comet-len": comet.len,
                animationDuration: comet.dur,
              } as React.CSSProperties
            }
          />
        )}
      </div>

      <div className="w-full flex flex-col items-center">
        <div className="text-center max-w-2xl mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-2 font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.15em] text-[#3B82F6] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            EXPLORE PROTOCOL PORTAL
          </div>
          <h2 className="font-display font-medium text-2xl sm:text-4xl text-[#F5F5F0] tracking-tighter mb-4">
            {t.explore.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            {t.explore.subtitle}
          </p>
        </div>

        {/* ---- Desktop: Solar System — Sun at the centre, 7 planets on their
             real heliocentric positions (astronomy-engine). ---- */}
        <div
          ref={parallaxRef}
          className="relative hidden lg:block w-full"
          onMouseLeave={() => {
            hideCard();
          }}
          onMouseMove={(e) => {
            if (motionless) return;
            const el = parallaxRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            // Normalised cursor position inside the block (-1..1).
            const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
            const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
            // Feed the 3D camera parallax (WebGL mode) the same cursor vector.
            pointerRef.current.nx = nx;
            pointerRef.current.ny = ny;
            // Depth-aware parallax (reference request): far stars barely move,
            // the mid layer drifts a touch, the near layer leads the cursor.
            const deep = starDeepRef.current;
            if (deep) deep.style.transform = `translate(${(-nx * 3).toFixed(2)}px, ${(-ny * 2.5).toFixed(2)}px)`;
            const layer = starLayerRef.current;
            if (layer) layer.style.transform = `translate(${(-nx * 10).toFixed(2)}px, ${(-ny * 8).toFixed(2)}px)`;
            const near = starNearRef.current;
            if (near) near.style.transform = `translate(${(-nx * 17).toFixed(2)}px, ${(-ny * 14).toFixed(2)}px)`;
          }}
        >
          <div ref={solarRef} className="relative aspect-square w-full max-w-[920px] mx-auto">

            {/* Orbiting 3D solar system (React Three Fiber): the 7 site
                 planets on their blue orbit rings. Hover reports the
                 projected planet position for the info card; click
                 navigates to that planet's page. Eco / reduced-motion
                 freezes the system at the real heliocentric angles. */}
            <CosmosScene
              planets={planets.map(({ page, data }) => ({
                page,
                data,
                radiusPx: data.radiusPct * ORBIT_SCALE * orbitHalf,
              }))}
              language={language}
              initialAngles={initialAngles}
              motionless={motionless}
              onNavigate={(id, e) => warpNavigate(id as PageId, e)}
              onHover={handleSceneHover}
              onReady={() => console.info("[cosmos] ready", planets.length, "planets")}
            />

            {/* info card beside the hovered planet */}
            <AnimatePresence>
              {!ecoMode && hoveredPlanet && hoveredPage && cardPos && (
                <motion.div
                  key={hoveredPageId}
                  ref={cardRef}
                  className="absolute z-30 w-[340px] max-w-[calc(100%-36px)] rounded-3xl border bg-[#0A0A0B]/95 backdrop-blur-md p-5 shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
                  style={{ left: cardPos.x, top: cardPos.y, borderColor: `${hoveredPlanet.color}55` }}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onPointerLeave={hideCardIfLeavingCard}
                >
                  {renderOverlayCard(hoveredPage, hoveredPlanet)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* warp flash (item 8): a short expanding ring + fading particles
                 burst from the click point before the page transition */}
            <AnimatePresence>
              {warp && (
                <motion.div
                  key={warp.key}
                  className="pointer-events-none absolute z-[50]"
                  style={{ left: warp.x, top: warp.y }}
                  initial={{ opacity: 0.9, scale: 0.15 }}
                  animate={{ opacity: 0, scale: 4.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                >
                  <div className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-[#3B82F6] shadow-[0_0_18px_rgba(59,130,246,0.9)]" />
                  <div className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-center gap-2 mt-10">
            <div className="flex items-center justify-center gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] ${motionless ? "" : "animate-ping"} opacity-75`} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]" />
              </span>
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.18em] text-[#8B8F9C]">
                {t.explore.hint}
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#8B8F9C]/50">
              Planet textures: Solar System Scope, 2K maps — CC BY 4.0 (based on NASA imagery)
            </span>
          </div>
        </div>

        {/* ---- Mobile / tablet: decorative Sun + vertical list, tap to expand. ---- */}
        <div className="w-full lg:hidden">
          <div className="flex flex-col items-center mb-8 pointer-events-none select-none">
            {/* Decorative mobile sun (item 7): the disc uses a smooth 8-stop
                gradient (oklab interpolation — no banding) and the glow lives
                on its own backdrop layer instead of stacked box-shadows, so
                there is no "aura ring" around the disc. */}
            <div className="relative">
              <div
                aria-hidden="true"
                className={`absolute -inset-[60px] rounded-full ${motionless ? "" : "sun-breathe"}`}
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,236,168,0.45) 0%, rgba(255,200,110,0.28) 22%, rgba(255,160,60,0.16) 46%, rgba(255,140,40,0.09) 62%, rgba(255,120,30,0.045) 78%, rgba(255,110,25,0) 100%)",
                }}
              />
              <div
                className={`relative rounded-full ${motionless ? "" : "sun-surface-rot"}`}
                style={{
                  width: 64,
                  height: 64,
                  background:
                    "radial-gradient(circle at 50% 42% in oklab, #FFF6D8 0%, #FFE9A8 12%, #FFD97A 26%, #FFC36B 40%, #F5A44A 54%, #E8932E 68%, #D07B1F 82%, #B45309 100%)",
                }}
              />
            </div>
            <span className="mt-3 font-mono text-[10px] tracking-[0.18em] text-[#8B8F9C]">
              {t.explore.hintTap}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {visiblePages.map((page) => renderMobileCard(page))}
          </div>
        </div>
      </div>
    </section>
  );
}