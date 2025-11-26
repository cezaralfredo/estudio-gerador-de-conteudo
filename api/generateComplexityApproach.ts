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

        Tarefa: Crie uma ABORDAGEM RICA E AMPLO OUTLINE em Markdown para o tema abaixo, obedecendo estritamente o nível (${level}).
        - Assunto: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Pauta/Diretriz: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Contexto: ${strategy.expertise}
        ${strategy.audience ? `- Público-Alvo: ${strategy.audience}` : ''}
        ${strategy.format ? `- Formato: ${strategy.format}` : ''}
        ${strategy.brandVoice ? `- Voz/Persona: ${strategy.brandVoice}` : ''}

        Estruture entre 600 e 900 palavras com seções claras:
        1) Visão Geral e Objetivos
        2) Fundamentos/Prática/Análise (conforme nível)
        3) Estrutura por Tópicos com bullets detalhados
        4) KPIs e critérios de sucesso
        5) Riscos, limitações e compliance
        6) Estudo de caso resumido aplicado ao Ângulo
        7) Roadmap (30/60/90 dias) e próximos passos
        8) Referências e materiais (se aplicável)

        Use linguagem precisa e aporte técnico; não escreva o conteúdo final.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
