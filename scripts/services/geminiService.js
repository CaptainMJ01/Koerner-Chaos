import { GoogleGenAI } from "@google/genai";

// Helper to get specific advice based on game performance
export const generateGameInsight = async (score, profile) => {
  // NOTE: process.env is not available in static browser builds.
  // This feature requires a backend proxy or explicit key injection.
  const apiKey = null; 
  
  // Fallback if no API key
  if (!apiKey) {
    return profile.insight;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Context: A player just finished a game called "Koerner Chaos" where they catch business ideas as Chris Koerner.
      Score: ${score}.
      Profile Category: ${profile.category}.
      Profile Base Insight: "${profile.insight}"
      
      Task: Rewrite the insight to be slightly more personalized, witty, and encouraging in 2 sentences. Keep the tone professional but fun (Lead Arcade style).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || profile.insight;
  } catch (error) {
    console.error("Gemini generation failed, using fallback", error);
    return profile.insight;
  }
};