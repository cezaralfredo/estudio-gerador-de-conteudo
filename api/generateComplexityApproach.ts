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

        Tarefa: Estruture uma ABORDAGEM DE CONTEÚDO (outline e texto explicativo) em Markdown para o tema abaixo, obedecendo estritamente o nível (${level}).

        Contexto:
        - Assunto Principal: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Diretriz/Pauta: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Área de Atuação: ${strategy.expertise}
        ${strategy.audience ? `- Público-Alvo: ${strategy.audience}` : ''}
        ${strategy.format ? `- Formato Alvo: ${strategy.format}` : ''}
        ${strategy.brandVoice ? `- Voz/Persona: ${strategy.brandVoice}` : ''}

        Regras de Profundidade (seguir à risca):
        - Nível "basic": foco em fundamentos, definições precisas, analogias claras; explique “o que” e “porquê”.
        - Nível "intermediate": foco em “como fazer”, passos, decisões, melhores práticas e troubleshooting.
        - Nível "advanced": foco em análise crítica, métricas complexas, governança, tendências e controvérsias.

        Exigências de qualidade:
        - Rigor acadêmico nas explicações: conceitos corretos, termos técnicos do domínio, frameworks e critérios.
        - Contextualização adequada: conecte o assunto ao contexto de ${strategy.expertise} e ao ângulo ${strategy.selectedSubTopic}.
        - Relações lógicas: estabeleça relações entre tópicos e sub-tópicos; evidencie dependências e consequências.
        - Referências: quando aplicável, cite fontes confiáveis (papers, relatórios, normas) em uma seção “Referências”.
        - Linguagem técnica apropriada ao ${strategy.audience || 'público'}; evite generalidades e jargões sem definição.

        Estrutura (Markdown):
        1) Assunto Principal
           - Definição clara e bem delimitada do escopo
           - Objetivos e motivação no contexto de ${strategy.expertise}
           - Premissas e critérios de sucesso
           - Transição: indique como os tópicos organizam o entendimento

        2) Tópicos (hierarquia)
           - Organize por níveis (H2/H3/H4) com bullets
           - Para cada tópico: propósito, escopo, entradas/saídas
           - Relacione dependências e ordem lógica de leitura
           - Transição: explique a ligação com os sub-tópicos

        3) Sub-tópicos (detalhados e relevantes)
           - Para cada sub-tópico: definição, motivação, decisões-chave
           - Inclua exemplos concretos (no domínio de ${strategy.expertise})
           - Mencione métricas/KPIs, riscos e compliance quando aplicável
           - Transição: conecte com os parágrafos explicativos

        4) Parágrafos Explicativos (completos e fundamentados)
           - Desenvolva os pontos críticos com argumentos, evidências e dados
           - No “basic”: fundamentos e analogias; no “intermediate”: etapas e trade-offs; no “advanced”: análise crítica, benchmarks e governança
           - Use transições suaves, conectando seções e evitando saltos de lógica
           - Inclua exemplos práticos ou mini-casos (quando útil)

        5) Preparação para o próximo agente
           - Indique blocos/segmentos prontos para:
             - Refinar formatação (manter Markdown consistente)
             - Ajustar tom e estilo (apontar onde adaptar à ${strategy.brandVoice || 'voz'} e ao ${strategy.format || 'formato'})
             - Compilar para o formato final (sinalize trechos que viram seções, capítulos ou slides)
           - Garanta integridade das informações: não deixe lacunas ou contradições

        6) Diretrizes de verificação e adaptabilidade
           - Abrangência: confirme que tudo está dentro do escopo definido
           - Precisão: destaque afirmações verificáveis; cite fontes quando aplicável
           - Adaptabilidade: a estrutura deve permitir conversão para ${strategy.format || 'formato escolhido'} sem perda de qualidade
           - Checklist final de integridade (bullets)

        7) Referências (quando aplicável)
           - Liste fontes confiáveis (paper, norma, relatório de mercado, documentação oficial)
           - Use formato: Autor/Título/Link (curto)

        Instruções de Estilo:
        - Use Markdown com cabeçalhos hierárquicos e bullets bem formatados.
        - Mantenha coesão textual e transições suaves entre seções.
        - Utilize linguagem técnica apropriada ao nível (${level}) e ao domínio de ${strategy.expertise}.
        - NÃO escreva o conteúdo final completo; entregue uma abordagem aprofundada e parágrafos explicativos que o próximo agente possa refinar.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
