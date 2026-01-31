
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || "";

export const generateImageDescription = async (prompt: string): Promise<string> => {
  if (!apiKey) return "API Key not configured";
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Enhance the following AI image prompt and provide a technical description for a high-quality generation: "${prompt}"`,
  });

  return response.text || "Failed to generate description";
};

export const generateResultImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not configured");
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `High quality digital art, cinematic lighting, 8k resolution, photorealistic, abstract aesthetic: ${prompt}` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini");
};
