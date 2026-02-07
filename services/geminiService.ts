
import { GoogleGenAI, Type } from "@google/genai";
import { Grid, Tetromino } from "../types";

export const getGeminiAdvice = async (grid: Grid, currentPiece: Tetromino, score: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Convert grid to a simple text representation for the AI
    const gridString = grid
      .map(row => row.map(cell => (cell ? 'X' : '.')).join(''))
      .join('\n');

    const prompt = `
      You are a Tetris Grandmaster AI. Analyze the following game state and give a short, punchy strategy tip (max 15 words) in Japanese.
      Current Score: ${score}
      Next Piece Type: ${currentPiece.color}
      Grid State (X is filled, . is empty):
      ${gridString}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "集中して、隙間を埋めよう！";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "高みを目指せ！";
  }
};
