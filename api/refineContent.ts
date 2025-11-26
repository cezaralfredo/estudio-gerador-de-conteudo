import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI as GenAIClient } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({});
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GenAIClient({ apiKey });
  try {
    const { currentContent, instruction } = req.body as any;
    const model = 'gemini-2.5-flash';
    const prompt = `
        Você é um Editor Sênior.
        
        INSTRUÇÃO DE EDIÇÃO: "${instruction}"
        
        TEXTO ORIGINAL:
        ${currentContent}
        
        TAREFA:
        Reescreva o texto aplicando a instrução acima.
        Mantenha a formatação Markdown.
        Mantenha a essência e os fatos, apenas ajuste o estilo/tamanho/gramática conforme pedido.
        
        SAÍDA: Apenas o novo texto em Markdown.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || currentContent });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao refinar conteúdo.' });
  }
}
