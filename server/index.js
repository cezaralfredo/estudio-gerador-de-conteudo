import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI as GenAIClient, Type } from '@google/genai';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Global error handler for JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  next();
});

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ Nenhuma chave de API configurada. Defina GOOGLE_API_KEY ou GEMINI_API_KEY no ambiente.');
}
const ai = new GenAIClient({ apiKey });

const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
let sql;
if (DATABASE_URL) {
  sql = neon(DATABASE_URL);
}

// System personas (mantidas como no frontend)
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

app.get('/api/status', (req, res) => {
  res.json({ ok: true, hasKey: Boolean(apiKey) });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!sql) return res.status(500).json({ success: false, message: 'DB indisponível' });
    const { name, email, password } = req.body;
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.json({ success: false, message: 'Este e-mail já está cadastrado.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'user')
      RETURNING id, name, email, role, created_at as "createdAt"
    `;
    res.json({ success: true, user: newUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erro ao criar conta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!sql) return res.status(500).json({ success: false, message: 'DB indisponível' });
    const { email, password } = req.body;
    const rows = await sql`
      SELECT id, name, email, role, created_at as "createdAt", password_hash
      FROM users WHERE email = ${email}
    `;
    if (rows.length === 0) {
      return res.json({ success: false, message: 'Credenciais inválidas.' });
    }
    const row = rows[0];
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, row.password_hash);
    } catch (_) {
      passwordMatch = false;
    }
    if (!passwordMatch && row.password_hash === password) {
      const newHash = await bcrypt.hash(password, 10);
      await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${row.id}`;
      passwordMatch = true;
    }
    if (!passwordMatch) {
      return res.json({ success: false, message: 'Credenciais inválidas.' });
    }
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${row.id}`;
    const user = { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.createdAt };
    res.json({ success: true, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erro ao conectar ao servidor.' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    if (!sql) return res.status(500).json({ success: false, message: 'DB indisponível' });
    const users = await sql`SELECT id, name, email, role, created_at as "createdAt" FROM users`;
    res.json({ success: true, users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
  }
});

app.patch('/api/admin/users', async (req, res) => {
  try {
    if (!sql) return res.status(500).json({ success: false, message: 'DB indisponível' });
    const { id, role } = req.body;
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erro ao atualizar função.' });
  }
});

app.delete('/api/admin/users', async (req, res) => {
  try {
    if (!sql) return res.status(500).json({ success: false, message: 'DB indisponível' });
    const { id } = req.body;
    await sql`DELETE FROM users WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erro ao excluir usuário.' });
  }
});

app.post('/api/generateDetailedAgenda', async (req, res) => {
  try {
    const { topic, subject, expertise } = req.body;
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
    res.json({ text: response.text?.trim() || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao gerar pauta detalhada.' });
  }
});

app.post('/api/generateSubTopics', async (req, res) => {
  try {
    const { strategy } = req.body;
    const model = 'gemini-2.5-flash';
    const prompt = `
    Atue como um estrategista de conteúdo sênior.
  Contexto:
- Assunto: ${strategy.subject}
- Tópico Geral: ${strategy.topic}
    ${strategy.detailedAgenda ? `- Pauta Detalhada/Diretriz: ${strategy.detailedAgenda}` : ''}
- Área de Atuação: ${strategy.expertise}
- Público: ${strategy.audience}

    Gere exatamente 10 sugestões de sub - tópicos(ângulos específicos) derivados desse contexto.
    Para cada sub - tópico, forneça:
1. Um Título chamativo.
    2. Uma descrição curta de até 100 caracteres explicando o viés.

    Retorne APENAS um JSON array neste formato:
[
  { "title": "...", "description": "..." }
]
  `;
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['title', 'description']
          }
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    res.json({ text: response.text || '[]' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao gerar subtópicos.' });
  }
});

app.post('/api/generateComplexityApproach', async (req, res) => {
  try {
    const { strategy, level } = req.body;
    const model = 'gemini-2.5-flash';
    let personaInstruction = '';
    if (level === 'basic') {
      personaInstruction = 'Você é um Professor Especialista em Fundamentos. Seu foco é clareza, definições precisas, evitar jargões complexos sem explicação e construir uma base sólida para iniciantes. Explique o \"O QUE\" e o \"PORQUÊ\".';
    } else if (level === 'intermediate') {
      personaInstruction = 'Você é um Consultor Prático Sênior. Seu foco é a aplicação, \"COMO FAZER\", melhores práticas de mercado, estudos de caso e resolução de problemas comuns. O público já conhece o básico.';
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
    res.json({ text: response.text || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao gerar abordagem de complexidade.' });
  }
});

app.post('/api/analyzeBriefingState', async (req, res) => {
  try {
    const { strategy, chatHistory } = req.body;
    const model = 'gemini-2.5-flash';
    const context = `
    Contexto da Pauta:
    Assunto Recorrente: ${strategy.subject}
    Área de Atuação/Indústria: ${strategy.expertise}
    Tópico Geral: ${strategy.topic}
    PAUTA DETALHADA: ${strategy.detailedAgenda}
    SUB-TÓPICO SELECIONADO: ${strategy.selectedSubTopic}
    NÍVEL DE COMPLEXIDADE: ${strategy.complexityLevel}
    Abordagem Planejada: ${strategy.generatedApproach}
    Público-Alvo: ${strategy.audience}
    ${strategy.brandVoice ? `\nIMPORTANTE - Siga esta Persona/Voz: ${strategy.brandVoice}` : ''}
  `;
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: INTERVIEWER_SYSTEM_INSTRUCTION }] },
        { role: 'user', parts: [{ text: context }] },
        ...chatHistory,
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });
    res.json({ text: response.text || '{}' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao analisar briefing.' });
  }
});

app.post('/api/generateFinalContent', async (req, res) => {
  try {
    const { strategy, chatHistory } = req.body;
    const model = 'gemini-2.5-flash';
    const prompt = `
    Escreva a peça de conteúdo final.
    
    PERFIL DA ESTRATÉGIA:
    - Assunto Principal: ${strategy.subject}
    - Tópico: ${strategy.topic}
    ${strategy.detailedAgenda ? `- PAUTA/DIRETRIZ ESPECÍFICA: ${strategy.detailedAgenda}` : ''}
    - SUB-TÓPICO ESPECÍFICO (Foco): ${strategy.selectedSubTopic}
    - NÍVEL DE COMPLEXIDADE: ${strategy.complexityLevel} (Siga rigorosamente este nível de profundidade)
    - Área de Atuação: ${strategy.expertise}
    - Formato: ${strategy.format}
    - Tom de Voz: ${strategy.tone}
    ${strategy.brandVoice ? `- PERSONALIDADE/VOZ ESPECÍFICA (MUITO IMPORTANTE): ${strategy.brandVoice}` : ''}
    ${strategy.keywords ? `- PALAVRAS-CHAVE SEO (Incluir organicamente): ${strategy.keywords}` : ''}
    
    ${strategy.generatedApproach ? `BASEIE-SE NESTA ESTRUTURA APROVADA: \n${strategy.generatedApproach}` : ''}

    ${Array.isArray(chatHistory) && chatHistory.length === 0 ? 'O usuário optou por pular o briefing, então confie totalmente na sua base de conhecimento e na estrutura acima.' : 'Incorpore os detalhes refinados discutidos no briefing abaixo.'}

    Use formatação Markdown. Seja extremamente detalhado. Escreva em Português do Brasil.
  `;
    const tools = strategy.useSearch ? [{ googleSearch: {} }] : [];
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...(Array.isArray(chatHistory) ? chatHistory : []),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: { systemInstruction: WRITER_SYSTEM_INSTRUCTION, tools }
    });
    res.json({
      text: response.text || '',
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao gerar conteúdo final.' });
  }
});

app.post('/api/generateInitialQuestion', async (req, res) => {
  try {
    const { strategy } = req.body;
    const model = 'gemini-2.5-flash';
    const prompt = `
      Contexto:
      O usuário quer escrever sobre: "${strategy.selectedSubTopic}".
      Pauta Base: "${strategy.detailedAgenda}".
      Nível: ${strategy.complexityLevel} (Isto é muito importante).
      Área: ${strategy.expertise}.
      ${strategy.brandVoice ? `Persona do Autor: ${strategy.brandVoice}` : ''}
      
      Atue como um editor objetivo.
      Com base no nível escolhido, faça A pergunta mais crítica para fechar o conteúdo.
      Se for Básico: pergunte sobre dados proprietários ou visão contrarianista.
      Se for Avançado: pergunte sobre dados proprietários ou visão contrarianista.
      
      Responda em Português do Brasil.
    `;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ text: response.text || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao gerar pergunta inicial.' });
  }
});

app.post('/api/refineContent', async (req, res) => {
  try {
    const { currentContent, instruction } = req.body;
    const model = 'gemini-2.5-flash';
    const prompt = `
        Você é um Editor Sênior.
        
        INSTRUÇÃO DE EDIÇÃO: "${instruction}"
        
        TEXTO ORIGINAL:
        ${currentContent}
        
        TAREFA:
        Reescreva o texto aplicando a instrução acima.
        Mantenha a formatação Markdown.
        Mantenha a essência e os fatos, apenas ajuste o estilo/tamanho/gramática conforme pedido.
        
        SAÍDA: Apenas o novo texto em Markdown.
    `;
    const response = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    res.json({ text: response.text || currentContent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao refinar conteúdo.' });
  }
});

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`🔒 Backend Gemini API Proxy rodando em http://localhost:${PORT}`);
});
