
import React, { useState, useEffect } from 'react';
import { ContentStrategy, ComplexityLevel } from '../types';
import { generateComplexityApproach } from '../services/geminiService';
import { BookOpen, Hammer, BrainCircuit, ArrowRight, ArrowLeft, Loader2, MessageSquare, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  strategy: ContentStrategy;
  onConfirmLevel: (level: ComplexityLevel, approach: string) => void;
  onGoToBriefing: () => void;
  onGoToResult: () => void;
  onBack: () => void;
}

const SpecificitySelector: React.FC<Props> = ({ strategy, onConfirmLevel, onGoToBriefing, onGoToResult, onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<ComplexityLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [approach, setApproach] = useState<string>("");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setAiAvailable(Boolean(data?.hasKey));
      } catch (_) {
        setAiAvailable(false);
      }
    };
    checkStatus();
  }, []);

  const handleSelectLevel = async (level: ComplexityLevel) => {
    setSelectedLevel(level);
    setLoading(true);
    setApproach("");
    
    try {
        const generatedText = await generateComplexityApproach(strategy, level);
        setApproach(generatedText);
        onConfirmLevel(level, generatedText);
    } catch (e) {
        console.error(e);
        setApproach("Não foi possível gerar a prévia da abordagem. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  const levels = [
    {
        id: 'basic',
        title: 'Básico / Fundamentos',
        desc: 'Foco no "O Que" e "Porquê". Ideal para educar iniciantes, definir conceitos e criar base.',
        icon: BookOpen,
        color: 'bg-emerald-600',
        borderColor: 'border-emerald-500',
        hoverColor: 'hover:border-emerald-400'
    },
    {
        id: 'intermediate',
        title: 'Intermediário / Prático',
        desc: 'Foco no "Como Fazer". Ideal para tutoriais, aplicações práticas e resolução de problemas.',
        icon: Hammer,
        color: 'bg-amber-600',
        borderColor: 'border-amber-500',
        hoverColor: 'hover:border-amber-400'
    },
    {
        id: 'advanced',
        title: 'Avançado / Visionário',
        desc: 'Foco em análise crítica, dados complexos, tendências futuras e inovação disruptiva.',
        icon: BrainCircuit,
        color: 'bg-purple-600',
        borderColor: 'border-purple-500',
        hoverColor: 'hover:border-purple-400'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6">
          <button 
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white underline mb-2 block"
          >
            &larr; Voltar para Ângulos
          </button>
          <h2 className="text-3xl font-serif font-bold text白 mb-2">Nível de Profundidade</h2>
          <p className="text-slate-400">
            Como você quer abordar o tema <span className="text-brand-400">"{strategy.selectedSubTopic}"</span>?
            Nossos agentes especialistas adaptarão o conteúdo para o nível escolhido.
          </p>
          {aiAvailable === false && (
            <span className="text-[11px] text-amber-500">IA desativada — usando fallback</span>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {levels.map((lvl) => {
            const Icon = lvl.icon;
            const isSelected = selectedLevel === lvl.id;
            const isOtherSelected = selectedLevel !== null && !isSelected;

            return (
                <button
                    key={lvl.id}
                    onClick={() => handleSelectLevel(lvl.id as ComplexityLevel)}
                    disabled={loading}
                    className={`
                        text-left p-6 rounded-xl border-2 transition-all relative overflow-hidden group
                        ${isSelected ? `${lvl.borderColor} bg-slate-800 shadow-xl scale-[1.02]` : 'border-slate-700 bg-slate-800/50'}
                        ${!selectedLevel ? lvl.hoverColor : ''}
                        ${isOtherSelected ? 'opacity-50 grayscale' : 'opacity-100'}
                    `}
                >
                    <div className={`w-12 h-12 rounded-lg ${lvl.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{lvl.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{lvl.desc}</p>
                    
                    {isSelected && (
                        <div className="absolute top-4 right-4 text-brand-500 animate-pulse">
                            <ArrowRight size={24} />
                        </div>
                    )}
                </button>
            )
        })}
      </div>

      {/* Loading Area */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center animate-in fade-in">
             <Loader2 className="animate-spin text-brand-500 w-10 h-10 mb-4" />
             <h3 className="text-xl text-white font-medium">O Agente Especialista está estruturando a abordagem...</h3>
             <p className="text-slate-500">Isso garante que o tom e a profundidade estejam perfeitos.</p>
        </div>
      )}

      {/* Result Preview & Actions */}
      {!loading && approach && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 animate-in slide-in-from-bottom-8 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-400 mb-4 flex items-center gap-2">
                <FileText size={20} /> Estratégia de Abordagem Sugerida:
            </h3>
            <div className="prose prose-invert prose-sm max-w-none mb-8 bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                <ReactMarkdown>{approach}</ReactMarkdown>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-end border-t border-slate-800 pt-6">
                <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">Opção 1: Refinar</p>
                    <button 
                        onClick={onGoToBriefing}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl flex items-center justify-center gap-3 border border-slate-600 hover:border-brand-500 transition-all group"
                    >
                        <MessageSquare size={20} className="text-brand-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <span className="block font-bold">Ir para Entrevista (Briefing)</span>
                            <span className="text-xs text-slate-400">Quero adicionar detalhes pessoais ou ajustar a estrutura.</span>
                        </div>
                    </button>
                </div>

                <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">Opção 2: Agilidade</p>
                    <button 
                        onClick={onGoToResult}
                        className="w-full bg-brand-700 hover:bg-brand-600 text-white p-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-brand-900/40 hover:scale-[1.02] transition-all"
                    >
                        <FileText size={20} className="text-white" />
                         <div className="text-left">
                            <span className="block font-bold">Gerar Conteúdo Final Agora</span>
                            <span className="text-xs text-slate-200">A estrutura acima está ótima. Escreva o texto completo.</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SpecificitySelector;
