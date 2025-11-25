import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateFinalContent, refineContent } from '../services/geminiService';
import { ContentStrategy } from '../types';
import { Copy, Check, RefreshCw, AlertTriangle, ExternalLink, ArrowLeft, Wand2, Scissors, Expand, SpellCheck, Download, FileText, ChevronDown } from 'lucide-react';

interface Props {
  strategy: ContentStrategy;
  chatHistory: { role: string; parts: { text: string }[] }[];
  onReset: () => void;
  onBack: () => void;
}

const ResultView: React.FC<Props> = ({ strategy, chatHistory, onReset, onBack }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  
  // Download Menu State
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generate = async () => {
      try {
        const result = await generateFinalContent(strategy, chatHistory);
        setContent(result.text || '');
        if (result.groundingMetadata?.groundingChunks) {
          setGroundingChunks(result.groundingMetadata.groundingChunks);
        }
      } catch (err) {
        console.error(err);
        setError("Falha ao gerar o conteúdo detalhado. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
            setShowDownloadMenu(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const element = document.createElement("a");
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    const file = new Blob([content], {type: mimeType});
    element.href = URL.createObjectURL(file);
    element.download = `conteudo-${strategy.date || 'rascunho'}.${format}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setShowDownloadMenu(false);
  };

  const handleRefine = async (instruction: string) => {
    if (refining) return;
    setRefining(true);
    try {
        const newContent = await refineContent(content, instruction);
        setContent(newContent);
    } catch (e) {
        console.error("Refinement failed", e);
    } finally {
        setRefining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
        <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw size={24} className="text-brand-500 animate-pulse" />
            </div>
        </div>
        <h3 className="text-2xl font-serif text-white mb-2">Criando sua Obra-prima</h3>
        <p className="text-slate-400 max-w-md">
          O agente está pensando estruturalmente, verificando fatos (se solicitado) e escrevendo com precisão. Isso pode levar até 30 segundos para resultados robustos.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <p className="text-red-400 mb-6">{error}</p>
        <div className="flex gap-4">
            <button onClick={onBack} className="text-slate-300 hover:text-white underline">Voltar</button>
            <button onClick={onReset} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Top Bar: Navigation & Primary Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <div className="flex items-center gap-4 self-start md:self-auto">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-sm"
            >
                <ArrowLeft size={18} /> <span className="hidden sm:inline">Voltar ao Briefing</span>
            </button>
            <div>
                <h2 className="text-white font-semibold text-lg">Editor Final</h2>
                <span className="text-xs text-brand-400 uppercase tracking-wider font-bold">{strategy.format}</span>
            </div>
        </div>

        <div className="flex gap-2 self-end md:self-auto">
            <button 
                onClick={onReset}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
                Novo Assunto
            </button>
            
            {/* Download Dropdown */}
            <div className="relative" ref={downloadMenuRef}>
                <button 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-700 active:bg-slate-600 transition-colors"
                    title="Baixar arquivo"
                >
                    <Download size={16} /> Baixar <ChevronDown size={14} className={`transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showDownloadMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden ring-1 ring-black/20 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => handleDownload('md')}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            <FileText size={16} className="text-brand-500 group-hover:text-white" />
                            <span>Markdown (.md)</span>
                        </button>
                        <button 
                            onClick={() => handleDownload('txt')}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700 group"
                        >
                            <FileText size={16} className="text-slate-500 group-hover:text-white" />
                            <span>Texto Puro (.txt)</span>
                        </button>
                    </div>
                )}
            </div>

            <button 
                onClick={handleCopy}
                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-900/20"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado" : "Copiar Texto"}
            </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="relative">
        
        {/* Magic Toolbar (Floating or Sticky) */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-full shadow-xl flex items-center gap-1 p-1.5 z-20 animate-slide-up">
            <button 
                onClick={() => handleRefine("Reescreva para tornar mais impactante e envolvente.")}
                disabled={refining}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors relative group"
                title="Reescrever Melhor"
            >
                <Wand2 size={18} />
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Melhorar</span>
            </button>
            <div className="w-[1px] h-5 bg-slate-600 mx-1"></div>
            
            <button 
                onClick={() => handleRefine("Resuma este texto em 50% do tamanho original, mantendo os pontos chave.")}
                disabled={refining}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors group relative"
                title="Encurtar"
            >
                <Scissors size={18} />
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Encurtar</span>
            </button>
            
            <button 
                onClick={() => handleRefine("Expanda o conteúdo adicionando mais exemplos e detalhes.")}
                disabled={refining}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors group relative"
                title="Expandir"
            >
                <Expand size={18} />
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Expandir</span>
            </button>
            
            <button 
                onClick={() => handleRefine("Corrija qualquer erro gramatical e melhore a fluidez do texto.")}
                disabled={refining}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors group relative"
                title="Corrigir Gramática"
            >
                <SpellCheck size={18} />
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Gramática</span>
            </button>
        </div>

        {/* Content Container */}
        <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-8 md:p-16 rounded-2xl shadow-2xl min-h-[700px] transition-opacity duration-300 relative ${refining ? 'opacity-50' : 'opacity-100'}`}>
             {refining && (
                 <div className="absolute inset-0 flex items-center justify-center z-10">
                     <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-xl border border-slate-700">
                        <RefreshCw size={20} className="animate-spin text-brand-500" />
                        <span className="text-white font-medium">Refinando conteúdo...</span>
                     </div>
                 </div>
             )}
             <article className="markdown-body">
                <ReactMarkdown>{content}</ReactMarkdown>
            </article>
        </div>
      </div>

      {/* Grounding / Sources Section */}
      {groundingChunks.length > 0 && (
        <div className="mt-8 bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <ExternalLink size={18} /> Fontes Verificadas
          </h3>
          <ul className="space-y-2">
            {groundingChunks.map((chunk, i) => {
              if (chunk.web?.uri) {
                return (
                  <li key={i} className="flex items-start gap-2 text-sm group">
                    <span className="text-brand-500 mt-1">•</span>
                    <a 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-brand-400 hover:underline truncate transition-colors"
                    >
                      {chunk.web.title || chunk.web.uri}
                    </a>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      )}

    </div>
  );
};

export default ResultView;