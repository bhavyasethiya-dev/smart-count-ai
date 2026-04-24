import { GoogleGenAI, Type } from "@google/genai";

export interface DetectionResult {
  className: string;
  count: number;
  confidence: number;
}

export interface ScanResult {
  totalItems: number;
  items: DetectionResult[];
  processingTime: number;
  model: string;
}

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function detectObjects(imageBase64: string, threshold: number = 0.75): Promise<ScanResult> {
  const start = Date.now();
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const ai = getAI();
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: {
          parts: [
            {
              text: "Return strictly as JSON: { \"totalItems\": number, \"items\": [{ \"className\": string, \"count\": number, \"confidence\": number }] }. Identify and count distinct objects in this image."
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["totalItems", "items"],
            properties: {
              totalItems: { type: Type.INTEGER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["className", "count", "confidence"],
                  properties: {
                    className: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    confidence: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      if (!response || !response.text) {
        throw new Error("Neural Engine Error: AI returned an empty response.");
      }

      const result = JSON.parse(response.text);
      
      return {
        ...result,
        processingTime: Date.now() - start,
        model: "Gemini Flash (Global Cluster)"
      };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const statusCode = error?.status || 0;
      
      // Handle Rate Limits (429) and Overload (503)
      if ((statusCode === 429 || statusCode === 503 || errorMsg.includes('Quota')) && attempt < maxRetries) {
        attempt++;
        const waitTime = attempt * 3000; // Progressive: 3s, 6s, 9s
        console.warn(`[AI Engine Busy] Status ${statusCode}. Retrying ${attempt}/${maxRetries} in ${waitTime}ms...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }

      // Handle Invalid Model (404) or API Key (400)
      if (statusCode === 404) {
        throw new Error("Cloud Config Error: Model not found. This usually happens if the project settings are proprietary or the model name is restricted.");
      }
      if (statusCode === 400 || errorMsg.includes('key not valid')) {
        throw new Error("Security Error: API key is invalid or unauthorized. Please verify your credentials in AI Studio settings.");
      }
      
      console.error("Critical System Error:", error);
      throw error;
    }
  }
  throw new Error("Maximum retries exhausted. AI engine is persistently busy.");
}
