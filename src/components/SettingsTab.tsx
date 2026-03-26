import { useState } from 'react';
import { ScanOptions } from '../types';
import { formatBytes } from '../utils/fileUtils';
import {
  Settings2, RotateCcw, Cpu, Image, Music, Film, HardDrive,
  Filter, Shield, ChevronDown, ChevronUp, Save, Info,
} from 'lucide-react';

interface SettingsTabProps {
  options: ScanOptions;
  onChange: (o: ScanOptions) => void;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#0d1120] rounded-2xl border border-white/[0.06] overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-violet-400" />
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-white/[0.04] space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!value)}
        className={`relative mt-0.5 w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${value ? 'bg-violet-600' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : ''}`} />
      </div>
      <div>
        <div className="text-gray-200 text-sm">{label}</div>
        {desc && <div className="text-gray-600 text-xs mt-0.5">{desc}</div>}
      </div>
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max, unit, desc }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; unit?: string; desc?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-gray-200 text-sm">{label}</div>
        {desc && <div className="text-gray-600 text-xs">{desc}</div>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-violet-500 transition-colors"
        />
        {unit && <span className="text-gray-500 text-xs">{unit}</span>}
      </div>
    </div>
  );
}

function ExtensionList({ label, value, onChange, placeholder }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const parts = input.split(/[,\s]+/).map(s => s.replace(/^\./, '').trim().toLowerCase()).filter(Boolean);
    onChange([...new Set([...value, ...parts])]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="text-gray-200 text-sm">{label}</div>
      <div className="flex gap-2">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder ?? 'e.g. jpg, png'}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-violet-500"
        />
        <button onClick={add} className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs rounded-lg transition-colors">Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map(ext => (
          <span key={ext} className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-800 rounded-full text-gray-300 text-xs">
            .{ext}
            <button onClick={() => onChange(value.filter(e => e !== ext))} className="text-gray-600 hover:text-red-400 ml-0.5 transition-colors">×</button>
          </span>
        ))}
        {value.length === 0 && <span className="text-gray-700 text-xs italic">None set</span>}
      </div>
    </div>
  );
}

const PRESETS: { label: string; desc: string; overrides: Partial<ScanOptions> }[] = [
  {
    label: '📷 Find Similar Photos',
    desc: 'Image mode, 90% similarity, match rotated',
    overrides: { scanMode: 'image', imageSimilarityThreshold: 90, matchRotatedImages: true, minFileSize: 10240 },
  },
  {
    label: '🎵 Duplicate Music',
    desc: 'Audio mode with fingerprinting & duration matching',
    overrides: { scanMode: 'audio', matchByAudioContent: true, matchByDuration: true, durationTolerance: 2 },
  },
  {
    label: '🎬 Duplicate Videos',
    desc: 'Video mode with duration matching',
    overrides: { scanMode: 'video', matchByDuration: true, durationTolerance: 5 },
  },
  {
    label: '📁 Exact File Duplicates',
    desc: 'Regular mode, MD5 content hash only',
    overrides: { scanMode: 'regular', matchByContent: true, matchByName: false, matchBySize: false },
  },
  {
    label: '📋 Copy/Renamed Files',
    desc: 'Match by similar filename (copy patterns)',
    overrides: { scanMode: 'regular', matchByName: true, matchBySimilarName: true, matchByContent: false },
  },
];

export default function SettingsTab({ options, onChange }: SettingsTabProps) {
  const update = (partial: Partial<ScanOptions>) => onChange({ ...options, ...partial });

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Scan Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">Fine-tune how DupeClear finds and matches duplicate files.</p>
      </div>

      {/* Quick Presets */}
      <div className="bg-[#0d1120] rounded-2xl border border-white/[0.06] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-violet-400" />
          <span className="text-white text-sm font-semibold">Quick Presets</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => update(preset.overrides)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-violet-500/10 border border-white/[0.04] hover:border-violet-500/30 text-left transition-all group"
            >
              <div className="flex-1">
                <div className="text-gray-200 text-sm font-medium">{preset.label}</div>
                <div className="text-gray-600 text-xs">{preset.desc}</div>
              </div>
              <ChevronDown size={12} className="text-gray-700 group-hover:text-violet-400 rotate-[-90deg] transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Image settings */}
      <Section title="Image Scan Options" icon={Image}>
        <NumberInput
          label="Similarity Threshold"
          value={options.imageSimilarityThreshold}
          onChange={v => update({ imageSimilarityThreshold: Math.max(50, Math.min(100, v)) })}
          min={50} max={100} unit="%"
          desc="Minimum similarity % to consider images as duplicates (100 = exact only)"
        />
        <Toggle
          label="Match Rotated Images"
          desc="Detect images that have been rotated 90°, 180° or 270°"
          value={options.matchRotatedImages}
          onChange={v => update({ matchRotatedImages: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Min Width" value={options.minImageWidth} onChange={v => update({ minImageWidth: v })} min={0} unit="px" />
          <NumberInput label="Min Height" value={options.minImageHeight} onChange={v => update({ minImageHeight: v })} min={0} unit="px" />
        </div>
      </Section>

      {/* Audio settings */}
      <Section title="Audio Scan Options" icon={Music}>
        <Toggle
          label="Match by Audio Fingerprint"
          desc="Compare first 100KB of audio data to find re-encoded duplicates"
          value={options.matchByAudioContent}
          onChange={v => update({ matchByAudioContent: v })}
        />
        <Toggle
          label="Match by Duration"
          desc="Group audio files with the same or very similar duration"
          value={options.matchByDuration}
          onChange={v => update({ matchByDuration: v })}
        />
        <NumberInput
          label="Duration Tolerance"
          value={options.durationTolerance}
          onChange={v => update({ durationTolerance: v })}
          min={0} max={60} unit="sec"
          desc="Allow this many seconds of duration difference"
        />
      </Section>

      {/* General match options */}
      <Section title="Regular Mode Options" icon={HardDrive}>
        <Toggle label="Match by MD5 Content" desc="Hash file contents to find exact byte-for-byte duplicates" value={options.matchByContent} onChange={v => update({ matchByContent: v })} />
        <Toggle label="Match by Filename" desc="Find files with identical names" value={options.matchByName} onChange={v => update({ matchByName: v })} />
        <Toggle label="Match Similar Names" desc="Find files with copy-style names like 'photo (1).jpg' or 'photo - copy.jpg'" value={options.matchBySimilarName} onChange={v => update({ matchBySimilarName: v })} />
        <Toggle label="Match by Size Only" desc="Find files with the same file size (fast, but many false positives)" value={options.matchBySize} onChange={v => update({ matchBySize: v })} />
        <Toggle label="Match by Modified Date" desc="Consider files with the same modification date as duplicates" value={options.matchByModifiedDate} onChange={v => update({ matchByModifiedDate: v })} />
        {options.matchByModifiedDate && (
          <NumberInput label="Date Tolerance" value={options.dateTolerance} onChange={v => update({ dateTolerance: v })} min={0} unit="sec" desc="Allow this many seconds of date difference" />
        )}
        <Toggle label="Ignore Duplicates Within Same Folder" desc="Don't report duplicates that are in the same directory" value={options.ignoreWithinSameFolder} onChange={v => update({ ignoreWithinSameFolder: v })} />
      </Section>

      {/* File filters */}
      <Section title="File Filters" icon={Filter}>
        <div className="space-y-1">
          <div className="text-gray-200 text-sm">Minimum File Size</div>
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={10240} step={1}
              value={Math.round(options.minFileSize / 1024)}
              onChange={e => update({ minFileSize: Number(e.target.value) * 1024 })}
              className="flex-1 accent-violet-500"
            />
            <span className="text-gray-400 text-sm w-20 text-right">{formatBytes(options.minFileSize)}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-200 text-sm">Maximum File Size</div>
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={10 * 1024} step={1}
              value={options.maxFileSize > 0 ? Math.round(options.maxFileSize / (1024 * 1024)) : 0}
              onChange={e => update({ maxFileSize: Number(e.target.value) * 1024 * 1024 })}
              className="flex-1 accent-violet-500"
            />
            <span className="text-gray-400 text-sm w-20 text-right">
              {options.maxFileSize > 0 ? formatBytes(options.maxFileSize) : 'No limit'}
            </span>
          </div>
        </div>
        <ExtensionList
          label="Include Only These Extensions"
          value={options.includeExtensions}
          onChange={v => update({ includeExtensions: v })}
          placeholder="e.g. jpg, png (leave empty = all)"
        />
        <ExtensionList
          label="Exclude These Extensions"
          value={options.excludeExtensions}
          onChange={v => update({ excludeExtensions: v })}
          placeholder="e.g. tmp, log"
        />
      </Section>

      {/* Safety */}
      <Section title="Safety Options" icon={Shield}>
        <Toggle label="Skip Hidden Files/Folders" desc="Skip files and folders starting with a dot (.)" value={options.skipHiddenFiles} onChange={v => update({ skipHiddenFiles: v })} />
        <Toggle label="Skip System Files/Folders" desc="Skip known system directories (System Volume Information, $RECYCLE.BIN, etc.)" value={options.skipSystemFiles} onChange={v => update({ skipSystemFiles: v })} />
      </Section>

      {/* Reset */}
      <button
        onClick={() => onChange({
          scanMode: 'regular', matchByContent: true, matchByName: false, matchBySimilarName: false,
          matchBySize: false, matchByModifiedDate: false, dateTolerance: 60, sizeTolerance: 0,
          imageSimilarityThreshold: 90, matchRotatedImages: true, minImageWidth: 0, minImageHeight: 0,
          matchByAudioTags: false, matchByAudioContent: true, audioSimilarityThreshold: 90,
          matchByDuration: false, durationTolerance: 2,
          minFileSize: 1, maxFileSize: 0, includeExtensions: [], excludeExtensions: ['tmp', 'temp', 'lnk', 'db', 'ini', 'log', 'cache'],
          skipHiddenFiles: true, skipSystemFiles: true, ignoreWithinSameFolder: false,
        })}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-600 transition-colors"
      >
        <RotateCcw size={13} />
        Reset to Defaults
      </button>
    </div>
  );
}
