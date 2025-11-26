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

        Tarefa: Atue como FILTRO EDITORIAL e ARQUITETO DE CONTEÚDO.
        O usuário exige uma ESTRATÉGIA DE ABORDAGEM SUGERIDA que traga INFORMAÇÕES COMPLETAS, estruturadas e robustas.

        Contexto:
        - Assunto Principal: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Diretriz/Pauta: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Área de Atuação: ${strategy.expertise}
        ${strategy.audience ? `- Público-Alvo: ${strategy.audience}` : ''}
        ${strategy.format ? `- Formato Alvo: ${strategy.format}` : ''}
        ${strategy.brandVoice ? `- Voz/Persona: ${strategy.brandVoice}` : ''}

        MODO FILTRO (Rigor e Completude):
        1. Analise profundamente as intenções do usuário para este sub-tópico.
        2. Filtre e elimine o irrelevante.
        3. Entregue conteúdo COMPLETO e RELEVANTE: não apenas tópicos, mas a explicação densa e coerente deles.

        Regras de Profundidade (${level}):
        - BASIC: Fundamentos sólidos, definições claras ("O que", "Porquê"), analogias didáticas.
        - INTERMEDIATE: Aplicação prática, "Como fazer", processos, erros comuns e soluções.
        - ADVANCED: Visão crítica, estratégias complexas, métricas de negócio, governança e inovação.

        ESTRUTURA DE SAÍDA OBRIGATÓRIA (Markdown):

        ## 1. Assunto Principal e Contexto
        - Definição precisa do escopo abordado.
        - Justificativa de relevância para o público.

        ## 2. Estrutura de Tópicos e Sub-tópicos
        - Hierarquia lógica (H2, H3).
        - Organize o raciocínio de forma progressiva e didática.

        ## 3. Parágrafos Explicativos e Robustos (O CORAÇÃO DA ESTRATÉGIA)
        - Para cada tópico/sub-tópico principal, escreva um parágrafo completo e argumentativo.
        - Não use placeholders. Traga a informação real, o dado, o argumento, a técnica.
        - Conecte os pontos (coesão e lógica).
        - Demonstre profundidade compatível com o nível ${level}.

        ## 4. Notas de Direcionamento Editorial
        - Observações sobre o que foi filtrado/focado e porquê.
        - Orientações de tom e estilo para a redação final.

        Instruções Finais:
        - Use Markdown limpo e bem formatado.
        - Seja direto, profissional e denso.
        - O objetivo é que esta estratégia já contenha todo o valor intelectual necessário.
        - IDIOMA: Português do Brasil.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
