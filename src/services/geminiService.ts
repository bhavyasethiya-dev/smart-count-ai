import { GoogleGenAI, Type } from "@google/genai";

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

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function detectObjects(imageBase64: string, threshold: number = 0.75): Promise<ScanResult> {
  const start = Date.now();
  
  // Clean base64 data
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  
  console.log(`Sending image for detection (base64 length: ${base64Data.length})`);

  try {
    const ai = getAI();
    let response;
    let attempt = 0;
    const maxRetries = 3;

    while (attempt <= maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash-latest", // Using explicit version for stability
          contents: {
            parts: [
              {
                text: `Task: Count all objects with confidence > ${threshold}. 
                Output valid JSON according to schema: { "totalItems": number, "items": [{ "className": string, "count": number, "confidence": number }] }`
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
            // Keep existing schema validation
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
        break; // Success
      } catch (err: any) {
        const errorMsg = err.message || "";
        // Retry on 503 (Overloaded) or 500 (Internal Error)
        if ((errorMsg.includes('503') || errorMsg.includes('500')) && attempt < maxRetries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.warn(`Model busy or internal error. Retrying in ${waitTime}ms... (Attempt ${attempt})`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        
        // If it's a 429, don't retry automatically in the service to save quota
        // throwing it will be handled by the UI with a timer
        throw err;
      }
    }

    if (!response || !response.text) {
      throw new Error("Empty AI response");
    }

    const result = JSON.parse(response.text);
    return {
      ...result,
      processingTime: Date.now() - start,
      model: "Gemini Flash (Mobile-Optimized)"
    };
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}
