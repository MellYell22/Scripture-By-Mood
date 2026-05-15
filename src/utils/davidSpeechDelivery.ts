/**
 * Adds subtle human rhythm to text before ElevenLabs TTS.
 * Display text and spoken text should both use the same output.
 */

const CONVERSATIONAL_PREFIXES = ['mm…', 'yeah…', 'hm.', 'alright…', 'heh.'];
const SOFT_OPENING_BREATH = '…'; // rare — implies inhale before speaking

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
