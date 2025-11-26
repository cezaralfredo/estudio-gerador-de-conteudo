import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI as GenAIClient } from '@google/genai';

const INTERVIEWER_SYSTEM_INSTRUCTION = `
Você é um Diretor Editorial experiente. 
O usuário JÁ SELECIONOU um sub - tópico e um NÍVEL DE COMPLEXIDADE.
Seu objetivo é obter APENAS os detalhes finais: opiniões polêmicas, dados específicos ou a "voz" única do usuário.

  Regras:
1. Seja OBJETIVO.Não enrole.
2. Respeite o Nível de Complexidade escolhido(Básico: seja didático; Avançado: fale de igual para igual).
3. Faça no máximo 1 ou 2 perguntas de alta precisão antes de permitir a geração.
4. Se o usuário der uma resposta curta, aceite e avance.

IDIOMA DE SAÍDA: PORTUGUÊS DO BRASIL.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({});
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GenAIClient({ apiKey });
  try {
    const { strategy, chatHistory } = req.body as any;
    const model = 'gemini-2.5-flash';
    const context = `
    Contexto da Pauta:
    Assunto Recorrente: ${strategy.subject}
    Área de Atuação/Indústria: ${strategy.expertise}
    Tópico Geral: ${strategy.topic}
    PAUTA DETALHADA: ${strategy.detailedAgenda}
    SUB-TÓPICO SELECIONADO: ${strategy.selectedSubTopic}
    NÍVEL DE COMPLEXIDADE: ${strategy.complexityLevel}
    Abordagem Planejada: ${strategy.generatedApproach}
    Público-Alvo: ${strategy.audience}
    ${strategy.brandVoice ? `\nIMPORTANTE - Siga esta Persona/Voz: ${strategy.brandVoice}` : ''}
  `;
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: INTERVIEWER_SYSTEM_INSTRUCTION }] },
        { role: 'user', parts: [{ text: context }] },
        ...(Array.isArray(chatHistory) ? chatHistory : [])
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });
    return res.json({ text: response.text || '{}' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao analisar briefing.' });
  }
}
