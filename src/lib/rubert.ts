import * as ort from "onnxruntime-web/wasm";

const BASE = typeof import.meta !== "undefined" ? import.meta.env.BASE_URL : "/";
const VOCAB_URL = `${BASE}models/vocab.txt`;
const MODEL_URL = `${BASE}models/rubert_fraud_merged_int8.onnx`;

const MAX_SEQ_LEN = 512;
const TOKEN_PAD = "[PAD]";
const TOKEN_UNK = "[UNK]";
const TOKEN_CLS = "[CLS]";
const TOKEN_SEP = "[SEP]";

// Single-threaded WASM. Multi-threading requires COOP/COEP headers which
// GitHub Pages cannot serve. Vite bundles the single-threaded pthread module
// inline and rewrites the ort-wasm-simd-threaded.wasm asset URL itself, so we
// must NOT set env.wasm.wasmPaths (that would force an external .mjs import).
ort.env.wasm.numThreads = 1;

export interface RubertProbs {
  neutral: number;
  fraud: number;
  hardNeg: number;
}

export interface RubertResult {
  probs: RubertProbs;
  verdict: 0 | 1 | 2;
  inputTokens: string[];
  latencyMs: number;
}

let vocabPromise: Promise<Map<string, number>> | null = null;
let sessionPromise: Promise<ort.InferenceSession> | null = null;
let loadProgress = 0;

export function getLoadProgress(): number {
  return loadProgress;
}

async function fetchTextWithProgress(url: string, onStep?: (done: number) => void): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const total = Number(res.headers.get("content-length") || 0);
  const reader = res.body?.getReader();
  if (!reader || !total) return await res.text();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onStep?.(received / total);
    }
  }
  const blob = new Blob(chunks);
  return await blob.text();
}

async function loadVocab(): Promise<Map<string, number>> {
  const text = await fetchTextWithProgress(VOCAB_URL, (p) => {
    loadProgress = 0.05 + p * 0.2;
  });
  const lines = text.split("\n");
  const map = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const token = lines[i].trim();
    if (token.length > 0) map.set(token, i);
  }
  return map;
}

async function getVocab(): Promise<Map<string, number>> {
  if (!vocabPromise) vocabPromise = loadVocab();
  return vocabPromise;
}

async function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      loadProgress = 0.3;
      const res = await fetch(MODEL_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status} for model`);
      const total = Number(res.headers.get("content-length") || 0);
      const reader = res.body?.getReader();
      if (!reader || !total) {
        const buf = await res.arrayBuffer();
        loadProgress = 1;
        return ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });
      }
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          loadProgress = 0.3 + (received / total) * 0.65;
        }
      }
      const blob = new Blob(chunks);
      const buf = await blob.arrayBuffer();
      loadProgress = 0.95;
      const session = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });
      loadProgress = 1;
      return session;
    })();
  }
  return sessionPromise;
}

function splitBasicTokens(text: string): string[] {
  const out: string[] = [];
  const re = /[\p{L}\p{N}_]+|[^\p{L}\p{N}\s]/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[0]);
  }
  return out;
}

function wordPieceEncode(word: string, vocab: Map<string, number>): string[] {
  if (vocab.has(word)) return [word];
  const pieces: string[] = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let found = "";
    while (end > start) {
      const sub = word.slice(start, end);
      const candidate = start === 0 ? sub : `##${sub}`;
      if (vocab.has(candidate)) {
        found = candidate;
        break;
      }
      end--;
    }
    if (!found) return [TOKEN_UNK];
    pieces.push(found);
    start += found.length - (start === 0 ? 0 : 2);
  }
  return pieces;
}

function encodeText(text: string, vocab: Map<string, number>): { ids: bigint[]; mask: bigint[]; tokens: string[] } {
  const basic = splitBasicTokens(text.trim());
  const pieces: string[] = [];
  for (const w of basic) {
    for (const p of wordPieceEncode(w, vocab)) {
      if (pieces.length + 2 >= MAX_SEQ_LEN) break;
      pieces.push(p);
    }
    if (pieces.length + 2 >= MAX_SEQ_LEN) break;
  }
  const tokens = [TOKEN_CLS, ...pieces, TOKEN_SEP];
  const ids = tokens.map((t) => BigInt(vocab.get(t) ?? vocab.get(TOKEN_UNK) ?? 1));
  const mask = ids.map(() => 1n);
  return { ids, mask, tokens };
}

export async function preloadRubert(): Promise<void> {
  await Promise.all([getVocab(), getSession()]);
}

export async function resetRubert(): Promise<void> {
  vocabPromise = null;
  sessionPromise = null;
  loadProgress = 0;
}

export async function classifyText(text: string): Promise<RubertResult> {
  const vocab = await getVocab();
  const session = await getSession();
  const { ids, mask, tokens } = encodeText(text, vocab);

  const inputIds = new ort.Tensor("int64", BigInt64Array.from(ids), [1, ids.length]);
  const attentionMask = new ort.Tensor("int64", BigInt64Array.from(mask), [1, mask.length]);

  const t0 = performance.now();
  const feeds = { input_ids: inputIds, attention_mask: attentionMask };
  const output = await session.run(feeds);
  const latencyMs = performance.now() - t0;

  const logits = output.logits.data as Float32Array;
  const raw = Array.from(logits);
  const max = Math.max(...raw);
  const exps = raw.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((v) => v / sum);

  const verdict = probs.indexOf(Math.max(...probs)) as 0 | 1 | 2;
  return {
    probs: {
      neutral: probs[0],
      fraud: probs[1],
      hardNeg: probs[2],
    },
    verdict,
    inputTokens: tokens,
    latencyMs,
  };
}
