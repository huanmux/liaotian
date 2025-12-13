// src/components/Sidebar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Archive, Users, MessagesSquare, LogOut, Github, FileText, Shield, Download, Activity, ChevronRight } from 'lucide-react';

interface SidebarProps {
  show: boolean;
  onClose: () => void;
  setView?: (view: any) => void;
  view?: string;
  onSignOut?: () => void;
}

export const LeftSidebar: React.FC<SidebarProps> = ({ show, onClose }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string, external: boolean = false) => {
    if (external) {
      window.open(path, '_blank');
    } else {
      navigate(path);
      onClose();
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[98] transition-opacity ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed left-0 top-0 h-full w-72 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] z-[99] ${show ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 shadow-lg flex flex-col`}>
        
        {/* Header Section */}
        <div className="p-8 pb-6">
          <h1 className="text-3xl font-black text-[rgb(var(--color-primary))] tracking-tighter">Liaoverse</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-[rgb(var(--color-text))]">running LiaoTian</span>
          </div>
          <p className="text-xs text-[rgb(var(--color-text-secondary))] mt-1 font-mono">v1.1.1</p>
        </div>

        <div className="h-px bg-[rgb(var(--color-border))] mx-6 mb-4"></div>

        {/* Menu Options */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => handleNavigation('https://github.com/huanmux/liaotian', true)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] transition group"
          >
            <div className="flex items-center gap-3">
              <Github size={20} className="text-[rgb(var(--color-text-secondary))] group-hover:text-black dark:group-hover:text-white transition-colors" />
              <span className="font-medium">Make your own!</span>
            </div>
            <ChevronRight size={16} className="text-[rgb(var(--color-border))] group-hover:text-[rgb(var(--color-text-secondary))]" />
          </button>

          <button 
            onClick={() => handleNavigation('/terms-of-service')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] transition group"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[rgb(var(--color-text-secondary))] group-hover:text-blue-500 transition-colors" />
              <span className="font-medium">Terms of Service</span>
            </div>
          </button>

          <button 
            onClick={() => handleNavigation('/privacy-policy')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] transition group"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[rgb(var(--color-text-secondary))] group-hover:text-green-500 transition-colors" />
              <span className="font-medium">Privacy Policy</span>
            </div>
          </button>

           <button 
            onClick={() => handleNavigation('/download')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] transition group"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-[rgb(var(--color-text-secondary))] group-hover:text-orange-500 transition-colors" />
              <span className="font-medium">Download Liaoverse</span>
            </div>
          </button>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-[rgb(var(--color-border))]">
          <button 
            onClick={() => handleNavigation('https://stats.uptimerobot.com/b7TIAsQhon', true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition border border-green-200"
          >
            <Activity size={20} />
            <span className="font-bold text-sm">Server status</span>
            <span className="flex h-2 w-2 relative ml-auto">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

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
