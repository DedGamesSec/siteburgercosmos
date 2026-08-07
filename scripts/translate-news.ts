import { writeFile, readFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../src/data/news.json");

interface NewsItem {
  id: string;
  source: "telegram" | "vk";
  date: string;
  text: string;
  url: string;
  imageUrl?: string;
  en?: string;
}

async function translateText(text: string): Promise<string> {
  const CHUNK = 4000;
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK) {
    const part = text.slice(i, i + CHUNK);
    if (!part.trim()) continue;
    const res = await fetch(
      "https://translate.googleapis.com/translate_a/single?client=gtx" +
        `&sl=ru&tl=en&dt=t&q=${encodeURIComponent(part)}`,
    );
    if (!res.ok) throw new Error(`Translation request failed (${res.status})`);
    const data: unknown = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error("Unexpected translation response shape");
    }
    const translated = (data[0] as unknown[][])
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
      .join("");
    parts.push(translated);
  }
  return parts.join("");
}

async function main() {
  const raw = await readFile(OUTPUT_PATH, "utf-8");
  const items = JSON.parse(raw) as NewsItem[];

  let translated = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.en || !item.text || !/[\u0400-\u04FF]/.test(item.text)) continue;
    try {
      item.en = await translateText(item.text);
      if (item.en) translated++;
      process.stdout.write(`\r[translate-news] ${i + 1}/${items.length} (${translated} translated)`);
    } catch {
      process.stdout.write(`\n[translate-news] skip ${item.id}: ${(await Promise.resolve(new Error("failed"))).message}\n`);
    }
  }
  process.stdout.write("\n");

  await writeFile(OUTPUT_PATH, JSON.stringify(items, null, 2) + "\n", "utf-8");
  console.log(`[translate-news] wrote ${items.length} items (${translated} newly translated) to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error("[translate-news] unexpected failure:", error);
  process.exit(1);
});
