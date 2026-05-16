/**
 * api/speech.ts — LemonFox TTS endpoint
 *
 * Replaces ElevenLabs with LemonFox TTS API.
 * LemonFox is OpenAI/ElevenLabs-compatible, lower cost, and lower latency.
 *
 * Endpoint: POST https://api.lemonfox.ai/v1/audio/speech
 * Auth:     Authorization: Bearer LEMONFOX_API_KEY
 *
 * David's voice: "onyx" — deep, calm, grounded male voice
 * Fallback voice: "eric" — warm, natural male voice
 *
 * Docs: https://www.lemonfox.ai/apis/text-to-speech
 */

// David's primary voice — deep, calm, grounded
const DAVID_VOICE = 'onyx';
// Fallback voice if primary fails
const FALLBACK_VOICE = 'eric';

const LEMONFOX_TTS_URL = 'https://api.lemonfox.ai/v1/audio/speech';

/** Strip any SSML tags so the plain-text API doesn't receive markup */
function stripSsml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Call LemonFox TTS and return the fetch Response */
async function callLemonFox(
  apiKey: string,
  voice: string,
  text: string,
): Promise<Response> {
  return fetch(LEMONFOX_TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      input: text,
      voice,
      language: 'en-us',
      response_format: 'mp3',
      speed: 0.95, // Slightly slower than default — more natural, less rushed
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

  // Strip SSML tags — LemonFox uses plain text only
  const text = stripSsml(rawText);
  if (!text) {
    return res.status(400).json({ error: 'Text was empty after stripping markup' });
  }

  // ── API Key ───────────────────────────────────────────────────────────────
  const apiKey = process.env.LEMONFOX_API_KEY;
  if (!apiKey) {
    console.error('[Speech API] CRITICAL: LEMONFOX_API_KEY not set in environment');
    return res.status(500).json({
      error: 'LemonFox API key not configured. Add LEMONFOX_API_KEY to Vercel env vars.',
    });
  }
  console.log(`[Speech API] LemonFox key OK (len=${apiKey.length}), text="${text.substring(0, 60)}..."`);

  // ── 2-tier fallback ───────────────────────────────────────────────────────
  const attempts = [
    { voice: DAVID_VOICE,    label: `LemonFox/${DAVID_VOICE} (primary)` },
    { voice: FALLBACK_VOICE, label: `LemonFox/${FALLBACK_VOICE} (fallback)` },
  ];

  let lastStatus = 500;
  let lastBody = '';

  for (const attempt of attempts) {
    console.log(`[Speech API] Trying ${attempt.label}...`);
    try {
      const response = await callLemonFox(apiKey, attempt.voice, text);

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

      // 401 = bad API key — no point retrying
      if (lastStatus === 401) {
        console.error('[Speech API] 401 — Invalid LEMONFOX_API_KEY');
        return res.status(401).json({
          error: 'LemonFox API key is invalid. Check LEMONFOX_API_KEY in Vercel env vars.',
          details: lastBody,
        });
      }

      // 402 / 429 = quota or rate limit — no point retrying
      if (lastStatus === 402 || lastStatus === 429) {
        console.error(`[Speech API] ${lastStatus} — LemonFox quota or rate limit hit`);
        return res.status(lastStatus).json({
          error: 'LemonFox quota exhausted or rate limit hit. Check billing at lemonfox.ai.',
          details: lastBody,
        });
      }

      // Otherwise continue to fallback voice
    } catch (fetchErr: any) {
      console.error(`[Speech API] ${attempt.label} threw: ${fetchErr.message}`);
      lastBody = fetchErr.message;
    }
  }

  // Both tiers failed
  console.error(`[Speech API] All attempts failed. Last status: ${lastStatus}. Last body: ${lastBody.substring(0, 500)}`);
  return res.status(500).json({
    error: 'All LemonFox TTS attempts failed',
    lastStatus,
    details: lastBody,
  });
}
