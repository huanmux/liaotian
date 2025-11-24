// src/components/Sidebar.tsx
import React from 'react';
import { Home, Archive } from 'lucide-react';

interface SidebarProps {
  show: boolean;
  onClose: () => void;
  setView: (view: any) => void;
  view: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ show, onClose, setView, view }) => {
  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', view: 'feed', onClick: () => { setView('feed'); onClose(); } },
    { icon: <Archive size={20} />, label: 'Status Archive', view: 'archive', onClick: () => { setView('archive'); onClose(); } },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[98] transition-opacity ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed left-0 top-0 h-full w-64 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] z-[99] ${show ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 shadow-lg flex-shrink-0`}>
        <nav className="p-4 space-y-2 h-full flex flex-col">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                view === item.view
                  ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-bold'
                  : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};
