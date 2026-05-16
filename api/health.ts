export default async function handler(req: any, res: any) {
  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV,
    appUrl: process.env.APP_URL || "not set",
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    lemonfoxConfigured: !!process.env.LEMONFOX_API_KEY,
    lemonfoxVoice: "onyx",
    supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
  });
}
