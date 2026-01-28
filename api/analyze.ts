import { analyzeScreenshotCore } from "../lib/analyzeCore";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing GEMINI_API_KEY on server (Vercel env var)." }));
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { base64Data, mimeType, model, userContext } = body || {};

    if (!base64Data || !mimeType || !model) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing required fields: base64Data, mimeType, model" }));
      return;
    }

    // If the UI passes a preview label that isn't available for this key/project,
    // try the requested model first, then fall back to a safer pro model.
    const modelAttempts = Array.from(
      new Set([
        model,
        model === "gemini-3-pro-preview" ? "gemini-1.5-pro" : undefined,
        model === "gemini-3-flash-preview" ? "gemini-1.5-flash" : undefined,
      ].filter(Boolean) as string[])
    );

    let lastErr: any;
    for (const m of modelAttempts) {
      try {
        const result = await analyzeScreenshotCore({
          apiKey,
          base64Data,
          mimeType,
          model: m,
          userContext,
        });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ...result, _modelUsed: m }));
        return;
      } catch (e: any) {
        lastErr = e;
        const msg = (e?.message || JSON.stringify(e) || "").toLowerCase();
        // If it's not a "model not found" style error, don't bother retrying.
        if (!msg.includes("not found") && !msg.includes("requested entity")) {
          break;
        }
      }
    }

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: lastErr?.message || "Analysis failed." }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "Server error." }));
  }
}

