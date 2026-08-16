import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { PAGES_CONFIG } from "../navigation/pages.config";
import { motion, AnimatePresence } from "motion/react";
import type { LanguageCode } from "../i18n/languages";
import { useEcoMode } from "../context/EcoModeContext";
import ScanCard from "./ScanCard";

const HEADER_PAGES = PAGES_CONFIG.filter((p) => p.showInHeader).sort((a, b) => a.order - b.order);

type LangDict = Record<LanguageCode, string>;

/* ---- Custom flat SVG planet glyphs (each planet gets an expressive look) ---- */

type GlyphProps = { size?: number };

const BaseOrb = ({ color, size = 40, back, children }: { color: string; size?: number; back?: React.ReactNode; children?: React.ReactNode }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    {back}
    <circle cx="32" cy="32" r="26" fill={color} fillOpacity="0.14" stroke={color} strokeWidth="3" />
    {children}
  </svg>
);

/* Mercury — grey-brown, cratered. */
const MercuryGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb color="#9CA3AF" size={size}>
    <circle cx="25" cy="25" r="4" fill="#9CA3AF" fillOpacity="0.5" />
    <circle cx="41" cy="37" r="3" fill="#9CA3AF" fillOpacity="0.35" />
    <circle cx="31" cy="44" r="2.2" fill="#9CA3AF" fillOpacity="0.3" />
  </BaseOrb>
);

/* Venus — cream, hazy cloud bands. */
const VenusGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb color="#FDE68A" size={size}>
    <path d="M13 25 Q32 20 51 25" stroke="#D97706" strokeOpacity="0.4" strokeWidth="2.5" fill="none" />
    <path d="M12 33 Q32 28 52 33" stroke="#D97706" strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
    <path d="M13 41 Q32 37 51 41" stroke="#D97706" strokeOpacity="0.18" strokeWidth="2.5" fill="none" />
  </BaseOrb>
);

/* Mars — reddish disc, dark craters. */
const MarsGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb color="#EF4444" size={size}>
    <circle cx="27" cy="27" r="6" fill="#B91C1C" fillOpacity="0.5" />
    <circle cx="41" cy="39" r="4.5" fill="#B91C1C" fillOpacity="0.4" />
    <circle cx="37" cy="24" r="2" fill="#B91C1C" fillOpacity="0.35" />
    <circle cx="24" cy="41" r="1.8" fill="#B91C1C" fillOpacity="0.3" />
  </BaseOrb>
);

/* Jupiter — amber bands + Great Red Spot. */
const JupiterGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb color="#D97706" size={size}>
    <path d="M12 24 Q32 20 52 24" stroke="#92400E" strokeOpacity="0.5" strokeWidth="3" fill="none" />
    <path d="M11 31 Q32 27 53 31" stroke="#92400E" strokeOpacity="0.3" strokeWidth="3" fill="none" />
    <path d="M12 38 Q32 34 52 38" stroke="#92400E" strokeOpacity="0.5" strokeWidth="3" fill="none" />
    <path d="M11 45 Q32 41 53 45" stroke="#92400E" strokeOpacity="0.3" strokeWidth="3" fill="none" />
    <ellipse cx="42" cy="31" rx="5" ry="2.6" fill="#EF4444" fillOpacity="0.85" />
  </BaseOrb>
);

/* Saturn — tilted rings passing behind and in front of the disc. */
const SaturnGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb
    color="#EAB308"
    size={size}
    back={
      <ellipse cx="32" cy="32" rx="35" ry="12" stroke="#EAB308" strokeWidth="2.5" fill="none" transform="rotate(-18 32 32)" />
    }
  >
    <path d="M14 41 Q32 50 50 41" stroke="#EAB308" strokeWidth="2" fill="none" opacity="0.8" />
    <circle cx="27" cy="26" r="2" fill="#A16207" fillOpacity="0.5" />
  </BaseOrb>
);

/* Uranus — pale cyan, near-vertical rings. */
const UranusGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb
    color="#22D3EE"
    size={size}
    back={
      <ellipse cx="32" cy="32" rx="9" ry="30" stroke="#22D3EE" strokeWidth="2.2" fill="none" transform="rotate(15 32 32)" />
    }
  >
    <ellipse cx="40" cy="39" rx="5" ry="3" fill="#0E7490" fillOpacity="0.4" />
  </BaseOrb>
);

/* Neptune — deep blue, bright cloud + dark storm spot. */
const NeptuneGlyph = ({ size = 40 }: GlyphProps) => (
  <BaseOrb color="#3B82F6" size={size}>
    <circle cx="27" cy="25" r="2.5" fill="#93C5FD" fillOpacity="0.5" />
    <ellipse cx="40" cy="39" rx="6" ry="3.5" fill="#1E3A8A" fillOpacity="0.55" />
  </BaseOrb>
);

/* ---- Solar System layout config ----
   Sizes are compressed from real diameters (min ~30px Mercury ... max 62px
   Jupiter). Orbit radii mirror the relative distances (compressed non-
   linearly: Mercury close, Neptune far). Durations scale from real periods:
   ~40s for Mercury up to ~400s (~7min) for Neptune. startDeg staggers the
   starting angles so the system looks alive immediately. */
type PlanetData = {
  name: LangDict;
  fact: LangDict;
  color: string;
  sizePx: number;
  radiusPct: number;
  durationSec: number;
  startDeg: number;
  glyph: (props: GlyphProps) => React.ReactNode;
};

const PLANET_DATA: Record<string, PlanetData> = {
  "how-it-works": {
    color: "#3B82F6",
    sizePx: 48,
    radiusPct: 0.9,
    durationSec: 400,
    startDeg: 320,
    glyph: NeptuneGlyph,
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
    sizePx: 62,
    radiusPct: 0.64,
    durationSec: 140,
    startDeg: 140,
    glyph: JupiterGlyph,
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
    sizePx: 34,
    radiusPct: 0.45,
    durationSec: 90,
    startDeg: 70,
    glyph: MarsGlyph,
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
    sizePx: 58,
    radiusPct: 0.74,
    durationSec: 200,
    startDeg: 200,
    glyph: SaturnGlyph,
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
    sizePx: 40,
    radiusPct: 0.34,
    durationSec: 60,
    startDeg: 30,
    glyph: VenusGlyph,
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
    sizePx: 50,
    radiusPct: 0.84,
    durationSec: 280,
    startDeg: 260,
    glyph: UranusGlyph,
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
    sizePx: 30,
    radiusPct: 0.26,
    durationSec: 40,
    startDeg: 0,
    glyph: MercuryGlyph,
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

/* Deferenced starfield layer (70 static spans, optional cheap twinkle). */
const STAR_COUNT = 70;

export default function ExplorePagesSection() {
  const { t, language } = useTranslation();
  const { activePage, navigateTo } = useNavigation();
  const { ecoMode } = useEcoMode();
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const solarRef = useRef<HTMLDivElement>(null);
  const [solarW, setSolarW] = useState(0);

  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

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

  // Deterministic pseudo-random star field.
  const stars = useMemo(() => {
    const arr: Array<{ left: number; top: number; size: number; delay: number; opacity: number }> = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < STAR_COUNT; i++) {
      arr.push({
        left: rnd() * 100,
        top: rnd() * 100,
        size: 0.8 + rnd() * 1.6,
        delay: rnd() * 6,
        opacity: 0.2 + rnd() * 0.6,
      });
    }
    return arr;
  }, []);

  const motionless = ecoMode || reduceMotion;

  const visiblePages = HEADER_PAGES.filter((p) => p.id !== activePage);
  const planets = visiblePages
    .map((page) => ({ page, data: PLANET_DATA[page.id] }))
    .filter((item) => item.data !== undefined);
  const hoveredPlanet = hoveredPageId ? PLANET_DATA[hoveredPageId] : null;
  const hoveredPage = visiblePages.find((p) => p.id === hoveredPageId);
  const halfW = solarW / 2;

  // Place the info card beside the hovered planet, opening "towards the
  // centre" of the container, clamped to its bounds.
  const handlePlanetEnter = (id: string, e: React.MouseEvent<HTMLElement>) => {
    setHoveredPageId(id);
    const cont = solarRef.current;
    if (!cont) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = cont.getBoundingClientRect();
    const px = rect.left - cRect.left + rect.width / 2;
    const py = rect.top - cRect.top + rect.height / 2;
    const CARD_W = 340;
    const CARD_H = 330;
    const towardRight = px < cRect.width / 2;
    let left = towardRight ? px + rect.width / 2 + 30 : px - rect.width / 2 - 30 - CARD_W;
    left = Math.max(18, Math.min(left, cRect.width - CARD_W - 18));
    let top = py - CARD_H / 2;
    top = Math.max(18, Math.min(top, cRect.height - CARD_H - 18));
    setCardPos({ x: left, y: top });
  };

  // Mobile: first tap reveals the fact, second tap navigates.
  const handleCardClick = (page: (typeof HEADER_PAGES)[number]) => (e: React.MouseEvent) => {
    if (hoveredPageId !== page.id) {
      setHoveredPageId(page.id);
      e.preventDefault();
      return;
    }
    navigateTo(page.id);
  };

  // Shared planet-fact block (used inside the desktop overlay card and the
  // expanded mobile card).
  const renderFact = (planet: PlanetData, compact = false) => {
    const Glyph = planet.glyph;
    return (
      <div className="mt-4 pt-4 border-t border-[#3C404A]/40 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Glyph size={compact ? 24 : 28} />
        </div>
        <div className="min-w-0">
          <span className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: planet.color }}>
            {planet.name[language]}
          </span>
          <p className="font-sans text-xs text-gray-300 leading-relaxed mt-1">{planet.fact[language]}</p>
        </div>
      </div>
    );
  };

  // Desktop info card: section content first (badge / title / desc / CTA),
  // then the planet fact below.
  const renderOverlayCard = (page: (typeof HEADER_PAGES)[number], planet: PlanetData) => {
    const Glyph = planet.glyph;
    const desc = PAGE_DESCRIPTIONS[page.id]?.[language] || "";
    const cta = PAGE_CTA[page.id]?.[language] || "";
    return (
      <div
        className="flex flex-col h-full cursor-pointer"
        onClick={(e) => {
          if (hoveredPageId !== page.id) {
            setHoveredPageId(page.id);
            e.preventDefault();
            return;
          }
          navigateTo(page.id);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigateTo(page.id);
          }
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <Glyph size={44} />
          <span
            className="font-mono text-xs tracking-widest font-bold px-3 py-1.5 rounded border"
            style={{ color: planet.color, borderColor: `${planet.color}2E`, backgroundColor: `${planet.color}0D` }}
          >
            {planet.name[language]}
          </span>
        </div>
        <h4 className="font-display font-medium text-lg text-[#F5F5F0] mb-2">{t.pageNames[page.labelKey]}</h4>
        <p className="font-sans text-xs text-gray-400 leading-relaxed mb-4 flex-1">{desc}</p>
        <span className="font-mono text-sm font-bold text-[#3B82F6]">{cta}</span>
        {renderFact(planet)}
      </div>
    );
  };

  // Mobile / tablet card: vertical list item, tap expands the fact in place.
  const renderMobileCard = (page: (typeof HEADER_PAGES)[number]) => {
    const planet = PLANET_DATA[page.id];
    if (!planet) return null;
    const Glyph = planet.glyph;
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
                className="w-11 h-11 rounded-xl bg-[#0A0A0B]/80 border flex items-center justify-center"
                style={{ borderColor: `${planet.color}26` }}
              >
                <Glyph size={30} />
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

          <span className="inline-flex justify-center w-full font-mono text-sm font-bold text-[#3B82F6] group-hover:text-white transition-all mt-4">
            {cta}
          </span>
        </ScanCard>
      </motion.div>
    );
  };

  const orbitAnim = (data: PlanetData): React.CSSProperties =>
    motionless
      ? { transform: `rotate(${data.startDeg}deg)` }
      : {
          animation: `orbit-spin ${data.durationSec}s linear infinite`,
          animationDelay: `${-(data.startDeg / 360) * data.durationSec}s`,
          animationPlayState: "running",
        };

  const counterAnim = (data: PlanetData): React.CSSProperties =>
    motionless
      ? { transform: "rotate(0deg)" }
      : {
          animation: `orbit-spin ${data.durationSec}s linear infinite reverse`,
          animationDelay: `${-(data.startDeg / 360) * data.durationSec}s`,
          animationPlayState: "running",
        };

  return (
    <section
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] select-none"
      id="explore-portal-section"
    >
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#3B82F6]/5 filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#3B82F6]/5 filter blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto flex flex-col items-center">
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

        {/* ---- Desktop: Solar System — Sun at the centre, 7 planets orbiting. ---- */}
        <div
          className="hidden lg:block w-full"
          onMouseLeave={() => {
            setHoveredPageId(null);
            setCardPos(null);
          }}
        >
          <div ref={solarRef} className="relative aspect-square w-full max-w-[920px] mx-auto">
            {/* starfield */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {stars.map((s, i) => (
                <span
                  key={i}
                  className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"}`}
                  style={
                    {
                      left: `${s.left}%`,
                      top: `${s.top}%`,
                      width: s.size,
                      height: s.size,
                      opacity: s.opacity,
                      boxShadow: "0 0 4px rgba(255,255,255,0.5)",
                      animationDelay: `${s.delay}s`,
                      "--star-base": s.opacity,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            {/* orbit rings */}
            {planets.map(({ page, data }) => (
              <div
                key={`ring-${page.id}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82F6]/[0.08] pointer-events-none"
                style={{ width: `${data.radiusPct * 100}%`, height: `${data.radiusPct * 100}%` }}
              />
            ))}

            {/* Sun */}
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

            {/* planets */}
            {solarW > 0 &&
              planets.map(({ page, data }) => {
                const active = hoveredPageId === page.id;
                const dimmed = !ecoMode && hoveredPageId !== null && !active;
                const color = data.color;
                const R = data.radiusPct * halfW;
                const Glyph = data.glyph;
                return (
                  <div key={page.id} className="absolute inset-0 z-10 pointer-events-none" style={orbitAnim(data)}>
                    <div className="absolute left-1/2 top-1/2" style={{ transform: `translateX(${R}px)` }}>
                      <div className="absolute" style={counterAnim(data)}>
                        <div className="absolute -translate-x-1/2 -translate-y-1/2">
                          <motion.button
                            type="button"
                            className="pointer-events-auto flex flex-col items-center gap-1.5 cursor-pointer outline-none"
                            animate={{ opacity: dimmed ? 0.35 : 1, scale: active ? 1.12 : 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onMouseEnter={(e) => handlePlanetEnter(page.id, e)}
                            onFocus={() => setHoveredPageId(page.id)}
                            onClick={() => {
                              if (hoveredPageId === page.id) navigateTo(page.id);
                              else setHoveredPageId(page.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigateTo(page.id);
                              }
                            }}
                            aria-label={t.pageNames[page.labelKey]}
                            aria-expanded={active}
                          >
                            <span
                              className="rounded-full flex items-center justify-center border transition-all"
                              style={{
                                width: data.sizePx + 14,
                                height: data.sizePx + 14,
                                borderColor: `${color}40`,
                                backgroundColor: `${color}0A`,
                                boxShadow: active ? `0 0 24px ${color}40` : undefined,
                              }}
                            >
                              <Glyph size={data.sizePx} />
                            </span>
                            <span
                              className="font-mono text-[9px] tracking-widest uppercase whitespace-nowrap"
                              style={{
                                color: active ? color : "#8B8F9C",
                                textShadow: active ? `0 0 12px ${color}80` : undefined,
                              }}
                            >
                              {data.name[language]}
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* info card beside the hovered planet */}
            <AnimatePresence>
              {!ecoMode && hoveredPlanet && hoveredPage && cardPos && (
                <motion.div
                  key={hoveredPageId}
                  className="absolute z-30 w-[340px] max-w-[calc(100%-36px)] rounded-3xl border bg-[#0A0A0B]/95 backdrop-blur-md p-5 shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
                  style={{ left: cardPos.x, top: cardPos.y, borderColor: `${hoveredPlanet.color}55` }}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {renderOverlayCard(hoveredPage, hoveredPlanet)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-3 mt-10">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] ${motionless ? "" : "animate-ping"} opacity-75`} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]" />
            </span>
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.18em] text-[#8B8F9C]">
              {t.explore.hint}
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
