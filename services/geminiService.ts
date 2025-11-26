import { ContentStrategy, StrategySchema, SubTopic, ComplexityLevel } from "../types";

// System instruction for the "Interviewer" persona
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

// System instruction for the "Writer" persona
const WRITER_SYSTEM_INSTRUCTION = `
Você é um Criador de Conteúdo de Classe Mundial.
Sua saída deve ser:
- FUNCIONAL: cobertura fiel do tópico dentro da área de atuação.
- COMUM: use dados comprovados, exemplos técnicos específicos.
- BEM ESTRUTURADA: use cabeçalhos markdown, marcadores e citações.
- ESTILIZADA: siga estritamente o tom e o público solicitados.

Se as ferramentas de Busca do Google estiverem ativadas, verifique seus fatos e forneça fontes.
IDIOMA DE SAÍDA: PORTUGUÊS DO BRASIL.
`;

export const generateDetailedAgenda = async (topic: string, subject: string, expertise: string): Promise<string> => {
  try {
    const res = await fetch('/api/generateDetailedAgenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subject, expertise })
    });
    if (!res.ok) {
      const base = `Pauta: ${topic} em ${subject} para ${expertise}. Detalhar impactos, métricas e exemplos práticos.`;
      return base.slice(0, 200);
    }
    const data = await res.json();
    const text = (data?.text || '').trim();
    if (text) return text;
    const base = `Pauta: ${topic} em ${subject} para ${expertise}. Detalhar impactos, métricas e exemplos práticos.`;
    return base.slice(0, 200);
  } catch (e) {
    console.error("Error generating agenda:", e);
    const base = `Pauta: ${topic} em ${subject} para ${expertise}. Detalhar impactos, métricas e exemplos práticos.`;
    return base.slice(0, 200);
  }
};

export const generateSubTopics = async (strategy: ContentStrategy): Promise<SubTopic[]> => {
  try {
    const res = await fetch('/api/generateSubTopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy })
    });
    const data = await res.json();
    const raw = (data?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(raw);
      const valid = Array.isArray(parsed) ? parsed.filter((it: any) => it && typeof it.title === 'string' && typeof it.description === 'string') : [];
      return valid.length > 0 ? valid.slice(0, 10) : buildHeuristicSubTopics(strategy);
    } catch (e) {
      // Fallback: tentar extrair pares "title - description" por linhas
      const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
      const items: SubTopic[] = [];
      for (const line of lines) {
        const [titlePart, descPart] = line.split(/\s*-\s+/);
        if (titlePart && descPart) {
          items.push({ title: titlePart.replace(/^[-*]\s*/, ''), description: descPart });
        }
        if (items.length >= 10) break;
      }
      return items.length > 0 ? items : buildHeuristicSubTopics(strategy);
    }
  } catch (error) {
    console.error('❌ Error generating subtopics:', error);
    return buildHeuristicSubTopics(strategy);
  }
};

function buildHeuristicSubTopics(strategy: ContentStrategy): SubTopic[] {
  const topic = strategy.topic || 'Tema';
  const subject = strategy.subject || 'Assunto';
  const area = strategy.expertise || 'Área';
  const base = [
    { title: `Benchmark de ${topic} em ${area}`, description: `Comparar líderes, lacunas e oportunidades.` },
    { title: `KPIs essenciais para ${topic}`, description: `Definir métricas, metas e monitoramento.` },
    { title: `Casos reais em ${area}`, description: `Estudos de caso práticos e lições aprendidas.` },
    { title: `ROI e custos de ${topic}`, description: `Estimativas, alavancas de eficiência e payback.` },
    { title: `Riscos e compliance em ${subject}`, description: `Mapear riscos, normas e mitigação.` },
    { title: `Stack e ferramentas para ${topic}`, description: `Tecnologias, integrações e critérios de escolha.` },
    { title: `Roadmap 30/60/90 dias`, description: `Plano de adoção por fases e resultados esperados.` },
    { title: `Erros comuns em ${topic}`, description: `Antipadrões, armadilhas e como evitar.` },
    { title: `Estratégias avançadas`, description: `Técnicas para escala, automação e governança.` },
    { title: `Visão contrarianista`, description: `Argumento oposto bem fundamentado para debate.` }
  ];
  return base.slice(0, 10);
}

export const generateComplexityApproach = async (strategy: ContentStrategy, level: ComplexityLevel): Promise<string> => {
  try {
    const res = await fetch('/api/generateComplexityApproach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, level })
    });
    if (!res.ok) {
      return buildHeuristicApproach(strategy, level);
    }
    const data = await res.json();
    const text = (data?.text || '').trim();
    return text || buildHeuristicApproach(strategy, level);
  } catch (e) {
    console.error('❌ Error generating approach:', e);
    return buildHeuristicApproach(strategy, level);
  }
};

function buildHeuristicApproach(strategy: ContentStrategy, level: ComplexityLevel): string {
  const subject = strategy.subject || 'Assunto';
  const topic = strategy.topic || 'Tópico';
  const sub = strategy.selectedSubTopic || 'Ângulo';
  const area = strategy.expertise || 'Área';
  const audience = strategy.audience || 'Público';
  const format = strategy.format || 'Formato';

  const intro = `## Abordagem (${level})\n\n` +
    `**Visão Geral**\n` +
    `Tema: ${topic} • Ângulo: ${sub} • Contexto: ${area} • Público: ${audience} • Formato: ${format}\n\n`;

  if (level === 'basic') {
    return (
      intro +
      `### Objetivos\n` +
      `- Ensinar fundamentos de ${topic} aplicados a ${subject}.\n` +
      `- Explicar por que o tema é relevante em ${area}.\n` +
      `- Preparar o leitor para aplicações práticas simples.\n\n` +
      `### Fundamentos Essenciais\n` +
      `- Definições e escopo do tema\n` +
      `- Conceitos-chave com analogias acessíveis\n` +
      `- Termos comuns e traduções sem jargão\n\n` +
      `### Estrutura por Tópicos\n` +
      `- Contextualização de ${sub}\n` +
      `- Componentes principais do problema\n` +
      `- Mini-exemplos didáticos passo a passo\n\n` +
      `### KPIs Simples\n` +
      `- Precisão básica, tempo, custo\n` +
      `- Indicadores de compreensão e retenção\n\n` +
      `### Riscos e Limitações\n` +
      `- Erros comuns de iniciantes\n` +
      `- Limites de escopo e falsas correlações\n\n` +
      `### Estudo de Caso (Resumo)\n` +
      `- Situação real em ${area} e como ${topic} ajudou\n\n` +
      `### Roadmap 30/60/90\n` +
      `- 30: assimilação de conceitos\n` +
      `- 60: aplicações guiadas\n` +
      `- 90: autonomia básica\n\n` +
      `### Referências\n` +
      `- Guias introdutórios, glossários e cursos curtos\n`
    );
  }
  if (level === 'intermediate') {
    return (
      intro +
      `### Objetivos\n` +
      `- Aplicar ${topic} ao ângulo ${sub} em ${area}.\n` +
      `- Detalhar o "como fazer" com melhores práticas.\n\n` +
      `### Pré-requisitos\n` +
      `- Ambiente, dados e ferramentas necessárias\n` +
      `- Critérios de prontidão e checklist\n\n` +
      `### Estrutura por Tópicos\n` +
      `- Fluxo operacional ponta a ponta\n` +
      `- Decisões e trade-offs\n` +
      `- Padrões e antipadrões\n\n` +
      `### KPIs e Sucesso\n` +
      `- Métricas de performance, qualidade e custo\n` +
      `- SLAs e observabilidade\n\n` +
      `### Riscos e Troubleshooting\n` +
      `- Falhas recorrentes e diagnósticos\n` +
      `- Mitigações e planos de contingência\n\n` +
      `### Estudo de Caso (Resumo)\n` +
      `- Implementação prática de ${sub} em ${area}\n\n` +
      `### Roadmap 30/60/90\n` +
      `- 30: piloto controlado\n` +
      `- 60: expansão e otimização\n` +
      `- 90: consolidação e handover\n\n` +
      `### Referências\n` +
      `- Playbooks, frameworks e guias de operação\n`
    );
  }
  return (
    intro +
    `### Objetivos\n` +
    `- Produzir análise crítica e visão avançada em ${sub}.\n` +
    `- Explorar benchmarks, governança e caminhos de escala.\n\n` +
    `### Tese e Hipóteses\n` +
    `- Tese central com premissas testáveis\n` +
    `- Variáveis e cenários\n\n` +
    `### Estrutura por Tópicos\n` +
    `- Arquiteturas e estratégias de dados/processos\n` +
    `- Benchmarks e métricas complexas\n` +
    `- Modelos de decisão e custo/benefício\n\n` +
    `### KPIs e Governança\n` +
    `- Indicadores de risco, compliance e performance avançada\n` +
    `- Comitês e políticas\n\n` +
    `### Riscos e Compliance\n` +
    `- Regulação aplicável e mitigação\n` +
    `- Resiliência e continuidade\n\n` +
    `### Estudo de Caso (Resumo)\n` +
    `- Implementação em ${area} com resultados mensuráveis\n\n` +
    `### Roadmap 30/60/90\n` +
    `- 30: alinhamento executivo e arquitetura\n` +
    `- 60: rollout com governança\n` +
    `- 90: escala e automação\n\n` +
    `### Referências\n` +
    `- Whitepapers, benchmarks e relatórios de mercado\n`
  );
}

export const analyzeBriefingState = async (
  strategy: ContentStrategy,
  chatHistory: { role: string; parts: { text: string }[] }[]
) => {
  try {
    const res = await fetch('/api/analyzeBriefingState', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, chatHistory })
    });
    const data = await res.json();
    return data?.text ? JSON.parse(data.text) : null;
  } catch (e) {
    console.error('❌ Error analyzing briefing:', e);
    return null;
  }
};

export const generateFinalContent = async (
  strategy: ContentStrategy,
  chatHistory: { role: string; parts: { text: string }[] }[]
) => {
  const res = await fetch('/api/generateFinalContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy, chatHistory })
  });
  const data = await res.json();
  return { text: data?.text || '', groundingMetadata: data?.groundingMetadata };
};

export const generateInitialQuestion = async (strategy: ContentStrategy) => {
  const res = await fetch('/api/generateInitialQuestion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy })
  });
  const data = await res.json();
  return data?.text || '';
};

export const refineContent = async (currentContent: string, instruction: string): Promise<string> => {
  const res = await fetch('/api/refineContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentContent, instruction })
  });
  const data = await res.json();
  return data?.text || currentContent;
};
