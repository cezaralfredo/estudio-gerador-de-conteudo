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
        Traga informações com Assunto Principal, Tópicos e Sub-tópicos bem estruturados, complementados por PARÁGRAFOS robustos, contextuais e explicativos sobre as questões solicitadas pelo usuário, obedecendo estritamente o nível (${level}).

        Contexto:
        - Assunto Principal: ${strategy.subject}
        - Tópico Base: ${strategy.topic}
        ${strategy.detailedAgenda ? `- Diretriz/Pauta: ${strategy.detailedAgenda}` : ''}
        - Sub-tópico (Ângulo): ${strategy.selectedSubTopic}
        - Área de Atuação: ${strategy.expertise}
        ${strategy.audience ? `- Público-Alvo: ${strategy.audience}` : ''}
        ${strategy.format ? `- Formato Alvo: ${strategy.format}` : ''}
        ${strategy.brandVoice ? `- Voz/Persona: ${strategy.brandVoice}` : ''}

        Modo Filtro (relevância e coerência):
        - Analise as questões, intenções e necessidades do usuário.
        - Selecione e traga apenas informações relevantes ao escopo; descarte o que for periférico.
        - Evite redundâncias; consolide pontos próximos e aponte interdependências.
        - Se algo for potencialmente útil mas fora do escopo, sinalize em “Notas” e não misture com o corpo principal.

        Regras de Profundidade:
        - “basic”: fundamentos, definições precisas, analogias claras; foque em “o que” e “porquê”.
        - “intermediate”: “como fazer”, etapas, decisões, melhores práticas e troubleshooting.
        - “advanced”: análise crítica, métricas complexas, governança, tendências e controvérsias.

        Exigências de Qualidade:
        - Rigor acadêmico: conceitos corretos, terminologia do domínio, frameworks e critérios.
        - Contextualização: conecte o assunto ao contexto de ${strategy.expertise} e ao ângulo ${strategy.selectedSubTopic}.
        - Relações lógicas: estabeleça causa/efeito, dependências e sequência lógica.
        - Referências: quando aplicável, cite fontes confiáveis (papers, relatórios, normas).
        - Linguagem técnica adequada ao ${strategy.audience || 'público'}; evite generalidades e jargões sem definição.

        Estrutura de Saída (Markdown):
        1) Assunto Principal
           - Definição clara do escopo e objetivo
           - Motivação e relevância em ${strategy.expertise}
           - Critérios de sucesso
           - Transição: indique como os tópicos organizam o entendimento

        2) Tópicos (hierarquia)
           - Organize em H2/H3/H4 com bullets
           - Para cada tópico: propósito, escopo, entradas/saídas
           - Dependências e ordem lógica de leitura
           - Transição para Sub-tópicos

        3) Sub-tópicos (detalhados e relevantes)
           - Definição, motivação e decisões-chave
           - Exemplos concretos no domínio de ${strategy.expertise}
           - Métricas/KPIs, riscos e compliance (quando aplicável)
           - Transição para Parágrafos Explicativos

        4) Parágrafos Explicativos (robustos, contextuais)
           - Desenvolva pontos críticos com argumentos, evidências e dados
           - Adapte ao nível: fundamentos (basic), etapas/trade-offs (intermediate), análise/benchmarks/governança (advanced)
           - Use transições suaves, conectando seções sem saltos de lógica
           - Inclua mini-casos ou exemplos práticos quando útil

        5) Conexões e Lógica
           - Mapa de relações entre tópicos/sub-tópicos
           - Implicações, limitações e próximos passos

        6) Métricas, Riscos e Compliance (se aplicável)
           - KPIs relevantes ao domínio
           - Riscos típicos e mitigação
           - Requisitos regulatórios/compliance

        7) Referências (quando aplicável)
           - Autor/Título/Link (curto), preferindo fontes confiáveis

        8) Preparação para o Próximo Agente
           - Blocos prontos para refinamento de formatação (Markdown consistente)
           - Pontos onde ajustar tom/estilo à ${strategy.brandVoice || 'voz'} e ao ${strategy.format || 'formato'}
           - Sinalização de trechos que viram seções/capítulos/slides
           - Garantia de integridade: sem lacunas ou contradições

        9) Checklist de Integridade
           - Abrangência dentro do escopo
           - Precisão e verificabilidade
           - Adaptabilidade ao formato de saída escolhido (${strategy.format || 'formato'})
           - Coesão e transições bem resolvidas

        Instruções de Estilo:
        - Use Markdown com cabeçalhos hierárquicos e bullets bem formatados.
        - Mantenha coesão textual e transições suaves entre seções.
        - Utilize linguagem técnica apropriada ao nível (${level}) e ao domínio de ${strategy.expertise}.
        - Entregue a abordagem e os parágrafos explicativos; NÃO escreva o conteúdo final completo.

        IDIOMA: Português do Brasil.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return res.json({ text: response.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
}
