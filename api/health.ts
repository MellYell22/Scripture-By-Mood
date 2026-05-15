import { resolveDavidVoiceId } from '../src/constants/elevenLabsVoice';

export default async function handler(req: any, res: any) {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
  const envVoiceId = process.env.ELEVENLABS_VOICE_ID || process.env.ELEVEN_LABS_VOICE_ID;
  const elevenLabsVoiceId = resolveDavidVoiceId(envVoiceId);

  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV,
    appUrl: process.env.APP_URL || "not set",
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    elevenLabsConfigured: !!elevenLabsKey,
    elevenLabsVoiceId,
    supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
  });
}
