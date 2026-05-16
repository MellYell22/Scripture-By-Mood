/**
 * api/speech.ts — ElevenLabs TTS endpoint
 *
 * Intentionally self-contained: no utility imports that could fail at runtime.
 * Uses plain text (no SSML) for maximum compatibility across all ElevenLabs plans.
 *
 * Fallback strategy:
 *   Tier 1: David voice (9X1Jz0xL6DHvaiD9uzHw) + eleven_turbo_v2_5
 *   Tier 2: David voice + eleven_multilingual_v2  (if turbo unavailable on plan)
 *   Tier 3: Adam voice (pNInz6obpgDQGcFmaJgB) + eleven_monolingual_v1 (free tier safe)
 */

// David's locked voice ID
const DAVID_VOICE_ID = '9X1Jz0xL6DHvaiD9uzHw';
// ElevenLabs built-in Adam — available on ALL plans including free
const ADAM_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

/** Strip any SSML tags so plain-text models don't choke */
function stripSsml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Call ElevenLabs TTS and return the fetch Response */
async function callElevenLabs(
  apiKey: string,
  voiceId: string,
  text: string,
  modelId: string,
): Promise<Response> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_22050_32`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      enable_ssml_parsing: false,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: false,
      },
    }),
  });
}

export default async function handler(req: any, res: any) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Validate input ────────────────────────────────────────────────────────
  const rawText = req.body?.text;
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    console.warn('[Speech API] Missing or empty text parameter');
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  // Always use plain text — strip any SSML that may have been passed in
  const text = stripSsml(rawText);
  if (!text) {
    return res.status(400).json({ error: 'Text was empty after stripping SSML' });
  }

  // ── API Key ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.error('[Speech API] CRITICAL: ELEVENLABS_API_KEY not set in environment');
    return res.status(500).json({
      error: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to Vercel env vars.',
    });
  }
  console.log(`[Speech API] Key OK (len=${apiKey.length}), text="${text.substring(0, 60)}..."`);

  // ── 3-tier fallback ───────────────────────────────────────────────────────
  const attempts = [
    { voiceId: DAVID_VOICE_ID, model: 'eleven_turbo_v2_5',      label: 'David/turbo' },
    { voiceId: DAVID_VOICE_ID, model: 'eleven_multilingual_v2',  label: 'David/multilingual' },
    { voiceId: ADAM_VOICE_ID,  model: 'eleven_monolingual_v1',   label: 'Adam/monolingual (fallback)' },
  ];

  let lastStatus = 500;
  let lastBody = '';

  for (const attempt of attempts) {
    console.log(`[Speech API] Trying ${attempt.label}...`);
    try {
      const response = await callElevenLabs(apiKey, attempt.voiceId, text, attempt.model);

      if (response.ok) {
        console.log(`[Speech API] Success with ${attempt.label}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        return res.status(200).send(buffer);
      }

      // Non-2xx — log and try next tier
      lastStatus = response.status;
      lastBody = await response.text();
      console.warn(
        `[Speech API] ${attempt.label} failed: HTTP ${lastStatus} — ${lastBody.substring(0, 300)}`,
      );

      // 402 = quota exhausted — no point retrying other voices/models
      if (lastStatus === 402) {
        console.error('[Speech API] 402 — ElevenLabs quota exhausted or subscription lapsed');
        return res.status(402).json({
          error: 'ElevenLabs quota exhausted. Check billing at elevenlabs.io.',
          details: lastBody,
        });
      }

      // 401 = bad API key — no point retrying
      if (lastStatus === 401) {
        console.error('[Speech API] 401 — Invalid ELEVENLABS_API_KEY');
        return res.status(401).json({
          error: 'ElevenLabs API key is invalid. Check ELEVENLABS_API_KEY in Vercel env vars.',
          details: lastBody,
        });
      }

      // Otherwise continue to next tier
    } catch (fetchErr: any) {
      console.error(`[Speech API] ${attempt.label} threw: ${fetchErr.message}`);
      lastBody = fetchErr.message;
    }
  }

  // All 3 tiers failed
  console.error(`[Speech API] All tiers failed. Last status: ${lastStatus}. Last body: ${lastBody.substring(0, 500)}`);
  return res.status(500).json({
    error: 'All ElevenLabs TTS attempts failed',
    lastStatus,
    details: lastBody,
  });
}
