import { useState } from 'react';
import {
  FolderPlus, Trash2, Play, Square, ChevronRight, AlertCircle,
  Cpu, FileSearch, FolderOpen, Image, Music, Film, HardDrive,
  Clock, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { ScanStatus, ScanStats, ScanOptions, ScanMode } from '../types';
import { formatBytes, formatDate } from '../utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanTabProps {
  status: ScanStatus;
  stats: ScanStats;
  scanOptions: ScanOptions;
  onScanOptionsChange: (o: ScanOptions) => void;
  onStartScan: (handles: FileSystemDirectoryHandle[], opts: ScanOptions) => void;
  onStopScan: () => void;
  onResultsClick: () => void;
}

const SCAN_MODES: { id: ScanMode; label: string; icon: any; desc: string; color: string }[] = [
  { id: 'regular', label: 'Regular', icon: HardDrive, desc: 'Find exact duplicate files by content hash, name or size', color: 'from-violet-500 to-indigo-600' },
  { id: 'image', label: 'Image', icon: Image, desc: 'Find similar/identical images using perceptual hashing (dHash)', color: 'from-pink-500 to-rose-600' },
  { id: 'audio', label: 'Audio', icon: Music, desc: 'Match duplicate or similar music/audio by fingerprint & duration', color: 'from-emerald-500 to-teal-600' },
  { id: 'video', label: 'Video', icon: Film, desc: 'Find duplicate videos by content hash and duration matching', color: 'from-amber-500 to-orange-600' },
];

export default function ScanTab({
  status, stats, scanOptions, onScanOptionsChange, onStartScan, onStopScan, onResultsClick,
}: ScanTabProps) {
  const [folders, setFolders] = useState<{ name: string; path: string; handle: FileSystemDirectoryHandle }[]>([]);
  const [fsError, setFsError] = useState<string | null>(null);

  const supportsFilePicker = 'showDirectoryPicker' in window;
  const isScanning = status === 'scanning' || status === 'hashing' || status === 'analyzing';
  const isComplete = status === 'complete';

  const addFolder = async () => {
    if (!supportsFilePicker) {
      setFsError('File System Access API not supported. Please use Chrome 86+ or Edge 86+ on Windows.');
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
      setFolders(prev => {
        if (prev.find(f => f.name === handle.name)) return prev;
        return [...prev, { name: handle.name, path: handle.name, handle }];
      });
      setFsError(null);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setFsError('Could not open folder: ' + e.message);
      }
    }
  };

  const removeFolder = (name: string) => {
    setFolders(prev => prev.filter(f => f.name !== name));
  };

  const handleStart = () => {
    if (folders.length === 0) {
      setFsError('Please add at least one folder to scan.');
      return;
    }
    setFsError(null);
    onStartScan(folders.map(f => f.handle), scanOptions);
  };

  const elapsedSec = Math.round((stats.elapsedMs || 0) / 1000);
  const elapsedStr = elapsedSec >= 60
    ? `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`
    : `${elapsedSec}s`;

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Scan for Duplicates</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Add folders, choose a scan mode, and DupeClear will find duplicates using multiple detection algorithms.
        </p>
      </div>

      {/* Scan Mode Selector */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <span className="text-white text-sm font-semibold">Scan Mode</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {SCAN_MODES.map(mode => {
            const Icon = mode.icon;
            const isActive = scanOptions.scanMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onScanOptionsChange({ ...scanOptions, scanMode: mode.id })}
                disabled={isScanning}
                className={`
                  relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 disabled:opacity-40
                  ${isActive
                    ? 'border-violet-500/50 bg-violet-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {mode.label}
                  </div>
                  <div className="text-gray-500 text-[11px] mt-0.5 leading-tight">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mode-specific quick options */}
        {scanOptions.scanMode === 'image' && (
          <div className="px-5 pb-4 flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.matchRotatedImages}
                onChange={e => onScanOptionsChange({ ...scanOptions, matchRotatedImages: e.target.checked })}
                className="w-3.5 h-3.5 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Match rotated images</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-gray-400 text-xs">Similarity ≥</span>
              <input
                type="number"
                min={60} max={100}
                value={scanOptions.imageSimilarityThreshold}
                onChange={e => onScanOptionsChange({ ...scanOptions, imageSimilarityThreshold: Number(e.target.value) })}
                className="w-12 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-white text-center"
              />
              <span className="text-gray-400 text-xs">%</span>
            </label>
          </div>
        )}
        {scanOptions.scanMode === 'audio' && (
          <div className="px-5 pb-4 flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.matchByAudioContent}
                onChange={e => onScanOptionsChange({ ...scanOptions, matchByAudioContent: e.target.checked })}
                className="w-3.5 h-3.5 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Match by audio fingerprint</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.matchByDuration}
                onChange={e => onScanOptionsChange({ ...scanOptions, matchByDuration: e.target.checked })}
                className="w-3.5 h-3.5 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Match by duration</span>
            </label>
          </div>
        )}
        {scanOptions.scanMode === 'regular' && (
          <div className="px-5 pb-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.matchByContent}
                onChange={e => onScanOptionsChange({ ...scanOptions, matchByContent: e.target.checked })}
                className="w-3.5 h-3.5 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Match by content (MD5)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.matchByName}
                onChange={e => onScanOptionsChange({ ...scanOptions, matchByName: e.target.checked })}
                className="w-3.5 h-3.5 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Match by filename</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.matchBySimilarName}
                onChange={e => onScanOptionsChange({ ...scanOptions, matchBySimilarName: e.target.checked })}
                className="w-3.5 h-3.5 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Similar names (copies)</span>
            </label>
          </div>
        )}
      </div>

      {/* Folder Picker */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <FolderOpen size={16} className="text-violet-400" />
            Scan Locations
          </div>
          <button
            onClick={addFolder}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FolderPlus size={13} />
            Add Folder
          </button>
        </div>

        <div className="p-4">
          {folders.length === 0 ? (
            <button
              onClick={addFolder}
              className="drag-zone w-full border-2 border-dashed border-gray-800 rounded-xl p-10 flex flex-col items-center gap-3 text-gray-600 hover:text-violet-400 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-800/60 group-hover:bg-violet-500/10 flex items-center justify-center transition-colors">
                <FolderPlus size={26} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm">Click to add a folder</div>
                <div className="text-xs text-gray-700 mt-1">Requires Chrome 86+ or Edge 86+</div>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => (
                <div
                  key={folder.name}
                  className="flex items-center gap-3 px-4 py-3 bg-gray-800/40 rounded-xl border border-white/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={15} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-200 text-sm font-medium truncate">{folder.name}</div>
                    <div className="text-gray-600 text-xs truncate">{folder.path}</div>
                  </div>
                  <button
                    onClick={() => removeFolder(folder.name)}
                    disabled={isScanning}
                    className="text-gray-700 hover:text-red-400 transition-colors disabled:opacity-30 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addFolder}
                disabled={isScanning}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-800 hover:border-violet-600 text-gray-600 hover:text-violet-400 text-sm transition-all disabled:opacity-30"
              >
                <FolderPlus size={14} />
                Add another folder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {fsError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {fsError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={handleStart}
            disabled={folders.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            Start {SCAN_MODES.find(m => m.id === scanOptions.scanMode)?.label} Scan
          </button>
        ) : (
          <button
            onClick={onStopScan}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 font-semibold text-sm transition-all"
          >
            <Square size={15} />
            Stop Scan
          </button>
        )}
        {isComplete && (
          <button
            onClick={onResultsClick}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-sm transition-all"
          >
            View Results
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* Progress */}
      <AnimatePresence>
        {(isScanning || isComplete) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#111827] rounded-2xl border border-white/5 p-5 space-y-4"
          >
            {/* Phase indicator */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                {isComplete
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : status === 'scanning'
                    ? <FileSearch size={16} className="text-violet-400 animate-pulse" />
                    : <Cpu size={16} className="text-indigo-400 animate-pulse" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{stats.phase}</div>
                <div className="text-gray-500 text-xs truncate">{stats.currentFile || 'Initializing…'}</div>
              </div>
              {isScanning && (
                <div className="text-gray-500 text-xs flex items-center gap-1">
                  <Clock size={11} />
                  {elapsedStr}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>{stats.scannedFiles.toLocaleString()} files</span>
                <span>{stats.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'shimmer'}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Result stats */}
            {(isComplete || stats.duplicateGroups > 0) && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { label: 'Files Scanned', value: stats.totalFiles.toLocaleString(), color: 'text-gray-300' },
                  { label: 'Groups Found', value: stats.duplicateGroups.toLocaleString(), color: 'text-violet-300' },
                  { label: 'Space Wasted', value: formatBytes(stats.wastedSpace), color: 'text-amber-300' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-gray-600 text-[11px]">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {!isScanning && !isComplete && (
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
          <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-300/70 text-xs leading-relaxed">
            <strong className="text-blue-300">Tips:</strong> For best results, start with a small folder first.
            Image mode uses perceptual hashing (dHash) to find visually similar images even if resized or edited.
            Audio mode fingerprints the first 100KB of audio data to find re-encoded duplicates.
          </div>
        </div>
      )}
    </div>
  );
}
