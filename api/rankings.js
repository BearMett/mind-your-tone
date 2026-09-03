import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const POW_PREFIX = "0000";
const TONES = new Set(["courteous", "direct", "impatient", "sarcastic", "disappointed", "explosive"]);
const TITLES = new Set([
  "매너 있는 동료", "정중한 독설가", "존댓말 암살자", "단도직입", "명령문 장인", "군더더기 파괴자",
  "조금 급한 사람", "마감의 지배자", "당장 대령하라", "은근한 한마디", "칭찬인 줄 알았지?", "비꼼의 대가",
  "작은 한숨", "한숨 수집가", "실망의 군주", "키보드 온도 상승", "키보드 화산", "프롬프트 폭군",
  "극존칭 폭군", "인간 최종 보스", "톤 수집가", "육각형 폭군",
]);
const LIMIT = 20;
let ready;

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const sql = neon(process.env.DATABASE_URL);
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS rankings (
        id text PRIMARY KEY,
        display_name varchar(32) NOT NULL,
        prompt_preview varchar(280) NOT NULL,
        source varchar(16) NOT NULL CHECK (source IN ('codex', 'claude')),
        receiver_score smallint NOT NULL CHECK (receiver_score BETWEEN 0 AND 100),
        judge_score smallint NOT NULL CHECK (judge_score BETWEEN 0 AND 100),
        score smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
        tone varchar(24) NOT NULL,
        title varchar(32) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`ALTER TABLE rankings ADD COLUMN IF NOT EXISTS ip_hash text NOT NULL DEFAULT 'legacy'`;
    await sql`ALTER TABLE rankings ADD COLUMN IF NOT EXISTS tone varchar(24) NOT NULL DEFAULT 'direct'`;
    await sql`ALTER TABLE rankings ADD COLUMN IF NOT EXISTS title varchar(32) NOT NULL DEFAULT '단도직입'`;
    await sql`CREATE INDEX IF NOT EXISTS rankings_created_at_idx ON rankings (created_at)`;
  })();
  return { sql, ready };
}

export function maskText(value) {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[opusr]_[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16})\b/g, "[SECRET]")
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]")
    .replace(/(?:\/Users|\/home)\/[^\s/]+/g, "[HOME]")
    .replace(/\b(token|password|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[SECRET]")
    .replace(/([?&](?:token|key|secret|password)=)[^&#\s]+/gi, "$1[SECRET]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

export function validateEntry(input) {
  const displayName = typeof input?.displayName === "string" ? input.displayName.trim() : "";
  const promptPreview = typeof input?.promptPreview === "string" ? maskText(input.promptPreview) : "";
  const { id, receiverScore, judgeScore, source, tone, title } = input ?? {};
  if (typeof id !== "string" || !/^[A-Za-z0-9-]{8,100}$/.test(id)) return { error: "invalid id" };
  if (!displayName || displayName.length > 32) return { error: "displayName must be 1-32 characters" };
  if (!promptPreview) return { error: "promptPreview must be 1-280 characters" };
  if (!["codex", "claude"].includes(source)) return { error: "source must be codex or claude" };
  if (!TONES.has(tone)) return { error: "invalid tone" };
  if (!TITLES.has(title)) return { error: "invalid title" };
  if (![receiverScore, judgeScore].every((score) => Number.isInteger(score) && score >= 0 && score <= 100)) {
    return { error: "scores must be integers from 0 to 100" };
  }
  return { value: { id, displayName, promptPreview, source, receiverScore, judgeScore, tone, title,
    score: Math.round((receiverScore + judgeScore) / 2) } };
}

export function verifyProof(id, proof, now = Date.now()) {
  const timestamp = proof?.timestamp;
  const nonce = String(proof?.nonce ?? "");
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(now / 1000) - timestamp) > 300 || !/^\d{1,20}$/.test(nonce)) return false;
  return createHash("sha256").update(`${id}:${timestamp}:${nonce}`).digest("hex").startsWith(POW_PREFIX);
}

function siteUrl(request) {
  const host = request.headers["x-forwarded-host"] || request.headers.host || "mind-your-tone.vercel.app";
  return `${request.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

async function rankOf(sql, entry) {
  const [rude, polite] = await Promise.all([
    sql`SELECT count(*)::int + 1 AS rank FROM rankings
        WHERE score > ${entry.score} OR (score = ${entry.score} AND created_at < ${entry.createdAt})`,
    sql`SELECT count(*)::int + 1 AS rank FROM rankings
        WHERE score < ${entry.score} OR (score = ${entry.score} AND created_at < ${entry.createdAt})`,
  ]);
  return { rank: rude[0].rank, politeRank: polite[0].rank };
}

function authorized(request) {
  const expected = process.env.RANKING_WRITE_TOKEN;
  const actual = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!expected || !actual) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default async function handler(request, response) {
  try {
    const { sql, ready: initialized } = database();
    await initialized;

    if (request.method === "GET") {
      const polite = request.query?.order === "polite";
      let page = Math.min(100, Math.max(1, Number.parseInt(request.query?.page || "1", 10) || 1));
      let highlight = null;
      const highlightId = typeof request.query?.highlight === "string" ? request.query.highlight : "";
      if (/^[A-Za-z0-9-]{8,100}$/.test(highlightId)) {
        const [entry] = await sql`SELECT score, created_at AS "createdAt" FROM rankings WHERE id = ${highlightId}`;
        if (entry) {
          const ranks = await rankOf(sql, entry);
          highlight = { id: highlightId, rank: polite ? ranks.politeRank : ranks.rank };
          page = Math.min(100, Math.ceil(highlight.rank / LIMIT));
        }
      }
      response.setHeader("Cache-Control", highlight ? "no-store" : "public, s-maxage=30, stale-while-revalidate=60");
      const offset = (page - 1) * LIMIT;
      const [rows, [{ count }]] = await Promise.all([
        polite
          ? sql`SELECT id, display_name AS "displayName", prompt_preview AS "promptPreview", source, score, tone, title, created_at AS "createdAt"
                FROM rankings ORDER BY score ASC, created_at ASC LIMIT ${LIMIT} OFFSET ${offset}`
          : sql`SELECT id, display_name AS "displayName", prompt_preview AS "promptPreview", source, score, tone, title, created_at AS "createdAt"
                FROM rankings ORDER BY score DESC, created_at ASC LIMIT ${LIMIT} OFFSET ${offset}`,
        sql`SELECT count(*)::int AS count FROM rankings`,
      ]);
      return response.status(200).json({ entries: rows, page, pages: Math.min(100, Math.max(1, Math.ceil(count / LIMIT))),
        total: count, order: polite ? "polite" : "rude", highlight });
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      return response.status(405).json({ error: "Method not allowed" });
    }
    response.setHeader("Cache-Control", "no-store");
    if (Number(request.headers["content-length"] || 0) > 4096 || JSON.stringify(request.body ?? {}).length > 4096) {
      return response.status(413).json({ error: "Payload too large" });
    }

    const parsed = validateEntry(request.body);
    if (parsed.error) return response.status(400).json({ error: parsed.error });
    if (!authorized(request) && !verifyProof(parsed.value.id, request.body?.proof)) {
      return response.status(401).json({ error: "Invalid or expired proof" });
    }
    if (!process.env.RANKING_IP_SALT) throw new Error("RANKING_IP_SALT is not configured");
    const ip = String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const ipHash = createHmac("sha256", process.env.RANKING_IP_SALT).update(ip).digest("hex");
    const [usage] = await sql`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE ip_hash = ${ipHash})::int AS "byIp"
      FROM rankings WHERE created_at > now() - interval '1 hour'`;
    if (usage.total >= 200 || usage.byIp >= 20) return response.status(429).json({ error: "Rate limit exceeded" });

    const entry = parsed.value;
    const rows = await sql`
      INSERT INTO rankings (id, display_name, prompt_preview, source, receiver_score, judge_score, score, tone, title, ip_hash)
      VALUES (${entry.id}, ${entry.displayName}, ${entry.promptPreview}, ${entry.source},
              ${entry.receiverScore}, ${entry.judgeScore}, ${entry.score}, ${entry.tone}, ${entry.title}, ${ipHash})
      ON CONFLICT (id) DO NOTHING
      RETURNING id, display_name AS "displayName", prompt_preview AS "promptPreview",
                source, score, tone, title, created_at AS "createdAt"`;
    if (!rows[0]) return response.status(409).json({ error: "Already submitted" });
    const ranks = await rankOf(sql, rows[0]);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM rankings`;
    const order = rows[0].score < 50 ? "polite" : "rude";
    return response.status(201).json({ ...rows[0], ...ranks, total: count,
      url: `${siteUrl(request)}/?order=${order}&highlight=${rows[0].id}` });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Ranking service unavailable" });
  }
}
