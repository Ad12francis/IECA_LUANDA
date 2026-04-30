import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppUser, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Trash2, Shield, User, Mail, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New User Form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState(UserRole.USER);
  const [adding, setAdding] = useState(false);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'users'), {
        email: newEmail.toLowerCase().trim(),
        name: newName,
        password: newPassword,
        role: newRole,
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    const masterEmail = 'af939040466@gmail.com';
    const fallbackEmail = 'admin@sinodo.ao';
    
    if (email === masterEmail || email === fallbackEmail) {
      return alert("Operação Protegida: Não é possível remover este administrador principal.");
    }
    
    if (!confirm('Tem certeza que deseja remover este utilizador?')) return;
    await deleteDoc(doc(db, 'users', id));
    fetchUsers();
  };

  if (!isAdmin) return <div className="p-10 text-red-500 font-bold uppercase tracking-widest text-xs">Acesso Negado</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="space-y-1 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Utilizadores</h2>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold">Configurações de Acesso MASTER</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Add User Form */}
        <div className="bg-white p-8 card-base rounded-sm border-t-4 border-ieca-blue space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
             <div className="p-2 bg-ieca-blue text-white rounded-sm"><UserPlus className="w-4 h-4" /></div>
             <h3 className="font-bold text-sm">Adicionar Utilizador</h3>
          </div>
          
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Nome Completo</label>
              <input 
                type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ieca-blue"
                placeholder="Ex: João Baptista"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email</label>
              <input 
                type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ieca-blue"
                placeholder="usuario@dominio.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Password Provisória</label>
              <input 
                type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ieca-blue font-mono"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nível de Acesso</label>
              <select 
                value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none"
              >
                <option value={UserRole.USER}>Utilizador</option>
                <option value={UserRole.MASTER}>Master</option>
              </select>
            </div>
            <button 
              type="submit" disabled={adding}
              className="w-full btn-primary h-12 flex items-center justify-center space-x-2"
            >
              {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus className="w-4 h-4" />}
              <span>Registar Acesso</span>
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 bg-white card-base rounded-sm overflow-hidden border-t-4 border-slate-400">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-widest">Utilizadores Activos</h3>
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">{users.length} Registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-4 font-mono text-[9px] uppercase text-slate-400">Utilizador</th>
                  <th className="p-4 font-mono text-[9px] uppercase text-slate-400 text-center">Papel</th>
                  <th className="p-4 font-mono text-[9px] uppercase text-slate-400 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-ieca-blue group-hover:text-white transition-all">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-1 rounded-sm",
                        u.role === UserRole.MASTER ? "bg-ieca-blue text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
