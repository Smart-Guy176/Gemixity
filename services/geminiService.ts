import { GoogleGenAI, Tool } from "@google/genai";
import { Source, SearchResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchWithGemini = async (
  query: string, 
  isDeepResearch: boolean = false,
  isSearchOnly: boolean = false
): Promise<{ text: string; sources: Source[]; relatedQuestions: string[]; searchResults: SearchResult[] }> => {
  try {
    const tools: Tool[] = [{ googleSearch: {} }];
    
    // Config based on mode
    let thinkingBudget = isDeepResearch ? 16384 : 1024;
    if (isSearchOnly) thinkingBudget = 0; // Search only doesn't need deep thinking, just retrieval

    let systemInstruction = "";

    if (isSearchOnly) {
      systemInstruction = `You are a search engine result aggregator. 
      1. Perform a google search for the user's query.
      2. Return a JSON array of the top 6-8 search results.
      3. For each result, strictly use this format: {"title": "Page Title", "url": "Page URL", "snippet": "Brief summary of the page content"}.
      4. Do NOT output any conversational text, introductions, or markdown code blocks. ONLY output the raw JSON array.`;
    } else {
      systemInstruction = isDeepResearch 
        ? `You are an expert Deep Research Analyst. 
           1. Your goal is to provide an exhaustive, highly detailed, and academic-grade answer based on Google Search results.
           2. Verify facts across multiple search results. 
           3. Structure your answer with an Executive Summary followed by detailed sections.
           4. You MUST cite your sources inline using [Source Title](URL) format or [1], [2] style.
           5. Suggest 3 complex follow-up questions in a JSON block at the end.`
        : `You are a helpful search assistant. Provide a concise and accurate answer based on Google Search results. Suggest 3 follow-up questions in a JSON block at the end.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: tools,
        thinkingConfig: { thinkingBudget }, 
        systemInstruction: `${systemInstruction}
        
        ${!isSearchOnly ? `Format the related questions exactly like this:
        \`\`\`json
        ["Question 1", "Question 2", "Question 3"]
        \`\`\`` : ''}
        `,
      },
    });

    let text = response.text || "No result generated.";
    let relatedQuestions: string[] = [];
    let searchResults: SearchResult[] = [];

    // Parse JSON for Search Only mode
    if (isSearchOnly) {
      try {
        // Use regex to extract the outermost JSON array, ignoring surrounding text
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          searchResults = JSON.parse(jsonMatch[0]);
          text = ""; // Clear text as we successfully parsed structured data
        } else {
          // Fallback: try to clean code blocks manually if regex failed
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          if (cleanText.startsWith('[')) {
             searchResults = JSON.parse(cleanText);
             text = "";
          } else {
             throw new Error("No JSON array found in response");
          }
        }
      } catch (e) {
        console.error("Failed to parse search results JSON", e);
        // Keep text populated so the UI can show the raw output/error
        text = "System Warning: Could not parse structured search results. \n\nRaw Response:\n" + text;
      }
    } else {
      // Parse Related Questions for Answer mode
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          relatedQuestions = JSON.parse(jsonMatch[1]);
          text = text.replace(jsonMatch[0], '').trim();
        } catch (e) {
          console.error("Failed to parse related questions", e);
        }
      }
    }

    // Extract Grounding Sources (Standard for Answer mode)
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
      
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
      text,
      sources: uniqueSources,
      relatedQuestions,
      searchResults
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};