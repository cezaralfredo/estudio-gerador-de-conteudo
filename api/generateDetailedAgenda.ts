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
    const { topic, subject, expertise } = req.body as any;
    const model = 'gemini-2.5-flash';
    const prompt = `
        Atue como um Assistente Editorial Sênior.

  Contexto:
- Assunto Macro: ${subject}
- Área de Atuação: ${expertise}
- Tópico Principal: ${topic}

Tarefa:
        Escreva uma PAUTA DETALHADA(descrição curta e rica) de até 200 caracteres para este tópico.
        A pauta deve ser específica, técnica e direta, indicando o que deve ser abordado.
        
        Exemplo de Saída: "Explorar o impacto da IA na triagem de pacientes, citando redução de 30% no tempo de espera e novos protocolos de compliance."

SAÍDA(Máx 200 chars):
`;
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return res.json({ text: response.text?.trim() || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar pauta detalhada.' });
  }
}
