/** Shared voice transcript validation (client + mirrored on api/transcribe). */

export const JUNK_TRANSCRIPT_PATTERNS = [
  /^[\s.…,!?*-]+$/,
  /^(spiritual conversation in english|spiritual conversation)[.!?\s]*$/i,
  /^(thank you|thanks for watching|subscribe|you|bye|goodbye|okay|ok)[.!?\s]*$/i,
  /^(music|applause|\[silence\]|\[music\]|\[inaudible\])$/i,
  /^(the|a|an|i|it|so|and|but|or|well)[.!?\s]*$/i,
];

/** Actual environmental noise only. Natural human vocalizations are allowed. */
export const NOISE_TRANSCRIPT_PATTERNS = [
  /^(cough|coughing|\*cough\*|clears? throat|sniff|sneeze|burp|yawn)[.!?\s]*$/i,
  /^(breathing|inhales?|exhales?)[.!?\s]*$/i,
  /^\[(music|silence|inaudible|noise|static)\]$/i,
];

/** True session openers — used to block a second greeting mid-session. */
const OPENING_GREETING_PATTERNS = [
  /^hey[,.]?\s/i,
  /^hey\.?$/i,
  /^hi[,.]?\s/i,
  /^hello[,.]?\s/i,
  /^good to see/i,
  /^what'?s (been on your mind|going on|up)/i,
  /^how'?s your (heart|night|day)/i,
  /^glad you came back/i,
  /^what'?s been weighing/i,
  /^there you are/i,
  /^how'?s it going/i,
  /^what'?s up/i,
  /^quiet night/i,
  /^long day/i,
];

/** Therapy-bot / assistant phrases — replace with fallback, never silent retry. */
const BANNED_THERAPY_PHRASE_PATTERNS = [
  /^how are you feeling(\s+today)?/i,
  /^tell me more/i,
  /^it sounds like you/i,
  /^you seem (like you|deep)/i,
  /^i'?m (here for you|here to listen|here to support|happy to help)/i,
  /^i'?m glad you/i,
  /^that must be (hard|difficult|challenging)/i,
  /^thank you for (sharing|telling)/i,
  /^how can i (help|assist|support)/i,
  /^you are not alone/i,
  /^good to hear from you/i,
  /^you'?ve got something on your mind/i,
  /^as an ai/i,
  /^i understand (that )?you/i,
  /^let'?s explore/i,
  /^it is important to remember/i,
  /^here are (some|a few|three)/i,
  /^in conclusion/i,
];

export const MIN_MEANINGFUL_WORDS = 2;
export const MIN_MEANINGFUL_LETTERS = 8;

/** Short phrases that are intentional user speech, not noise — bypass strict filters. */
const INTENTIONAL_SHORT_PHRASES = [
  /^(hi|hey|hello)\s+(david|there|man|bro|friend)/i,
  /^(good\s+)?(morning|evening|afternoon)/i,
  /^how('?s|\s+is)\s+(it|everything|life|things)/i,
  /^i('?m|\s+am)\s+/i,
  /^(i\s+need|i\s+feel|i\s+want|help|pray)/i,
  /^what('?s|\s+is)\s+/i,
  /^can\s+you/i,
  /^david/i,
  /^(um|uh|hmm|hm|mhm|ah|oh|wow|yeah|yep|nope)$/i,
];

const ALLOWED_HUMAN_SOUNDS = [
  'um',
  'uh',
  'hmm',
  'hm',
  'mhm',
  'ah',
  'oh',
  'wow',
  'yeah',
  'yep',
  'nope',
];

function isIntentionalShortPhrase(text: string): boolean {
  const t = text.trim();
  return INTENTIONAL_SHORT_PHRASES.some(re => re.test(t));
}

export function normalizeTranscript(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isJunkTranscript(text: string): boolean {
  const normalized = normalizeTranscript(text);
  if (!normalized) return true;
  if (normalized.length < 3) return true;

  // Allow intentional short phrases like "Hi David" and natural sounds like "hmm" through.
  if (isIntentionalShortPhrase(normalized)) return false;

  if (JUNK_TRANSCRIPT_PATTERNS.some(re => re.test(normalized))) return true;
  if (NOISE_TRANSCRIPT_PATTERNS.some(re => re.test(normalized))) return true;

  const words = normalized.split(/\s+/).filter(Boolean);

  if (
    words.length === 1 &&
    words[0].length <= 4 &&
    !ALLOWED_HUMAN_SOUNDS.includes(words[0])
  ) {
    return true;
  }

  return false;
}

/** Require enough real language before calling the AI. */
export function isMeaningfulTranscript(text: string): boolean {
  if (isJunkTranscript(text)) return false;

  const trimmed = text.trim();

  // Intentional short phrases always pass — they are real user speech.
  if (isIntentionalShortPhrase(trimmed)) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < MIN_MEANINGFUL_WORDS) return false;

  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length < MIN_MEANINGFUL_LETTERS) return false;

  return true;
}

export function transcriptsAreSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;

  if (longer.includes(shorter) && shorter.length >= 6) return true;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;

  let matches = 0;
  const minLen = Math.min(a.length, b.length);

  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / maxLen >= 0.85;
}

export function isDuplicateTranscript(
  normalized: string,
  lastTranscript: string,
  recentTranscripts: string[],
): boolean {
  if (!normalized) return true;
  if (normalized === lastTranscript) return true;
  return recentTranscripts.some(t => transcriptsAreSimilar(t, normalized));
}

/** Block David from re-delivering an opening greeting mid-session. */
export function looksLikeOpeningGreeting(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return OPENING_GREETING_PATTERNS.some(re => re.test(t));
}

/** Persona-banned therapy / assistant phrasing — swap for a natural fallback. */
export function looksLikeBannedTherapyPhrase(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return BANNED_THERAPY_PHRASE_PATTERNS.some(re => re.test(t));
}
