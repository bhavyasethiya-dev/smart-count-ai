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
  const maxRetries = 2; // Increase retries for mobile stability

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use standard alias for maximum compatibility
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", 
        contents: [{
          parts: [
            {
              text: `Count all objects in this image with focus on precision. 
              Required JSON schema: { "totalItems": number, "items": [{ "className": string, "count": number, "confidence": number }] }
              Only include items with confidence > ${threshold}.`
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

      if (!response || !response.text) {
        throw new Error("Empty response from AI engine");
      }

      const duration = Date.now() - start;
      const result = JSON.parse(response.text);

      return {
        ...result,
        processingTime: duration,
        model: "Gemini 1.5 Flash (Optimized)"
      };
    } catch (error: any) {
      console.warn(`Detection attempt ${attempt + 1} failed:`, error.message || error);
      lastError = error;
      
      // Exponential backoff for retries
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  console.error("Critical failure in detection pipeline:", lastError);
  throw lastError || new Error("Detection engine unavailable");
}
