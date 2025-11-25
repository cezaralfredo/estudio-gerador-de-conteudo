import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEntry, ContentStatus } from '../types';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
    Edit2, Layers, AlertTriangle, Briefcase,
    CheckCircle2, Clock, FileText, Search, Filter, AlertCircle
} from 'lucide-react';

interface Props {
    entries: CalendarEntry[];
    setEntries: React.Dispatch<React.SetStateAction<CalendarEntry[]>>;
    onSelectEntry: (entry: CalendarEntry) => void;
}

// Status Colors and Labels
const STATUS_CONFIG: Record<ContentStatus, { label: string, color: string, dotColor: string, icon: any }> = {
    'idea': { label: 'Ideia', color: 'bg-slate-600/20 text-slate-200 border-slate-500', dotColor: 'bg-slate-500', icon: FileText },
    'planned': { label: 'Planejado', color: 'bg-blue-600/20 text-blue-200 border-blue-500', dotColor: 'bg-blue-500', icon: CalendarIcon },
    'writing': { label: 'Em Redação', color: 'bg-amber-600/20 text-amber-200 border-amber-500', dotColor: 'bg-amber-500', icon: Edit2 },
    'review': { label: 'Revisão', color: 'bg-purple-600/20 text-purple-200 border-purple-500', dotColor: 'bg-purple-500', icon: Clock },
    'published': { label: 'Publicado', color: 'bg-green-600/20 text-green-200 border-green-500', dotColor: 'bg-green-500', icon: CheckCircle2 },
};

const CalendarView: React.FC<Props> = ({ entries, setEntries, onSelectEntry }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [openStatusId, setOpenStatusId] = useState<string | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenStatusId(null);
        if (openStatusId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [openStatusId]);

    // Dashboard & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');

    // --- Statistics Logic ---
    const stats = useMemo(() => {
        return {
            total: entries.length,
            ideas: entries.filter(e => e.status === 'idea').length,
            inProgress: entries.filter(e => ['writing', 'planned', 'review'].includes(e.status)).length,
            published: entries.filter(e => e.status === 'published').length,
            overdue: entries.filter(e => {
                const entryDate = new Date(e.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return entryDate < today && e.status !== 'published';
            }).length
        };
    }, [entries]);

    // --- Calendar Logic ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
        const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        return { daysInMonth, startPadding: adjustedFirstDay };
    };

    const { daysInMonth, startPadding } = getDaysInMonth(currentDate);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    // --- Filtering Logic ---
    const getEntryForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const entry = entries.find(e => e.date === dateStr);

        if (!entry) return undefined;

        // Apply Search
        if (searchTerm && !entry.topic.toLowerCase().includes(searchTerm.toLowerCase()) && !entry.subject.toLowerCase().includes(searchTerm.toLowerCase())) {
            return undefined; // Hide from calendar view if search doesn't match
        }

        // Apply Status Filter
        if (statusFilter !== 'all' && entry.status !== statusFilter) {
            return undefined;
        }

        return entry;
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existingEntry = entries.find(e => e.date === dateStr);

        if (existingEntry) {
            onSelectEntry(existingEntry);
        } else {
            // Create a temporary entry scaffold for the new date
            const newEntry: CalendarEntry = {
                id: '', // Will be generated on save
                date: dateStr,
                subject: '',
                topic: '',
                status: 'idea',
                expertise: '',
                audience: ''
            };
            onSelectEntry(newEntry);
        }
    };

    const handleStatusUpdate = (e: React.MouseEvent, entryId: string, newStatus: ContentStatus) => {
        e.stopPropagation();
        setEntries(prev => prev.map(entry =>
            entry.id === entryId ? { ...entry, status: newStatus } : entry
        ));
        setOpenStatusId(null);
    };

    const toggleStatusDropdown = (e: React.MouseEvent, entryId: string) => {
        e.stopPropagation();
        setOpenStatusId(prev => prev === entryId ? null : entryId);
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">

            {/* Dashboard Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-slate-700/50 rounded-xl text-slate-300"><Layers size={22} /></div>
                    <div><p className="text-3xl font-bold text-white">{stats.total}</p><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Total Posts</p></div>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-amber-900/30 rounded-xl text-amber-500"><Edit2 size={22} /></div>
                    <div><p className="text-3xl font-bold text-white">{stats.inProgress}</p><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Em Produção</p></div>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-green-900/30 rounded-xl text-green-500"><CheckCircle2 size={22} /></div>
                    <div><p className="text-3xl font-bold text-white">{stats.published}</p><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Publicados</p></div>
                </div>
                <div className={`bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border flex items-center gap-4 shadow-lg ${stats.overdue > 0 ? 'border-red-900/50 bg-red-900/10' : 'border-slate-700/50'}`}>
                    <div className={`p-3 rounded-xl ${stats.overdue > 0 ? 'bg-red-900/30 text-red-500' : 'bg-slate-700/50 text-slate-300'}`}><AlertCircle size={22} /></div>
                    <div><p className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-white'}`}>{stats.overdue}</p><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Atrasados</p></div>
                </div>
            </div>

            {/* Calendar Header & Controls */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 mb-6 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-700/50 rounded-full text-slate-300 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="text-2xl font-semibold w-48 text-center text-white font-serif tracking-tight">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-700/50 rounded-full text-slate-300 transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar tópicos ou assuntos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full sm:w-auto bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-8 py-3 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none transition-all cursor-pointer"
                        >
                            <option value="all">Todos Status</option>
                            <option value="idea">Ideia</option>
                            <option value="planned">Planejado</option>
                            <option value="writing">Escrevendo</option>
                            <option value="review">Revisão</option>
                            <option value="published">Publicado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Calendar Container (Horizontal Scroll on Mobile) */}
            <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px]">
                    {/* Calendar Grid Header */}
                    <div className="grid grid-cols-7 gap-3 mb-3">
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                            <div key={day} className="text-center text-slate-400 font-bold text-xs uppercase tracking-widest py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid Body */}
                    <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: startPadding }).map((_, i) => (
                            <div key={`pad-${i}`} className="h-40 bg-slate-800/10 rounded-xl border border-slate-800/20"></div>
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const entry = getEntryForDate(day);
                            const isWeekend = (startPadding + i) % 7 >= 5;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isPast = cellDate < today;
                            const isOverdue = entry && isPast && entry.status !== 'published';

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                        h-48 p-3 rounded-xl border transition-all cursor-pointer group relative overflow-visible flex flex-col backdrop-blur-sm
                        ${isOverdue ? 'border-red-500/30 bg-red-900/5 hover:border-red-500/50' :
                                            isWeekend ? 'bg-slate-900/20 border-slate-800/50' :
                                                'bg-slate-800/40 border-slate-700/50 hover:border-brand-500 hover:bg-slate-800/60 hover:shadow-lg hover:-translate-y-1'}
                    `}
                                >
                                    <div className="flex justify-between items-start mb-3 relative">
                                        <span className={`text-sm font-bold ${isOverdue ? 'text-red-400' : 'text-slate-400 group-hover:text-white transition-colors'}`}>{day}</span>
                                        {entry && (
                                            <div className="relative z-20">
                                                <button
                                                    onClick={(e) => toggleStatusDropdown(e, entry.id)}
                                                    className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-1 border shadow-sm ${STATUS_CONFIG[entry.status].color}`}
                                                >
                                                    {STATUS_CONFIG[entry.status].label}
                                                </button>

                                                {openStatusId === entry.id && (
                                                    <div className="absolute top-full right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 overflow-hidden ring-1 ring-black/20 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                                        {(Object.keys(STATUS_CONFIG) as ContentStatus[]).map(statusKey => (
                                                            <button
                                                                key={statusKey}
                                                                onClick={(e) => handleStatusUpdate(e, entry.id, statusKey)}
                                                                className={`w-full text-left px-3 py-2.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-white cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-700/50 last:border-0 ${entry.status === statusKey ? 'bg-slate-700/50 text-white font-bold' : ''}`}
                                                            >
                                                                <div className={`w-2 h-2 rounded-full shadow ${STATUS_CONFIG[statusKey].dotColor}`}></div>
                                                                {STATUS_CONFIG[statusKey].label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {entry ? (
                                        <div className="space-y-2 flex-1 flex flex-col z-0">
                                            <div className="text-xs font-bold text-brand-400 uppercase tracking-tight truncate opacity-80">
                                                {entry.subject}
                                            </div>
                                            <div className="text-sm text-slate-200 font-serif leading-snug line-clamp-3 group-hover:text-white transition-colors">
                                                {entry.topic}
                                            </div>

                                            <div className="mt-auto pt-3 border-t border-slate-700/30 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
                                                <span className="flex items-center gap-1 truncate max-w-[80px]">
                                                    <Briefcase size={10} /> {entry.expertise || 'Geral'}
                                                </span>
                                                {isOverdue && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                                            </div>
                                        </div>
                                    ) : (
                                        (
                                            <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                                                <div className="bg-brand-500/20 p-3 rounded-full text-brand-400">
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;