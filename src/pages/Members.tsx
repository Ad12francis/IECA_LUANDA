import { useEffect, useState, useMemo, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Synod, Pastorate, Congregation } from '../types';
import { Search, Filter, FileDown, Printer, Users, Trash2, ChevronDown, Check } from 'lucide-react';
import { cn, formatDate, calculateAge } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

import { dataService } from '../services/dataService';

function MultiSelect({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  options: { id: string; name: string }[]; 
  value: string[]; 
  onChange: (val: string[]) => void; 
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-zinc-100"
      >
        <span className="truncate max-w-[120px]">
          {value.length === 0 ? placeholder : `${label}: ${value.length}`}
        </span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 max-h-60 overflow-y-auto bg-white border border-zinc-100 rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-1">
          <div className="grid gap-1">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-left transition-colors",
                  value.includes(opt.id) ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-600"
                )}
              >
                <span className="truncate">{opt.name.toUpperCase()}</span>
                {value.includes(opt.id) && <Check className="w-3 h-3" />}
              </button>
            ))}
            {options.length === 0 && (
              <div className="p-4 text-center text-[10px] font-bold text-zinc-400">Sem opções</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [synods, setSynods] = useState<Synod[]>([]);
  const [pastorates, setPastorates] = useState<Pastorate[]>([]);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSynods, setFilterSynods] = useState<string[]>([]);
  const [filterPastorates, setFilterPastorates] = useState<string[]>([]);
  const [filterCongregations, setFilterCongregations] = useState<string[]>([]);
  const [filterGenders, setFilterGenders] = useState<string[]>([]);
  const [filterAgeRanges, setFilterAgeRanges] = useState<string[]>([]);
  const [filterAcademics, setFilterAcademics] = useState<string[]>([]);
  const [filterProfessionals, setFilterProfessionals] = useState<string[]>([]);

  const getAgeCategory = (birthDate: string): string => {
    const age = calculateAge(birthDate);
    if (age <= 12) return 'CRIANÇA';
    if (age <= 17) return 'ADOLESCENTE';
    if (age <= 35) return 'JOVEM';
    return 'ADULTO';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mems, syns, pasts, congs] = await Promise.all([
          dataService.getMembers(),
          dataService.getSynods(),
          dataService.getPastorates(),
          dataService.getCongregations(),
        ]);

        setMembers(mems);
        setSynods(syns);
        setPastorates(pasts);
        setCongregations(congs);
      } catch (err) {
        console.error("Erro ao carregar registros:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSynod = filterSynods.length === 0 || filterSynods.includes(m.synodId);
      const matchesPastorate = filterPastorates.length === 0 || filterPastorates.includes(m.pastorateId);
      const matchesCongregation = filterCongregations.length === 0 || filterCongregations.includes(m.congregationId);
      const matchesGender = filterGenders.length === 0 || filterGenders.includes((m.gender || '').toUpperCase());
      const matchesAge = filterAgeRanges.length === 0 || filterAgeRanges.includes(getAgeCategory(m.birthDate));
      const matchesAcademic = filterAcademics.length === 0 || filterAcademics.includes((m.academicLevel || '').toUpperCase());
      const matchesProfessional = filterProfessionals.length === 0 || filterProfessionals.includes((m.professionalStatus || '').toUpperCase());

      return matchesSearch && matchesSynod && matchesPastorate && 
             matchesCongregation && matchesGender && matchesAge && 
             matchesAcademic && matchesProfessional;
    });
  }, [members, searchTerm, filterSynods, filterPastorates, filterCongregations, filterGenders, filterAgeRanges, filterAcademics, filterProfessionals]);

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
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // IECA Branding Header
      doc.setFillColor(24, 24, 27); // Zinc-900
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('IECA', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Igreja Evangélica Congregacional em Angola', 15, 26);
      doc.text('Secretariado Provincial da Sociedade de Jovens - Luanda', 15, 30);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('RELATÓRIO DE REGISTROS DE MEMBROS', 180, 25, { align: 'left' });

      // Page Info
      doc.setTextColor(82, 82, 91); // Zinc-500
      doc.setFontSize(8);
      const dateStr = new Date().toLocaleDateString('pt-AO');
      doc.text(`Data de Emissão: ${dateStr}`, 15, 42);
      doc.text(`Total de Registros: ${filteredMembers.length}`, 15, 46);

      const tableData = filteredMembers.map(m => [
        m.name?.toUpperCase() || 'N/A',
        (m.gender || 'N/A').toUpperCase(),
        calculateAge(m.birthDate).toString(),
        (m.category || '').toUpperCase(),
        (synods.find(s => s.id === m.synodId)?.name || '').toUpperCase(),
        (pastorates.find(p => p.id === m.pastorateId)?.name || '').toUpperCase(),
        (congregations.find(c => c.id === m.congregationId)?.name || '').toUpperCase(),
        (m.academicLevel || '').toUpperCase(),
        (m.status || 'ACTIVO').toUpperCase()
      ]);

      autoTable(doc, {
        head: [['NOME COMPLETO', 'GÉNERO', 'IDADE', 'CATEGORIA', 'SÍNODO', 'PASTORADO', 'CONGREGAÇÃO', 'NÍVEL ACAD.', 'ESTADO']],
        body: tableData,
        startY: 50,
        styles: { 
          fontSize: 7,
          cellPadding: 3,
          font: 'helvetica'
        },
        headStyles: { 
          fillColor: [39, 39, 42], // Zinc-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Name
          1: { halign: 'center' },
          2: { halign: 'center' },
          8: { halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { top: 50, bottom: 20 },
        didDrawPage: (data) => {
          // Footer
          const str = `Página ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
          doc.text('© IECA - Sistema de Gestão de Membros', 220, doc.internal.pageSize.height - 10);
        }
      });

      const timestamp = new Date().getTime();
      doc.save(`IECA_MEMBROS_LUANDA_${timestamp}.pdf`);
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm transition-all">
        <div className="relative md:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
          <input 
            type="text" 
            placeholder="Procurar nome..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <MultiSelect 
          label="Sínodos"
          placeholder="SELECIONAR SÍNODOS"
          options={synods}
          value={filterSynods}
          onChange={(val) => { setFilterSynods(val); setFilterPastorates([]); setFilterCongregations([]); }}
        />

        <MultiSelect 
          label="Pastorados"
          placeholder="SELECIONAR PASTORADOS"
          options={pastorates.filter(p => filterSynods.length === 0 || filterSynods.includes(p.synodId))}
          value={filterPastorates}
          onChange={(val) => { setFilterPastorates(val); setFilterCongregations([]); }}
        />

        <MultiSelect 
          label="Congregações"
          placeholder="SELECIONAR CONGREGAÇÕES"
          options={congregations.filter(c => filterPastorates.length === 0 || filterPastorates.includes(c.pastorateId))}
          value={filterCongregations}
          onChange={(val) => setFilterCongregations(val)}
        />

        <MultiSelect 
          label="Gêneros"
          placeholder="SELECIONAR GÉNEROS"
          options={[
            { id: 'MASCULINO', name: 'MASCULINO' },
            { id: 'FEMININO', name: 'FEMININO' }
          ]}
          value={filterGenders}
          onChange={setFilterGenders}
        />

        <MultiSelect 
          label="Idades"
          placeholder="SELECIONAR IDADES"
          options={[
            { id: 'CRIANÇA', name: 'CRIANÇA (0-12)' },
            { id: 'ADOLESCENTE', name: 'ADOLESCENTE (13-17)' },
            { id: 'JOVEM', name: 'JOVEM (18-35)' },
            { id: 'ADULTO', name: 'ADULTO (36+)' }
          ]}
          value={filterAgeRanges}
          onChange={setFilterAgeRanges}
        />

        <MultiSelect 
          label="Académico"
          placeholder="NÍVEL ACADÉMICO"
          options={[
            { id: 'ENSINO PRIMÁRIO', name: 'ENSINO PRIMÁRIO' },
            { id: 'ENSINO SECUNDÁRIO', name: 'ENSINO SECUNDÁRIO' },
            { id: 'ENSINO MÉDIO', name: 'ENSINO MÉDIO' },
            { id: 'ENSINO SUPERIOR', name: 'ENSINO SUPERIOR' },
            { id: 'PÓS GRADUAÇÃO/ MESTRADO', name: 'PÓS GRADUAÇÃO/ MESTRADO' },
            { id: 'DOUTORADO', name: 'DOUTORADO' }
          ]}
          value={filterAcademics}
          onChange={setFilterAcademics}
        />

        <MultiSelect 
          label="Profissional"
          placeholder="ESTADO PROFISSIONAL"
          options={[
            { id: 'EMPREGADO', name: 'EMPREGADO' },
            { id: 'DESEMPREGADO', name: 'DESEMPREGADO' },
            { id: 'ESTUDANTE', name: 'ESTUDANTE' },
            { id: 'POR CONTA PRÓPRIA', name: 'POR CONTA PRÓPRIA' },
            { id: 'FUNCIONÁRIO PÚBLICO', name: 'FUNCIONÁRIO PÚBLICO' }
          ]}
          value={filterProfessionals}
          onChange={setFilterProfessionals}
        />

        <button 
          onClick={() => { 
            setSearchTerm(''); 
            setFilterSynods([]); 
            setFilterPastorates([]); 
            setFilterCongregations([]);
            setFilterGenders([]);
            setFilterAgeRanges([]);
            setFilterAcademics([]);
            setFilterProfessionals([]);
          }}
          className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900 transition-colors flex items-center justify-center space-x-2 border border-dashed border-zinc-200 rounded-xl hover:border-zinc-900"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpar Tudo</span>
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
