import React from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { Users, Shield, ArrowLeft, Calendar } from 'lucide-react';

interface Props {
    onBack: () => void;
}

const AdminUserList: React.FC<Props> = ({ onBack }) => {
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadUsers = async () => {
            const data = await AuthService.getAllUsers();
            setUsers(data);
            setLoading(false);
        };
        loadUsers();
    }, []);

    if (loading) {
        return <div className="p-10 text-center text-slate-400">Carregando usuários...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 animate-in fade-in pb-20">

            <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-white underline mb-2 flex items-center gap-1 text-sm"
                    >
                        <ArrowLeft size={14} /> Voltar para o App
                    </button>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <Shield className="text-brand-500" /> Painel SaaS Administrativo
                    </h2>
                    <p className="text-slate-400">
                        Gestão total de usuários registrados na plataforma.
                    </p>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-xs uppercase font-bold block">Total Usuários</span>
                    <span className="text-2xl font-bold text-white">{users.length}</span>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800">
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider">E-mail</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider">Função</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider">Data Cadastro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${user.role === 'admin' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-brand-900/20 text-brand-400 border-brand-500/30'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                                        <Calendar size={12} />
                                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminUserList;