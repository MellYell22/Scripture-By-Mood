/** David's ElevenLabs voice — single source of truth */
export const DAVID_ELEVENLABS_VOICE_ID = '9X1Jz0xL6DHvaiD9uzHw';

/** Stale IDs from older configs — auto-map to current David voice */
const DEPRECATED_VOICE_IDS = new Set([
  'vek32IUMncn9S8XIcFt5',
]);

export function resolveDavidVoiceId(
  envVoiceId?: string | null,
): string {
  const trimmed = envVoiceId?.trim();
  if (!trimmed || DEPRECATED_VOICE_IDS.has(trimmed)) {
    return DAVID_ELEVENLABS_VOICE_ID;
  }
  return trimmed;
}
