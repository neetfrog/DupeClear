import { useState, useMemo, useCallback } from 'react';
import {
  Trash2, CheckSquare, Square, ChevronDown, ChevronRight, Download,
  Search, X, Copy, LayoutGrid, List, AlertTriangle, BarChart2,
  FileImage, Music, Film, FileText, Archive, File,
  Zap, Clock, HardDrive, ChevronUp, Sparkles, Target,
} from 'lucide-react';
import { DuplicateGroup, ScannedFile, SortField, SortDirection, FileCategory, SelectionRule } from '../types';
import { formatBytes, formatDate, formatDuration, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultsTabProps {
  groups: DuplicateGroup[];
  stats: { duplicateGroups: number; duplicateFiles: number; wastedSpace: number; totalFiles: number };
  onToggleFile: (id: string) => void;
  onSelectAllInGroup: (groupId: string, keepFirst?: boolean) => void;
  onDeselectAllInGroup: (groupId: string) => void;
  onSelectAllDuplicates: () => void;
  onDeselectAll: () => void;
  onApplyRule: (rule: SelectionRule) => void;
  onRemoveSelected: () => void;
  onRemoveGroup: (groupId: string) => void;
  getSelectedFiles: () => ScannedFile[];
}

type ViewMode = 'grouped' | 'thumbnail';

const CAT_ICONS: Record<FileCategory, any> = {
  image: FileImage, video: Film, audio: Music, document: FileText, archive: Archive, other: File,
};

function SimilarityBadge({ sim, matchType }: { sim?: number; matchType: 'exact' | 'similar' }) {
  if (matchType === 'exact') {
    return (
      <span className="badge bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
        Exact
      </span>
    );
  }
  if (sim === undefined) return null;
  const color = sim >= 95 ? 'bg-violet-500/15 text-violet-300' : sim >= 85 ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300';
  return (
    <span className={`badge ${color} flex items-center gap-1`}>
      <Sparkles size={9} />
      {sim}% similar
    </span>
  );
}

function FileIcon({ category }: { category: FileCategory }) {
  const Icon = CAT_ICONS[category];
  const color = CATEGORY_COLORS[category];
  return <Icon size={14} style={{ color }} />;
}

interface GroupRowProps {
  group: DuplicateGroup;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleFile: (id: string) => void;
  onSelectAll: (keepFirst?: boolean) => void;
  onDeselectAll: () => void;
  onRemove: () => void;
  groupIndex: number;
}

function GroupRow({ group, expanded, onToggleExpand, onToggleFile, onSelectAll, onDeselectAll, onRemove, groupIndex }: GroupRowProps) {
  const CatIcon = CAT_ICONS[group.category];
  const catColor = CATEGORY_COLORS[group.category];

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0d1120]">
      {/* Group header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
        onClick={onToggleExpand}
      >
        <button
          className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
          onClick={e => { e.stopPropagation(); onToggleExpand(); }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Category icon */}
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${catColor}20` }}>
          <CatIcon size={13} style={{ color: catColor }} />
        </div>

        {/* Group info */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-gray-200 text-sm font-medium">
            Group {groupIndex + 1}
          </span>
          <span className="text-gray-500 text-xs">
            {group.files.length} files · {formatBytes(group.size)} each
          </span>
          <SimilarityBadge sim={group.similarity} matchType={group.matchType} />
        </div>

        {/* Wasted space */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="text-amber-400 text-xs font-semibold">{formatBytes(group.wastedSpace)} wasted</div>
        </div>

        {/* Thumbnail preview strip */}
        {group.category === 'image' && group.files.some(f => f.thumbnailUrl) && (
          <div className="flex gap-1 flex-shrink-0">
            {group.files.slice(0, 3).filter(f => f.thumbnailUrl).map(f => (
              <div key={f.id} className="w-8 h-8 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                <img src={f.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Group actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSelectAll(true)}
            title="Select duplicates (keep first)"
            className="p-1.5 rounded-lg hover:bg-violet-500/15 text-gray-600 hover:text-violet-400 transition-colors text-xs"
          >
            <CheckSquare size={13} />
          </button>
          <button
            onClick={onDeselectAll}
            title="Deselect all"
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Square size={13} />
          </button>
          <button
            onClick={onRemove}
            title="Remove group from list"
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-600 hover:text-red-400 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.04]">
              {group.files.map((file, fileIdx) => (
                <div
                  key={file.id}
                  className={`file-row flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${file.selected ? 'selected' : ''}`}
                  onClick={() => onToggleFile(file.id)}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    {file.selected
                      ? <CheckSquare size={14} className="text-violet-400" />
                      : <Square size={14} className="text-gray-700" />
                    }
                  </div>

                  {/* Thumbnail or icon */}
                  {file.thumbnailUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/5">
                      <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-800/60 flex items-center justify-center flex-shrink-0 border border-white/5">
                      <FileIcon category={file.category} />
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium truncate max-w-xs ${file.selected ? 'text-violet-300 line-through decoration-violet-500/50' : 'text-gray-200'}`}>
                        {file.name}
                      </span>
                      {fileIdx === 0 && (
                        <span className="badge bg-emerald-500/10 text-emerald-500 text-[10px]">Keep</span>
                      )}
                      {file.similarity !== undefined && file.similarity < 100 && (
                        <span className="badge bg-blue-500/10 text-blue-400 text-[10px]">{file.similarity}%</span>
                      )}
                    </div>
                    <div className="text-gray-600 text-xs mt-0.5 truncate">{file.path}</div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-gray-700 text-[11px]">{formatBytes(file.size)}</span>
                      <span className="text-gray-700 text-[11px]">{formatDate(file.modified)}</span>
                      {file.imageWidth && (
                        <span className="text-gray-700 text-[11px]">{file.imageWidth}×{file.imageHeight}</span>
                      )}
                      {file.audioDuration && (
                        <span className="text-gray-700 text-[11px]">⏱ {formatDuration(file.audioDuration)}</span>
                      )}
                      {file.videoDuration && (
                        <span className="text-gray-700 text-[11px]">⏱ {formatDuration(file.videoDuration)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Thumbnail grid group ─────────────────────────────────────────────────────

function ThumbnailGroup({ group, onToggleFile, groupIndex }: {
  group: DuplicateGroup;
  onToggleFile: (id: string) => void;
  groupIndex: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d1120] p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400 text-xs font-semibold">Group {groupIndex + 1}</span>
        <SimilarityBadge sim={group.similarity} matchType={group.matchType} />
        <span className="text-amber-400 text-xs ml-auto">{formatBytes(group.wastedSpace)} wasted</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {group.files.map((file, i) => (
          <div
            key={file.id}
            onClick={() => onToggleFile(file.id)}
            className={`thumb-card relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${file.selected ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-white/10 hover:border-violet-500/50'}`}
            style={{ width: 120, height: 120 }}
          >
            {file.thumbnailUrl ? (
              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <FileIcon category={file.category} />
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {/* Keep badge */}
            {i === 0 && (
              <div className="absolute top-1.5 left-1.5">
                <span className="badge bg-emerald-500/80 text-white text-[9px]">Keep</span>
              </div>
            )}
            {/* Selection indicator */}
            {file.selected && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                <CheckSquare size={11} className="text-white" />
              </div>
            )}
            {/* File info */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5">
              <div className="text-white text-[10px] font-medium truncate">{file.name}</div>
              <div className="text-gray-400 text-[9px]">{formatBytes(file.size)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Selection Assistant Panel ───────────────────────────────────────────────

function SelectionAssistant({ onApplyRule, onSelectAll, onDeselectAll }: {
  onApplyRule: (r: SelectionRule) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const [pathContains, setPathContains] = useState('');

  const rules: { label: string; type: SelectionRule['type']; icon: any; desc: string }[] = [
    { label: 'Keep Oldest', type: 'keep_oldest', icon: Clock, desc: 'Keep the oldest file, mark newer as duplicate' },
    { label: 'Keep Newest', type: 'keep_newest', icon: Clock, desc: 'Keep the most recently modified file' },
    { label: 'Keep Largest', type: 'keep_largest', icon: HardDrive, desc: 'Keep the biggest file (best quality)' },
    { label: 'Keep Smallest', type: 'keep_smallest', icon: HardDrive, desc: 'Keep the smallest file to save space' },
    { label: 'Keep Shortest Path', type: 'keep_shortest_path', icon: Target, desc: 'Keep file closest to root directory' },
  ];

  return (
    <div className="bg-[#0d1120] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
        <Zap size={14} className="text-violet-400" />
        <span className="text-white text-sm font-semibold">Selection Assistant</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-gray-500 text-xs">Auto-mark files for removal based on rules:</p>
        <div className="grid grid-cols-1 gap-1.5">
          {rules.map(rule => {
            const Icon = rule.icon;
            return (
              <button
                key={rule.type}
                onClick={() => onApplyRule({ type: rule.type })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-violet-500/10 border border-white/[0.04] hover:border-violet-500/30 text-left transition-all group"
              >
                <Icon size={13} className="text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                <div>
                  <div className="text-gray-300 text-xs font-medium">{rule.label}</div>
                  <div className="text-gray-600 text-[11px]">{rule.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Path-based selection */}
        <div className="border-t border-white/[0.04] pt-3">
          <div className="text-gray-500 text-xs mb-2">Keep files in a specific path:</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. C:/Photos/Archive"
              value={pathContains}
              onChange={e => setPathContains(e.target.value)}
              className="flex-1 bg-gray-800/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={() => onApplyRule({ type: 'keep_path', pathContains })}
              disabled={!pathContains}
              className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium transition-colors disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Quick all/none */}
        <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
          <button
            onClick={onSelectAll}
            className="flex-1 py-2 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 text-xs font-medium transition-colors"
          >
            Select All Duplicates
          </button>
          <button
            onClick={onDeselectAll}
            className="flex-1 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 text-xs font-medium transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Results Tab ────────────────────────────────────────────────────────

export default function ResultsTab({
  groups, stats, onToggleFile, onSelectAllInGroup, onDeselectAllInGroup,
  onSelectAllDuplicates, onDeselectAll, onApplyRule, onRemoveSelected, onRemoveGroup, getSelectedFiles,
}: ResultsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'all'>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<'all' | 'exact' | 'similar'>('all');
  const [sortField, setSortField] = useState<SortField>('size');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandAll, setExpandAll] = useState(true);

  const selectedFiles = getSelectedFiles();
  const selectedCount = selectedFiles.length;
  const selectedWaste = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExpandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.id)));
    setExpandAll(true);
  };
  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
    setExpandAll(false);
  };

  const filteredGroups = useMemo(() => {
    let filtered = groups;
    if (categoryFilter !== 'all') filtered = filtered.filter(g => g.category === categoryFilter);
    if (matchTypeFilter !== 'all') filtered = filtered.filter(g => g.matchType === matchTypeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(g => g.files.some(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)));
    }
    filtered = [...filtered].sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortField === 'size') { va = a.size; vb = b.size; }
      else if (sortField === 'name') { va = a.files[0]?.name ?? ''; vb = b.files[0]?.name ?? ''; }
      else if (sortField === 'similarity') { va = a.similarity ?? 100; vb = b.similarity ?? 100; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
    });
    return filtered;
  }, [groups, categoryFilter, matchTypeFilter, searchQuery, sortField, sortDir]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<FileCategory, { count: number; waste: number }>();
    for (const g of groups) {
      const ex = map.get(g.category) ?? { count: 0, waste: 0 };
      map.set(g.category, { count: ex.count + g.files.length - 1, waste: ex.waste + g.wastedSpace });
    }
    return [...map.entries()].sort((a, b) => b[1].waste - a[1].waste);
  }, [groups]);

  const hasExact = groups.some(g => g.matchType === 'exact');
  const hasSimilar = groups.some(g => g.matchType === 'similar');

  const exportCSV = () => {
    const rows = ['Group,Match Type,Similarity,File Name,Path,Size (bytes),Modified,Selected'];
    groups.forEach((g, gi) => {
      g.files.forEach(f => {
        rows.push([
          gi + 1, g.matchType, g.similarity ?? 100,
          `"${f.name}"`, `"${f.path}"`, f.size,
          new Date(f.modified).toISOString(),
          f.selected ? 'Yes' : 'No',
        ].join(','));
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dupeclear-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportTXT = () => {
    const lines = ['DupeClear Duplicate Report', '='.repeat(60), `Generated: ${new Date().toLocaleString()}`, ''];
    groups.forEach((g, gi) => {
      lines.push(`Group ${gi + 1} [${g.matchType.toUpperCase()}${g.similarity ? ` ${g.similarity}%` : ''}] — ${formatBytes(g.size)} each — ${formatBytes(g.wastedSpace)} wasted`);
      g.files.forEach(f => lines.push(`  ${f.selected ? '[MARK] ' : ''}${f.path}`));
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dupeclear-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-24">
        <div className="w-20 h-20 rounded-2xl bg-gray-800/60 flex items-center justify-center">
          <Copy size={36} className="text-gray-700" />
        </div>
        <div>
          <div className="text-white font-bold text-xl">No Results Yet</div>
          <div className="text-gray-500 text-sm mt-2">Run a scan to discover duplicate files.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 h-full">
      {/* Main panel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2.5 flex-shrink-0">
          {[
            { label: 'Groups', value: stats.duplicateGroups, fmt: (v: number) => v.toLocaleString(), color: 'from-violet-500/20 to-violet-600/5', text: 'text-violet-300', icon: <Copy size={14}/> },
            { label: 'Duplicates', value: stats.duplicateFiles, fmt: (v: number) => v.toLocaleString(), color: 'from-pink-500/20 to-pink-600/5', text: 'text-pink-300', icon: <BarChart2 size={14}/> },
            { label: 'Wasted Space', value: stats.wastedSpace, fmt: (v: number) => formatBytes(v), color: 'from-amber-500/20 to-amber-600/5', text: 'text-amber-300', icon: <AlertTriangle size={14}/> },
            { label: 'Selected', value: selectedCount, fmt: (v: number) => `${v} · ${formatBytes(selectedWaste)}`, color: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-300', icon: <CheckSquare size={14}/> },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl border border-white/5 px-3 py-2.5`}>
              <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${s.text}`}>{s.icon}{s.label}</div>
              <div className="text-white font-bold text-base">{s.fmt(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-[#0d1120] rounded-xl border border-white/[0.06] px-3 py-2.5 flex items-center gap-2 flex-wrap flex-shrink-0">
          <span className="text-gray-600 text-xs font-medium">Filter:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
          >All</button>
          {categoryBreakdown.map(([cat, data]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'text-white' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
              style={categoryFilter === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              {CATEGORY_ICONS[cat]} {cat}
              <span className="opacity-60">({data.count})</span>
            </button>
          ))}
          {(hasExact && hasSimilar) && (
            <>
              <div className="w-px h-4 bg-gray-800 mx-1" />
              {['all', 'exact', 'similar'].map(t => (
                <button
                  key={t}
                  onClick={() => setMatchTypeFilter(t as any)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize ${matchTypeFilter === t ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-36">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text" placeholder="Search files…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1120] border border-white/[0.06] rounded-lg pl-8 pr-7 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={`${sortField}-${sortDir}`}
            onChange={e => {
              const [f, d] = e.target.value.split('-');
              setSortField(f as SortField);
              setSortDir(d as SortDirection);
            }}
            className="bg-[#0d1120] border border-white/[0.06] rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="similarity-desc">Most similar</option>
            <option value="similarity-asc">Least similar</option>
          </select>

          {/* View mode */}
          <div className="flex bg-[#0d1120] border border-white/[0.06] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grouped')}
              className={`p-2 transition-colors ${viewMode === 'grouped' ? 'bg-violet-600/30 text-violet-300' : 'text-gray-600 hover:text-gray-300'}`}
              title="List view"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('thumbnail')}
              className={`p-2 transition-colors ${viewMode === 'thumbnail' ? 'bg-violet-600/30 text-violet-300' : 'text-gray-600 hover:text-gray-300'}`}
              title="Thumbnail view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* Expand/collapse */}
          {viewMode === 'grouped' && (
            <button
              onClick={expandAll ? handleCollapseAll : handleExpandAll}
              className="p-2 rounded-lg bg-[#0d1120] border border-white/[0.06] text-gray-600 hover:text-gray-300 transition-colors"
              title={expandAll ? 'Collapse all' : 'Expand all'}
            >
              {expandAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Export */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d1120] border border-white/[0.06] text-gray-400 text-xs hover:text-white hover:border-white/10 transition-colors">
              <Download size={13} />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-[#161b2e] border border-white/10 rounded-xl shadow-2xl py-1 w-32 hidden group-hover:block z-10">
              <button onClick={exportCSV} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Export CSV</button>
              <button onClick={exportTXT} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Export TXT</button>
            </div>
          </div>
        </div>

        {/* Groups list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No groups match your filter</div>
          ) : viewMode === 'grouped' ? (
            filteredGroups.map((group, i) => (
              <GroupRow
                key={group.id}
                group={group}
                expanded={expandedGroups.has(group.id)}
                onToggleExpand={() => toggleGroup(group.id)}
                onToggleFile={onToggleFile}
                onSelectAll={(keepFirst) => onSelectAllInGroup(group.id, keepFirst)}
                onDeselectAll={() => onDeselectAllInGroup(group.id)}
                onRemove={() => onRemoveGroup(group.id)}
                groupIndex={i}
              />
            ))
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group, i) => (
                <ThumbnailGroup
                  key={group.id}
                  group={group}
                  onToggleFile={onToggleFile}
                  groupIndex={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action bar */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[#0d1120] rounded-xl border border-violet-500/20 shadow-lg"
          >
            <div className="flex-1">
              <span className="text-violet-300 font-semibold text-sm">{selectedCount} files selected</span>
              <span className="text-gray-500 text-xs ml-2">({formatBytes(selectedWaste)} will be removed from list)</span>
            </div>
            <button
              onClick={onDeselectAll}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
            >
              Deselect All
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors"
              >
                <Trash2 size={13} />
                Remove from List
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xs">Are you sure?</span>
                <button
                  onClick={() => { onRemoveSelected(); setShowDeleteConfirm(false); }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                >
                  Yes, Remove
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Right sidebar: Selection Assistant */}
      <div className="w-60 flex-shrink-0">
        <SelectionAssistant
          onApplyRule={onApplyRule}
          onSelectAll={onSelectAllDuplicates}
          onDeselectAll={onDeselectAll}
        />
      </div>
    </div>
  );
}
