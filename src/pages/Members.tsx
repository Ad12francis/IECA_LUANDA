import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Synod, Pastorate, Congregation } from '../types';
import { Search, Filter, FileDown, Printer, Users } from 'lucide-react';
import { cn, formatDate, calculateAge } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [synods, setSynods] = useState<Synod[]>([]);
  const [pastorates, setPastorates] = useState<Pastorate[]>([]);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSynod, setFilterSynod] = useState('');
  const [filterPastorate, setFilterPastorate] = useState('');
  const [filterCongregation, setFilterCongregation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [mems, syns, pasts, congs] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'synods')),
        getDocs(collection(db, 'pastorates')),
        getDocs(collection(db, 'congregations')),
      ]);

      setMembers(mems.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      setSynods(syns.docs.map(d => ({ id: d.id, ...d.data() } as Synod)));
      setPastorates(pasts.docs.map(d => ({ id: d.id, ...d.data() } as Pastorate)));
      setCongregations(congs.docs.map(d => ({ id: d.id, ...d.data() } as Congregation)));
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSynod = !filterSynod || m.synodId === filterSynod;
      const matchesPastorate = !filterPastorate || m.pastorateId === filterPastorate;
      const matchesCongregation = !filterCongregation || m.congregationId === filterCongregation;
      return matchesSearch && matchesSynod && matchesPastorate && matchesCongregation;
    });
  }, [members, searchTerm, filterSynod, filterPastorate, filterCongregation]);

  const exportCSV = () => {
    const data = filteredMembers.map(m => ({
      Nome: m.name,
      Gênero: m.gender,
      Idade: calculateAge(m.birthDate),
      Categoria: m.category,
      Residência: m.residence,
      Contacto: m.contact1,
      Sínodo: synods.find(s => s.id === m.synodId)?.name,
      Pastorado: pastorates.find(p => p.id === m.pastorateId)?.name,
      Congregação: congregations.find(c => c.id === m.congregationId)?.name,
      Status: m.status
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.href = URL.createObjectURL(blob);
    link.download = `membros_filtrados_${timestamp}.csv`;
    link.click();
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Sociedade de Jovens - Sínodo Provincial de Luanda', 14, 15);
      doc.setFontSize(10);
      doc.text(`Lista de Membros Filtrada - Total: ${filteredMembers.length}`, 14, 22);

      const tableData = filteredMembers.map(m => [
        m.name || 'N/A',
        (m.gender || 'M')[0],
        calculateAge(m.birthDate).toString(),
        (m.category || '').substring(0, 15),
        synods.find(s => s.id === m.synodId)?.name || '',
        m.status || 'ACTIVO'
      ]);

      autoTable(doc, {
        head: [['Nome', 'G', 'Idade', 'Categoria', 'Sínodo', 'Estado']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 24, 27] }
      });

      const timestamp = new Date().getTime();
      doc.save(`membros_${timestamp}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Erro ao gerar PDF.");
    }
  };


  if (loading) return <div className="p-10 animate-pulse font-mono text-zinc-400">Carregando registros...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Membros</h2>
          <div className="flex items-center space-x-2">
            <Users className="w-3 h-3 text-zinc-400" />
            <p className="text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-widest">
              {filteredMembers.length} de {members.length} registros
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={exportCSV} className="flex items-center space-x-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase transition-all hover:bg-zinc-50">
            <FileDown className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button onClick={exportPDF} className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 text-white border border-zinc-900 rounded-xl text-xs font-bold uppercase transition-all hover:opacity-90">
            <Printer className="w-4 h-4" />
            <span>PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-white p-6 border-b-2 border-slate-100 card-base rounded-sm">
        <div className="relative col-span-1 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Procurar nome..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ieca-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none"
          value={filterSynod}
          onChange={(e) => { setFilterSynod(e.target.value); setFilterPastorate(''); setFilterCongregation(''); }}
        >
          <option value="">Sínodos</option>
          {synods.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select 
          className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none"
          value={filterPastorate}
          onChange={(e) => { setFilterPastorate(e.target.value); setFilterCongregation(''); }}
        >
          <option value="">Pastorados</option>
          {pastorates.filter(p => !filterSynod || p.synodId === filterSynod).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select 
          className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-sm text-sm focus:outline-none"
          value={filterCongregation}
          onChange={(e) => setFilterCongregation(e.target.value)}
        >
          <option value="">Congregações</option>
          {congregations.filter(c => !filterPastorate || c.pastorateId === filterPastorate).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button 
          onClick={() => { setSearchTerm(''); setFilterSynod(''); setFilterPastorate(''); setFilterCongregation(''); }}
          className="text-xs font-bold uppercase text-zinc-400 hover:text-zinc-900 transition-colors flex items-center justify-center"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Nome Completo</th>
                <th className="p-4 font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Género / Idade</th>
                <th className="p-4 font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Categoria / Batizado</th>
                <th className="p-4 font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Sínodo / Localização</th>
                <th className="p-4 font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Profissão / Académico</th>
                <th className="p-4 font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 text-sm font-mono uppercase tracking-widest">Sem registros</td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-ieca-light/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-none mb-1">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono lowercase">{m.email || 'sem email'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-700 uppercase">{m.gender}</span>
                        <span className="text-[10px] text-ieca-blue font-bold">{calculateAge(m.birthDate)} anos</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm self-start">{m.category}</span>
                        <span className={cn("text-[9px] font-bold", m.isBaptized ? "text-ieca-blue" : "text-slate-300")}>
                          {m.isBaptized ? "✓ BATIZADO" : "✕ NÃO BATIZADO"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-700">{synods.find(s => s.id === m.synodId)?.name}</span>
                        <span className="text-[9px] text-slate-400 uppercase">{m.residence}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-900 uppercase truncate max-w-[120px]">{m.profession || m.fieldOfWork || 'N/A'}</span>
                        <span className="text-[9px] text-slate-500 uppercase">{m.academicLevel}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-1 rounded-sm",
                        m.status === 'ACTIVO' ? "bg-blue-100 text-ieca-blue" : "bg-red-50 text-red-400"
                      )}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
