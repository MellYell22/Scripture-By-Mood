import { MoodResponse, ResponseLength } from "../types";

export const getMoodScriptures = async (mood: string, translation: string = 'NIV', responseLength: ResponseLength = 'short'): Promise<MoodResponse> => {
  const response = await fetch('/api/mood-scriptures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, translation, responseLength })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch mood scriptures');
  }

  return response.json();
};

export const getVerseReflection = async (verse: string, reference: string): Promise<string> => {
  const response = await fetch('/api/reflection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verse, reference })
  });

  if (!response.ok) {
    return "I am reflecting on this beautiful verse. May it bring you peace today.";
  }

  const data = await response.json();
  return data.text;
};

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const getChatResponse = async (history: ChatHistoryMessage[], responseLength: ResponseLength = 'short'): Promise<string> => {
  const lengthInstruction = {
    short: "Please keep your response relatively short (2-4 sentences).",
    medium: "Please give a moderately long response (4-6 sentences).",
    long: "Feel free to be more detailed and thoughtful in your response."
  }[responseLength];

  // Map history to OpenAI format (Gemini uses 'model', OpenAI uses 'assistant')
  const messages = history.map(h => ({
    role: h.role,
    content: h.content
  }));

  // Append length instruction to the last message to guide OpenAI
  if (messages.length > 0) {
    messages[messages.length - 1].content += `\n\n[Instruction: ${lengthInstruction}]`;
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get chat response');
  }

  const data = await response.json();
  return data.text;
};

export const getChatResponseStream = async (
  history: ChatHistoryMessage[],
  onChunk: (text: string) => void,
  responseLength: ResponseLength = 'short'
): Promise<string> => {
  const lengthInstruction = {
    short: "Please keep your response relatively short (2-4 sentences).",
    medium: "Please give a moderately long response (4-6 sentences).",
    long: "Feel free to be more detailed and thoughtful in your response."
  }[responseLength];

  const messages = history.map(h => ({
    role: h.role,
    content: h.content
  }));

  if (messages.length > 0) {
    messages[messages.length - 1].content += `\n\n[Instruction: ${lengthInstruction}]`;
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: true })
  });

  if (!response.ok) {
    throw new Error('Failed to get chat stream');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  if (!reader) throw new Error("No reader");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') break;
        try {
          const data = JSON.parse(dataStr);
          fullText += data.text;
          onChunk(fullText);
        } catch (e) {
          // Ignore parse errors for incomplete lines
        }
      }
    }
  }

  return fullText;
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Strip data:audio/mpeg;base64,
        resolve(base64.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
};

/**
 * David is currently envisioning new ways to generate visuals.
 * For now, this returns a placeholder as we migrate from Gemini.
 */
export async function generateVideo(prompt: string): Promise<string | null> {
  console.log("Video generation requested for prompt:", prompt);
  // OpenAI doesn't have a direct equivalent to Gemini's experimental video API yet.
  return null;
}
