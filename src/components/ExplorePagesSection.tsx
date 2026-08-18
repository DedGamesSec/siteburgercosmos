import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { PAGES_CONFIG } from "../navigation/pages.config";
import { motion, AnimatePresence } from "motion/react";
import type { LanguageCode } from "../i18n/languages";
import { useEcoMode } from "../context/EcoModeContext";
import ScanCard from "./ScanCard";
import * as Astronomy from "astronomy-engine";
import { isWebGLAvailable } from "./cinematicShared";

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
type PlanetData = {
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

const PLANET_DATA: Record<string, PlanetData> = {
  "how-it-works": {
    color: "#3B82F6",
    sizePx: 82,
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
    sizePx: 104,
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
    sizePx: 58,
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
    sizePx: 98,
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
    sizePx: 68,
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
    sizePx: 86,
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
    sizePx: 52,
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

/* Real axial tilt (°) and compressed sidereal rotation timings per planet
   (item 9). spinSeconds = a full self-rotation at a comfortable animation
   speed, keeping the true ordering (Jupiter fastest, Venus slowest) and
   direction (Venus and Uranus rotate retrograde). Ring config scales against
   the planet's radius. */
const PLANET_MOTION: Record<string, { tiltDeg: number; spinSeconds: number; retrograde?: boolean; ring?: { inner: number; outer: number; opacity: number } }> = {
  download: { tiltDeg: 0.03, spinSeconds: 120 },
  comparison: { tiltDeg: 177.4, spinSeconds: 240, retrograde: true },
  roadmap: { tiltDeg: 25.2, spinSeconds: 30 },
  tech: { tiltDeg: 3.1, spinSeconds: 14 },
  about: { tiltDeg: 26.7, spinSeconds: 16, ring: { inner: 0.78, outer: 1.18, opacity: 0.95 } },
  news: { tiltDeg: 97.8, spinSeconds: 22, retrograde: true, ring: { inner: 0.98, outer: 1.26, opacity: 0.6 } },
  "how-it-works": { tiltDeg: 28.3, spinSeconds: 20 },
};

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

/* ---- Optional real planet models (GLB) ----
   The procedural SSS-textured spheres below are the default, but you can
   render downloaded planet models instead. Two modes:

   1. A single combined solar-system model (FyorDev "solar system REAL SCALE
      2K", a 17MB GLB with a named node per body). Loaded once, and each
      planet subtree is extracted by node-name prefix — e.g. node `Saturn_5`
      + ring node `SaturnRing_14` both match the about page. Set
      SOLAR_SYSTEM_GLB to its URL under public/ ("" disables it).
   2. Individual per-planet files, one per page id, dropped into
      `public/models/planets/` with the MODEL_GLB line uncommented.

   Either way the loader normalises each model automatically: its bounding
   box is scaled to the planet's configured `sizePx` and centred on its
   orbit, so no hand-tuned scale/position constants are needed. The
   procedural extras (Venus atmosphere / Saturn rings) are skipped for a
   configured model on purpose — Sketchfab models carry their own. */
const SOLAR_SYSTEM_GLB = "models/solar_system_real_scale_2k_textures.glb";

/** Node-name prefix per page used to find that planet inside the combined
    model (case-insensitive, trailing `_index` ignored). */
const MODEL_NODE_PREFIX: Record<string, string> = {
  "download": "Mercury",
  comparison: "Venus",
  news: "Uranus",
  roadmap: "Mars",
  tech: "Jupiter",
  about: "Saturn",
  "how-it-works": "Neptune",
};

const MODEL_GLB: Record<string, string> = {
  // "about": "models/planets/saturn.glb",
  // "tech": "models/planets/jupiter.glb",
  // "roadmap": "models/planets/mars.glb",
  // "how-it-works": "models/planets/neptune.glb",
  // "comparison": "models/planets/venus.glb",
  // "news": "models/planets/uranus.glb",
  // "download": "models/planets/mercury.glb",
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
/* A single faint light pulse travelling along a few outer orbits (reference
   request): per-planet rotation duration + delay. The relevant orbit ring is
   the only moving thing — positions of planets stay real and frozen. */
const ORBIT_DOTS: Record<string, { dur: number; delay: number }> = {
  "how-it-works": { dur: 150, delay: 0 },
  news: { dur: 120, delay: 18 },
  tech: { dur: 100, delay: 34 },
  about: { dur: 130, delay: 9 },
  roadmap: { dur: 78, delay: 27 },
};
/* A couple of rare shooting stars crossing the starfield (item 8). They are
   pure decoration: staggered delays keep them from firing in sync, and the
   whole layer is disabled under eco-mode / prefers-reduced-motion. */
const SHOOTING_STARS = [
  { top: "12%", left: "4%", dist: "44vw", dur: 17, delay: 3 },
  { top: "34%", left: "52%", dist: "40vw", dur: 21, delay: 11 },
  { top: "58%", left: "10%", dist: "38vw", dur: 19, delay: 19 },
];

export default function ExplorePagesSection() {
  const { t, language } = useTranslation();
  const { activePage, navigateTo } = useNavigation();
  const { ecoMode } = useEcoMode();
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const solarRef = useRef<HTMLDivElement>(null);
  const starLayerRef = useRef<HTMLDivElement>(null);
  const starDeepRef = useRef<HTMLDivElement>(null);
  const starNearRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [solarW, setSolarW] = useState(0);
  const hideCard = () => {
    setHoveredPageId(null);
    setCardPos(null);
  };

  const cardRef = useRef<HTMLDivElement>(null);
  // Hide the preview card immediately when the pointer leaves a planet — but
  // not while it is heading toward the card itself (the card has a narrow
  // buffer envelope around it), so the card stays open while it is being
  // read/clicked.
  const hideCardIfLeavingPlanet = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const pad = 60;
      if (
        e.clientX >= r.left - pad &&
        e.clientX <= r.right + pad &&
        e.clientY >= r.top - pad &&
        e.clientY <= r.bottom + pad
      ) {
        return;
      }
    }
    hideCard();
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

  // Measure the solar container so orbit radii are exact pixels.
  useEffect(() => {
    const el = solarRef.current;
    if (!el) return;
    const update = () => setSolarW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const motionless = ecoMode || reduceMotion;

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

  // ---- Item 7 (final): hover leaves the planets completely frozen. 3D
  //      sphere, DOM hit zone and 2D fallback all stay glued to the exact
  //      same `positions`-derived point, and the hovered planet neither
  //      moves, grows nor glows — no displacement, no scale pulse, no halo,
  //      so nothing can be read as motion. There is no direction/distance
  //      math at all. The only hover feedback is the side info card, the
  //      dimming of the other planets and the pinned label tint.

  const handlePlanetEnter = (id: string, e: React.MouseEvent<HTMLElement>) => {
    setHoveredPageId(id);
    const cont = solarRef.current;
    if (!cont) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = cont.getBoundingClientRect();
    const px = rect.left - cRect.left + rect.width / 2;
    const py = rect.top - cRect.top + rect.height / 2;
    const planet = PLANET_DATA[id];
    const pos = computeCardPos(px, py, cRect.width, cRect.height, planet ? planet.sizePx / 2 : 0);
    setCardPos(pos);
  };

  // ---- Item 9: real 3D planets — one shared three.js canvas. Each planet is
  //      a textured, slowly-spinning sphere with its real axial tilt; Saturn
  //      / Uranus get ring geometry. Hover/click use raycasting directly on
  //      the spheres, so the rendered object IS the trigger — there is no DOM
  //      overlay that could drift from the visual. Falls back to flat 2D
  //      discs (DOM buttons) when WebGL or motion is unavailable.
  const [webglOk] = useState(() => isWebGLAvailable());
  const [webglFailed, setWebglFailed] = useState(false);
  // True once boot() has loaded the shared GLB models and started rendering —
  // until then the canvas is empty, so a lightweight skeleton hints that the
  // orbits are being computed instead of showing a dead black square.
  const [sceneReady, setSceneReady] = useState(false);
  const use3D = webglOk && !webglFailed && !motionless && solarW > 0;
  const visibleIds = useMemo(() => visiblePages.map((p) => p.id).join(","), [visiblePages]);
  const solarCanvasRef = useRef<HTMLCanvasElement>(null);
  const solarWRef = useRef(solarW);
  solarWRef.current = solarW;
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const planetsRef = useRef(planets);
  planetsRef.current = planets;
  const hoverRef = useRef<string | null>(null);
  hoverRef.current = hoveredPageId;
  const inViewRef = useRef(true);

  // ---- Item 8: "warp" burst on card click. A short decorative flash fans out
  //      from the click point, then navigation happens — never blocked for
  //      long, and skipped entirely under eco-mode / reduced-motion.
  const [warp, setWarp] = useState<{ x: number; y: number; key: number } | null>(null);
  const warpTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (warpTimer.current !== null) window.clearTimeout(warpTimer.current);
  }, []);
  const warpNavigate = (id: string, e?: React.MouseEvent) => {
    if (motionless || !e) {
      navigateTo(id);
      return;
    }
    const cont = solarRef.current;
    if (!cont) {
      navigateTo(id);
      return;
    }
    const r = cont.getBoundingClientRect();
    setWarp({ x: e.clientX - r.left, y: e.clientY - r.top, key: Date.now() });
    if (warpTimer.current !== null) window.clearTimeout(warpTimer.current);
    warpTimer.current = window.setTimeout(() => {
      setWarp(null);
      navigateTo(id);
    }, 320);
  };


  useEffect(() => {
    if (!use3D) return;
    setSceneReady(false);
    const canvas = solarCanvasRef.current;
    const container = solarRef.current;
    if (!canvas || !container) return;
    let cancelled = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").OrthographicCamera | null = null;
    let io: IntersectionObserver | null = null;
    let onContextLost: ((e: Event) => void) | null = null;
    const disposables: Array<{ dispose: () => void }> = [];
    let records: Array<{
      pageId: string;
      data: PlanetData;
      group: import("three").Group;
      mesh?: import("three").Mesh;
      mat?: import("three").MeshStandardMaterial;
      /** When a GLB model is configured: the normalised group added to the
          orbit group. `modelHook` is the inner node hover-scaled each frame. */
      modelBody?: import("three").Group;
      modelHook?: import("three").Group;
      modelDimmed?: boolean;
      label: import("three").Sprite;
      labelMat: import("three").SpriteMaterial;
      spinRate: number;
      direction: number;
      /** Eased dynamic field: current spin speed (decelerated to 0 while the
          planet is hovered). */
      spinVel: number;
    }> = [];

    const applyCamera = () => {
      if (!camera) return;
      const w = Math.max(1, Math.round(solarWRef.current));
      const hw = w / 2;
      camera.left = -hw;
      camera.right = hw;
      camera.top = hw;
      camera.bottom = -hw;
      camera.updateProjectionMatrix();
      renderer?.setSize(w, w, false);
    };

    const boot = async () => {
      const THREE = await import("three");
      if (cancelled) return;
      const w = Math.round(solarWRef.current);
      if (w <= 0) return;
      const hw = w / 2;
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-hw, hw, hw, -hw, -100, 100);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, w, false);
      // If the GPU drops the context (tab switch, VRAM pressure, driver
      // reset), a lost context leaves a permanently blank canvas — the scene
      // would never recover and the planets would silently "disappear".
      // Listen for it and fall back to the DOM disc layout instead.
      onContextLost = (e: Event) => {
        e.preventDefault();
        if (!cancelled) setWebglFailed(true);
      };
      canvas.addEventListener("webglcontextlost", onContextLost, false);

      // The Sun at the centre is the main light source (real day/night
      // terminator). A modest top-left key light guarantees visible 3D
      // shading even on GPUs where the point light behaves differently,
      // plus a faint fill so no sphere ever reads as flat.
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      const sunLight = new THREE.PointLight(0xffe0b0, 3.2, 0, 0);
      const key = new THREE.DirectionalLight(0xffffff, 0.45);
      key.position.set(-1, 1, 1);
      const fill = new THREE.DirectionalLight(0xffffff, 0.18);
      fill.position.set(0, -0.5, 1);
      scene.add(ambient, sunLight, key, fill);

      // The Sun sphere itself (unlit).
      const sunGeo = new THREE.SphereGeometry(52, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffc36b });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      scene.add(sun);
      disposables.push(sunGeo, sunMat);

      const loader = new THREE.TextureLoader();

      // Pre-load any configured GLB planet models. Two modes: a single
      // combined solar-system model (loaded once, planets extracted by node
      // name) or one file per planet. Each result is normalised — `body` is
      // scaled so the model's bounding box matches the planet's `sizePx` and
      // is centred on the orbit; `hook` is the inner node hover/scale is
      // applied to each frame without disturbing the centring offset.
      const modelByPage = new Map<string, { body: import("three").Group; hook: import("three").Group }>();
      const normaliseModel = (root: import("three").Object3D, sizePx: number) => {
        const hook = new THREE.Group();
        hook.add(root);
        const body = new THREE.Group();
        body.add(hook);
        body.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(body);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const s = sizePx / maxDim;
        const c = box.getCenter(new THREE.Vector3());
        body.scale.setScalar(s);
        body.position.set(-c.x * s, -c.y * s, -c.z * s);
        body.traverse((o) => {
          o.frustumCulled = false;
        });
        disposables.push({
          dispose: () => {
            body.traverse((o) => {
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
        return { body, hook };
      };

      if (SOLAR_SYSTEM_GLB) {
        try {
          const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
          const gltf = await new Promise<{ scene: import("three").Group }>((res, rej) => {
            new GLTFLoader().load(`${import.meta.env.BASE_URL}${SOLAR_SYSTEM_GLB}`, (g) => res(g), undefined, (err) => rej(err));
          });
          if (cancelled) return;
          // Detach every node whose name starts with that planet's prefix
          // (e.g. `Saturn_5` and `SaturnRing_14` => the Saturn subtree), so
          // the planet's own rings/moons travel with it after auto-normalising.
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
        } catch {
          /* Combined model failed to load — planets stay procedural. */
        }
      } else {
        await Promise.all(
          (Object.entries(MODEL_GLB) as Array<[string, string]>)
            .filter(([id]) => planetsRef.current.some(({ page }) => page.id === id))
            .map(async ([id, url]) => {
              try {
                const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
                const gltf = await new Promise<{ scene: import("three").Group }>((res, rej) => {
                  new GLTFLoader().load(`${import.meta.env.BASE_URL}${url}`, (g) => res(g), undefined, (err) => rej(err));
                });
                modelByPage.set(id, normaliseModel(gltf.scene, PLANET_DATA[id].sizePx));
              } catch {
                /* GLB failed to load — the planet stays fully procedural. */
              }
            })
        );
        if (cancelled) return;
      }

      // Planet name label: a white-text sprite that lives in the scene and is
      // parented to the planet's orbit position each frame (tied to the 3D
      // model — it can never drift from the sphere). Material colour tints it
      // so hover/dim states are handled in the render loop.
      const makeLabelTex = (THREE_MOD: typeof import("three"), text: string) => {
        const font = "600 12px 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
        const probe = document.createElement("canvas");
        const pctx = probe.getContext("2d")!;
        pctx.font = font;
        const tw = Math.ceil(pctx.measureText(text).width);
        const w = tw + 12;
        const h = 18;
        const c = document.createElement("canvas");
        c.width = Math.ceil(w * dpr);
        c.height = Math.ceil(h * dpr);
        const ctx = c.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, w / 2, h / 2 + 1);
        const tex = new THREE_MOD.CanvasTexture(c);
        tex.colorSpace = THREE_MOD.SRGBColorSpace;
        const mat = new THREE_MOD.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
        const sprite = new THREE_MOD.Sprite(mat);
        sprite.scale.set(w, h, 1);
        sprite.renderOrder = 10;
        scene!.add(sprite);
        disposables.push(tex, mat);
        return { sprite, mat };
      };

      

      for (const { page, data } of planetsRef.current) {
        const motion = PLANET_MOTION[page.id];
        if (!motion) continue;
        const group = new THREE.Group();
        group.rotation.z = (motion.tiltDeg * Math.PI) / 180;
        scene.add(group);

        const model = modelByPage.get(page.id);
        let mesh: import("three").Mesh | undefined;
        let mat: import("three").MeshStandardMaterial | undefined;
        if (model) {
          // Real GLB model: add the normalised body in place of the
          // procedural sphere (Sketchfab models ship their own textures and,
          // for Saturn, their own rings — skip the procedural extras).
          group.add(model.body);
        } else {
          // Procedural sphere with the real surface map.
          const geo = new THREE.SphereGeometry(data.sizePx / 2, 32, 24);
          mat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 1, metalness: 0, transparent: true });
          loader.load(
            `${import.meta.env.BASE_URL}${data.textureUrlHi ?? data.textureUrl}`,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              mat.map = tex;
              mat.color.set(0xffffff);
              mat.needsUpdate = true;
            },
            undefined,
            () => {
              /* keep the tinted colour as fallback */
            }
          );
          mesh = new THREE.Mesh(geo, mat);
          mesh.userData.pageId = page.id;
          group.add(mesh);
          disposables.push(geo, mat);

          // Venus: translucent cloud shell over the surface map for depth.
          if (data.atmosphereTextureUrl) {
            const cloudGeo = new THREE.SphereGeometry((data.sizePx / 2) * 1.012, 32, 24);
            const cloudMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false });
            loader.load(
              `${import.meta.env.BASE_URL}${data.atmosphereTextureUrl}`,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                cloudMat.map = tex;
                cloudMat.needsUpdate = true;
              },
              undefined,
              () => {
                /* keep invisible fallback */
              }
            );
            const clouds = new THREE.Mesh(cloudGeo, cloudMat);
            group.add(clouds);
            disposables.push(cloudGeo, cloudMat);
          }

          if (data.hasRings) {
            const cfg = motion.ring ?? { inner: 0.78, outer: 1.15, opacity: 0.9 };
            const ringGeo = new THREE.RingGeometry((data.sizePx / 2) * cfg.inner, (data.sizePx / 2) * cfg.outer, 128);
            const ringMat = new THREE.MeshBasicMaterial({
              color: data.color,
              transparent: true,
              opacity: cfg.opacity,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            if (data.ringTextureUrl) {
              // Saturn: real ring map (Solar System Scope alpha strip). The
              // strip's radial banding maps across the ring band; the alpha
              // channel keeps the gaps (Cassini division) transparent.
              loader.load(
                `${import.meta.env.BASE_URL}${data.ringTextureUrl}`,
                (tex) => {
                  tex.colorSpace = THREE.SRGBColorSpace;
                  ringMat.map = tex;
                  ringMat.color.set(0xffffff);
                  ringMat.opacity = 1; // the map's own alpha drives visibility
                  ringMat.depthWrite = false;
                  ringMat.needsUpdate = true;
                },
                undefined,
                () => {
                  /* keep the tinted colour as fallback */
                }
              );
            }
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            group.add(ring);
            disposables.push(ringGeo, ringMat);
          }
        }

        const label = makeLabelTex(THREE, data.name[language].toUpperCase());

        records.push({
          pageId: page.id,
          data,
          group,
          ...(model ? { modelBody: model.body, modelHook: model.hook } : {}),
          ...(mesh ? { mesh, mat } : {}),
          label: label.sprite,
          labelMat: label.mat,
          spinRate: (Math.PI * 2) / motion.spinSeconds,
          direction: motion.retrograde ? -1 : 1,
          spinVel: (Math.PI * 2) / motion.spinSeconds,
        });
      }

      // Warm up shaders before the first visible frame (no first-frame stutter).
      renderer.compile(scene, camera);
      let last = performance.now();
      let lastW = -1;
      const frame = (now: number) => {
        if (cancelled) return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        const wCur = Math.max(1, Math.round(solarWRef.current));
        if (renderer && lastW !== wCur) {
          lastW = wCur;
          applyCamera();
        }
        const hw2 = wCur / 2;
        const pos = positionsRef.current;
        const hovered = hoverRef.current;
        const ease = 1 - Math.pow(0.005, dt); // exponential smoothing factor
        for (const rec of records) {
          const angle = ((pos[rec.pageId] ?? 0) * Math.PI) / 180;
          const R = rec.data.radiusPct * ORBIT_SCALE * hw2;
          const baseX = Math.cos(angle) * R;
          const baseY = -Math.sin(angle) * R;
          // In-place hover (item 7, rewrite): the planet never leaves its orbit point.
          rec.group.position.set(baseX, baseY, 0);

          const isHovered = rec.pageId === hovered;
          const dim = hovered !== null && !isHovered;

          // Planets are fully frozen (client request): no axial self-rotation,
          // no orbital drift — the body sits exactly on its orbit point and
          // only the gentle hover scale below ever touches its geometry.

          // Gentle hover scale (client request): the planet stays on its
          // orbit point, but its body eases up ~5% while hovered (nothing
          // translates — a pure in-place size pulse). Eased per frame from the
          // current value so it never snaps.
          const hoverTarget = isHovered ? 1.05 : 1;

          if (rec.modelBody) {
            // Dim adjacent planets: tweak material opacity once per state
            // change (3D models have several materials, so no per-frame sweep).
            if (rec.modelDimmed !== dim) {
              rec.modelDimmed = dim;
              rec.modelBody.traverse((o) => {
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
            if (rec.modelHook) {
              const s = rec.modelHook.scale.x + (hoverTarget - rec.modelHook.scale.x) * ease;
              rec.modelHook.scale.setScalar(s);
            }
          } else if (rec.mesh && rec.mat) {
            const s = rec.mesh.scale.x + (hoverTarget - rec.mesh.scale.x) * ease;
            rec.mesh.scale.setScalar(s);
            rec.mat.opacity = isHovered ? 1 : dim ? 0.35 : 1;
          } else {
            if (rec.mesh) {
              const s = rec.mesh.scale.x + (hoverTarget - rec.mesh.scale.x) * ease;
              rec.mesh.scale.setScalar(s);
            }
            if (rec.mat) rec.mat.opacity = 1;
          }
          // Planets are frozen (client request) — the body never rotates on
          // its own axis; only the pinned label below updates below.

          // Keep the name label pinned directly below its sphere (it is a
          // scene object, so it moves with the model; the tint drives the
          // hover/dim states instead of a full DOM redraw).
          rec.label.position.set(rec.group.position.x, rec.group.position.y - (rec.data.sizePx / 2 + 22), 0);
          rec.labelMat.color.set(rec.pageId === hovered ? rec.data.color : "#8B8F9C");
          rec.labelMat.opacity = hovered && rec.pageId !== hovered ? 0.35 : 1;
        }
        if (inViewRef.current) renderer?.render(scene!, camera!);
      };
      raf = requestAnimationFrame(frame);
      if (!cancelled) setSceneReady(true);
    };

    io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { rootMargin: "120px" }
    );
    io.observe(container);

    void boot().catch(() => {
      // If the WebGL scene fails to initialise for any reason, drop back to
      // the DOM disc fallback instead of leaving an empty canvas with only
      // the HTML labels floating over it.
      if (!cancelled) setWebglFailed(true);
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      if (onContextLost) canvas.removeEventListener("webglcontextlost", onContextLost, false);
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
      renderer = null;
      scene = null;
      camera = null;
      records = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use3D, visibleIds, language]);

  // Mobile: first tap reveals the fact, second tap navigates.
  const handleCardClick = (page: (typeof HEADER_PAGES)[number]) => (e: React.MouseEvent) => {
    if (hoveredPageId !== page.id) {
      setHoveredPageId(page.id);
      e.preventDefault();
      return;
    }
    warpNavigate(page.id, e);
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
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] select-none"
      id="explore-portal-section"
    >
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#3B82F6]/5 filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#3B82F6]/5 filter blur-[120px] pointer-events-none" />

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
          {/* starfield — spans the full section width, so the planets keep
              their arrangement inside the square below while surrounding
              space extends out to the screen edges. */}
          {/* deepest sky — tiny, dim stars that barely move under the cursor
              parallax (reference request: the field reads as a volume) */}
          <div ref={starDeepRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out" aria-hidden="true">
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
          <div ref={starLayerRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out" aria-hidden="true">
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
              little (per-planet depth on the parallax stack) */}
          <div ref={starNearRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out" aria-hidden="true">
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

          <div ref={solarRef} className="relative aspect-square w-full max-w-[920px] mx-auto">

            {/* Loading skeleton — shown while the shared GLB models are still
                 being fetched & normalised (the canvas needs boot() to finish
                 before it can draw anything). Popped as soon as the first
                 frame is scheduled, so it never overlaps the live planets. */}
            {use3D && !sceneReady && (
              <div
                className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-5 pointer-events-none"
                aria-hidden="true"
              >
                <div
                  className="w-28 h-28 rounded-full relative animate-pulse"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.06) 45%, rgba(59,130,246,0) 70%)",
                  }}
                >
                  <div className="absolute inset-0 rounded-full border border-[#3B82F6]/20" />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 42%, #FFE9A8 0%, #FFC36B 40%, #F59E0B 80%, #B45309 100%)",
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-[#3B82F6]/70 animate-pulse">
                  CALCULATING ORBITS…
                </span>
              </div>
            )}

            {/* orbit rings — the hovered planet's ring ignites in its own colour
                 (pure glow on the ring, the planet itself stays frozen) */}
            {planets.map(({ page, data }) => {
              const lit = hoveredPageId === page.id;
              const dot = ORBIT_DOTS[page.id];
              return (
                <div
                  key={`ring-${page.id}`}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82F6]/[0.08] pointer-events-none transition-[opacity,border-color] duration-500 ${lit && !motionless ? "orbit-ignite" : ""}`}
                  style={{
                    width: `${data.radiusPct * ORBIT_SCALE * 100}%`,
                    height: `${data.radiusPct * ORBIT_SCALE * 100}%`,
                    borderColor: lit ? `${data.color}66` : undefined,
                    opacity: lit ? (motionless ? 0.9 : 0.75) : undefined,
                    "--orbit-color": lit ? data.color : undefined,
                  } as React.CSSProperties}
                >
                  {/* a single faint light travelling along this orbit (reference
                       request): the wrapper rotates in place, the dot rides the
                       rim. Static under eco-mode / reduced-motion. */}
                  {dot && !motionless && (
                    <div
                      className="absolute inset-0 orbit-drift"
                      style={{
                        color: data.color,
                        "--drift-dur": `${dot.dur}s`,
                        "--drift-delay": `${dot.delay}s`,
                      } as React.CSSProperties}
                    >
                      <span className="orbit-dot" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sun — a layered halo behind the 3D sphere in WebGL mode (the
                 outer corona slowly swells and fades so the star reads alive,
                 reference request), the gradient sphere itself in 2D fallback. */}
            {use3D ? (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,213,128,0.55) 0%, rgba(251,191,36,0.22) 45%, rgba(245,158,11,0) 70%)",
                    filter: "blur(10px)",
                  }}
                />
                <div
                  className={`absolute inset-0 rounded-full ${motionless ? "" : "sun-halo-pulse"}`}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,200,120,0.5) 0%, rgba(251,146,60,0.2) 40%, rgba(245,158,11,0) 68%)",
                    filter: "blur(26px)",
                  }}
                />
              </div>
            ) : (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none">
                <div
                  className={`relative rounded-full ${motionless ? "" : "sun-breathe"}`}
                  style={{
                    width: 88,
                    height: 88,
                    background:
                      "radial-gradient(circle at 50% 42%, #FFE9A8 0%, #FFC36B 26%, #F59E0B 58%, #B45309 100%)",
                    boxShadow:
                      "0 0 40px rgba(251,191,36,0.55), 0 0 90px rgba(245,158,11,0.35), 0 0 140px rgba(245,158,11,0.18)",
                  }}
                />
              </div>
            )}

            {/* planets on real positions — 3D spheres (WebGL + raycast triggers)
                 or flat 2D discs (DOM buttons) in fallback */}
{solarW > 0 &&
            (use3D ? (
              <>
                <canvas
                  ref={solarCanvasRef}
                  className="absolute inset-0 w-full h-full touch-none z-[3]"
                  aria-hidden="true"
                />
                {/* invisible DOM hit zones — positioned with the exact same orbit
                     math as the 3D spheres, so hover/focus/click work reliably
                     even where GPU acceleration misbehaves. The WebGL sphere in
                     front is always the visual, and its in-canvas sprite label
                     is pinned to the same orbit point. The zones are static —
                     in-place hover (item 7) means the planet never leaves its
                     orbit, so there is nothing to follow. */}
                {planets.map(({ page, data }) => {
                  const angleDeg = positions[page.id] ?? 0;
                  const rad = (angleDeg * Math.PI) / 180;
                  const R = data.radiusPct * ORBIT_SCALE * halfW;
                  const x = Math.cos(rad) * R;
                  // CSS `top` grows downward while three.js y grows upward, so
                  // the hit zone must mirror the scene's y sign to sit exactly
                  // on the rendered sphere.
                  const y = Math.sin(rad) * R;
                  const box = Math.max(48, data.sizePx + 28);
                  return (
                    <button
                      key={page.id}
                      type="button"
                      className="absolute z-[4] rounded-full p-0 cursor-pointer outline-none border-0 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        width: box,
                        height: box,
                        background: "transparent",
                      }}
                      aria-label={t.pageNames[page.labelKey]}
                      onMouseEnter={(e) => {
                        handlePlanetEnter(page.id, e);
                      }}
                      onMouseLeave={hideCardIfLeavingPlanet}
                      onFocus={() => {
                        setHoveredPageId(page.id);
                      }}
                      onClick={(e) => warpNavigate(page.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          warpNavigate(page.id);
                        }
                      }}
                    />
                  );
                })}
                {/* keyboard / assistive-tech access to the same pages */}
                <ul className="sr-only pointer-events-none">
                  {planets.map(({ page }) => (
                    <li key={page.id}>
                      <button
                        type="button"
                        onClick={() => navigateTo(page.id)}
                        onFocus={() => setHoveredPageId(page.id)}
                      >
                        {t.pageNames[page.labelKey]}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
                planets.map(({ page, data }, i) => {
                  const active = hoveredPageId === page.id;
                  const dimmed = !ecoMode && hoveredPageId !== null && !active;
                  const color = data.color;
                  const angleDeg = positions[page.id] ?? 0;
                  const rad = (angleDeg * Math.PI) / 180;
                  const R = data.radiusPct * ORBIT_SCALE * halfW;
                  const x = Math.cos(rad) * R;
                  const y = Math.sin(rad) * R;
                  // Gentle hover (client request): the orbit point is never
                  // touched and nothing translates — only the planet's own
                  // disc grows a few percent in place (the name label stays
                  // pinned, so nothing reads as motion). The atmospheric halo
                  // brightens, the ring lights, neighbours dim.
                  return (
                    <div
                      key={page.id}
                      className="absolute z-[30]"
                      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                    >
                      <div className="absolute -translate-x-1/2 -translate-y-1/2">
                        <motion.button
                          type="button"
                          className="flex flex-col items-center gap-1.5 cursor-pointer outline-none"
                          animate={{
                            opacity: dimmed ? 0.35 : 1,
                          }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          onMouseEnter={(e) => {
                            handlePlanetEnter(page.id, e);
                          }}
                          onMouseLeave={hideCardIfLeavingPlanet}
                          onFocus={() => {
                            setHoveredPageId(page.id);
                          }}
                          onClick={(e) => warpNavigate(page.id, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              warpNavigate(page.id);
                            }
                          }}
                          aria-label={t.pageNames[page.labelKey]}
                          aria-expanded={active}
                        >
                          <motion.span
                            className={`rounded-full flex items-center justify-center border transition-all ${motionless ? "" : "planet-breathe"}`}
                            animate={{ scale: active ? 1.05 : 1 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            style={{
                              width: data.sizePx + 16,
                              height: data.sizePx + 16,
                              borderColor: `${color}38`,
                              backgroundColor: "#0A0A0B80",
                              "--breathe-delay": `${(i * 0.9) % 6}s`,
                            } as React.CSSProperties}
                          >
                            <PlanetDisc
                              planet={data}
                              size={data.sizePx}
                              ring={data.hasRings}
                              spin={false}
                              lit={active}
                            />
                          </motion.span>
                          <span
                            className="font-mono text-[9px] tracking-widest uppercase whitespace-nowrap"
                            style={{
                              color: active ? color : "#8B8F9C",
                              textShadow: active ? `0 0 12px ${color}` : undefined,
                            }}
                          >
                            {data.name[language]}
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  );
                })
              ))}

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
            <div
              className={`relative rounded-full ${motionless ? "" : "sun-breathe"}`}
              style={{
                width: 64,
                height: 64,
                background:
                  "radial-gradient(circle at 50% 42%, #FFE9A8 0%, #FFC36B 26%, #F59E0B 58%, #B45309 100%)",
                boxShadow:
                  "0 0 32px rgba(251,191,36,0.5), 0 0 70px rgba(245,158,11,0.3)",
              }}
            />
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