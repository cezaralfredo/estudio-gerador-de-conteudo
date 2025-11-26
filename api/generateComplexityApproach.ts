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

        Tarefa: Atue como um AGENTE CATALISADOR DE CONTEÚDO.
        Sua missão é acelerar a produção entregando uma ESTRATÉGIA DE ABORDAGEM SUGERIDA completa, densa e pronta para uso.

        Contexto:
        - Assunto Principal: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Diretriz/Pauta: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Área de Atuação: ${strategy.expertise}
        ${strategy.audience ? `- Público-Alvo: ${strategy.audience}` : ''}
        ${strategy.format ? `- Formato Alvo: ${strategy.format}` : ''}
        ${strategy.brandVoice ? `- Voz/Persona: ${strategy.brandVoice}` : ''}

        MODO CATALISADOR (Filtro e Densidade):
        1. Analise o pedido e traga APENAS o que é relevante e coerente.
        2. Não entregue apenas um esqueleto. Entregue a "carne" do conteúdo.
        3. Os PARÁGRAFOS EXPLICATIVOS são a parte mais fundamental: eles devem conter a explicação real, o argumento, o dado e o contexto.

        Regras de Profundidade (${level}):
        - BASIC: Fundamentos sólidos, definições claras ("O que", "Porquê"), analogias didáticas.
        - INTERMEDIATE: Aplicação prática, "Como fazer", processos, erros comuns e soluções.
        - ADVANCED: Visão crítica, estratégias complexas, métricas de negócio, governança e inovação.

        ESTRUTURA DE SAÍDA OBRIGATÓRIA (Markdown):

        ## 1. Contextualização do Assunto
        - Definição clara do foco.
        - Por que isso importa agora? (Relevância)

        ## 2. Estrutura Analítica (Tópicos e Sub-tópicos)
        - Organize os tópicos de forma lógica e sequencial.
        - Para cada Tópico, liste os Sub-tópicos essenciais.

        ## 3. Desenvolvimento Explicativo (FUNDAMENTAL)
        - Esta é a seção principal. Dedique 80% do seu esforço aqui.
        - Para cada ponto estrutural acima, escreva um PARÁGRAFO ROBUSTO e CONTEXTUAL.
        - Explique o "como", o "porquê" e as implicações.
        - Use conectivos lógicos para garantir fluidez e coerência.
        - Traga exemplos ou cenários compatíveis com o nível ${level}.

        ## 4. Conclusão e Próximos Passos
        - Síntese da abordagem.
        - Direcionamento para a execução final do texto.

        Instruções de Estilo:
        - Use Markdown limpo.
        - Texto corrido e bem articulado nos parágrafos (evite excesso de bullet points isolados).
        - Seja um especialista conversando com o público alvo.
        - IDIOMA: Português do Brasil.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
