import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member } from '../types';
import { motion } from 'motion/react';
import { Upload, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [shouldClear, setShouldClear] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const clearDatabase = async () => {
    const collections = ['members', 'synods', 'pastorates', 'congregations'];
    for (const collName of collections) {
      const snap = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  };

  const getRef = async (collName: string, name: string, parentData?: any) => {
    const coll = collection(db, collName);
    const q = query(coll, where('name', '==', name.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;
    
    const docRef = await addDoc(coll, { name: name.trim(), ...parentData });
    return docRef.id;
  };

  const processCSV = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    setError(null);

    if (shouldClear) {
      try {
        await clearDatabase();
      } catch (err) {
        setError("Erro ao limpar dados antigos.");
        setImporting(false);
        return;
      }
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let success = 0;
        let failed = 0;

        try {
          for (const row of results.data as any[]) {
            try {
              const findValue = (keys: string[]) => {
                const foundKey = Object.keys(row).find(k => 
                  keys.some(searchKey => k.trim().toUpperCase().includes(searchKey.toUpperCase()))
                );
                return foundKey ? row[foundKey] : null;
              };

              const synodName = findValue(["SÍNODO LOCAL", "POLO DE LUANDA"]);
              if (!synodName) continue;

              const synodId = await getRef('synods', synodName);
              let pastorateName = findValue(["PASTORADOS S.L", "PASTORADO"]);
              if (!pastorateName) continue;
              const pastorateId = await getRef('pastorates', pastorateName, { synodId });

              const congregationName = findValue(["CONGREGAÇÃO"]) || "SEDE";
              const congregationId = await getRef('congregations', congregationName, { pastorateId, synodId });

              const memberData: Partial<Member> = {
                name: findValue(["NOME"]),
                gender: (findValue(["GÊNERO"]) || "").toUpperCase().includes("FEM") ? "FEMININO" : "MASCULINO",
                birthDate: findValue(["DATA DE NASCI", "DATA DE NASCIMENTO"]),
                category: findValue(["CATEGORIA DE MEBRO", "CATEGORIA DE MEMBRO"]),
                residence: findValue(["RESIDÊNCIA"]),
                contact1: findValue(["CONTACTO PRINCIPAL"]),
                contact2: findValue(["CONTACTO ALTERNATIVO"]),
                email: findValue(["E-MAIL"]),
                facebook: findValue(["FACEBOOK"]),
                isDisabled: (findValue(["PORTADOR DE DEFICIÊNCIA"]) || "").toUpperCase() === "SIM",
                disabilityType: findValue(["DEIFICIÊNCIA", "DEFICIÊNCIAS"]),
                academicLevel: findValue(["NÍVEL ACADÊMICO"]),
                fieldOfStudy: findValue(["ÁREA DE FORMAÇÃO"]),
                academicStatus: findValue(["ESTADO ACADÊMICO"]),
                professionalStatus: findValue(["ESTADO PROFISSIONAL"]),
                employmentType: findValue(["TIPO DE EMPREGO"]),
                fieldOfWork: findValue(["ÁREA DE ACTUAÇÃO"]),
                experience: findValue(["Experiência Profissional"]),
                status: (findValue(["ESTADO DE MEMBRO"]) || "ACTIVO").toUpperCase() as any,
                // Novos campos mapeados ou default
                isBaptized: (findValue(["BATIZADO"]) || "").toUpperCase() === "SIM",
                civilStatus: findValue(["ESTADO CIVIL"]) || "NÃO ESPECIFICADO",
                profession: findValue(["PROFISSÃO"]) || "N/A",
                role: findValue(["CARGO"]) || "Membro",
                synodId,
                pastorateId,
                congregationId,
                createdAt: new Date().toISOString()
              };

              if (!memberData.name) continue;

              await addDoc(collection(db, 'members'), memberData);
              success++;
            } catch (err) {
              failed++;
            }
          }
          setResult({ success, failed });
        } catch (err) {
          setError("Erro crítico no processamento.");
        } finally {
          setImporting(false);
        }
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-ieca-blue">Ingestão de Dados</h2>
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Sincronização com Google Forms</p>
      </div>

      <div className="card-base p-10 space-y-8">
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-12 transition-all flex flex-col items-center justify-center space-y-4 text-center cursor-pointer",
            file ? "border-ieca-blue bg-ieca-light" : "border-slate-200 hover:border-ieca-blue hover:bg-slate-50"
          )}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className={cn("w-10 h-10", file ? "text-ieca-blue" : "text-slate-300")} />
          <div>
            <p className="font-bold text-slate-900">{file ? file.name : "Seleccionar ficheiro CSV"}</p>
            <p className="text-xs text-slate-400">Arraste ou clique para carregar</p>
          </div>
          <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="bg-slate-50 p-6 rounded-md flex items-center justify-between border border-slate-100">
          <div className="flex items-center space-x-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-bold text-slate-900">Limpar dados anteriores</p>
              <p className="text-xs text-slate-500">Substitui todos os registros pelos novos do ficheiro.</p>
            </div>
          </div>
          <button 
            onClick={() => setShouldClear(!shouldClear)}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              shouldClear ? "bg-red-500" : "bg-slate-300"
            )}
          >
            <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", shouldClear ? "left-7" : "left-1")}></div>
          </button>
        </div>

        {file && !importing && !result && (
          <button onClick={processCSV} className="w-full btn-primary h-14">
            Processar e Importar
          </button>
        )}

        {importing && (
           <div className="flex flex-col items-center py-6 space-y-3">
             <Loader2 className="w-10 h-10 text-ieca-blue animate-spin" />
             <p className="text-xs font-mono font-bold text-ieca-blue animate-pulse">Sincronizando registros...</p>
           </div>
        )}

        {result && (
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-md flex items-center space-x-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-bold">Importação Terminada</p>
              <p className="text-xs text-slate-500">Sucesso: {result.success} | Falhas: {result.failed}</p>
            </div>
            <button onClick={() => {setFile(null); setResult(null);}} className="text-xs font-bold text-ieca-blue uppercase">Novo Ficheiro</button>
          </div>
        )}
      </div>
    </div>
  );
}
