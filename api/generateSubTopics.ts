import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI as GenAIClient, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({});
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GenAIClient({ apiKey });
  try {
    const { strategy } = req.body as any;
    const model = 'gemini-2.5-flash';
    const prompt = `
    Atue como um estrategista de conteúdo sênior.
  Contexto:
- Assunto: ${strategy.subject}
- Tópico Geral: ${strategy.topic}
    ${strategy.detailedAgenda ? `- Pauta Detalhada/Diretriz: ${strategy.detailedAgenda}` : ''}
- Área de Atuação: ${strategy.expertise}
- Público: ${strategy.audience}

    Gere exatamente 10 sugestões de sub - tópicos(ângulos específicos) derivados desse contexto.
    Para cada sub - tópico, forneça:
1. Um Título chamativo.
    2. Uma descrição curta de até 100 caracteres explicando o viés.

    Retorne APENAS um JSON array neste formato:
[
  { "title": "...", "description": "..." }
]
  `;
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['title', 'description']
          }
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return res.json({ text: response.text || '[]' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar subtópicos.' });
  }
}
