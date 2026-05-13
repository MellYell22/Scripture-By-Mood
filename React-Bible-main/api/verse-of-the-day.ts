import OpenAI from 'openai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { translation = 'NIV' } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API Key is not configured.');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides daily Bible verses.' },
        { 
          role: 'user', 
          content: `Provide a single, inspiring Bible verse for today (${today}) in the ${translation} translation. 
Include the verse text, the reference (e.g., "John 3:16 (${translation})"), and a short, encouraging explanation (1-2 sentences).
Ensure the verse is different from common ones if possible, but always uplifting.
Format your response as valid JSON:
{
  "verse": "...",
  "reference": "...",
  "explanation": "..."
}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const content = completion.choices[0].message.content;
    res.status(200).json(JSON.parse(content || '{}'));
  } catch (error: any) {
    console.error('[OpenAI] Verse of the day error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
