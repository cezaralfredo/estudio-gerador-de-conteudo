import React, { useState, useEffect } from 'react';
import { AppStage, ContentStrategy, CalendarEntry, ComplexityLevel, User } from './types';
import ConfigurationPanel from './components/ConfigurationPanel';
import InteractiveBriefing from './components/InteractiveBriefing';
import ResultView from './components/ResultView';
import CalendarView from './components/CalendarView';
import SubTopicSelector from './components/SubTopicSelector';
import SpecificitySelector from './components/SpecificitySelector';
import AuthScreen from './components/AuthScreen';
import AdminUserList from './components/AdminUserList';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { PenTool, Calendar as CalendarIcon, LogOut, Shield, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- App State ---
  const [stage, setStage] = useState<AppStage>(AppStage.AUTH); // Default to Auth
  
  // Data State
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Strategy State
  const [strategy, setStrategy] = useState<ContentStrategy>({
    audience: '',
    tone: 'Autoritário e Técnico',
    format: 'Artigo Longo',
    goal: '',
    topic: '',
    detailedAgenda: '', 
    subject: '',
    expertise: '',
    useSearch: false,
    status: 'idea', 
    selectedSubTopic: '',
    generatedApproach: '',
    keywords: '',
    brandVoice: ''
  });

  // --- Initialization ---
  useEffect(() => {
    // 1. Initialize Auth System
    AuthService.init();

    // 2. Check for existing session
    const session = AuthService.getCurrentUser();
    if (session) {
      setCurrentUser(session);
      setStage(AppStage.CALENDAR);
    } else {
      setStage(AppStage.AUTH);
    }
  }, []);

  // --- Data Loading (User Specific) ---
  useEffect(() => {
    if (currentUser) {
      setIsLoaded(false);
      const savedData = StorageService.loadEntries(currentUser.id);
      
      if (savedData.length > 0) {
        setCalendarEntries(savedData);
      } else {
        // Initialize mock data ONLY if database is empty for this new user
        // But only do this if it's the very first time (array empty)
        // Actually, let's keep it empty for new users to start fresh, 
        // OR give them a welcome example. Let's give one example.
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const initialEntries: CalendarEntry[] = [{
            id: `welcome-${currentUser.id}`,
            date: `${year}-${month}-${day}`,
            subject: 'Bem-vindo',
            topic: 'Primeiros passos no Estúdio',
            detailedAgenda: 'Explore as funcionalidades do calendário e crie seu primeiro conteúdo.',
            expertise: 'Onboarding',
            audience: 'Você',
            status: 'idea'
        }];
        setCalendarEntries(initialEntries);
      }
      setIsLoaded(true);
    }
  }, [currentUser]);

  // --- Data Saving (User Specific) ---
  useEffect(() => {
    if (isLoaded && currentUser) {
      StorageService.saveEntries(currentUser.id, calendarEntries);
    }
  }, [calendarEntries, isLoaded, currentUser]);

  // --- Handlers ---

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setStage(AppStage.CALENDAR);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCalendarEntries([]); // Clear view
    setStage(AppStage.AUTH);
  };

  const [briefingHistory, setBriefingHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);

  const handleBriefingFinished = (history: { role: string; parts: { text: string }[] }[]) => {
    setBriefingHistory(history);
    setStage(AppStage.GENERATION);
  };

  const handleSelectCalendarEntry = (entry: CalendarEntry) => {
    setStrategy({
        id: entry.id, 
        date: entry.date,
        status: entry.status,
        topic: entry.topic,
        detailedAgenda: entry.detailedAgenda || '',
        subject: entry.subject,
        expertise: entry.expertise || '',
        audience: entry.audience || '', 
        tone: 'Autoritário e Técnico',
        format: 'Artigo Longo',
        goal: '',
        useSearch: false,
        selectedSubTopic: '',
        generatedApproach: '',
        keywords: entry.keywords || '',
        brandVoice: entry.brandVoice || ''
    });
    setBriefingHistory([]); 
    setStage(AppStage.CONFIGURATION);
  };

  const handleSaveStrategyToCalendar = () => {
    if (!strategy.date) return; 

    const entryToSave: CalendarEntry = {
        id: strategy.id || Math.random().toString(36).substr(2, 9),
        date: strategy.date,
        subject: strategy.subject,
        topic: strategy.topic,
        detailedAgenda: strategy.detailedAgenda,
        expertise: strategy.expertise,
        audience: strategy.audience,
        status: strategy.status || 'idea',
        keywords: strategy.keywords,
        brandVoice: strategy.brandVoice
    };

    setCalendarEntries(prev => {
        const exists = prev.find(e => e.id === entryToSave.id);
        if (exists) {
            return prev.map(e => e.id === entryToSave.id ? entryToSave : e);
        } else {
            return [...prev, entryToSave];
        }
    });

    setStrategy(prev => ({...prev, id: entryToSave.id}));
  };

  const handleSaveDraft = () => {
    handleSaveStrategyToCalendar();
    setStage(AppStage.CALENDAR);
  };

  const handleGoToSubTopics = () => {
    handleSaveStrategyToCalendar();
    setStage(AppStage.SUBTOPIC_SELECTION);
  };

  const handleSubTopicSelected = (subTopic: string) => {
    setStrategy(prev => ({ ...prev, selectedSubTopic: subTopic }));
    setStage(AppStage.SPECIFICITY_AGENT);
  };

  const handleSpecificityConfirmed = (level: ComplexityLevel, approach: string) => {
    setStrategy(prev => ({ ...prev, complexityLevel: level, generatedApproach: approach }));
  };

  const resetApp = () => {
    setStage(AppStage.CALENDAR); 
    setStrategy({
      audience: '',
      tone: 'Autoritário e Técnico',
      format: 'Artigo Longo',
      goal: '',
      topic: '',
      detailedAgenda: '',
      subject: '',
      expertise: '',
      useSearch: false,
      status: 'idea',
      selectedSubTopic: '',
      generatedApproach: '',
      keywords: '',
      brandVoice: ''
    });
    setBriefingHistory([]);
  };

  // Progress Stepper
  const renderStepper = () => (
    <div className="flex justify-center mb-8 gap-4 text-sm font-medium overflow-x-auto px-4 pb-4">
      <div onClick={() => setStage(AppStage.CALENDAR)} className={`flex items-center gap-2 cursor-pointer flex-shrink-0 ${stage === AppStage.CALENDAR ? 'text-brand-500' : 'text-slate-500'}`}>
         <CalendarIcon size={18} /> Cal
      </div>
      <div className="w-4 h-[1px] bg-slate-700 self-center flex-shrink-0"></div>

      <div className={`flex items-center gap-2 flex-shrink-0 ${stage === AppStage.CONFIGURATION ? 'text-brand-500' : 'text-slate-500'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${stage === AppStage.CONFIGURATION ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800'}`}>1</span>
        Studio
      </div>
      <div className="w-4 h-[1px] bg-slate-700 self-center flex-shrink-0"></div>

      <div className={`flex items-center gap-2 flex-shrink-0 ${stage === AppStage.SUBTOPIC_SELECTION ? 'text-brand-500' : 'text-slate-500'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${stage === AppStage.SUBTOPIC_SELECTION ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800'}`}>2</span>
        Ângulo
      </div>
      <div className="w-4 h-[1px] bg-slate-700 self-center flex-shrink-0"></div>
      
      <div className={`flex items-center gap-2 flex-shrink-0 ${stage === AppStage.SPECIFICITY_AGENT ? 'text-brand-500' : 'text-slate-500'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${stage === AppStage.SPECIFICITY_AGENT ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800'}`}>3</span>
        Nível
      </div>
      <div className="w-4 h-[1px] bg-slate-700 self-center flex-shrink-0"></div>
      
      <div className={`flex items-center gap-2 flex-shrink-0 ${stage === AppStage.BRIEFING ? 'text-brand-500' : 'text-slate-500'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${stage === AppStage.BRIEFING ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800'}`}>4</span>
        Briefing
      </div>
      <div className="w-4 h-[1px] bg-slate-700 self-center flex-shrink-0"></div>
      
      <div className={`flex items-center gap-2 flex-shrink-0 ${stage === AppStage.GENERATION ? 'text-brand-500' : 'text-slate-500'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${stage === AppStage.GENERATION ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800'}`}>5</span>
        Fim
      </div>
    </div>
  );

  if (stage === AppStage.AUTH) {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-brand-500/30">
            <AuthScreen onAuthSuccess={handleAuthSuccess} />
        </div>
    );
  }

  if (stage === AppStage.ADMIN) {
      return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-brand-500/30">
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                             <div className="bg-brand-600 p-2 rounded-lg"><PenTool className="text-white" size={20} /></div>
                             <span className="text-xl font-serif font-bold tracking-tight text-white">Estúdio Gerador</span>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <AdminUserList onBack={() => setStage(AppStage.CALENDAR)} />
            </main>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-brand-500/30">
      
      {/* Navbar with User Controls */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStage(AppStage.CALENDAR)}>
              <div className="bg-brand-600 p-2 rounded-lg">
                <PenTool className="text-white" size={20} />
              </div>
              <span className="text-xl font-serif font-bold tracking-tight text-white hidden sm:block">Estúdio Gerador</span>
              <span className="text-xl font-serif font-bold tracking-tight text-white sm:hidden">Nexus</span>
            </div>
            
            <div className="flex items-center gap-4">
                {currentUser?.role === 'admin' && (
                    <button 
                        onClick={() => setStage(AppStage.ADMIN)}
                        className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                        title="Painel Administrativo"
                    >
                        <Shield size={18} /> <span className="hidden md:inline">Admin SaaS</span>
                    </button>
                )}
                
                <div className="h-6 w-[1px] bg-slate-700 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-bold text-white">{currentUser?.name}</span>
                        <span className="text-xs text-slate-500">{currentUser?.email}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-600">
                        <UserIcon size={18} />
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="ml-2 p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {renderStepper()}

        {stage === AppStage.CALENDAR && (
            <CalendarView 
                entries={calendarEntries}
                setEntries={setCalendarEntries}
                onSelectEntry={handleSelectCalendarEntry}
            />
        )}

        {stage === AppStage.CONFIGURATION && (
          <ConfigurationPanel 
            strategy={strategy} 
            setStrategy={setStrategy} 
            onNext={handleGoToSubTopics} 
            onSaveDraft={handleSaveDraft}
            onBackToCalendar={() => setStage(AppStage.CALENDAR)}
          />
        )}

        {stage === AppStage.SUBTOPIC_SELECTION && (
            <SubTopicSelector 
                strategy={strategy}
                onSelect={handleSubTopicSelected}
                onBack={() => setStage(AppStage.CONFIGURATION)}
            />
        )}

        {stage === AppStage.SPECIFICITY_AGENT && (
            <SpecificitySelector
                strategy={strategy}
                onConfirmLevel={handleSpecificityConfirmed}
                onGoToBriefing={() => setStage(AppStage.BRIEFING)}
                onGoToResult={() => setStage(AppStage.GENERATION)}
                onBack={() => setStage(AppStage.SUBTOPIC_SELECTION)}
            />
        )}

        {stage === AppStage.BRIEFING && (
          <InteractiveBriefing 
            strategy={strategy} 
            onFinished={handleBriefingFinished}
            initialHistory={briefingHistory}
            onBack={() => setStage(AppStage.SPECIFICITY_AGENT)}
          />
        )}

        {stage === AppStage.GENERATION && (
          <ResultView 
            strategy={strategy} 
            chatHistory={briefingHistory} 
            onReset={resetApp}
            onBack={() => setStage(AppStage.BRIEFING)}
          />
        )}
      </main>
    </div>
  );
};

export default App;