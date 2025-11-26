import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI as GenAIClient } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({});
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GenAIClient({ apiKey });
  try {
    const { strategy, level } = req.body as any;
    const model = 'gemini-2.5-flash';
    let personaInstruction = '';
    if (level === 'basic') {
      personaInstruction = 'Você é um Professor Especialista em Fundamentos. Seu foco é clareza, definições precisas, evitar jargões complexos sem explicação e construir uma base sólida para iniciantes. Explique o "O QUE" e o "PORQUÊ".';
    } else if (level === 'intermediate') {
      personaInstruction = 'Você é um Consultor Prático Sênior. Seu foco é a aplicação, "COMO FAZER", melhores práticas de mercado, estudos de caso e resolução de problemas comuns. O público já conhece o básico.';
    } else {
      personaInstruction = 'Você é um Visionário Disruptivo e Analista de Dados. Seu foco é tendências futuras, métricas complexas, controvérsias do setor, inovação e desafiar o status quo. Fale de igual para igual com executivos.';
    }
    const prompt = `
        ${personaInstruction}

        Tarefa: Crie uma ESTRUTURA DE CONTEÚDO (Outline) para o seguinte tema:
        - Assunto: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Pauta/Diretriz: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Contexto: ${strategy.expertise}
        ${strategy.brandVoice ? `- Voz/Persona Específica a Seguir: ${strategy.brandVoice}` : ''}

        Gere um resumo estruturado de 300 palavras explicando como você vai abordar esse tema neste nível de complexidade (${level}).
        Inclua os principais pontos que serão cobertos.
        Não escreva o artigo ainda, apenas a estratégia de abordagem didática.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
