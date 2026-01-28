
import { GoogleGenAI, Type } from "@google/genai";
import { ScreenAnalysis } from "../types";
import { NIELSEN_HEURISTICS } from "../constants";

export const analyzeScreenshot = async (base64Data: string, mimeType: string, model: string, userContext?: string): Promise<ScreenAnalysis> => {
  const apiKey =
    (process as any)?.env?.GEMINI_API_KEY ||
    (process as any)?.env?.API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Set it in your environment (Vercel) or .env.local (local dev).");
  }

  const ai = new GoogleGenAI({ apiKey });

  const properties: Record<string, any> = {};
  NIELSEN_HEURISTICS.forEach((h) => {
    properties[`heuristic_${h.id}`] = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: `Strict heuristic score (0-10) for ${h.name}.` },
        observations: {
          type: Type.ARRAY,
          description: `Comprehensive list of all findings.`,
          items: {
            type: Type.OBJECT,
            properties: {
              finding: { type: Type.STRING, description: "Detailed UI observation." },
              recommendation: { type: Type.STRING, description: "Actionable recommendation." },
              boundingBox: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER }, 
                description: "Normalized bounding box [ymin, xmin, ymax, xmax] (0-1000) of the relevant UI element." 
              }
            },
            required: ["finding", "recommendation", "boundingBox"]
          }
        }
      },
      required: ["score", "observations"]
    };
  });

  const contextPrompt = userContext 
    ? `\n\n[USER-PROVIDED CONTEXT]: "${userContext}".`
    : "";

  const textPrompt = `Perform a deep-dive heuristic evaluation of the provided screenshot using Jakob Nielsen's 10 principles.
Be brutally honest. For each finding, provide the exact location of the UI element using normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000.${contextPrompt}`;

  const maxOutputTokens = model.includes("flash") ? 8192 : 16384;

  const configWithSchema: any = {
    maxOutputTokens,
    // Some models reject thinkingConfig; we’ll retry without it if needed.
    thinkingConfig: { thinkingBudget: 2048 },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        ...properties,
        summary: { type: Type.STRING, description: "Executive assessment." }
      },
      required: [...NIELSEN_HEURISTICS.map(h => `heuristic_${h.id}`), "summary"]
    }
  };

  try {
    const call = async (config: any) => {
      return await ai.models.generateContent({
        model,
        // @google/genai expects an array of contents for generateContent.
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
              { text: textPrompt },
            ],
          },
        ],
        config,
      });
    };

    const extractText = async (response: any): Promise<string> => {
      if (!response) return "";
      // SDKs vary: text can be a string, a function, or absent.
      if (typeof response.text === "string") return response.text;
      if (typeof response.text === "function") {
        const out = response.text();
        return typeof out?.then === "function" ? await out : out;
      }
      const candidateText =
        response?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n");
      return candidateText || "";
    };

    const parseJsonLenient = (raw: string) => {
      const trimmed = (raw || "").trim();
      if (!trimmed) throw new Error("Empty response from AI service.");
      // Strip common code-fence wrappers
      const noFences = trimmed
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      // If model added prose, try to extract the first JSON object
      const firstBrace = noFences.indexOf("{");
      const lastBrace = noFences.lastIndexOf("}");
      const jsonSlice = firstBrace !== -1 && lastBrace !== -1 ? noFences.slice(firstBrace, lastBrace + 1) : noFences;
      return JSON.parse(jsonSlice);
    };

    let response: any;
    try {
      response = await call(configWithSchema);
    } catch (err: any) {
      const msg = (err?.message || JSON.stringify(err) || "").toLowerCase();
      // Retry without thinkingConfig / schema when models reject advanced config.
      if (
        msg.includes("thinking") ||
        msg.includes("response_schema") ||
        msg.includes("response schema") ||
        msg.includes("invalid argument") ||
        msg.includes("unsupported")
      ) {
        response = await call({ maxOutputTokens, responseMimeType: "application/json" });
      } else {
        throw err;
      }
    }

    const rawText = await extractText(response);
    const result = parseJsonLenient(rawText);
    
    const heuristics: Record<number, any> = {};
    let weightedSum = 0;
    let totalWeights = 0;

    NIELSEN_HEURISTICS.forEach(h => {
      const detail = result[`heuristic_${h.id}`];
      if (!detail) {
        console.warn(`Heuristic detail missing for ID: ${h.id}`);
        heuristics[h.id] = {
          score: 0,
          initialScore: 0,
          observations: []
        };
        return;
      }
      heuristics[h.id] = {
        ...detail,
        initialScore: detail.score,
        observations: (detail.observations || []).map((obs: any) => ({ ...obs, resolved: false }))
      };
      weightedSum += (detail.score * h.weight);
      totalWeights += h.weight;
    });

    return {
      heuristics,
      summary: result.summary || "No summary provided.",
      overallScore: totalWeights > 0 ? Math.round((weightedSum / totalWeights) * 10) / 10 : 0
    };
  } catch (err: any) {
    console.error("Gemini Audit Service Error:", err);
    const errorString = (err?.message || JSON.stringify(err)).toLowerCase();
    if (errorString.includes("requested entity was not found")) {
      throw new Error(`Model "${model}" was not found for this API key/project. Try a different model or check API access.`);
    }
    throw err;
  }
};
