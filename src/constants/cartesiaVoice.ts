/** David's Cartesia voice configuration */
export const DAVID_CARTESIA_VOICE_ID = 'a5136bf9-224c-4d76-b823-52bd5efcffcc';

export const CARTESIA_TTS_URL = 'https://api.cartesia.ai/tts/bytes';

/**
 * sonic-3 is used for David because it supports generation_config
 * controls for speed, volume, and emotion.
 */
export const CARTESIA_MODEL_ID = 'sonic-3';

export const CARTESIA_API_VERSION = '2026-03-01';

export function resolveCartesiaVoiceId(envVoiceId?: string | null): string {
  return envVoiceId?.trim() || DAVID_CARTESIA_VOICE_ID;
}