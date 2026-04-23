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
  
  // Use the standard latest flash alias for vision tasks
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{
      parts: [
        {
          text: `Analyze this image and count the objects. 
          Return the results strictly in JSON format matching this schema:
          {
            "totalItems": number,
            "items": [
              {
                "className": string,
                "count": number,
                "confidence": number
              }
            ]
          }
          Only include items with confidence higher than ${threshold}.`
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
}
