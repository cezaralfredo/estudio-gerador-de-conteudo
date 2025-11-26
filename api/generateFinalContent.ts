import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI as GenAIClient } from '@google/genai';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({});
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GenAIClient({ apiKey });
  try {
    const { strategy, chatHistory } = req.body as any;
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
    return res.json({
      text: response.text || '',
      groundingMetadata: (response as any).candidates?.[0]?.groundingMetadata || null
    });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar conteúdo final.' });
  }
}
