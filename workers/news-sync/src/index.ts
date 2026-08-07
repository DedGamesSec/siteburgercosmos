interface NewsItem {
  id: string;
  source: "telegram" | "vk";
  date: string;
  text: string;
  url: string;
  imageUrl?: string;
  /** Pre-translated English text, produced once by this worker. */
  en?: string;
}

interface Env {
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  NEWS_PATH?: string;
  TELEGRAM_WEB_URL?: string;
  TELEGRAM_CHANNEL?: string;
  VK_DOMAIN?: string;
  /** Secret */ GITHUB_TOKEN?: string;
  /** Secret */ VK_ACCESS_TOKEN?: string;
}

const VK_API_VERSION = "5.199";
const VK_COUNT = 20;
const MAX_IMAGE_WIDTH = 800;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface RawPost {
  id: string;
  source: "telegram" | "vk";
  date: string;
  text: string;
  url: string;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// Telegram (web preview scraping via regex – no external deps)
// ---------------------------------------------------------------------------

export function extractTelegramBlocks(html: string, channel: string): RawPost[] {
  // Each post is wrapped in `<div class="tgme_widget_message_wrap js-widget_message_wrap">`.
  const wraps = html.split('<div class="tgme_widget_message_wrap js-widget_message_wrap">').slice(1);
  const posts: RawPost[] = [];

  for (const wrap of wraps) {
    // The message root inside the wrap.
    const messageStart = wrap.indexOf('<div class="tgme_widget_message ');
    const slice = messageStart >= 0 ? wrap.slice(messageStart) : "";

    let id = "";
    const dateAnchor = slice.match(/class="tgme_widget_message_date"[^>]*href="([^"]+)"/);
    if (dateAnchor) {
      const cm = dateAnchor[1].match(/\/\d+$/);
      if (cm) id = cm[0].slice(1);
    }
    if (!id) {
      const dp = slice.match(/data-post="([^"]+)"/);
      if (dp) id = (dp[1].split("/").pop() || "").trim();
    }
    if (!id) continue;

    let dateText = "";
    const dt = slice.match(/datetime="([^"]+)"/);
    if (dt) dateText = dt[1];

    const textHtml = slice.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = textHtml ? stripHtml(textHtml[1]) : "";

    const photoMatch = slice.match(/class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*url\((['"])(.*?)\1\)/);
    let imageUrl: string | undefined;
    if (photoMatch) {
      imageUrl = photoMatch[2];
    }

    if (!text && !imageUrl) continue;
    if (/\bpinned\s*«/i.test(text)) continue;

    posts.push({
      id: `tg-${id}`,
      source: "telegram",
      date: dateText || new Date(0).toISOString(),
      text,
      url: `https://t.me/${channel}/${id}`,
      imageUrl,
    });
  }
  return posts;
}

async function fetchTelegramPosts(channel: string, webUrl: string): Promise<RawPost[]> {
  const res = await fetch(webUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TrustNodeNewsSync/1.0)" },
  });
  if (!res.ok) throw new Error(`Telegram web preview responded with HTTP ${res.status}`);
  const html = await res.text();
  return extractTelegramBlocks(html, channel);
}

// ---------------------------------------------------------------------------
// VK
// ---------------------------------------------------------------------------

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
  return best || sizes.find((s) => s.url)?.url;
}

async function fetchVkPosts(token: string, domain: string): Promise<RawPost[]> {
  const params = new URLSearchParams({
    domain,
    count: String(VK_COUNT),
    access_token: token,
    v: VK_API_VERSION,
  });
  const res = await fetch(`https://api.vk.com/method/wall.get?${params.toString()}`);
  if (!res.ok) throw new Error(`VK API responded with HTTP ${res.status}`);
  const json = (await res.json()) as {
    response?: { items?: Array<Record<string, unknown>> };
    error?: { error_msg?: string };
  };
  if (json.error) throw new Error(`VK API error: ${json.error.error_msg || "unknown"}`);
  const items = json.response?.items;
  if (!Array.isArray(items)) throw new Error("VK API returned no items array");

  const posts: RawPost[] = [];
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
    if (firstPhoto) imageUrl = pickBestVkPhoto(firstPhoto.sizes);

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

// ---------------------------------------------------------------------------
// Translation (RU -> EN) via the free Google endpoint (no API key)
// ---------------------------------------------------------------------------

export async function translateText(text: string): Promise<string> {
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

// ---------------------------------------------------------------------------
// GitHub Contents API
// ---------------------------------------------------------------------------

async function readRepoFile(env: Env): Promise<{ content: string; sha: string } | null> {
  const repo = env.GITHUB_REPO!;
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.NEWS_PATH || "src/data/news.json";
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TrustNodeNewsSync/1.0",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { content?: string; sha?: string };
  if (!json.content || !json.sha) return null;
  return { content: decodeBase64(json.content), sha: json.sha };
}

async function writeRepoFile(env: Env, content: string, sha: string | null): Promise<void> {
  const repo = env.GITHUB_REPO!;
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.NEWS_PATH || "src/data/news.json";
  const body: Record<string, unknown> = {
    message: "sync news (worker)",
    content: encodeBase64(content),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TrustNodeNewsSync/1.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
}

function decodeBase64(input: string): string {
  const padded = input.replace(/\s/g, "") + "=".repeat((4 - (input.replace(/\s/g, "").length % 4)) % 4);
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
}

function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

// ---------------------------------------------------------------------------
// Merge + translate
// ---------------------------------------------------------------------------

export function merge(existing: NewsItem[], fresh: RawPost[]): NewsItem[] {
  const combined: NewsItem[] = [...existing];
  for (const p of fresh) {
    const idx = combined.findIndex((it) => it.id === p.id);
    const item: NewsItem = {
      id: p.id,
      source: p.source,
      date: p.date,
      text: p.text,
      url: p.url,
      imageUrl: p.imageUrl || combined[idx]?.imageUrl,
    };
    if (idx >= 0) {
      item.en = combined[idx].en;
      item.text = item.text || combined[idx].text;
      combined[idx] = item;
    } else {
      combined.push(item);
    }
  }
  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return combined;
}

function needsTranslation(item: NewsItem): boolean {
  return !item.en && /[\u0400-\u04FF]/.test(item.text || "");
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

async function runSync(env: Env): Promise<{ ok: boolean; added: number; translated: number; changed: boolean }> {
  const failures: string[] = [];
  const freshTotal: RawPost[] = [];

  const tg = fetchTelegramPosts(env.TELEGRAM_CHANNEL || "TrustNode_team", env.TELEGRAM_WEB_URL || "https://t.me/s/TrustNode_team")
    .then((p) => freshTotal.push(...p))
    .catch((e) => failures.push(`telegram: ${(e as Error).message}`));

  const vk =
    env.VK_ACCESS_TOKEN && env.VK_DOMAIN
      ? fetchVkPosts(env.VK_ACCESS_TOKEN, env.VK_DOMAIN)
          .then((p) => freshTotal.push(...p))
          .catch((e) => failures.push(`vk: ${(e as Error).message}`))
      : Promise.resolve();

  await Promise.all([tg, vk]);
  if (failures.length >= 2) {
    throw new Error(`All sources failed: ${failures.join("; ")}`);
  }

  const before = await readRepoFile(env);
  const existing: NewsItem[] = before ? (JSON.parse(before.content) as NewsItem[]) : [];

  const existingIds = new Set(existing.map((e) => e.id));
  const addedCount = freshTotal.filter((f) => !existingIds.has(f.id)).length;

  const merged = merge(existing, freshTotal);

  let translatedCount = 0;
  for (const item of merged) {
    if (!needsTranslation(item)) continue;
    try {
      item.en = await translateText(item.text || "");
      if (item.en) translatedCount++;
    } catch {
      /* keep item without en */
    }
  }

  const json = JSON.stringify(merged, null, 2) + "\n";
  const changed = addedCount > 0 || translatedCount > 0 || before?.content !== json;
  if (changed) {
    await writeRepoFile(env, json, before?.sha ?? null);
  }

  return { ok: true, added: addedCount, translated: translatedCount, changed };
}

export default {
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    const result = await runSync(env);
    console.log(`news-sync: ok=${result.ok} added=${result.added} translated=${result.translated} changed=${result.changed}`);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const result = await runSync(env);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      const message = (e as Error).message;
      console.error("news-sync failed:", message);
      return new Response(JSON.stringify({ ok: false, error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};