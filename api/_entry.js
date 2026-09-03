import { database, rankOf } from "./rankings.js";
import TITLES from "../plugins/mind-your-tone/titles.json" with { type: "json" };

export const WEATHER = {
  ko: ["🍃 산들바람", "🌤 쾌적", "🌡 후끈", "🔥 폭염", "🌋 분화"],
  en: ["🍃 Breeze", "🌤 Fair", "🌡 Warm", "🔥 Heatwave", "🌋 Eruption"],
};
export const HEAT = ["#2a9d6f", "#4fa3c7", "#d99a2b", "#e0612f", "#b3261e"];
export const ID = /^[A-Za-z0-9-]{8,100}$/;

// Loads one published entry with its ranks and display strings, or null.
export async function loadEntry(id) {
  const { sql, ready } = database();
  await ready;
  const [entry] = await sql`SELECT id, display_name AS "displayName", prompt_preview AS "promptPreview", source, score,
    title AS "titleKey", lang, created_at AS "createdAt" FROM rankings WHERE id = ${id}`;
  if (!entry) return null;
  const { rank, politeRank } = await rankOf(sql, entry);
  const heat = Math.min(4, Math.floor(entry.score / 20));
  const ko = entry.lang === "ko";
  return {
    ...entry, rank, politeRank, heat,
    weather: WEATHER[entry.lang][heat],
    title: TITLES[entry.titleKey]?.[entry.lang] ?? entry.titleKey,
    rankLine: ko ? `뜨거운 순 ${rank}위 · 온화한 순 ${politeRank}위` : `Hottest #${rank} · Mildest #${politeRank}`,
    order: entry.score < 50 ? "polite" : "rude",
  };
}
