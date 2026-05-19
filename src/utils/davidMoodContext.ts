import { buildDavidScriptureResponse, MOODS_DATA } from '../constants/moods';
import { DAVID_PERSONALITY_PROMPT } from '../constants/persona';

type ChatLikeMessage = {
  role?: string;
  content?: string;
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  ANXIOUS: ['anxious', 'anxiety', 'panic', 'panicking', 'worried', 'worry', 'nervous', 'fearful', 'scared', 'afraid', 'spiraling', 'restless'],
  SAD: ['sad', 'down', 'depressed', 'blue', 'unhappy', 'heavy', 'crying', 'hurt', 'heartbroken'],
  LONELY: ['lonely', 'alone', 'isolated', 'left out', 'by myself', 'nobody', 'unseen', 'forgotten'],
  GUILTY: ['guilty', 'guilt', 'ashamed', 'shame', 'regret', 'condemned', 'failed god', 'not good enough'],
  STRESSED: ['stressed', 'stress', 'pressure', 'burned out', 'burnt out', 'exhausted', 'tired'],
  OVERWHELMED: ['overwhelmed', 'too much', 'buried', 'drowning', "can't handle", 'falling apart'],
  HOPELESS: ['hopeless', 'no hope', 'pointless', 'give up', 'worthless', "can't go on"],
  GRIEVING: ['grieving', 'grief', 'loss', 'lost someone', 'mourning', 'died', 'passed away', 'miss them'],
  ANGRY: ['angry', 'mad', 'furious', 'resentful', 'rage', 'bitter'],
  NUMB: ['numb', 'empty', 'nothing', 'disconnected', "don't feel anything"],
  CONFUSED: ['confused', 'lost', 'uncertain', 'unsure', "don't know what to do", 'stuck'],
  HOPEFUL: ['hopeful', 'hope', 'encouraged'],
  GRATEFUL: ['grateful', 'thankful', 'blessed'],
  JOYFUL: ['joyful', 'happy', 'joy', 'excited'],
  PEACEFUL: ['peaceful', 'peace', 'calm', 'settled'],
};

function normalizeMoodKey(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const directMatch = MOODS_DATA.find((mood) => mood.key === normalized);
  if (directMatch) return directMatch.key;

  if (MOOD_KEYWORDS[normalized]) return normalized;

  const labelMatch = MOODS_DATA.find((mood) => mood.label.toUpperCase() === normalized);
  return labelMatch?.key ?? null;
}

export function detectMoodKeyFromMessages(messages: ChatLikeMessage[] = []): string | null {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const text = latestUserMessage?.content?.toLowerCase();
  if (!text) return null;

  for (const mood of MOODS_DATA) {
    if (text.includes(mood.key.toLowerCase()) || text.includes(mood.label.toLowerCase())) {
      return mood.key;
    }
  }

  for (const [moodKey, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return moodKey;
    }
  }

  return null;
}

export function resolveMoodKey(input: {
  mood?: string | null;
  moodKey?: string | null;
  detectedMood?: string | null;
  profileMood?: string | null;
  messages?: ChatLikeMessage[];
}): string | null {
  return (
    normalizeMoodKey(input.detectedMood)
    || normalizeMoodKey(input.moodKey)
    || normalizeMoodKey(input.mood)
    || normalizeMoodKey(input.profileMood)
    || detectMoodKeyFromMessages(input.messages)
  );
}

export function buildDavidSystemPromptWithMood(moodKey?: string | null): string {
  const normalizedMoodKey = normalizeMoodKey(moodKey);
  if (!normalizedMoodKey) return DAVID_PERSONALITY_PROMPT;

  const scriptureContext = buildDavidScriptureResponse(normalizedMoodKey);
  const scriptureSection = scriptureContext
    ? `\n\n${scriptureContext}`
    : '';

  return `${DAVID_PERSONALITY_PROMPT}
CURRENT EMOTIONAL THREAD:
The user may be feeling ${normalizedMoodKey.toLowerCase()}.

Respond as if you noticed this from their voice and words, not as if you are labeling them. Do not say, "It sounds like you're feeling..." or clinically name the emotion unless the user named it first.

Use this scripture material only as quiet inspiration. If you mention scripture, connect it to the user's emotional moment in one natural sentence. Do not list verses, preach, or over-explain.
${scriptureSection}

Best voice pattern for this moment: brief acknowledgement, one gentle spiritual thought, then stop or ask one small question.`;
}
