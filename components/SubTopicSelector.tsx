
import React, { useEffect, useState } from 'react';
import { ContentStrategy, SubTopic } from '../types';
import { generateSubTopics } from '../services/geminiService';
import { ArrowRight, Loader2, Target, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  strategy: ContentStrategy;
  onSelect: (subTopicTitle: string) => void;
  onBack: () => void;
}

const SubTopicSelector: React.FC<Props> = ({ strategy, onSelect, onBack }) => {
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTopics = async () => {
    setLoading(true);
    setError(false);
    setSubTopics([]);
    try {
      const results = await generateSubTopics(strategy);
      if (results && results.length > 0) {
        setSubTopics(results);
      } else {
        throw new Error("No topics generated");
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have topics yet
    if (subTopics.length === 0) {
        fetchTopics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <button 
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white underline mb-2 block"
          >
            &larr; Voltar para Configuração
          </button>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Refinando o Foco</h2>
          <p className="text-slate-400">
            Baseado no tópico <span className="text-brand-400 font-semibold">"{strategy.topic}"</span>, selecione um ângulo específico para tornar a entrevista mais objetiva.
          </p>
        </div>
        {!loading && (
             <button onClick={fetchTopics} className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-2 border border-brand-500/20 px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-colors">
                <RefreshCw size={14} /> Gerar novos ângulos
             </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
          <p className="text-slate-200 font-medium text-lg">Analisando contexto: {strategy.expertise}</p>
          <p className="text-slate-500 text-sm mt-1">Criando 10 abordagens estratégicas...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-red-900/10 rounded-xl border border-red-900/30">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-300 font-medium mb-2">Falha ao gerar tópicos</p>
            <p className="text-slate-400 text-sm mb-6 max-w-md">Ocorreu um erro ao conectar com o agente de estratégia. Verifique sua conexão ou tente novamente.</p>
            <button 
                onClick={fetchTopics} 
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-600"
            >
                <RefreshCw size={16} /> Tentar Novamente
            </button>
        </div>
      )}

      {/* Grid of Options */}
      {!loading && !error && subTopics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {subTopics.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(item.title)}
              className="group text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand-500 p-6 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-900/20 flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="bg-brand-600 text-white p-1.5 rounded-full shadow-lg">
                    <ArrowRight size={16} />
                 </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition-colors pr-8">
                  {item.title}
                </h3>
              </div>
              
              <div className="mt-auto">
                <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-slate-600 pl-3 group-hover:border-brand-500 transition-colors">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600 group-hover:text-brand-500 uppercase tracking-wider">
                    <Target size={12} /> Selecionar este viés
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubTopicSelector;
