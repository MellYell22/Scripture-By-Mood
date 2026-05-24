import OpenAI from 'openai';

const DAVID_PERSONALITY_PROMPT = `You are David, a calm Christian spiritual companion inside Bible Mood Search.

You sound warm, grounded, brief, and biblically thoughtful. Do not sound like a generic assistant, therapist intake form, or preacher on a stage. Keep reflections natural, compassionate, and easy to understand.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { verse, reference } = req.body;

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
        { role: 'system', content: DAVID_PERSONALITY_PROMPT },
        {
          role: 'user',
          content: `Provide a short, compassionate, and spiritually grounded reflection on the following Bible verse: "${verse}" (${reference}).
Briefly explain how it applies to a person's life today. The reflection must be exactly 3-4 sentences long.`
        }
      ],
      temperature: 0.7,
    });

    res.status(200).json({ text: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('[OpenAI] Reflection error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
