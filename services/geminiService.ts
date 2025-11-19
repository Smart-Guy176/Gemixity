import { GoogleGenAI, Tool, Type } from "@google/genai";
import { Source } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchWithGemini = async (query: string): Promise<{ text: string; sources: Source[]; relatedQuestions: string[] }> => {
  try {
    // Define the search tool
    const tools: Tool[] = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // 2.5 Flash is optimized for speed + reasoning
      contents: query,
      config: {
        tools: tools,
        // Enable "Thinking" (Test Time Compute) to allow the model to reason before answering
        thinkingConfig: { thinkingBudget: 2048 }, 
        systemInstruction: `You are an advanced Deep Research AI. 
        1. Your goal is to provide a comprehensive, accurate, and well-structured answer based on Google Search results. 
        2. Structure your answer with clear headings (##) and bullet points.
        3. Be objective and exhaustive. 
        4. Suggest 3 follow-up questions at the very end of your response in a JSON block formatted like this:
        \`\`\`json
        ["Question 1", "Question 2", "Question 3"]
        \`\`\`
        `,
      },
    });

    let text = response.text || "No result generated.";
    
    // Extract Related Questions from the JSON block if present
    let relatedQuestions: string[] = [];
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        relatedQuestions = JSON.parse(jsonMatch[1]);
        // Remove the JSON block from the display text
        text = text.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse related questions", e);
      }
    }

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
      
    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
      text,
      sources: uniqueSources,
      relatedQuestions
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};