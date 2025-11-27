// src/components/Sidebar.tsx
import React from 'react';
import { Home, Archive, Users, MessagesSquare, LogOut } from 'lucide-react';

interface SidebarProps {
  show: boolean;
  onClose: () => void;
  setView: (view: any) => void;
  view: string;
}

  export const RightSidebar: React.FC<SidebarProps> = ({ show, onClose, setView, view, onSignOut }) => {
  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', view: 'feed', onClick: () => { setView('feed'); onClose(); } },
    { icon: <Users size={20} />, label: 'Groups', view: 'groups', onClick: () => { setView('groups'); onClose(); } },
    { icon: <MessagesSquare size={20} />, label: 'Forums', view: 'forums', onClick: () => { setView('forums'); onClose(); } },
    { icon: <Archive size={20} />, label: 'Status Archive', view: 'archive', onClick: () => { setView('archive'); onClose(); } },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[98] transition-opacity ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed right-0 top-0 h-full w-64 bg-[rgb(var(--color-surface))] border-l border-[rgb(var(--color-border))] z-[99] ${show ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 shadow-lg flex-shrink-0`}>
        <nav className="p-4 space-y-2 h-full flex flex-col">
          <div className="flex-1 space-y-2">
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
          </div>
          
          {/* Sign Out moved to bottom of sidebar */}
          <div className="pt-4 border-t border-[rgb(var(--color-border))]">
            <button
              onClick={() => { onSignOut(); onClose(); }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-[rgba(239,68,68,0.1)] transition"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};
