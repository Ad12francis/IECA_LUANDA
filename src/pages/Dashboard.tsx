import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Synod } from '../types';
import { cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, UserCheck, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#3476D1', '#1E40AF', '#60A5FA', '#93C5FD', '#BFDBFE'];

import { dataService } from '../services/dataService';

export default function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [synods, setSynods] = useState<Synod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mems, syns] = await Promise.all([
          dataService.getMembers(),
          dataService.getSynods()
        ]);
        
        setMembers(mems);
        setSynods(syns);
        
        // Verifica se os dados vieram do localStore (id começando com local_)
        const hasLocalData = mems.some(m => m.id?.includes('local'));
        setIsLocalMode(hasLocalData);

      } catch (err) {
        console.error("Erro ao carregar Dashboard:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setIsReady(true), 100);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 font-mono text-ieca-blue animate-pulse">Relatório em processamento...</div>;

  const membersByGender = [
    { name: 'Masculino', value: members.filter(m => m.gender === 'MASCULINO').length },
    { name: 'Feminino', value: members.filter(m => m.gender === 'FEMININO').length },
  ];

  const membersBySynod = synods.map(s => ({
    name: s.name,
    count: members.filter(m => m.synodId === s.id).length
  }));

  const membersByStatus = Array.from(new Set(members.map(m => m.academicLevel || 'N/A'))).map(level => ({
    name: level,
    count: members.filter(m => m.academicLevel === level).length
  }));

  const membersByBaptism = [
    { name: 'Batizados', value: members.filter(m => m.isBaptized).length },
    { name: 'Não Batizados', value: members.filter(m => !m.isBaptized).length },
  ];

  const membersByCivilStatus = Array.from(new Set(members.map(m => m.civilStatus || 'N/A'))).map(status => ({
    name: status,
    count: members.filter(m => m.civilStatus === status).length
  }));

  const stats = [
    { label: 'Total de Membros', value: members.length, icon: Users, color: 'bg-ieca-blue' },
    { label: 'Masculino', value: membersByGender[0].value, icon: UserCheck, color: 'bg-ieca-dark' },
    { label: 'Feminino', value: membersByGender[1].value, icon: UserCheck, color: 'bg-pink-500' },
    { label: 'Plena Comunhão', value: members.filter(m => m.category?.toUpperCase().includes('PLENA')).length, icon: ShieldCheck, color: 'bg-green-600' },
  ];

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">
      <header className="flex items-center justify-between border-b-2 border-ieca-blue pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Estatísticas Gerais</h2>
            {isLocalMode && (
              <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse border border-orange-200">
                MODO OFFLINE (RESILIÊNCIA)
              </span>
            )}
          </div>
          <p className="text-ieca-blue font-mono text-xs font-bold uppercase tracking-widest">Sociedade de Jovens - Sínodo Provincial de Luanda</p>
        </div>
        
      </header>

      {/* KPI Section - Sharp Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 border-b-4 border-slate-200 card-base rounded-sm hover:border-ieca-blue transition-all">
            <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                 <h4 className="text-3xl font-black text-slate-900 font-mono mt-1">{stat.value}</h4>
               </div>
               <div className={cn("p-2 rounded-sm text-white", stat.color)}>
                 <stat.icon className="w-5 h-5" />
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members by Province/Synod */}
        <div className="lg:col-span-2 card-base rounded-sm p-8 bg-white border-t-4 border-ieca-blue">
          <h3 className="font-bold text-sm uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 mb-6">Membros por Sínodo Local</h3>
          <div className="h-[350px] w-full min-h-[350px]">
            {isReady && (
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={membersBySynod} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} width={120} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="count" fill="#3476D1" barSize={30} label={{ position: 'right', fontSize: 10, fontWeight: 'bold' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gender Pie Chart - Following Excel Look */}
        <div className="card-base rounded-sm p-8 bg-white border-t-4 border-slate-400">
           <h3 className="font-bold text-sm uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 mb-6">Género</h3>
           <div className="h-[300px] w-full min-h-[300px] relative">
              {isReady && (
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={membersByGender} innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                      {membersByGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3476D1' : '#F472B6'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
           </div>
        </div>

        {/* Baptism Pie Chart */}
        <div className="card-base rounded-sm p-8 bg-white border-t-4 border-ieca-blue">
           <h3 className="font-bold text-sm uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 mb-6">Membros Batizados</h3>
           <div className="h-[300px] w-full min-h-[300px] relative">
              {isReady && (
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={membersByBaptism} innerRadius={0} outerRadius={100} dataKey="value" stroke="none">
                      <Cell fill="#3476D1" />
                      <Cell fill="#CBD5E1" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
           </div>
        </div>

        {/* Civil Status */}
        <div className="lg:col-span-2 card-base rounded-sm p-8 bg-white border-t-4 border-slate-400">
          <h3 className="font-bold text-sm uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 mb-6">Estado Civil</h3>
          <div className="h-[300px] w-full min-h-[300px]">
             {isReady && (
               <ResponsiveContainer width="99%" height="100%">
                 <BarChart data={membersByCivilStatus}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                   <YAxis fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip />
                   <Bar dataKey="count" fill="#1E40AF" radius={[2, 2, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        {/* Education Levels */}
        <div className="lg:col-span-3 card-base rounded-sm p-8 bg-white border-t-4 border-ieca-blue shadow-lg">
          <div className="flex items-center space-x-3 mb-8">
            <GraduationCap className="text-ieca-blue w-6 h-6" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-900">Educação e Habilitações</h3>
          </div>
          <div className="h-[300px] w-full min-h-[300px]">
             {isReady && (
               <ResponsiveContainer width="99%" height="100%">
                 <BarChart data={membersByStatus}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                   <YAxis fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip />
                   <Bar dataKey="count" fill="#1E40AF" radius={[2, 2, 0, 0]} barSize={50} />
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
