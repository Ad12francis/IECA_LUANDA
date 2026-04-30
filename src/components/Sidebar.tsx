import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Settings, LogOut, FileDown, Database, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import logoIeca from "./logo_iecaa.png";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Membros', path: '/members', icon: Users },
    { name: 'Administração', path: '/admin', icon: Settings, adminOnly: true },
    { name: 'Importar Dados', path: '/import', icon: Database, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col p-6 space-y-10 shadow-sm">
      <div className="flex items-center justify-between">
  <div className="space-y-1">
    <div className="border-l-4 border-ieca-blue pl-4">
      <img 
        src={logoIeca} 
        alt="IECA" 
        className="h-12 w-auto object-contain -mb-1" 
      />
    </div>
    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold leading-none pl-4">
      Sociedade de Jovens
    </p>
  </div>
  <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-50 rounded-md">
    <X className="w-5 h-5 text-slate-400" />
  </button>
</div>

      <nav className="flex-1 flex flex-col space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 transition-all duration-200 group text-xs font-bold uppercase tracking-wider",
                isActive 
                  ? "bg-ieca-blue text-white shadow-md rounded-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-ieca-blue rounded-sm"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-ieca-blue")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 pt-6 flex flex-col space-y-4">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-xs">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-900 truncate">{user?.name}</span>
            <span className="font-mono text-[9px] text-zinc-400 uppercase">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center space-x-3 px-4 py-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
