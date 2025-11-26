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

function bullets(arr: string[]): string {
  return arr.map(it => `- ${it}\n`).join('');
}

function deriveDomainHints(area: string, topic: string, sub: string, subject: string) {
  const a = (area || '').toLowerCase();
  let kpisBasic = ['Precisão básica', 'Tempo', 'Custo'];
  let kpisIntermediate = ['Performance', 'Qualidade', 'Custo'];
  let kpisAdvanced = ['Indicadores de risco', 'Governança', 'Eficiência em escala'];
  let risks = ['Erros comuns', 'Limites de escopo'];
  let compliance = ['LGPD', 'Boas práticas de segurança'];
  let caseDesc = `Aplicação de ${topic} em ${subject} para ${sub} em ${area}`;
  if (/marketing|growth|ads|tráfego|mkt/.test(a)) {
    kpisBasic = ['CTR', 'CVR', 'CAC', 'LTV'];
    kpisIntermediate = ['ROAS', 'Frequência', 'Uplift de A/B'];
    kpisAdvanced = ['Incremental lift', 'Atribuição multi-touch', 'MMM'];
    risks = ['Saturação de público', 'Viés de segmentação', 'Fraude de clique'];
    compliance = ['LGPD', 'Consentimento e opt-in', 'Políticas de plataforma'];
    caseDesc = `Campanha de ${topic} em ${area} focada em ${sub}, elevando CTR e ROAS`;
  } else if (/engenharia|software|devops|sre|backend|frontend/.test(a)) {
    kpisBasic = ['Latência p95', 'Taxa de erro', 'Throughput', 'Uptime'];
    kpisIntermediate = ['SLIs/SLOs', 'MTTR', 'Uso de CPU e memória'];
    kpisAdvanced = ['Latência p99', 'Custo por requisição', 'Resiliência em falhas'];
    risks = ['Race conditions', 'Vazamento de memória', 'Backpressure'];
    compliance = ['OWASP', 'Licenças de software', 'LGPD'];
    caseDesc = `Serviço de ${subject} com ${topic} reduz p95 e erros em ${area}`;
  } else if (/dados|data|analytics|ml|ia|machine learning|ciência de dados/.test(a)) {
    kpisBasic = ['Acurácia', 'Precisão', 'Recall', 'F1', 'MAE'];
    kpisIntermediate = ['ROC-AUC', 'Calibração', 'Drift de dados'];
    kpisAdvanced = ['Lift incremental', 'PSI', 'SHAP/interpretabilidade'];
    risks = ['Overfitting', 'Data leakage', 'Viés algorítmico'];
    compliance = ['LGPD', 'Ética e explicabilidade'];
    caseDesc = `Modelo de ${topic} aplicado a ${sub} em ${area}, elevando F1 e reduzindo drift`;
  } else if (/finan|finance|banco|crédito|invest/.test(a)) {
    kpisBasic = ['ROI', 'Churn', 'Inadimplência'];
    kpisIntermediate = ['NPL', 'Spread', 'Loss rate'];
    kpisAdvanced = ['VaR', 'Expected Shortfall', 'Stress testing'];
    risks = ['Risco de crédito', 'Fraude', 'Liquidez'];
    compliance = ['Bacen', 'CVM', 'AML/KYC'];
    caseDesc = `Estratégia de ${topic} em ${area} reduz inadimplência e melhora ROI`;
  } else if (/saúde|health|med/.test(a)) {
    kpisBasic = ['Sensibilidade', 'Especificidade', 'PPV', 'NPV'];
    kpisIntermediate = ['AUC', 'Tempo de atendimento', 'Taxa de readmissão'];
    kpisAdvanced = ['Risk adjustment', 'Compliance clínica', 'Segurança do paciente'];
    risks = ['Viés clínico', 'Privacidade de dados', 'Generalização limitada'];
    compliance = ['LGPD', 'Ética médica', 'ANS'];
    caseDesc = `Protocolo com ${topic} em ${area} melhora ${sub} mantendo segurança do paciente`;
  } else if (/educa|ensino|learning|edtech/.test(a)) {
    kpisBasic = ['Retenção', 'Taxa de conclusão', 'NPS'];
    kpisIntermediate = ['Tempo on-task', 'Engajamento', 'Learning gain'];
    kpisAdvanced = ['Adaptive mastery', 'Causal impact', 'Coortes'];
    risks = ['Viés de avaliação', 'Acessibilidade', 'Desmotivação'];
    compliance = ['Acessibilidade', 'LGPD', 'COPPA'];
    caseDesc = `Curso de ${subject} usando ${topic} eleva conclusão e engajamento em ${area}`;
  } else if (/ecom|varejo|retail/.test(a)) {
    kpisBasic = ['Taxa de conversão', 'Ticket médio', 'Abandono de carrinho'];
    kpisIntermediate = ['Tempo de entrega', 'Frete', 'Recompra'];
    kpisAdvanced = ['LTV', 'Retenção por coorte', 'RFM'];
    risks = ['Ruptura de estoque', 'Fraude', 'Devolução'];
    compliance = ['LGPD', 'PCI-DSS'];
    caseDesc = `Loja em ${area} aplica ${topic} ao ${sub} e aumenta conversão e LTV`;
  }
  return { kpisBasic, kpisIntermediate, kpisAdvanced, risks, compliance, caseDesc };
}

function buildHeuristicFinalContent(strategy: ContentStrategy, chatHistory: { role: string; parts: { text: string }[] }[]): string {
  const subject = strategy.subject || 'Assunto';
  const topic = strategy.topic || 'Tópico';
  const sub = strategy.selectedSubTopic || 'Ângulo';
  const area = strategy.expertise || 'Área';
  const audience = strategy.audience || 'Público';
  const format = strategy.format || 'Formato';
  const tone = strategy.tone || 'Informativo e Neutro';
  const approach = (strategy.generatedApproach || '').trim();
  const hints = deriveDomainHints(area, topic, sub, subject);
  const briefingNote = Array.isArray(chatHistory) && chatHistory.length > 0 ? 'Observações do briefing incorporadas.' : 'Sem briefing adicional; usando estrutura e contexto.';

  let intro = `# ${topic}\n\n` +
    `**${sub}** • ${area} • ${audience} • ${format} • Tom: ${tone}\n\n` +
    `${briefingNote}\n\n`;

  if (approach) {
    intro += `> Estrutura aprovada (resumo):\n\n${approach}\n\n`;
  }

  const body = (
    `## Introdução\n` +
    `Apresente por que ${topic} em ${area} importa para ${audience}, contextualizando ${sub} com objetivos claros.\n\n` +
    `## Desenvolvimento\n` +
    `Descreva o que fazer, como fazer e decisões-chave ligadas a ${sub}. Inclua termos do domínio e exemplos práticos.\n\n` +
    `### Métricas e KPIs\n` +
    bullets(hints.kpisIntermediate) + `\n` +
    `### Riscos e Compliance\n` +
    bullets(hints.risks) + bullets(hints.compliance) + `\n` +
    `### Estudo de Caso\n` +
    `- ${hints.caseDesc}\n\n` +
    `## Conclusão e Próximos Passos\n` +
    `Sintetize ganhos esperados e proponha um plano objetivo de adoção incremental (30/60/90).\n`
  );

  return intro + body;
}

function buildHeuristicApproach(strategy: ContentStrategy, level: ComplexityLevel): string {
  const subject = strategy.subject || 'Assunto';
  const topic = strategy.topic || 'Tópico';
  const sub = strategy.selectedSubTopic || 'Ângulo';
  const area = strategy.expertise || 'Área';
  const audience = strategy.audience || 'Público';
  const format = strategy.format || 'Formato';
  const hints = deriveDomainHints(area, topic, sub, subject);

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
      `- Termos do domínio em ${area} sem jargão\n\n` +
      `### Estrutura por Tópicos\n` +
      `- Contextualização de ${sub}\n` +
      `- Componentes principais do problema\n` +
      `- Mini-exemplos didáticos passo a passo\n\n` +
      `### KPIs Simples\n` +
      bullets(hints.kpisBasic) +
      `- Indicadores de compreensão e retenção\n\n` +
      `### Riscos e Limitações\n` +
      bullets(hints.risks) +
      `- Limites de escopo e falsas correlações\n\n` +
      `### Estudo de Caso (Resumo)\n` +
      `- ${hints.caseDesc}\n\n` +
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
      bullets(hints.kpisIntermediate) +
      `- SLAs e observabilidade\n\n` +
      `### Riscos e Troubleshooting\n` +
      bullets(hints.risks) +
      `- Mitigações e planos de contingência\n\n` +
      `### Estudo de Caso (Resumo)\n` +
      `- ${hints.caseDesc}\n\n` +
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
    bullets(hints.kpisAdvanced) +
    `- Comitês e políticas\n\n` +
    `### Riscos e Compliance\n` +
    bullets(hints.compliance) +
    `- Resiliência e continuidade\n\n` +
    `### Estudo de Caso (Resumo)\n` +
    `- ${hints.caseDesc}\n\n` +
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
  try {
    const res = await fetch('/api/generateFinalContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, chatHistory })
    });
    if (!res.ok) {
      const text = buildHeuristicFinalContent(strategy, chatHistory);
      return { text, groundingMetadata: null };
    }
    const data = await res.json();
    const text = (data?.text || '').trim();
    return { text: text || buildHeuristicFinalContent(strategy, chatHistory), groundingMetadata: data?.groundingMetadata };
  } catch (e) {
    const text = buildHeuristicFinalContent(strategy, chatHistory);
    return { text, groundingMetadata: null };
  }
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
