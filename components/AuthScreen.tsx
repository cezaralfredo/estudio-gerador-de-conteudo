import React, { useState } from 'react';
import { AuthMode, User } from '../types';
import { AuthService } from '../services/authService';
import { Lock, Mail, User as UserIcon, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<Props> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simula um pequeno delay de rede para UX
    await new Promise(resolve => setTimeout(resolve, 800));

    let result;
    try {
      if (mode === 'signup') {
        if (!name || !email || !password) {
          setError("Todos os campos são obrigatórios.");
          setLoading(false);
          return;
        }
        result = await AuthService.register(name, email, password);
      } else {
        if (!email || !password) {
          setError("E-mail e senha são obrigatórios.");
          setLoading(false);
          return;
        }
        result = await AuthService.login(email, password);
      }

      if (result.success && result.user) {
        onAuthSuccess(result.user);
      } else {
        setError(result.message || "Erro desconhecido");
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 text-brand-500 mb-4 border border-brand-500/30 shadow-lg shadow-brand-500/10">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Estúdio Gerador</h1>
          <p className="text-slate-400">Acesse sua central de criação de conteúdo.</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">

          <div className="flex gap-4 mb-8 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'signup' && (
              <div className="space-y-1 animate-in slide-in-from-left-4 fade-in">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in fade-in">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-900/40 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  {mode === 'login' ? 'Acessar Conta' : 'Criar Conta'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className="mt-6 text-center text-xs text-slate-500">
              Esqueceu a senha? Entre em contato com o suporte.
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          &copy; 2024 Nexus Content Studio. Todos os direitos reservados.
        </p>

      </div>
    </div>
  );
};

export default AuthScreen;