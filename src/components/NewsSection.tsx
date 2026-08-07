import { useState } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Send, ExternalLink } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";
import newsData from "../data/news.json";
import type { NewsItem } from "../vite-env";

const NEWS_POST_LIMIT = 5;

const news: NewsItem[] = (newsData as NewsItem[])
  .slice()
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, NEWS_POST_LIMIT);

const VK_ICON_PATH = "M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.576-1.496c.588-.19 1.341 1.26 2.14 1.818.605.423 1.064.33 1.064.33l2.137-.03s1.117-.071.588-.964c-.043-.073-.308-.661-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.13.079-.213.262-.213.262s-.383 1.018-.892 1.884c-1.075 1.828-1.505 1.925-1.681 1.812-.408-.263-.306-1.06-.306-1.625 0-1.766.268-2.502-.52-2.693-.262-.064-.454-.105-1.123-.112-.858-.01-1.585.003-1.996.204-.274.134-.486.433-.357.45.159.021.519.097.71.317.246.284.237.923.237.923s.142 1.758-.331 1.977c-.325.15-.77-.156-1.234-.779-.295-.375-.578-1.02-.578-1.02s-.105-.214-.295-.231c-.194-.02-.468.003-.468.003s-1.337.02-1.798.044c-.326.017-.445.218-.322.46.125.25.808 1.98 2.202 3.32 1.168 1.128 2.27 1.01 2.27 1.01z";

const LINK_REGEX = /(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}[^\s<>"']*/gi;

function renderTextWithLinks(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = new RegExp(LINK_REGEX.source, "gi");
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let i = 0;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const before = start > 0 ? text[start - 1] : "";
    const isBounded = before === "" || !/[A-Za-z0-9@]/.test(before);
    const raw = match[0];

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    if (isBounded) {
      let url = raw;
      let trailing = "";
      const stripped = url.replace(/[.,;:!?)\]}>"'’]+$/, (m) => {
        trailing = m;
        return "";
      });
      if (stripped) {
        url = stripped;
      }
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

      parts.push(
        <a
          key={`${keyPrefix}-link-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3B82F6] underline decoration-[#3B82F6]/40 underline-offset-2 hover:text-white hover:decoration-white transition-colors break-all"
        >
          {url}
        </a>,
      );
      if (trailing) {
        parts.push(trailing);
      }
      i++;
    } else {
      parts.push(raw);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function SourceBadge({ source }: { source: "telegram" | "vk" }) {
  if (source === "telegram") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2AABEE]/10 border border-[#2AABEE]/30 text-[#7EC9F2]">
        <Send className="w-3 h-3" />
        <span className="font-mono text-[10px] font-bold tracking-wider uppercase">Telegram</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0077FF]/10 border border-[#0077FF]/30 text-[#7EB6FF]">
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
        <path d={VK_ICON_PATH} />
      </svg>
      <span className="font-mono text-[10px] font-bold tracking-wider uppercase">VK</span>
    </span>
  );
}

export default function NewsSection() {
  const { t, language } = useTranslation();
  const { ecoMode } = useEcoMode();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isEnglish = language === "en";

  if (!Array.isArray(news) || news.length === 0) {
    return (
      <section
        className="relative w-full py-16 sm:py-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B] overflow-hidden"
        id="news"
      >
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <SectionBadge variant="pill" label={t.news.badge} className="mb-6" />
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {t.news.title}
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3C404A] border border-[#3B82F6]/20 font-mono text-[11px] text-gray-400">
            {t.news.emptyTitle}
          </div>
          <p className="font-sans text-xs text-gray-600 mt-4 max-w-md mx-auto leading-relaxed">
            {t.news.emptyDesc}
          </p>
        </div>
      </section>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    try {
      return new Intl.DateTimeFormat(language, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  };

  return (
    <section
        className="relative w-full py-16 sm:py-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B] overflow-hidden"
        id="news"
      >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <SectionBadge variant="pill" label={t.news.badge} className="mb-6" />
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {t.news.title}
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {news.map((item, index) => {
            const isExpanded = expandedIds.has(item.id);
            const displayedText = isEnglish ? (item.en ?? item.text) : item.text;
            const isLong = displayedText.length > 220;
            return (
              <motion.article
                key={item.id}
                initial={ecoMode ? false : { opacity: 0, y: 20 }}
                whileInView={ecoMode ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2), ease: "easeOut" }}
                className={`rounded-md border bg-[#12141A] p-5 sm:p-6 ${
                  isExpanded ? "border-[#3B82F6]/30" : "border-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <SourceBadge source={item.source} />
                  <span className="font-mono text-[11px] text-gray-500">{formatDate(item.date)}</span>
                </div>

                <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {item.imageUrl && (
                  <div className="mb-4 rounded-md overflow-hidden border border-white/[0.04] flex justify-center bg-[#12141A]">
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="mx-auto h-auto max-w-full w-auto object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <p
                  className={`font-sans text-sm text-gray-300 leading-relaxed whitespace-pre-line ${
                    isLong && !isExpanded ? "line-clamp-4" : ""
                  }`}
                  lang={isEnglish && item.en ? "en" : "ru"}
                >
                  {renderTextWithLinks(displayedText, item.id)}
                </p>

                {isLong && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="mt-3 font-mono text-[11px] font-bold tracking-wider text-[#3B82F6] hover:text-white transition-colors uppercase cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? t.news.showLess : t.news.showMore}
                  </button>
                )}

                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-gray-400 hover:text-[#3B82F6] transition-colors uppercase"
                  >
                    {t.news.readIn.replace("{source}", item.source === "telegram" ? "Telegram" : "VK")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
