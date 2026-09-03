import { ImageResponse } from "@vercel/og";
import { HEAT, ID, loadEntry } from "./_entry.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36";

// Google Fonts returns a TTF subset containing only `text`, so each image ships a few KB of glyphs.
async function font(text, weight) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`,
    { headers: { "User-Agent": UA } }).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error("font subset unavailable");
  return fetch(url).then((r) => r.arrayBuffer());
}

const h = (type, style, ...children) => ({ type, props: { style: { display: "flex", ...style }, children } });

export default async function handler(request, response) {
  try {
    const id = String(request.query?.id || "");
    const entry = ID.test(id) ? await loadEntry(id) : null;
    if (!entry) return response.status(404).send("Not found");
    const heat = HEAT[entry.heat];
    const prompt = entry.promptPreview.length > 90 ? `${entry.promptPreview.slice(0, 89)}…` : entry.promptPreview;
    const strings = ["Mind Your Tone", `${entry.score}°`, entry.weather, entry.title, entry.displayName, `“${prompt}”`, entry.rankLine, "0123456789"];
    const text = [...new Set(strings.join(""))].join("");
    const [bold, regular] = await Promise.all([font(text, 700), font(text, 400)]);
    const image = new ImageResponse(
      h("div", { width: "100%", height: "100%", background: heat, padding: 48, fontFamily: "Noto Sans KR", color: "#18202b" },
        h("div", { flexDirection: "column", justifyContent: "space-between", width: "100%", background: "#fff", borderRadius: 32, padding: "48px 56px" },
          h("div", { justifyContent: "space-between", fontSize: 28, color: "#597087", fontWeight: 700 },
            h("div", {}, "Mind Your Tone"), h("div", {}, entry.weather)),
          h("div", { alignItems: "baseline", gap: 28 },
            h("div", { fontSize: 168, fontWeight: 700, color: heat, lineHeight: 1 }, `${entry.score}°`),
            h("div", { flexDirection: "column", gap: 6 },
              h("div", { fontSize: 56, fontWeight: 700, color: heat }, entry.title),
              h("div", { fontSize: 36, color: "#597087" }, entry.displayName))),
          h("div", { fontSize: 38, lineHeight: 1.4, maxHeight: 110, overflow: "hidden" }, `“${prompt}”`),
          h("div", { justifyContent: "space-between", fontSize: 30, color: "#597087" },
            h("div", {}, entry.rankLine), h("div", {}, "mind-your-tone.vercel.app")))),
      { width: 1200, height: 630, fonts: [
        { name: "Noto Sans KR", data: bold, weight: 700, style: "normal" },
        { name: "Noto Sans KR", data: regular, weight: 400, style: "normal" }] });
    response.setHeader("Content-Type", "image/png");
    response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return response.status(200).send(Buffer.from(await image.arrayBuffer()));
  } catch (error) {
    console.error(error);
    return response.status(500).send("Image unavailable");
  }
}
