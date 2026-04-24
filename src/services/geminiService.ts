import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DetectionResult {
  className: string;
  count: number;
  confidence: number;
}

export interface ScanResult {
  totalItems: number;
  processingTime: number;
  model: string;
  items: DetectionResult[];
}

export async function detectObjects(imageBase64: string, threshold: number = 0.75): Promise<ScanResult> {
  const start = Date.now();
  let lastError: any = null;
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{
          parts: [
            {
              text: `Count objects above ${threshold} confidence. Output JSON: {totalItems: number, items: [{className: string, count: number, confidence: number}]}`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1] || imageBase64
              }
            }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalItems: { type: Type.INTEGER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    className: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    confidence: { type: Type.NUMBER }
                  }
                }
              }
            },
            required: ["totalItems", "items"]
          }
        }
      });

      const duration = Date.now() - start;
      const result = JSON.parse(response.text);

      return {
        ...result,
        processingTime: duration,
        model: "Gemini Flash (Live)"
      };
    } catch (error) {
      console.warn(`Detection attempt ${attempt + 1} failed:`, error);
      lastError = error;
      // Minimal wait for faster recovery
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // If we get here, all retries failed
  console.error("All detection attempts failed:", lastError);
  throw lastError || new Error("Detection failed");
}
