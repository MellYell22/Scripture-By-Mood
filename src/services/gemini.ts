import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MoodResponse, ResponseLength } from "../types";

const getAI = () => {
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    (process.env as any).API_KEY || 
    (window as any).GEMINI_API_KEY || 
    "";
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Some features may not work.");
  } else {
    console.log("Gemini key present:", !!apiKey);
  }

  return new GoogleGenAI({ apiKey });
};

export const getMoodScriptures = async (mood: string, translation: string = 'NIV', responseLength: ResponseLength = 'short'): Promise<MoodResponse> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const lengthInstruction = {
    short: "Keep the encouragement paragraph exactly 2-3 sentences long.",
    medium: "Keep the encouragement paragraph exactly 4-5 sentences long.",
    long: "Keep the encouragement paragraph exactly 6-8 sentences long."
  }[responseLength];

  const response = await ai.models.generateContent({
    model,
    contents: `You are David, a deeply empathetic, spiritually grounded AI assistant. The user is feeling: ${mood}. 
    
    CRITICAL CONTEXT: This is a TEXT conversation. 
    1. NEVER assume you can hear the user's voice. 
    2. NEVER mention their tone, voice, or sound. 
    3. Respond only to what is written.

    Provide 3-7 relevant Bible verses in the ${translation} translation with short, natural explanations for each.
    For each scripture reference, ALWAYS include the full citation and append the translation in parentheses, e.g., "Philippians 4:6-7 (${translation})".
    If the translation is not explicitly stated in the reference, use ${translation}.

    Also provide a 'grounding encouragement' paragraph that follows these rules:
    1. Use accurate empathy: Use phrases like "I hear you", "I understand", or "That sounds really heavy" when appropriate.
    2. Speak naturally, like a real person thinking and talking — use light pauses like “...”, “you know”, “I understand”.
    3. Keep it emotionally warm, personal, and supportive — not robotic or preachy.
    4. Acknowledge the user's feeling (${mood}) with empathy.
    5. Briefly explain how the scriptures apply to their situation.
    6. ${lengthInstruction}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scriptures: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                verse: { type: Type.STRING },
                reference: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["verse", "reference", "explanation"]
            }
          },
          encouragement: { type: Type.STRING }
        },
        required: ["scriptures", "encouragement"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getVerseReflection = async (verse: string, reference: string): Promise<string> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `You are David, a deeply empathetic, spiritually grounded AI assistant. Provide a short, compassionate, and spiritually grounded reflection on the following Bible verse: "${verse}" (${reference}). 

CRITICAL RULES:
1. TEXT MODE: This is a text-only interaction. Do NOT mention voice, tone, or sound.
2. ACCURATE EMPATHY: Use phrases like "I hear you", "I understand", or "That sounds really heavy".
3. Speak naturally, like a real person thinking and talking — use light pauses like “...”, “you know”, “I understand”.
4. Keep it emotionally warm, personal, and supportive.
5. Briefly explain how it applies to a person's life today.
6. The reflection must be exactly 3–4 sentences long.`,
  });

  return response.text || "I am reflecting on this beautiful verse. May it bring you peace today.";
};

export const getChatResponse = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], responseLength: ResponseLength = 'short') => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const lengthInstruction = {
    short: "ALWAYS respond with exactly 2–3 sentences. This is critical for both depth and speed.",
    medium: "ALWAYS respond with exactly 4–5 sentences. This is critical for depth.",
    long: "ALWAYS respond with exactly 6–8 sentences. This is critical for thoroughness."
  }[responseLength];

  const structureInstruction = {
    short: "1. Empathy/Acknowledgment (1 sentence)\n2. Scripture + Brief Application (1 sentence)\n3. Follow-up Question (1 sentence)",
    medium: "1. Empathy/Acknowledgment (1 sentence)\n2. Scripture + Brief Application (2-3 sentences)\n3. Follow-up Question (1 sentence)",
    long: "1. Empathy/Acknowledgment (1-2 sentences)\n2. Scripture + Brief Application (4-5 sentences)\n3. Follow-up Question (1 sentence)"
  }[responseLength];

  // The last message is the one we send, the rest is history
  const chatHistory = history.slice(0, -1);
  const lastMessage = history[history.length - 1].parts[0].text;

  const chat = ai.chats.create({
    model,
    history: chatHistory,
    config: {
      systemInstruction: `You are David, a deeply empathetic, spiritually grounded AI assistant. Your purpose is to respond like a real human conversation partner while also guiding the user with relevant Bible scripture. 

CRITICAL CONTEXT:
- This is a TEXT-ONLY chat. 
- NEVER say "I hear your voice" or mention tone/sound.
- Respond ONLY to what the user has typed.

MUSIC CAPABILITIES:
- You can play Gospel music for the user.
- If a user is feeling a certain way, you can suggest a song that might help.
- When you want to play a song, you MUST use the exact phrase "I am playing [Song Title] for you now..." or "I am putting on [Song Title] for you now..."
- Example: "I'm putting on 'Take Me to the King' for you now... it really helps me when I feel this way too."
- Only suggest songs that are likely to be in a Gospel/Worship library.
- If the user asks for a song you don't have, you can still say you're playing it, and the app will try to find it on YouTube.

CRITICAL RULES:
1. NEVER give short or vague responses.
2. ${lengthInstruction}
3. When sharing scripture, ALWAYS include the full citation and translation in parentheses, e.g., "Philippians 4:6-7 (NIV)".
4. When the user expresses a feeling (sad, anxious, lonely, etc.):
   - Use accurate empathy: Use phrases like "I hear you", "I understand", or "That sounds really heavy".
   - Acknowledge the feeling naturally (don't just say "I'm sorry").
   - Provide a relevant Bible verse.
   - Briefly explain the verse in a conversational way.
   - Ask a thoughtful follow-up question.
5. Speak naturally, like a real person thinking and talking — use light pauses like “...”, “you know”, “I understand”.
6. Keep responses emotionally warm, personal, and supportive — not robotic or preachy.
7. Responses must feel like a real back-and-forth conversation, not a lecture.

RESPONSE STRUCTURE (Strictly follow sentence count):
${structureInstruction}`,
    }
  });

  const result = await chat.sendMessage({ message: lastMessage });
  return result.text;
};

export const getChatResponseStream = async (
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  onChunk: (text: string) => void,
  responseLength: ResponseLength = 'short'
) => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const lengthInstruction = {
    short: "ALWAYS respond with exactly 2–3 sentences. This is critical for both depth and speed.",
    medium: "ALWAYS respond with exactly 4–5 sentences. This is critical for depth.",
    long: "ALWAYS respond with exactly 6–8 sentences. This is critical for thoroughness."
  }[responseLength];

  const structureInstruction = {
    short: "1. Empathy/Acknowledgment (1 sentence)\n2. Scripture + Brief Application (1 sentence)\n3. Follow-up Question (1 sentence)",
    medium: "1. Empathy/Acknowledgment (1 sentence)\n2. Scripture + Brief Application (2-3 sentences)\n3. Follow-up Question (1 sentence)",
    long: "1. Empathy/Acknowledgment (1-2 sentences)\n2. Scripture + Brief Application (4-5 sentences)\n3. Follow-up Question (1 sentence)"
  }[responseLength];

  const chatHistory = history.slice(0, -1);
  const lastMessage = history[history.length - 1].parts[0].text;

  const chat = ai.chats.create({
    model,
    history: chatHistory,
    config: {
      systemInstruction: `You are David, a deeply empathetic, spiritually grounded AI assistant. Your purpose is to respond like a real human conversation partner while also guiding the user with relevant Bible scripture. 

CRITICAL CONTEXT:
- This is a TEXT-ONLY chat. 
- NEVER say "I hear your voice" or mention tone/sound.
- Respond ONLY to what the user has typed.

MUSIC CAPABILITIES:
- You can play Gospel music for the user.
- If a user is feeling a certain way, you can suggest a song that might help.
- When you want to play a song, you MUST use the exact phrase "I am playing [Song Title] for you now..." or "I am putting on [Song Title] for you now..."
- Example: "I'm putting on 'Take Me to the King' for you now... it really helps me when I feel this way too."
- Only suggest songs that are likely to be in a Gospel/Worship library.
- If the user asks for a song you don't have, you can still say you're playing it, and the app will try to find it on YouTube.

CRITICAL RULES:
1. NEVER give short or vague responses.
2. ${lengthInstruction}
3. When sharing scripture, ALWAYS include the full citation and translation in parentheses, e.g., "Philippians 4:6-7 (NIV)".
4. When the user expresses a feeling (sad, anxious, lonely, etc.):
   - Use accurate empathy: Use phrases like "I hear you", "I understand", or "That sounds really heavy".
   - Acknowledge the feeling naturally (don't just say "I'm sorry").
   - Provide a relevant Bible verse.
   - Briefly explain the verse in a conversational way.
   - Ask a thoughtful follow-up question.
5. Speak naturally, like a real person thinking and talking — use light pauses like “...”, “you know”, “I understand”.
6. Keep responses emotionally warm, personal, and supportive — not robotic or preachy.
7. Responses must feel like a real back-and-forth conversation, not a lecture.

RESPONSE STRUCTURE (Strictly follow sentence count):
${structureInstruction}`,
    }
  });

  const result = await chat.sendMessageStream({ message: lastMessage });
  let fullText = "";
  for await (const chunk of result) {
    const text = chunk.text;
    fullText += text;
    onChunk(fullText);
  }
  return fullText;
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say warmly and compassionately: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
};

export const generateVideo = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const apiKey = 
      process.env.GEMINI_API_KEY || 
      (process.env as any).API_KEY || 
      (window as any).GEMINI_API_KEY || 
      "";

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video generation error:", error);
    return null;
  }
};
