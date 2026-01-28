
import { GoogleGenAI, Type } from "@google/genai";
import { ScreenAnalysis } from "../types";
import { NIELSEN_HEURISTICS } from "../constants";

export const analyzeScreenshot = async (base64Data: string, mimeType: string, model: string, userContext?: string): Promise<ScreenAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  const config: any = {
    maxOutputTokens: 65536,
    thinkingConfig: { thinkingBudget: 32768 },
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
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: textPrompt
          },
        ],
      },
      config: config,
    });

    if (!response || !response.text) {
      throw new Error("Empty response from AI service.");
    }
    
    const result = JSON.parse(response.text.trim());
    
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
      throw new Error("Requested entity was not found.");
    }
    throw err;
  }
};
