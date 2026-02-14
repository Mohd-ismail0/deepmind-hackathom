import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Attachment, UserDetails } from "../types";

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

export const sendMessageToGemini = async (message: string, attachments: Attachment[] = []): Promise<string> => {
  if (!chatSession) {
    startChatSession();
  }
  if (!chatSession) throw new Error("Failed to initialize chat session");

  try {
    let content: string | any[] = message;

    if (attachments.length > 0) {
      const parts: any[] = [];
      if (message) {
        parts.push({ text: message });
      }
      attachments.forEach(att => {
        // Extract base64 data (remove prefix)
        const base64Data = att.data.split(',')[1] || att.data;
        parts.push({
          inlineData: {
            mimeType: att.type,
            data: base64Data
          }
        });
      });
      content = parts;
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
        message: content 
    });
    return response.text || "I'm having trouble understanding that. Could you try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

/**
 * Uses Gemini with Google Search Grounding to find the official URL.
 */
export const findGovernmentUrl = async (taskName: string): Promise<string> => {
  const ai = getClient();
  const prompt = `Find the official government website URL for applying for: "${taskName}". 
  Return ONLY the URL string. Do not include markdown or explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    // Check grounding chunks for the source or fallback to text
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let url = '';
    
    if (chunks && chunks.length > 0) {
        // Try to find a web URI in chunks
        const webChunk = chunks.find((c: any) => c.web?.uri);
        if (webChunk) url = webChunk.web.uri;
    }

    if (!url) {
        // Fallback to cleaning the text response
        url = response.text?.replace(/`/g, '').trim() || '';
    }

    // Basic validation
    if (url.startsWith('http')) return url;
    return 'https://google.com/search?q=' + encodeURIComponent(taskName);

  } catch (e) {
    console.error("Error searching for URL", e);
    return 'https://google.com';
  }
};

export const generateAutomationSteps = async (taskDescription: string, url: string): Promise<any[]> => {
  const ai = getClient();
  const prompt = `
    You are an automation engineer using Playwright.
    Generate a JSON array of browser automation steps for the task: "${taskDescription}" on the website: "${url}".
    
    The steps should act like a high-level plan for a headless browser.
    Format:
    [
      { "id": "1", "action": "visit", "target": "${url}", "description": "Navigate to portal" },
      { "id": "2", "action": "click", "target": "text=Apply Now", "description": "Click apply button" }
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

export const extractDocumentDetails = async (attachment: Attachment): Promise<UserDetails> => {
  const ai = getClient();
  const base64Data = attachment.data.split(',')[1] || attachment.data;
  
  const prompt = `
    Analyze this document image. Extract key personal information that would be needed for government forms.
    Standardize the keys to camelCase (e.g., fullName, idNumber, dob, address, expiryDate).
    If a field is not present, do not invent it.
    Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: attachment.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Error extracting document details", e);
    return {};
  }
};