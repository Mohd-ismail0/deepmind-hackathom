import { GoogleGenAI, Chat, GenerateContentResponse, Type } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants.js';
import type { Attachment, UserDetails } from '../types.js';
import { createError } from '../middleware/errorHandler.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiClient) {
    if (!GEMINI_API_KEY) {
      throw createError(
        'GEMINI_API_KEY is missing from environment variables.',
        'CONFIG_ERROR',
        500
      );
    }
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return aiClient;
}

const chatSessions = new Map<string, Chat>();

export function getOrCreateChatSession(sessionId: string): Chat {
  let session = chatSessions.get(sessionId);
  if (!session) {
    const ai = getClient();
    session = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    chatSessions.set(sessionId, session);
  }
  return session;
}

export async function sendMessageToGemini(
  sessionId: string,
  message: string,
  attachments: Attachment[] = []
): Promise<string> {
  const chatSession = getOrCreateChatSession(sessionId);
  try {
    let content: string | object[] = message;
    if (attachments.length > 0) {
      const parts: object[] = [];
      if (message) {
        parts.push({ text: message });
      }
      for (const att of attachments) {
        const base64Data = att.data.split(',')[1] || att.data;
        parts.push({
          inlineData: {
            mimeType: att.type,
            data: base64Data,
          },
        });
      }
      content = parts;
    }
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: content,
    });
    return response.text || "I'm having trouble understanding that. Could you try again?";
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Gemini API Error:', err);
    throw createError(
      err.message || 'Failed to get response from AI.',
      'GEMINI_ERROR',
      502,
      process.env.NODE_ENV === 'development' ? { cause: err.cause } : undefined
    );
  }
}

export async function findGovernmentUrl(taskName: string): Promise<string> {
  const ai = getClient();
  const prompt = `Find the official government website URL for applying for: "${taskName}". 
  Return ONLY the URL string. Do not include markdown or explanation.`;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let url = '';
    if (chunks?.length) {
      const webChunk = chunks.find((c: { web?: { uri?: string } }) => c.web?.uri);
      if (webChunk?.web?.uri) url = webChunk.web.uri;
    }
    if (!url) {
      url = response.text?.replace(/`/g, '').trim() || '';
    }
    if (url.startsWith('http')) return url;
    return 'https://google.com/search?q=' + encodeURIComponent(taskName);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error searching for URL', err);
    throw createError(
      err.message || 'Failed to find government URL.',
      'GEMINI_ERROR',
      502,
      process.env.NODE_ENV === 'development' ? { cause: err.cause } : undefined
    );
  }
}

export async function generateAutomationSteps(
  taskDescription: string,
  url: string
): Promise<{ id: string; action: string; target: string; value?: string; description: string }[]> {
  const ai = getClient();
  const prompt = `
    You are an automation engineer using Playwright.
    Generate a JSON array of browser automation steps for the task: "${taskDescription}" on the website: "${url}".
    Format:
    [
      { "id": "1", "action": "visit", "target": "${url}", "description": "Navigate to portal" },
      { "id": "2", "action": "click", "target": "text=Apply Now", "description": "Click apply button" }
    ]
    Return ONLY the JSON array.
  `;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
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
            },
          },
        },
      },
    });
    return JSON.parse(response.text || '[]');
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating steps', err);
    throw createError(
      err.message || 'Failed to generate automation steps.',
      'GEMINI_ERROR',
      502,
      process.env.NODE_ENV === 'development' ? { cause: err.cause } : undefined
    );
  }
}

export async function extractDocumentDetails(attachment: Attachment): Promise<UserDetails> {
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
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: attachment.type, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error extracting document details', err);
    throw createError(
      err.message || 'Failed to extract document details.',
      'GEMINI_ERROR',
      502,
      process.env.NODE_ENV === 'development' ? { cause: err.cause } : undefined
    );
  }
}
