import { ActiveTab } from '../types';
import {
  ScanLine, FolderSearch, Settings2, Info, FolderOpen,
  Layers, Zap, Shield,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasResults: boolean;
  resultCount?: number;
}

const NAV = [
  { id: 'scan' as ActiveTab, label: 'Scan', icon: ScanLine, desc: 'Configure & run' },
  { id: 'results' as ActiveTab, label: 'Results', icon: Layers, desc: 'View duplicates' },
  { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings2, desc: 'Scan options' },
  { id: 'about' as ActiveTab, label: 'About', icon: Info, desc: 'About DupeClear' },
];

export default function Sidebar({ activeTab, onTabChange, hasResults, resultCount }: SidebarProps) {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-[#0d0f1a] border-r border-white/5 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <FolderSearch size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">DupeClear</div>
            <div className="text-violet-400 text-[10px] font-medium">Open Source</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isResults = item.id === 'results';
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative
                ${isActive
                  ? 'bg-violet-600/20 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
              )}
              <Icon
                size={16}
                className={isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </div>
              </div>
              {isResults && hasResults && resultCount !== undefined && resultCount > 0 && (
                <span className="badge bg-violet-600/30 text-violet-300 text-[10px]">
                  {resultCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10">
          <Shield size={11} className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-400 text-[10px] font-medium">No files sent online</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-500/10">
          <Zap size={11} className="text-violet-400 flex-shrink-0" />
          <span className="text-violet-400 text-[10px] font-medium">All processing local</span>
        </div>
        <div className="text-gray-700 text-[10px] text-center mt-1">v2.0.0 · MIT License</div>
      </div>
    </aside>
  );
}
