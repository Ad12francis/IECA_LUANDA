import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Admin from './pages/Admin';
import ImportData from './pages/ImportData';
import { Menu, X } from 'lucide-react';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-mono text-slate-400">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-2 border-slate-200 border-t-ieca-blue rounded-full animate-spin"></div>
        <span>A carregar...</span>
      </div>
    </div>
  );

  if (!user) return <Login />;
  
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-ieca-blue selection:text-white">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop, Drawer on mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-8 bg-ieca-blue rounded-full"></div>
            <span className="font-black text-lg tracking-tighter">IECA</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-50 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
          <Route path="/members" element={<AuthenticatedLayout><Members /></AuthenticatedLayout>} />
          <Route path="/admin" element={<AuthenticatedLayout><Admin /></AuthenticatedLayout>} />
          <Route path="/import" element={<AuthenticatedLayout><ImportData /></AuthenticatedLayout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
