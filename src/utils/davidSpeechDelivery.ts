/**
 * Natural voice delivery helpers for David.
 *
 * The raw Cartesia voice is not the main realism lever. David sounds human when
 * the text going into TTS carries small, believable turns of thought: brief
 * pauses, modest hesitation, short sentences, and occasional soft fillers.
 */

export type HumanizeOptions = {
  isGreeting?: boolean;
  force?: boolean;
};

const TRAILING_PAUSE_MARKS = /[\s。…,…,;:-]+$/;
const SOFT_FILLER_RE = /^(mm+|hmm+|hm+|yeah|you know|i mean)[,\.\s…]+/i;
const SCRIPTED_MARKUP_RE = /\[(?:soft\s+breath|breath|inhale|exhale|sigh|pause)\]|\((?:soft\s+breath|breath|inhale|exhale|sigh|pause)\)|\*(?:soft\s+breath|breath|inhale|exhale|sigh|pause)\*/gi;

const HUMAN_OPENERS = [
  'mm.',
  'hmm.',
  'yeah...',
] as const;

const SHORT_ACKNOWLEDGEMENTS = [
  'I hear you.',
  "I'm with you.",
  "That's a lot.",
  'That feels heavy.',
] as const;

const shouldMaybeAddOpener = (text: string, options: HumanizeOptions): boolean => {
  if (options.isGreeting || options.force) return false;
  if (!text || SOFT_FILLER_RE.test(text)) return false;
  if (/^(lord|father god|god[,\s])/i.test(text)) return false;
  if (text.length < 18 || text.length > 180) return false;

  // Emotional responses benefit from a tiny audible moment of thought. Keep this
  // deterministic-ish and sparse so David does not develop a verbal tic.
  const emotionalCue = /\b(anxious|afraid|sad|lonely|alone|guilt|guilty|ashamed|overwhelmed|tired|grief|lost|hurt|heavy|panic|worried|depressed)\b/i.test(text);
  return emotionalCue ? Math.random() < 0.38 : Math.random() < 0.16;
};

const lightlyShortenRunOn = (text: string): string => {
  // Voice replies should not sound like essays. If the model returns a long,
  // polished answer, keep the first two spoken beats.
  const sentenceMatches = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g);
  if (!sentenceMatches || sentenceMatches.length <= 2) return text;

  const firstTwo = sentenceMatches.slice(0, 2).join(' ').trim();
  return firstTwo.length >= 28 ? firstTwo : text;
};

export function humanizeForTts(
  text: string,
  options: HumanizeOptions = {},
): string {
  if (!text) return '';

  let t = text.trim();

  // Keep the displayed assistant text conversational and speech-friendly.
  t = t.replace(SCRIPTED_MARKUP_RE, '');
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/!+/g, '.');
  t = t.replace(/\.{3,}|…/g, '...');
  t = t.replace(/\s+([,.!?])/g, '$1');

  t = lightlyShortenRunOn(t);

  if (shouldMaybeAddOpener(t, options)) {
    const opener = HUMAN_OPENERS[Math.floor(Math.random() * HUMAN_OPENERS.length)];
    t = `${opener} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  }

  return t.trim();
}

/**
 * Cartesia speech cleanup and cadence shaping.
 *
 * Keep natural fillers such as "mm" and "hmm" because they are part of the
 * requested human delivery. Remove only explicit stage directions and markup.
 */
export function sanitizeForDavidSpeech(text: string): string {
  if (!text) return '';

  let t = text.trim();

  t = t.replace(SCRIPTED_MARKUP_RE, '');
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/…/g, '...');
  t = t.replace(/[!?]+/g, '.');
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/\s+([,.])/g, '$1');

  // Ellipses create a more human pause in Cartesia than commas alone, but too
  // many make speech drag. Keep the first two, soften the rest.
  let ellipsisCount = 0;
  t = t.replace(/\.\.\./g, () => {
    ellipsisCount += 1;
    return ellipsisCount <= 2 ? '...' : ', ';
  });

  // Add one small acknowledgement to very short emotional replies only when the
  // model returned something too bare for speech. This gives David a human beat
  // without turning the response into a script.
  if (t.length >= 12 && t.length <= 34 && !SOFT_FILLER_RE.test(t) && Math.random() < 0.12) {
    const ack = SHORT_ACKNOWLEDGEMENTS[Math.floor(Math.random() * SHORT_ACKNOWLEDGEMENTS.length)];
    t = `${ack} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  }

  t = t.replace(TRAILING_PAUSE_MARKS, '');

  if (t && !/[.!?]$/.test(t)) {
    t += '.';
  }

  return t;
}

export type PrepareTtsResult = {
  displayText: string;
  speechText: string;
};

export function prepareDavidTtsPayload(
  text: string,
  options: HumanizeOptions = {},
): PrepareTtsResult {
  const displayText = humanizeForTts(text, options);
  const speechText = sanitizeForDavidSpeech(displayText);

  return {
    displayText,
    speechText,
  };
}

/**
 * A tiny reflective pause makes realtime voice feel less machine-fast. Keep it
 * short so David remains responsive, and make shorter emotional replies pause a
 * bit longer than factual answers.
 */
export function preSpeechThinkingDelay(text = ''): Promise<void> {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const emotionalCue = /\b(anxious|afraid|sad|lonely|guilt|ashamed|overwhelmed|grief|hurt|heavy|panic|worried|tired)\b/i.test(text);
  const base = emotionalCue ? 520 : 320;
  const lengthAdjustment = wordCount <= 10 ? 220 : wordCount >= 35 ? -120 : 0;
  const jitter = Math.floor(Math.random() * 260);
  const delayMs = Math.max(260, Math.min(1050, base + lengthAdjustment + jitter));

  return new Promise(resolve => setTimeout(resolve, delayMs));
}
