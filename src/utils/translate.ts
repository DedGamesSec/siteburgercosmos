const MEMORY_CACHE = new Map<string, string>();
const LS_PREFIX = "trustnode_news_t:";

const GOOGLE_TL_MAP: Record<string, string> = {
  zh: "zh-CN",
};

function sourceHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export async function translateText(
  text: string,
  targetLang: string,
  cacheKey: string,
): Promise<string> {
  const tl = GOOGLE_TL_MAP[targetLang] || targetLang;
  const key = `${tl}:${cacheKey}:${sourceHash(text)}`;

  const mem = MEMORY_CACHE.get(key);
  if (mem) return mem;

  try {
    const stored = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (stored) {
      MEMORY_CACHE.set(key, stored);
      return stored;
    }
  } catch {}

  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx" +
    `&sl=ru&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Translation request failed (${res.status})`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected translation response shape");
  }

  const translated = (data[0] as unknown[][])
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("");

  MEMORY_CACHE.set(key, translated);
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, translated);
  } catch {}
  return translated;
}
