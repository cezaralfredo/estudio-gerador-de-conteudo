
import React, { useState, useEffect } from 'react';
import { ContentStrategy, ContentStatus } from '../types';
import { Sparkles, Target, Mic, FileText, Search, BookOpen, Layers, Briefcase, Calendar as CalendarIcon, Save, Loader2, AlertTriangle } from 'lucide-react';
import { generateDetailedAgenda } from '../services/geminiService';

interface Props {
  strategy: ContentStrategy;
  setStrategy: React.Dispatch<React.SetStateAction<ContentStrategy>>;
  onNext: () => void; // Goes to SubTopics
  onSaveDraft: () => void; // Saves and goes back to calendar
  onBackToCalendar: () => void;
}

const ConfigurationPanel: React.FC<Props> = ({ strategy, setStrategy, onNext, onSaveDraft, onBackToCalendar }) => {
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
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

  const handleChange = (field: keyof ContentStrategy, value: any) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateAgenda = async () => {
    if (!strategy.topic || !strategy.subject) return;
    setGeneratingAgenda(true);
    try {
        const agenda = await generateDetailedAgenda(strategy.topic, strategy.subject, strategy.expertise);
        handleChange('detailedAgenda', agenda);
    } catch (e) {
        console.error(e);
    } finally {
        setGeneratingAgenda(false);
    }
  };

  // Status Config for Dropdown
  const STATUS_OPTIONS: {value: ContentStatus, label: string}[] = [
    { value: 'idea', label: 'Ideia' },
    { value: 'planned', label: 'Planejado' },
    { value: 'writing', label: 'Em Redação' },
    { value: 'review', label: 'Revisão' },
    { value: 'published', label: 'Publicado' },
  ];

  // Validation
  const isFormValid = strategy.topic.length > 3 && strategy.audience.length > 0 && strategy.expertise.length > 0 && strategy.subject.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header with Navigation and Quick Actions */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
        <div>
            <button 
                onClick={onBackToCalendar}
                className="text-xs text-slate-400 hover:text-white underline mb-1 block"
            >
                &larr; Cancelar e Voltar
            </button>
            <h2 className="text-3xl font-serif font-bold text-white">Estúdio Gerador de Conteúdo</h2>
            <p className="text-slate-400 text-sm">Centralize o planejamento, status e estratégia do seu conteúdo.</p>
        </div>
        <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-700 text-amber-300 px-3 py-2 rounded-md shadow">
          <AlertTriangle size={14} className="mt-[2px]" />
          <span className="text-xs">A IA gratuita tem limite de uso, fale com o suporte para uso de IA paga.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Core Workflow Data */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 space-y-4 sticky top-24">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700 pb-2 mb-2">
                    <CalendarIcon size={16} className="text-brand-500"/> Gestão
                </h3>

                {/* Date Display */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase">Data de Publicação</label>
                    <div className="text-lg font-mono text-white bg-slate-900 p-2 rounded border border-slate-700 text-center">
                        {strategy.date ? new Date(strategy.date + 'T00:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' }) : 'Data não definida'}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase">Status Atual</label>
                    <select 
                        value={strategy.status || 'idea'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                 {/* Expertise (Moved UP) */}
                 <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Briefcase size={12} /> Área de Atuação
                    </label>
                    <input 
                        type="text" 
                        value={strategy.expertise}
                        onChange={(e) => handleChange('expertise', e.target.value)}
                        placeholder="ex: Varejo Farmacêutico"
                        className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-slate-600 ${!strategy.expertise ? 'border-amber-500/30' : 'border-slate-700'}`}
                    />
                </div>

                {/* Recurring Subject (Moved DOWN) */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Layers size={12} /> Assunto Recorrente
                    </label>
                    <input 
                        type="text" 
                        value={strategy.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        placeholder="ex: Logística"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-slate-600"
                    />
                </div>

            </div>
        </div>

        {/* Right Column: Deep Strategy */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Topic Field */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-brand-500 uppercase tracking-wider">
                    <BookOpen size={16} /> Tópico Principal
                </label>
                <input 
                    type="text"
                    value={strategy.topic}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    placeholder="Ex: O impacto da IA na previsão de demanda"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-600 font-serif text-lg"
                />
            </div>

            {/* Detailed Agenda Field (New AI Assisted) */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-500 uppercase tracking-wider">
                        <FileText size={16} /> Pauta Detalhada
                    </label>
                    <div className="flex items-center gap-3">
                    <button 
                        onClick={handleGenerateAgenda}
                        disabled={generatingAgenda || !strategy.topic}
                        className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-all border ${!strategy.topic ? 'opacity-50 cursor-not-allowed border-slate-700 text-slate-500' : 'bg-brand-900/30 border-brand-500 text-brand-400 hover:bg-brand-500 hover:text-white'}`}
                        title="Gera uma descrição curta e robusta sobre o tópico"
                    >
                        {generatingAgenda ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                        {generatingAgenda ? 'Gerando...' : 'Gerar com IA'}
                    </button>
                    {aiAvailable === false && (
                      <span className="text-[11px] text-amber-500">IA desativada — usando fallback</span>
                    )}
                    </div>
                </div>
                <textarea 
                    value={strategy.detailedAgenda || ''}
                    onChange={(e) => handleChange('detailedAgenda', e.target.value)}
                    placeholder="Descreva brevemente o que cobrir (ou use o botão Gerar com IA)..."
                    maxLength={250}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-600 font-sans text-sm h-24 resize-none"
                />
                <div className="text-right text-xs text-slate-500">
                    {(strategy.detailedAgenda?.length || 0)}/250 caracteres
                </div>
            </div>

            {/* SEO & Brand Voice (Moved Here) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                 {/* Keywords */}
                 <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Search size={12} /> Palavras-chave (SEO)
                    </label>
                    <input 
                        type="text" 
                        value={strategy.keywords || ''}
                        onChange={(e) => handleChange('keywords', e.target.value)}
                        placeholder="ex: tecnologia, inovação"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                </div>

                {/* Brand Voice */}
                 <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Mic size={12} /> Voz da Marca / Persona
                    </label>
                    <textarea 
                        value={strategy.brandVoice || ''}
                        onChange={(e) => handleChange('brandVoice', e.target.value)}
                        placeholder="ex: 'Fale como Steve Jobs'"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none resize-none h-[52px]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Audience */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-500 uppercase tracking-wider">
                        <Target size={16} /> Público-Alvo
                    </label>
                    <select 
                        value={strategy.audience}
                        onChange={(e) => handleChange('audience', e.target.value)}
                        className={`w-full bg-slate-800 border rounded-lg p-3 text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none appearance-none ${!strategy.audience ? 'border-amber-500/30' : 'border-slate-700'}`}
                    >
                        <option value="">Selecione...</option>
                        <option value="Público Geral">Público Geral (Iniciante)</option>
                        <option value="Profissionais da Indústria">Profissionais da Indústria (Especialista)</option>
                        <option value="Acadêmicos">Acadêmicos/Pesquisadores</option>
                        <option value="Executivos C-Level">Executivos C-Level</option>
                        <option value="Estudantes">Estudantes</option>
                    </select>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-500 uppercase tracking-wider">
                        <Mic size={16} /> Tom de Voz (Base)
                    </label>
                    <select 
                        value={strategy.tone}
                        onChange={(e) => handleChange('tone', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none appearance-none"
                    >
                        <option value="Informativo e Neutro">Informativo e Neutro</option>
                        <option value="Inteligente e Cativante">Inteligente e Cativante</option>
                        <option value="Autoritário e Técnico">Autoritário e Técnico</option>
                        <option value="Persuasivo e Vendedor">Persuasivo e Vendedor</option>
                        <option value="Empático e Apoiador">Empático e Apoiador</option>
                    </select>
                </div>

                {/* Format */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-500 uppercase tracking-wider">
                        <FileText size={16} /> Formato
                    </label>
                    <select 
                        value={strategy.format}
                        onChange={(e) => handleChange('format', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none appearance-none"
                    >
                        <option value="Artigo Longo">Artigo de Blog (2000+ palavras)</option>
                        <option value="Liderança de Pensamento LinkedIn">LinkedIn (Liderança de Pensamento)</option>
                        <option value="Roteiro de Vídeo">Roteiro de Vídeo (YouTube)</option>
                        <option value="Whitepaper Técnico">Whitepaper Técnico</option>
                        <option value="Newsletter">Newsletter de E-mail</option>
                        <option value="Copy (até 1500 caracteres)">Copy (até 1500 caracteres)</option>
                        <option value="Instagram (até 2000 caracteres)">Instagram (até 2000 caracteres)</option>
                    </select>
                </div>

                {/* Goal */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-500 uppercase tracking-wider">
                        <Target size={16} /> Objetivo
                    </label>
                    <input 
                        type="text" 
                        value={strategy.goal}
                        onChange={(e) => handleChange('goal', e.target.value)}
                        placeholder="ex: Educar, Converter..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                </div>
            </div>

            {/* Deep Research */}
            <div 
                onClick={() => handleChange('useSearch', !strategy.useSearch)}
                className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-all ${strategy.useSearch ? 'bg-brand-900/30 border-brand-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${strategy.useSearch ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        <Search size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-200">Pesquisa Profunda (Deep Research)</h3>
                        <p className="text-sm text-slate-400">Ative para verificar fatos e incluir dados recentes da web.</p>
                    </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${strategy.useSearch ? 'border-brand-500 bg-brand-500' : 'border-slate-500'}`}>
                    {strategy.useSearch && <Sparkles size={12} className="text-white" />}
                </div>
            </div>

            {/* Main Action */}
            <div className="mt-8 flex justify-end items-center gap-4 border-t border-slate-800 pt-6">
                <button
                  onClick={onSaveDraft}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                >
                  <Save size={16} /> Salvar Rascunho
                </button>
                {!isFormValid && (
                    <p className="text-sm text-amber-500 animate-pulse text-right">
                        Preencha Tópico, Assunto, Público e Área de Atuação.
                    </p>
                )}
                <button
                onClick={onNext} // Goes to SubTopic Selection
                disabled={!isFormValid}
                className={`
                    px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 transition-all w-full md:w-auto justify-center
                    ${isFormValid 
                        ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/50 hover:scale-105' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
                >
                <Target size={18} /> Definir Ângulo Específico &rarr;
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
