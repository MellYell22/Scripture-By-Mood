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
  'mm,',
  'hmm,',
  'yeah,',
] as const;

const SHORT_ACKNOWLEDGEMENTS = [
  'I hear you,',
  "I'm with you,",
  "That's a lot,",
  'That feels heavy,',
] as const;

const ACKNOWLEDGEMENT_PERIOD_RE = /\b(I hear you|I'm with you|I am with you|That feels heavy|That's a lot|That is a lot|I get that|I understand)\.\s+/gi;
const FILLER_PERIOD_RE = /\b(mm+|hmm+|hm+|yeah|you know|i mean)\.\s+/gi;
const DECIMAL_PLACEHOLDER = '__DAVID_DECIMAL_POINT__';

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

const joinLineBreaksConversationally = (text: string): string => {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);

  if (lines.length <= 1) return text;

  return lines
    .map((line, index) => {
      let current = line;
      const isLast = index === lines.length - 1;

      if (!isLast) {
        // Newlines are visual formatting, not mandatory speech stops. Remove
        // trailing punctuation that was likely added only because the phrase was
        // placed on its own line, while keeping true question marks intact.
        current = current.replace(/[.;:]+$/g, '');
        if (/[!?]$/.test(current)) return current;
        return `${current},`;
      }

      return current;
    })
    .join(' ');
};

const protectDecimalPoints = (text: string): string => text.replace(/(\d)\.(\d)/g, `$1${DECIMAL_PLACEHOLDER}$2`);
const restoreDecimalPoints = (text: string): string => text.replaceAll(DECIMAL_PLACEHOLDER, '.');

const softenPunctuationForTts = (text: string): string => {
  let t = text;

  // Cartesia treats periods as strong stops. Preserve real sentence endings, but
  // soften separators that are usually formatting or mid-thought punctuation.
  t = t.replace(/\s*[;:]\s*/g, ', ');
  t = t.replace(/\s+[–—]\s+/g, ', ');
  t = t.replace(/\s+-\s+/g, ', ');
  t = t.replace(/,{2,}/g, ',');
  t = t.replace(/\s+,/g, ',');
  t = t.replace(/,\s*(and|but|so|because|then)\b/gi, ', $1');

  return t;
};

const softenShortInternalStops = (text: string): string => {
  let t = protectDecimalPoints(text);

  // Filler and acknowledgement periods sound like hard stops in TTS. They should
  // be a soft conversational beat, not a sentence break.
  t = t.replace(FILLER_PERIOD_RE, (_match, filler: string) => `${filler}, `);
  t = t.replace(ACKNOWLEDGEMENT_PERIOD_RE, (_match, phrase: string) => `${phrase}, `);

  // If a very short first beat is followed by more speech, make it flow like a
  // spoken lead-in. Longer complete thoughts keep their sentence boundary.
  t = t.replace(/^([^.!?]{2,34})\.\s+(?=[A-Z"'])/u, (_match, leadIn: string) => {
    const wordCount = leadIn.trim().split(/\s+/).filter(Boolean).length;
    return wordCount <= 5 ? `${leadIn}, ` : `${leadIn}. `;
  });

  return restoreDecimalPoints(t);
};

const lightlyShortenRunOn = (text: string): string => {
  // Voice replies should not sound like essays. If the model returns a long,
  // polished answer, keep the first two spoken beats.
  const sentenceMatches = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g);
  if (!sentenceMatches || sentenceMatches.length <= 2) return text;

  const firstTwo = sentenceMatches.slice(0, 2).join(' ').trim();
  return firstTwo.length >= 28 ? firstTwo : text;
};

// Add SSML support for fine-grained control over speech delivery
const addSsmlTags = (text: string): string => {
  let t = text;

  // Add pauses for commas and periods
  t = t.replace(/,/g, '<break time="300ms"/>');
  t = t.replace(/\./g, '<break time="500ms"/>');

  // Emphasize key emotional words
  t = t.replace(/\b(anxious|afraid|sad|lonely|guilt|ashamed|overwhelmed|tired|grief|lost|hurt|heavy|panic|worried|depressed)\b/gi, '<emphasis level="moderate">$1</emphasis>');

  return t;
};

// Adjust pacing dynamically based on sentence length and emotional content
const adjustPacing = (text: string): string => {
  const words = text.split(' ');
  const wordCount = words.length;

  if (wordCount < 10) {
    return `<prosody rate="slow">${text}</prosody>`;
  } else if (wordCount > 20) {
    return `<prosody rate="fast">${text}</prosody>`;
  }

  return `<prosody rate="medium">${text}</prosody>`;
};

// Further refine punctuation handling for natural sentence flow
const refinePunctuation = (text: string): string => {
  let t = text;

  // Replace semicolons, colons, and dashes with commas for smoother flow
  t = t.replace(/\s*[;:]+\s*/g, ', ');
  t = t.replace(/\s+[–—]+\s+/g, ', ');
  t = t.replace(/\s+-\s+/g, ', ');

  // Remove duplicate commas and unnecessary spaces
  t = t.replace(/,{2,}/g, ',');
  t = t.replace(/\s+,/g, ',');

  // Ensure proper spacing after punctuation
  t = t.replace(/([.!?])(?=\S)/g, '$1 ');

  return t.trim();
};

// Fine-tune response chunking for conversational rhythm
const chunkForRhythm = (text: string): string => {
  const sentences = text.split(/(?<=[.!?])\s+/); // Split by sentence boundaries

  return sentences
    .map((sentence, index) => {
      if (index === sentences.length - 1) return sentence; // Keep the last sentence as is

      // Add a slight pause between sentences for rhythm
      return `${sentence},`;
    })
    .join(' ');
};

export function humanizeForTts(
  text: string,
  options: HumanizeOptions = {},
): string {
  if (!text) return '';

  let t = text.trim();

  // Keep the displayed assistant text conversational and speech-friendly.
  t = t.replace(SCRIPTED_MARKUP_RE, '');
  t = joinLineBreaksConversationally(t);
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\.{3,}|…/g, '...');
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/\s+([,.!?])/g, '$1');
  t = softenPunctuationForTts(t);
  t = softenShortInternalStops(t);

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
  t = joinLineBreaksConversationally(t);
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/…/g, '...');
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/\s+([,.!?])/g, '$1');
  t = softenPunctuationForTts(t);
  t = softenShortInternalStops(t);

  // Ellipses create a more human pause in Cartesia than commas alone, but too
  // many make speech drag. Keep the first one, soften the rest so the line keeps
  // moving instead of repeatedly stopping.
  let ellipsisCount = 0;
  t = t.replace(/\.\.\./g, () => {
    ellipsisCount += 1;
    return ellipsisCount <= 1 ? '...' : ', ';
  });

  // Add one small acknowledgement to very short emotional replies only when the
  // model returned something too bare for speech. This gives David a human beat
  // without turning the response into a script.
  if (t.length >= 12 && t.length <= 34 && !SOFT_FILLER_RE.test(t) && Math.random() < 0.12) {
    const ack = SHORT_ACKNOWLEDGEMENTS[Math.floor(Math.random() * SHORT_ACKNOWLEDGEMENTS.length)];
    t = `${ack} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  }

  t = t.replace(TRAILING_PAUSE_MARKS, '');

  // Do not append an artificial period. Cartesia should only pause when the LLM
  // actually produced a meaningful sentence boundary, not because the frontend
  // forced every TTS payload to end with a hard stop.
  return t.trim();
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
  const emotionalCue = /\b(anxious|afraid|sad|lonely|guilt|ashamed|overwhelmed|grief|hurt|heavy|panic|worried|depressed)\b/i.test(text);
  const base = emotionalCue ? 620 : 420;
  const lengthAdjustment = wordCount <= 10 ? 260 : wordCount >= 35 ? -80 : 80;
  const jitter = Math.floor(Math.random() * 260);
  const delayMs = Math.max(360, Math.min(1180, base + lengthAdjustment + jitter));

  return new Promise(resolve => setTimeout(resolve, delayMs));
}

// Integrate refined pacing and rhythm adjustments
export const enhanceSpeechDelivery = (text: string): string => {
  let enhancedText = softenPunctuationForTts(text);
  enhancedText = softenShortInternalStops(enhancedText);
  enhancedText = joinLineBreaksConversationally(enhancedText);
  enhancedText = refinePunctuation(enhancedText);
  enhancedText = chunkForRhythm(enhancedText);

  return enhancedText;
};
