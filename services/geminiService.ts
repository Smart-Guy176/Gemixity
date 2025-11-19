import { GoogleGenAI, Tool } from "@google/genai";
import { Source } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchWithGemini = async (query: string): Promise<{ text: string; sources: Source[] }> => {
  try {
    // Define the search tool
    const tools: Tool[] = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: tools,
        systemInstruction: "You are a deep research assistant. Your goal is to provide comprehensive, accurate, and well-structured answers based on Google Search results. Always cite your sources implicitly by synthesizing the information. Provide a detailed answer.",
      },
    });

    const text = response.text || "No result generated.";
    
    // Extract sources from grounding metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Source[] = chunks
      .map((chunk: any) => {
        if (chunk.web) {
          return {
            title: chunk.web.title,
            uri: chunk.web.uri,
          };
        }
        return null;
      })
      .filter((source: Source | null): source is Source => source !== null);
      
    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
      text,
      sources: uniqueSources,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};