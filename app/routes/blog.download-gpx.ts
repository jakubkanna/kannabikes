import type { Route } from "./+types/blog.download-gpx";

function getWordpressBaseUrl() {
  const explicitBaseUrl = import.meta.env.VITE_WORDPRESS_API_URL;
  const wordpressApiBase = (
    import.meta.env.VITE_WORDPRESS_API_BASE_URL ?? ""
  ).replace(/\/$/, "");

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  if (wordpressApiBase) {
    try {
      return new URL(wordpressApiBase).origin;
    } catch {
      return wordpressApiBase.replace(/\/wp-json.*$/i, "");
    }
  }

  return "http://localhost";
}

function sanitizeDownloadFilename(value: string | null) {
  const normalized = (value ?? "").trim();

  if (!normalized) {
    return "route.gpx";
  }

  const safe = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return safe.toLowerCase().endsWith(".gpx") ? safe : `${safe}.gpx`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const source = requestUrl.searchParams.get("source");
  const filename = sanitizeDownloadFilename(
    requestUrl.searchParams.get("filename"),
  );

  if (!source) {
    throw new Response("Missing source.", { status: 400 });
  }

  let sourceUrl: URL;

  try {
    sourceUrl = new URL(source);
  } catch {
    throw new Response("Invalid source.", { status: 400 });
  }

  const allowedOrigins = new Set<string>([
    getWordpressBaseUrl(),
    requestUrl.origin,
  ]);

  if (!allowedOrigins.has(sourceUrl.origin)) {
    throw new Response("Source not allowed.", { status: 403 });
  }

  const upstream = await fetch(sourceUrl.toString(), {
    headers: { Accept: "application/gpx+xml,application/xml,text/xml,*/*" },
  });

  if (!upstream.ok) {
    throw new Response("Download failed.", { status: upstream.status });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/gpx+xml";
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.byteLength),
      "Content-Type": contentType,
    },
  });
}
