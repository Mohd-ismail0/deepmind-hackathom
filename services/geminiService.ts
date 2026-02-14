import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let aiClient: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const startChatSession = () => {
  const ai = getClient();
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    startChatSession();
  }
  if (!chatSession) throw new Error("Failed to initialize chat session");

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "I'm having trouble understanding that. Could you try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

export const generateAutomationSteps = async (taskDescription: string): Promise<any[]> => {
  const ai = getClient();
  const prompt = `
    Generate a JSON array of browser automation steps for the following task: "${taskDescription}".
    The steps should be realistic for a standard web form.
    Format:
    [
      { "id": "1", "action": "visit", "target": "url", "description": "..." },
      { "id": "2", "action": "fill", "target": "selector", "value": "placeholder", "description": "..." }
    ]
    Return ONLY the JSON.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              action: { type: Type.STRING },
              target: { type: Type.STRING },
              value: { type: Type.STRING },
              description: { type: Type.STRING },
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Error generating steps", e);
    return [];
  }
};
