import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ScanTab from './components/ScanTab';
import ResultsTab from './components/ResultsTab';
import SettingsTab from './components/SettingsTab';
import AboutTab from './components/AboutTab';
import { useScanner } from './hooks/useScanner';
import { ActiveTab, ScanOptions } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderSearch } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');

  const {
    status, stats, duplicateGroups, scanOptions, setScanOptions,
    startScan, stopScan,
    toggleFileSelected, selectAllInGroup, deselectAllInGroup,
    selectAllDuplicates, deselectAll, applySelectionRule,
    getSelectedFiles, removeSelected, removeGroup,
  } = useScanner();

  const hasResults = duplicateGroups.length > 0 || status === 'complete';
  const totalGroups = duplicateGroups.length;

  const handleStartScan = useCallback(
    (handles: FileSystemDirectoryHandle[], opts: ScanOptions) => {
      setScanOptions(opts);
      startScan(handles, opts);
      // Auto-switch to scan tab to show progress
    },
    [startScan, setScanOptions]
  );

  const statusLabel = {
    idle: null,
    scanning: { text: 'Scanning…', color: 'text-violet-300', dot: 'bg-violet-400' },
    hashing: { text: 'Hashing…', color: 'text-indigo-300', dot: 'bg-indigo-400' },
    analyzing: { text: 'Analyzing…', color: 'text-blue-300', dot: 'bg-blue-400' },
    complete: { text: 'Scan Complete', color: 'text-emerald-300', dot: 'bg-emerald-400' },
    error: { text: 'Error', color: 'text-red-300', dot: 'bg-red-400' },
  }[status];

  return (
    <div className="flex h-screen bg-[#060914] text-white overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasResults={hasResults}
        resultCount={totalGroups}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Title bar */}
        <div className="h-11 bg-[#0a0d1a]/90 border-b border-white/[0.04] flex items-center px-5 gap-3 flex-shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-4 h-4 rounded flex items-center justify-center opacity-40">
              <FolderSearch size={13} className="text-violet-400" />
            </div>
            <span className="text-gray-500 text-xs font-medium">
              {activeTab === 'scan' && 'Scan for Duplicates'}
              {activeTab === 'results' && (
                <span className="flex items-center gap-2">
                  Results
                  {stats.duplicateGroups > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 text-[10px] font-semibold">
                      {stats.duplicateGroups} groups · {stats.duplicateFiles} dupes
                    </span>
                  )}
                </span>
              )}
              {activeTab === 'settings' && 'Scan Settings'}
              {activeTab === 'about' && 'About DupeClear'}
            </span>
          </div>

          {/* Status indicator */}
          {statusLabel && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${statusLabel.dot} ${status !== 'complete' && status !== 'error' ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-medium ${statusLabel.color}`}>{statusLabel.text}</span>
              {status === 'complete' && stats.duplicateGroups > 0 && (
                <button
                  onClick={() => setActiveTab('results')}
                  className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/25 transition-colors"
                >
                  View →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <div className={`h-full ${activeTab === 'results' ? 'p-4' : 'p-6'}`}>
                {activeTab === 'scan' && (
                  <ScanTab
                    status={status}
                    stats={stats}
                    scanOptions={scanOptions}
                    onScanOptionsChange={setScanOptions}
                    onStartScan={handleStartScan}
                    onStopScan={stopScan}
                    onResultsClick={() => setActiveTab('results')}
                  />
                )}
                {activeTab === 'results' && (
                  <ResultsTab
                    groups={duplicateGroups}
                    stats={stats}
                    onToggleFile={toggleFileSelected}
                    onSelectAllInGroup={selectAllInGroup}
                    onDeselectAllInGroup={deselectAllInGroup}
                    onSelectAllDuplicates={selectAllDuplicates}
                    onDeselectAll={deselectAll}
                    onApplyRule={applySelectionRule}
                    onRemoveSelected={removeSelected}
                    onRemoveGroup={removeGroup}
                    getSelectedFiles={getSelectedFiles}
                  />
                )}
                {activeTab === 'settings' && (
                  <SettingsTab
                    options={scanOptions}
                    onChange={setScanOptions}
                  />
                )}
                {activeTab === 'about' && <AboutTab />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
