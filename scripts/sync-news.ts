import { writeFile, readFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../src/data/news.json");

const TELEGRAM_WEB_URL = "https://t.me/s/TrustNode_team";
const TELEGRAM_CHANNEL = "TrustNode_team";
const VK_DOMAIN = "trustnode";
const VK_API_VERSION = "5.199";
const VK_COUNT = 20;
const MAX_IMAGE_WIDTH = 800;

interface NewsItem {
  id: string;
  source: "telegram" | "vk";
  date: string;
  text: string;
  url: string;
  imageUrl?: string;
  en?: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrustNodeNewsSync/1.0)" },
    });
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchTelegramPosts(): Promise<NewsItem[]> {
  const res = await fetchWithTimeout(TELEGRAM_WEB_URL);
  if (!res.ok) {
    throw new Error(`Telegram web preview responded with HTTP ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const posts: NewsItem[] = [];

  $(".tgme_widget_message").each((_index, element) => {
    const $msg = $(element);
    const $text = $msg.find(".tgme_widget_message_text").first();
    const $date = $msg.find(".tgme_widget_message_date").first();
    const $photo = $msg.find(".tgme_widget_message_photo_wrap").first();

    let id = "";
    const href = $date.attr("href") || "";
    const idMatch = href.match(/\/\d+$/);
    if (idMatch) {
      id = idMatch[0].slice(1);
    }
    if (!id) {
      const dataPost = $msg.attr("data-post");
      if (dataPost) {
        id = dataPost.split("/").pop() || "";
      }
    }
    if (!id) return;

    const dateText = $date.attr("datetime") || $date.find("time").attr("datetime") || "";
    const text = stripHtml($text.html() || "");
    if (!text && !$photo.length) return;

    // Skip the "pinned message" placeholder that the web preview repeats as a
    // service entry — it duplicates the real post body (see tg-39 / tg-38).
    if (/\bpinned\s*«/i.test(text)) return;

    let imageUrl: string | undefined;
    const bgStyle = $photo.attr("style") || "";
    const bgMatch = bgStyle.match(/url\((['"]?)(.*?)\1\)/);
    if (bgMatch) {
      imageUrl = bgMatch[2];
    }

    posts.push({
      id: `tg-${id}`,
      source: "telegram",
      date: dateText || new Date(0).toISOString(),
      text,
      url: `https://t.me/${TELEGRAM_CHANNEL}/${id}`,
      imageUrl,
    });
  });

  return posts;
}

function pickBestVkPhoto(sizes?: Array<{ width?: number; url?: string }>): string | undefined {
  if (!sizes || !sizes.length) return undefined;
  let best: string | undefined;
  let bestWidth = -1;
  for (const size of sizes) {
    if (!size.url) continue;
    const width = size.width || 0;
    if (width > MAX_IMAGE_WIDTH) continue;
    if (width > bestWidth) {
      bestWidth = width;
      best = size.url;
    }
  }
  return best || (sizes.find((s) => s.url)?.url);
}

async function fetchVkPosts(): Promise<NewsItem[]> {
  const token = process.env.VK_ACCESS_TOKEN;
  if (!token) {
    throw new Error("VK_ACCESS_TOKEN environment variable is not set");
  }
  const params = new URLSearchParams({
    domain: VK_DOMAIN,
    count: String(VK_COUNT),
    access_token: token,
    v: VK_API_VERSION,
  });
  const res = await fetchWithTimeout(`https://api.vk.com/method/wall.get?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`VK API responded with HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    response?: { items?: Array<Record<string, unknown>> };
    error?: { error_msg?: string };
  };
  if (json.error) {
    throw new Error(`VK API error: ${json.error.error_msg || "unknown"}`);
  }
  const items = json.response?.items;
  if (!Array.isArray(items)) {
    throw new Error("VK API returned no items array");
  }

  const posts: NewsItem[] = [];
  for (const item of items) {
    const ownerId = item.owner_id as number | undefined;
    const postId = item.id as number | undefined;
    if (!ownerId || !postId) continue;

    const text = String(item.text || "").trim();
    const date = Number(item.date) || 0;

    let imageUrl: string | undefined;
    const attachments = Array.isArray(item.attachments) ? (item.attachments as Array<Record<string, unknown>>) : [];
    const firstPhoto = attachments.find((a) => a.type === "photo")?.photo as
      | { sizes?: Array<{ width?: number; url?: string }> }
      | undefined;
    if (firstPhoto) {
      imageUrl = pickBestVkPhoto(firstPhoto.sizes);
    }

    posts.push({
      id: `vk-${ownerId}_${postId}`,
      source: "vk",
      date: new Date(date * 1000).toISOString(),
      text,
      url: `https://vk.com/wall${ownerId}_${postId}`,
      imageUrl,
    });
  }
  return posts;
}

async function loadExisting(): Promise<NewsItem[]> {
  try {
    const raw = await readFile(OUTPUT_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as NewsItem[]) : [];
  } catch {
    return [];
  }
}

async function main() {
  const existing = await loadExisting();
  const failed: string[] = [];
  const results: Array<NewsItem[]> = [];

  const tgPromise = fetchTelegramPosts()
    .then((posts) => {
      results.push(posts);
      console.log(`[telegram] parsed ${posts.length} posts`);
    })
    .catch((error) => {
      failed.push("telegram");
      console.error("[telegram] failed:", (error as Error).message);
    });

  const vkPromise = fetchVkPosts()
    .then((posts) => {
      results.push(posts);
      console.log(`[vk] parsed ${posts.length} posts`);
    })
    .catch((error) => {
      failed.push("vk");
      console.error("[vk] failed:", (error as Error).message);
    });

  await Promise.all([tgPromise, vkPromise]);

  if (failed.length === 2) {
    console.error("[sync-news] both sources failed; aborting without overwriting news.json");
    process.exit(1);
  }

  let combined: NewsItem[] = [...existing];
  for (const posts of results) {
    const existingById = new Map(combined.map((item) => [item.id, item]));
    combined = combined.filter((item) => !posts.some((p) => p.id === item.id));
    for (const p of posts) {
      const prev = existingById.get(p.id);
      combined.push({
        ...p,
        // Preserve server-generated translations across re-parses.
        en: prev?.en,
        // Refresh the image URL when the CDN link is regenerated live.
        imageUrl: p.imageUrl || prev?.imageUrl,
      });
    }
  }

  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  await writeFile(OUTPUT_PATH, JSON.stringify(combined, null, 2) + "\n", "utf-8");
  console.log(`[sync-news] wrote ${combined.length} items to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error("[sync-news] unexpected failure:", error);
  process.exit(1);
});
