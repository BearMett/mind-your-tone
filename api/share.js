import { siteUrl } from "./rankings.js";
import { ID, loadEntry } from "./_entry.js";

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Per-entry share page: crawlers read the OG tags, people get sent to the highlighted ranking card.
export default async function handler(request, response) {
  try {
    const id = String(request.query?.id || "");
    const entry = ID.test(id) ? await loadEntry(id) : null;
    const site = siteUrl(request);
    if (!entry) {
      response.setHeader("Location", `${site}/`);
      return response.status(302).end();
    }
    const target = `${site}/?order=${entry.order}&lang=${entry.lang}&highlight=${entry.id}`;
    const title = `${entry.weather.split(" ")[0]} ${entry.score}° · ${entry.title} · ${entry.displayName}`;
    const description = `“${entry.promptPreview}” — ${entry.rankLine}`;
    const image = `${site}/api/og?id=${entry.id}`;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return response.status(200).send(`<!doctype html>
<html lang="${entry.lang}">
<head>
<meta charset="utf-8" />
<title>${escape(title)} · Mind Your Tone</title>
<meta name="description" content="${escape(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Mind Your Tone" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(description)}" />
<meta property="og:image" content="${escape(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${escape(`${site}/s/${entry.id}`)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(title)}" />
<meta name="twitter:description" content="${escape(description)}" />
<meta name="twitter:image" content="${escape(image)}" />
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body><a href="${escape(target)}">${escape(title)}</a></body>
</html>`);
  } catch (error) {
    console.error(error);
    return response.status(500).send("Share page unavailable");
  }
}
