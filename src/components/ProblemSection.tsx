import React from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";
import { Eye, ShieldOff, WifiOff } from "lucide-react";

// One shared, endless "news feed" about phone fraud. Each hole in the
// colander shows the SAME feed, but a different slice of it (negative
// animation-delay shifts the visible part), so it reads like the same
// video running in every window at once.
const NEWS_TICKER: Record<string, string[]> = {
  ru: [
    "Мошенники звонят от имени банка — как распознать обман",
    "Ваши разговоры уходят в облако: утечка логов под запись",
    "Без интернета защита молчит — 7 из 10 жертв остаются без помощи",
    "Соц-инженерия: взламывают не телефон, а человека",
    "Централизованные антифрод-базы устаревают за 48 часов",
    "Звонок «из службы безопасности» — самая массовая схема года",
    "Доверчивость обходится дороже троянов: цифры ущерба",
    "Приложения «шпионят» через микрофон — приватность под угрозой",
  ],
  en: [
    "Scammers call pretending to be your bank — how to spot the lie",
    "Your calls are uploaded to the cloud: logs leaked on record",
    "Offline means unprotected — 7 of 10 victims left without help",
    "Social engineering: they hack the human, not the phone",
    "Centralized anti-fraud databases go stale within 48 hours",
    "\"Security service\" calls — the biggest scam of the year",
    "Blind trust costs more than trojans: real damage numbers",
    "Apps \"spy\" through the microphone — privacy at risk",
  ],
  es: [
    "Los estafadores llaman en nombre de su banco — cómo detectar el engaño",
    "Sus llamadas van a la nube: fuga de registros grabados",
    "Sin internet la protección calla — 7 de 10 víctimas quedan solas",
    "Ingeniería social: hackean a la persona, no al teléfono",
    "Las bases antifraude centralizadas caducan en 48 horas",
    "Llamada \"del servicio de seguridad\" — el timo más masivo del año",
    "La confianza ciega cuesta más que los troyanos",
    "Las apps \"espían\" por el micrófono — privacidad en riesgo",
  ],
  zh: [
    "骗子冒充银行来电——如何识破骗局",
    "你的通话被上传云端：日志泄露有记录",
    "断网即失守——10个受害者中7个无人可依",
    "社会工程学：他们黑的是人，不是手机",
    "集中式反欺诈库48小时内就过时",
    "“安全部门”来电——今年最大规模骗局",
    "盲目信任比木马更贵：真实损失数据",
    "应用借麦克风“窃听”——隐私岌岌可危",
  ],
  tr: [
    "Dolandırıcılar bankanızın adını kullanarak arıyor — yalanı nasıl anlarsınız",
    "Görüşmeleriniz buluta gidiyor: kayıtlar sızdırılıyor",
    "İnternet yoksa koruma da yok — 10 kurbandan 7'si yalnız kalıyor",
    "Sosyal mühendislik: hacklenen telefon değil, insan",
    "Merkezi dolandırıcılık veritabanları 48 saatte eskir",
    "\"Güvenlik servisi\" araması — yılın en büyük dolandırıcılığı",
    "Kör güven virüslerden daha pahalıya mal olur",
    "Uygulamalar mikrofonla \"casusluk\" yapıyor — gizlilik tehlikede",
  ],
  hi: [
    "धोखेबाज़ बैंक के नाम पर कॉल करते हैं — झूठ कैसे पकड़ें",
    "आपकी कॉल क्लाउड पर अपलोड होती हैं: लॉग लीक",
    "इंटरनेट नहीं तो सुरक्षा नहीं — 10 में से 7 पीड़ित अकेले",
    "सोशल इंजीनियरिंग: फोन नहीं, इंसान हैक होता है",
    "केंद्रीय एंटी-फ्रॉड डेटाबेस 48 घंटे में पुराने हो जाते हैं",
    "\"सुरक्षा विभाग\" का कॉल — साल की सबसे बड़ी धोखाधड़ी",
    "अंधा भरोसा ट्रोजन से महंगा पड़ता है",
    "ऐप्स माइक्रोफ़ोन से \"जासूसी\" करते हैं — गोपनीयता खतरे में",
  ],
  ar: [
    "المحتالون يتصلون باسم البنك — كيف تكشف الكذب",
    "مكالماتك تذهب إلى السحابة: تسريب السجلات",
    "بدون إنترنت تتوقف الحماية — 7 من 10 ضحايا يبقون وحدهم",
    "الهندسة الاجتماعية: لا يخترقون الهاتف بل الإنسان",
    "قواعد مكافحة الاحتيال المركزية تقادم خلال 48 ساعة",
    "مكالمة \"خدمة الأمن\" — أكبر احتيال في السنة",
    "الثقة العمياء تكلف أكثر من أحصنة طروادة",
    "التطبيقات تتجسس عبر الميكروفون — الخصوصية في خطر",
  ],
  pt: [
    "Golpistas ligam em nome do banco — como identificar a mentira",
    "Suas chamadas vão para a nuvem: logs vazados",
    "Sem internet, proteção calada — 7 de 10 vítimas ficam sozinhas",
    "Engenharia social: hackeiam a pessoa, não o telefone",
    "Bases antifraude centralizadas ficam obsoletas em 48 horas",
    "Chamada do \"serviço de segurança\" — o golpe do ano",
    "Confiança cega custa mais que trojans",
    "Aplicativos \"espionam\" pelo microfone — privacidade em risco",
  ],
  fr: [
    "Des escrocs appellent au nom de votre banque — comment déceler le mensonge",
    "Vos appels partent dans le cloud : journaux divulgués",
    "Sans réseau, la protection se tait — 7 victimes sur 10 restent seules",
    "Ingénierie sociale : on pirate la personne, pas le téléphone",
    "Les bases antifraude centralisées périclitent en 48 h",
    "L'appel \"du service de sécurité\" — l'arnaque de l'année",
    "La confiance aveugle coûte plus cher que les trojans",
    "Les apps \"espionnent\" via le micro — vie privée menacée",
  ],
  de: [
    "Betrüger rufen im Namen Ihrer Bank an — wie Sie die Lüge erkennen",
    "Ihre Gespräche gehen in die Cloud: Logs werden geleakt",
    "Ohne Netz schweigt der Schutz — 7 von 10 Opfern bleiben allein",
    "Social Engineering: gehackt wird der Mensch, nicht das Handy",
    "Zentrale Anti-Fraud-Datenbanken veralten in 48 Stunden",
    "Der Anruf vom \"Sicherheitsdienst\" — der größte Betrug des Jahres",
    "Blindes Vertrauen kostet mehr als Trojaner",
    "Apps \"spionieren\" übers Mikrofon — Privatsphäre in Gefahr",
  ],
  ja: [
    "銀行を名乗る詐欺電話 — 嘘の見抜き方",
    "通話がクラウドへ流出：ログ漏えいの実態",
    "オフラインで防御は沈黙 — 10人中7人が無援",
    "ソーシャルエンジニアリング：ハックされるのは人",
    "集中型の不正対策DBは48時間で陳腐化",
    "「セキュリティサービス」の電話 — 今年最大の詐欺",
    "盲信はトロイの木馬より高くつく",
    "アプリがマイクで「盗聴」— プライバシー危機",
  ],
};

const HOLE_ICONS = [Eye, ShieldOff, WifiOff];

// Zigzag positions of the three holes across the stage (desktop).
const HOLE_POSITIONS = [
  { className: "md:left-[4%] md:top-0", delay: 0 },
  { className: "md:right-[4%] md:top-[30%]", delay: 6 },
  { className: "md:left-[7%] md:bottom-[2%]", delay: 12 },
];

const ProblemSection = React.memo(function ProblemSection() {
  const { t, language } = useTranslation();
  const { ecoMode } = useEcoMode();
  const news = NEWS_TICKER[language] || NEWS_TICKER.en;
  const problems = t.problem.items.map((item) => item.title);

  // Two copies of the feed make the vertical scroll loop seamless.
  const feedItems = [...news, ...news];

  return (
    <section
      className="relative w-full py-16 sm:py-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B] overflow-hidden"
      id="problem"
    >
      {/* Background glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <SectionBadge variant="brackets" label={t.problem.badge} className="mb-6" />

          <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {t.problem.titleLine1} <br className="hidden sm:inline" />
            <span className="text-[#3B82F6]">{t.problem.titleHighlight}</span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.problem.subtitle}
          </p>
        </div>

        {/* The colander: a dirty sheet with three holes punched in it.
            Through each hole you see the SAME live news feed running
            underneath — different slices of one endless video. */}
        <div className="relative md:h-[920px] flex flex-col gap-10 md:block">
          {/* The sheet itself (everything except the holes is the site) */}
          <div
            className="absolute inset-0 rounded-2xl border border-[#3C404A]/30 bg-[#0A0A0B] pointer-events-none hidden md:block"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          {problems.map((problemTitle, i) => {
            const Icon = HOLE_ICONS[i];
            const position = HOLE_POSITIONS[i];
            return (
              <div
                key={`hole-${i}`}
                className={`relative w-full md:w-[46%] ${position.className}`}
              >
                {/* Caption on the sheet, next to the hole */}
                <div className="flex items-center gap-2 mb-3 md:absolute md:-top-9 md:left-0">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-gray-500">
                    {String(i + 1).padStart(2, "0")} / {t.problem.badge}
                  </span>
                </div>

                {/* The hole — a torn window into the feed */}
                <div
                  className="relative h-56 sm:h-64 md:h-72 rounded-2xl overflow-hidden border border-dashed border-[#3C404A]/70 bg-[#12141A]/80"
                  style={{
                    boxShadow:
                      "inset 0 0 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.4), 0 20px 40px -20px rgba(0,0,0,0.8)",
                  }}
                >
                  {/* Torn / charred inner rim */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      boxShadow:
                        "inset 0 0 0 2px rgba(59,130,246,0.08), inset 0 0 30px rgba(0,0,0,0.85)",
                    }}
                  />
                  {/* Scanline sheen so the "video" feels like a feed */}
                  <div className="absolute inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_4px)]" />
                  {/* Corner tag */}
                  <div className="absolute top-2 left-3 z-20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-red-400 uppercase">
                      {t.problem.badge}
                    </span>
                  </div>

                  {/* The endless feed, one copy per hole, shifted in time */}
                  <div className="absolute inset-0 p-4 font-mono overflow-hidden">
                    <div
                      className="flex flex-col gap-3"
                      style={{
                        animation: ecoMode ? "none" : "newsScroll 40s linear infinite",
                        animationDelay: `-${position.delay}s`,
                      }}
                    >
                      {feedItems.map((headline, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <Icon className="w-3 h-3 mt-0.5 text-red-400 shrink-0" />
                          <span className="text-[11px] sm:text-xs leading-snug text-gray-300">
                            {headline}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default ProblemSection;
