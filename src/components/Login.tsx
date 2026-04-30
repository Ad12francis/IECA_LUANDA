import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "motion/react";
import { LogIn, Lock, Mail, AlertCircle } from "lucide-react";
import logoIeca from "./logo_ieca.png"; // ← IMPORTE A IMAGEM

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = await login(email, password);
    if (!success) {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 flex flex-col space-y-8 border border-zinc-100"
      >
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoIeca} alt="IECA Luanda" className="h-26 w-auto" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            IECA Luanda
          </h1>
          <p className="text-zinc-500 text-sm">Gestão da Sociedade de Jovens</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                placeholder="usuario@sinodo.ao"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">
              Palavra-passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold shadow-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="pt-4 flex flex-col space-y-4 w-full text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-100"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-400 font-mono">
                Dica de Acesso
              </span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono bg-zinc-50 p-4 rounded-xl space-y-1">
            <p>
              As credenciais de acesso são fornecidas pela
              <strong> secretaria da igreja</strong>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
