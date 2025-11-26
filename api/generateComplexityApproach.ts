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
        Seu objetivo é gerar uma ESTRATÉGIA DE ABORDAGEM SUGERIDA que seja estruturada, relevante e robusta.

        Contexto:
        - Assunto Principal: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Diretriz/Pauta: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Área de Atuação: ${strategy.expertise}
        ${strategy.audience ? `- Público-Alvo: ${strategy.audience}` : ''}
        ${strategy.format ? `- Formato Alvo: ${strategy.format}` : ''}
        ${strategy.brandVoice ? `- Voz/Persona: ${strategy.brandVoice}` : ''}

        MODO FILTRO (Prioridade Máxima):
        1. Analise as intenções do usuário e o escopo do sub-tópico.
        2. Filtre ruídos: descarte informações periféricas ou genéricas.
        3. Traga apenas o que é essencial, coerente e de alto valor para o nível (${level}).

        Regras de Profundidade (${level}):
        - BASIC: Fundamentos sólidos, definições claras ("O que", "Porquê"), analogias didáticas.
        - INTERMEDIATE: Aplicação prática, "Como fazer", processos, erros comuns e soluções.
        - ADVANCED: Visão crítica, estratégias complexas, métricas de negócio, governança e inovação.

        ESTRUTURA DE SAÍDA OBRIGATÓRIA (Markdown):

        ## 1. Assunto Principal
        - Defina o foco exato da abordagem.
        - Justifique a relevância para o público e área de atuação.

        ## 2. Estrutura de Tópicos e Sub-tópicos
        - Apresente uma hierarquia lógica (Tópicos > Sub-tópicos).
        - Garanta que cada item tenha um propósito claro na narrativa.

        ## 3. Parágrafos Explicativos (Robustos e Contextuais)
        - Esta é a seção mais importante.
        - Escreva parágrafos densos e bem articulados para cada ponto chave.
        - Conecte os conceitos (Coesão).
        - Use dados, argumentos e exemplos alinhados ao nível ${level}.
        - Demonstre autoridade no assunto.

        ## 4. Notas de Direcionamento (Filtro)
        - Justifique escolhas editoriais (ex: "Focamos em X pois Y é obsoleto").
        - Aponte conexões lógicas críticas para o redator final.

        Instruções Finais:
        - Use Markdown limpo.
        - Seja direto e profissional.
        - NÃO escreva o artigo final ainda, mas forneça a "espinha dorsal" detalhada e argumentada.
        - IDIOMA: Português do Brasil.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
