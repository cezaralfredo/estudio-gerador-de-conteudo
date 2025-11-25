
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, ContentStrategy } from '../types';
import { analyzeBriefingState, generateInitialQuestion } from '../services/geminiService';
import { Send, Loader2, Sparkles, User, Bot, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  strategy: ContentStrategy;
  onFinished: (chatHistory: { role: string; parts: { text: string }[] }[]) => void;
  initialHistory?: { role: string; parts: { text: string }[] }[];
  onBack: () => void;
}

const InteractiveBriefing: React.FC<Props> = ({ strategy, onFinished, initialHistory, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true); // Initial load for first question
  const [analyzing, setAnalyzing] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (initialHistory && initialHistory.length > 0) {
        // Restore history if available (coming back from ResultView)
        const restoredMessages: ChatMessage[] = initialHistory.map(h => ({
            role: h.role as 'user' | 'model',
            content: h.parts[0].text
        }));
        setMessages(restoredMessages);
        setLoading(false);
        // Assume if we have history, we might be ready or close to it. 
        // Let's not force readyToGenerate=true to allow further editing, 
        // but user can click generate if button was available.
        // Actually, let's re-analyze or just let the user continue.
        // For simplicity, we just restore state. If it was ready before, the last message might indicate it,
        // but we let the user continue chatting.
        setReadyToGenerate(true); // Enable generation button immediately when returning
        return;
      }

      try {
        const firstQ = await generateInitialQuestion(strategy);
        if (firstQ) {
          setMessages([{ role: 'model', content: firstQ }]);
        }
      } catch (e) {
        console.error(e);
        setMessages([{ role: 'model', content: "Estou pronto para discutir seu tópico. Por favor, descreva o ângulo específico que você gostaria de abordar." }]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [strategy, initialHistory]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, analyzing]);

  const handleSend = async () => {
    if (!input.trim() || analyzing) return;

    const userMsg = input;
    setInput('');
    const newHistory = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newHistory);
    setAnalyzing(true);
    setReadyToGenerate(false); // Reset ready state when user adds more info

    try {
      // Convert UI messages to API format
      const apiHistory = newHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Analyze the state
      const analysis = await analyzeBriefingState(strategy, apiHistory);

      if (analysis) {
        if (analysis.isReadyToGenerate) {
          setReadyToGenerate(true);
          setMessages(prev => [...prev, { 
            role: 'model', 
            content: "Excelente. Tenho informações suficientes para construir um rascunho detalhado. Clique no botão abaixo quando estiver pronto para gerar." 
          }]);
        } else {
            setMessages(prev => [...prev, { 
                role: 'model', 
                content: analysis.questionToUser || "Você poderia elaborar mais?" 
            }]);
        }
      } else {
          // Fallback if JSON parsing fails or something weird happens
          setMessages(prev => [...prev, { role: 'model', content: "Poderia me dizer mais sobre os pontos-chave específicos que você deseja cobrir?" }]);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', content: "Estou com problemas de conexão. Poderia repetir, por favor?" }]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors"
                title="Voltar para Configurações"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
                <Bot size={20} className="text-brand-500" /> Entrevista com o Agente
                </h3>
                <p className="text-xs text-slate-400">Refinando o contexto para robustez...</p>
            </div>
        </div>
        {readyToGenerate && (
             <button 
                onClick={() => onFinished(messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })))}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse shadow-lg shadow-green-900/20"
             >
                Gerar Conteúdo <ArrowRight size={16} />
             </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {loading && (
            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                <Loader2 className="animate-spin" /> Preparando briefing...
            </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-slate-700 text-slate-300' : 'bg-brand-600 text-white'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`
              max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-slate-800 text-slate-200 rounded-tr-none' 
                : 'bg-slate-800/50 border border-slate-700 text-slate-100 rounded-tl-none font-serif'}
            `}>
              {msg.content}
            </div>
          </div>
        ))}

        {analyzing && (
           <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} />
             </div>
             <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 text-sm">
                <Sparkles size={14} className="animate-spin" /> Analisando requisitos...
             </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={analyzing ? "Aguarde..." : "Responda ao agente para refinar seu conteúdo..."}
            disabled={analyzing} 
            className="w-full bg-slate-900 text-slate-200 rounded-xl p-4 pr-12 resize-none h-16 focus:ring-2 focus:ring-brand-500 outline-none border border-slate-700 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || analyzing}
            className="absolute right-3 top-3 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 disabled:opacity-0 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
            {readyToGenerate ? "Briefing completo. Você pode adicionar mais detalhes ou clicar em 'Gerar Conteúdo'." : "O agente fará perguntas até entender exatamente suas necessidades."}
        </p>
      </div>
    </div>
  );
};

export default InteractiveBriefing;
