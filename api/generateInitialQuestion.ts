import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI as GenAIClient } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({});
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GenAIClient({ apiKey });
  try {
    const { strategy } = req.body as any;
    const model = 'gemini-2.5-flash';
    const prompt = `
      Contexto:
      O usuário quer escrever sobre: "${strategy.selectedSubTopic}".
      Pauta Base: "${strategy.detailedAgenda}".
      Nível: ${strategy.complexityLevel} (Isto é muito importante).
      Área: ${strategy.expertise}.
      ${strategy.brandVoice ? `Persona do Autor: ${strategy.brandVoice}` : ''}
      
      Atue como um editor objetivo.
      Com base no nível escolhido, faça A pergunta mais crítica para fechar o conteúdo.
      Se for Básico: pergunte sobre dados proprietários ou visão contrarianista.
      Se for Avançado: pergunte sobre dados proprietários ou visão contrarianista.
      
      Responda em Português do Brasil.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar pergunta inicial.' });
  }
}
