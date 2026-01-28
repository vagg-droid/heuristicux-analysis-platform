
import { ScreenAnalysis } from "../types";

export const analyzeScreenshot = async (base64Data: string, mimeType: string, model: string, userContext?: string): Promise<ScreenAnalysis> => {
  try {
    const resp = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType, model, userContext }),
    });

    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(payload?.error || `Analysis failed (HTTP ${resp.status}).`);
    }

    // API may return _modelUsed for debugging; strip it out for UI typing.
    const { _modelUsed, ...result } = payload || {};
    return result as ScreenAnalysis;
  } catch (err: any) {
    console.error("Gemini Audit Service Error:", err);
    throw err;
  }
};
