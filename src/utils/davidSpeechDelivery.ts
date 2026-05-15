/**
 * Human rhythm (plain text) + ElevenLabs SSML delivery (audio only).
 * UI/message history uses displayText; TTS uses ssmlText.
 */

/** Matches pastor-presence delivery: slightly slower, grounded pitch */
export const DAVID_SSML_PROSODY = {
  rate: '91%',
  pitch: '-1st',
} as const;

/** Break after thinking fillers (mm…, yeah…, etc.) */
export const SSML_BREAK_AFTER_FILLER_S = 0.35;
export const SSML_BREAK_ELLIPSIS_S = 0.3;
export const SSML_BREAK_CLAUSE_S = 0.2;

const CONVERSATIONAL_PREFIXES = ['mm…', 'yeah…', 'hm.', 'alright…', 'heh.'];
const SOFT_OPENING_BREATH = '…';

const SAFETY_PLAIN_SPEECH = /emergency|crisis|988|self[- ]?harm|suicide|call 911|danger right now/i;

export type HumanizeOptions = {
  /** Opening session line — slightly more texture, still subtle */
  isGreeting?: boolean;
  /** Skip randomization (safety / already humanized) */
  force?: boolean;
};

function alreadyHasTexture(text: string): boolean {
  const t = text.trim();
  return /^(mm|hm|yeah|alright|heh|okay|ok)[.…\s]/i.test(t)
    || /^…/.test(t)
    || /…/.test(t);
}

/** Insert natural pauses via ellipsis — not on every line */
function addEllipsisPauses(text: string): string {
  let t = text;

  // "hey. what's" → "hey… what's"
  t = t.replace(/^hey\.\s+/i, 'hey… ');
  t = t.replace(/^hey,\s+/i, 'hey… ');

  // "good to see you." at end → trailing thought
  if (/^good to see you\.?$/i.test(t)) {
    t = 'good to see you…';
  }

  // Clause break before a question word
  t = t.replace(/\.\s+(what|how|you)\b/i, '… $1');

  // "I get that." → "I get that…" (occasional trailing)
  if (Math.random() < 0.35 && /^I get that\.?$/i.test(t)) {
    t = 'I get that…';
  }

  return t;
}

/**
 * Light post-process so TTS sounds like someone thinking, not reading a script.
 */
export function humanizeForTts(text: string, options: HumanizeOptions = {}): string {
  if (options.force) return text.trim();

  let t = text.trim();
  if (!t || t.length < 2) return t;

  const isGreeting = options.isGreeting ?? false;
  const prefixChance = isGreeting ? 0.5 : 0.3;
  const breathChance = isGreeting ? 0.12 : 0.06;
  const pauseChance = isGreeting ? 0.55 : 0.25;

  if (!alreadyHasTexture(t) && Math.random() < breathChance) {
    t = `${SOFT_OPENING_BREATH} ${t}`;
  } else if (!alreadyHasTexture(t) && Math.random() < prefixChance) {
    const prefix = CONVERSATIONAL_PREFIXES[Math.floor(Math.random() * CONVERSATIONAL_PREFIXES.length)];
    const rest = t.charAt(0).toLowerCase() + t.slice(1);
    t = `${prefix} ${rest}`;
  }

  if (Math.random() < pauseChance) {
    t = addEllipsisPauses(t);
  }

  return t.replace(/\s+/g, ' ').trim();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** True when text is already a full ElevenLabs SSML document */
export function isAlreadyElevenLabsSsml(text: string): boolean {
  return /^\s*<speak[\s>]/i.test(text);
}

/**
 * Wrap plain text in ElevenLabs SSML — prosody + breaks for natural pacing.
 * Example: mm… <break/> that's a heavy thing to carry.
 */
export function toElevenLabsSsml(plainText: string): string {
  const trimmed = plainText.trim();
  if (!trimmed) return trimmed;
  if (isAlreadyElevenLabsSsml(trimmed)) return trimmed;

  let inner = escapeXml(trimmed);

  // Filler + ellipsis → pause (thinking before continuing)
  inner = inner.replace(
    /^(mm|hm|yeah|alright|heh)(…|\.{3}|\.)\s*/i,
    `$1$2 <break time="${SSML_BREAK_AFTER_FILLER_S}s"/> `,
  );

  // Mid-sentence ellipsis
  inner = inner.replace(/(…|\.{3})\s+/g, `<break time="${SSML_BREAK_ELLIPSIS_S}s"/> `);

  // Em dash / clause breath
  inner = inner.replace(/\s*—\s*/g, ` <break time="${SSML_BREAK_CLAUSE_S}s"/> `);

  // Short pause after sentence end before next thought (not every period)
  inner = inner.replace(
    /\.(\s+)(?=[a-z])/g,
    `.<break time="${SSML_BREAK_CLAUSE_S}s"/>$1`,
  );

  return (
    `<speak><prosody rate="${DAVID_SSML_PROSODY.rate}" pitch="${DAVID_SSML_PROSODY.pitch}">` +
    `${inner}</prosody></speak>`
  );
}

export type PrepareTtsResult = {
  /** Shown in chat / logs — no SSML tags */
  displayText: string;
  /** Sent to ElevenLabs */
  ssmlText: string;
  enableSsmlParsing: boolean;
};

/** Humanize plain text, then build SSML payload for synthesis. */
export function prepareDavidTtsPayload(
  text: string,
  options: HumanizeOptions = {},
): PrepareTtsResult {
  const displayText = options.force ? text.trim() : humanizeForTts(text, options);
  const usePlainSpeech = SAFETY_PLAIN_SPEECH.test(displayText);

  if (usePlainSpeech) {
    return {
      displayText,
      ssmlText: displayText,
      enableSsmlParsing: false,
    };
  }

  if (isAlreadyElevenLabsSsml(displayText)) {
    return {
      displayText,
      ssmlText: displayText.trim(),
      enableSsmlParsing: true,
    };
  }

  return {
    displayText,
    ssmlText: toElevenLabsSsml(displayText),
    enableSsmlParsing: true,
  };
}

/** Brief pause before audio — simulates someone gathering thought (voice only) */
export function preSpeechThinkingDelay(isGreeting = false): Promise<void> {
  const chance = isGreeting ? 0.4 : 0.38;
  if (Math.random() > chance) {
    return Promise.resolve();
  }
  const ms = isGreeting
    ? 350 + Math.floor(Math.random() * 450)
    : 200 + Math.floor(Math.random() * 500);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
