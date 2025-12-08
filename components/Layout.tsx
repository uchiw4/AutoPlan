import React from 'react';
import { LayoutDashboard, Calendar, Users, UserCheck, Settings, Car } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
    { id: 'PLANNING', label: 'Planning', icon: <Calendar size={20} /> },
    { id: 'STUDENTS', label: 'Élèves', icon: <Users size={20} /> },
    { id: 'INSTRUCTORS', label: 'Moniteurs', icon: <UserCheck size={20} /> },
    { id: 'SETTINGS', label: 'Paramètres', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl flex-shrink-0 z-20">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="bg-white p-2 rounded-lg text-slate-900">
             <Car size={24} />
          </div>
          <span className="font-bold text-lg tracking-tight">AutoPlanning</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
          v1.0.0
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-7xl mx-auto h-full">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};
