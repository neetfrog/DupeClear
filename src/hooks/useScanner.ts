import { useState, useRef, useCallback } from 'react';
import {
  ScannedFile, DuplicateGroup, ScanStatus, ScanStats, ScanOptions, SelectionRule,
} from '../types';
import {
  hashFile, generateId, getFileCategory, matchesOptions, DEFAULT_SCAN_OPTIONS,
  computeImagePerceptualHash, computeImagePerceptualHashWithRotations,
  perceptualSimilarity, computeAudioFingerprint, getMediaDuration,
  getImageDimensions, generateThumbnail, similarFileName, levenshtein,
  IMAGE_EXTENSIONS, AUDIO_EXTENSIONS, VIDEO_EXTENSIONS,
} from '../utils/fileUtils';

const initialStats: ScanStats = {
  totalFiles: 0, scannedFiles: 0, duplicateGroups: 0, duplicateFiles: 0,
  wastedSpace: 0, currentFile: '', progress: 0, phase: 'Idle', elapsedMs: 0,
};

export function useScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [stats, setStats] = useState<ScanStats>(initialStats);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [allFiles, setAllFiles] = useState<ScannedFile[]>([]);
  const [scanOptions, setScanOptions] = useState<ScanOptions>(DEFAULT_SCAN_OPTIONS);
  const abortRef = useRef(false);
  const fileHandles = useRef<Map<string, File>>(new Map());
  const startTimeRef = useRef<number>(0);

  // ─── File collection ─────────────────────────────────────────────────────

  const collectFiles = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string,
    collected: ScannedFile[],
    onUpdate: (n: number, current: string) => void,
    options: ScanOptions,
  ) => {
    for await (const [name, handle] of (dirHandle as any).entries()) {
      if (abortRef.current) break;
      if (handle.kind === 'directory') {
        // Skip hidden/system dirs
        if (options.skipHiddenFiles && name.startsWith('.')) continue;
        if (options.skipSystemFiles && ['System Volume Information', '$RECYCLE.BIN', 'WindowsApps', 'node_modules'].includes(name)) continue;
        await collectFiles(handle, `${path}/${name}`, collected, onUpdate, options);
      } else if (handle.kind === 'file') {
        try {
          const file: File = await handle.getFile();
          const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
          const scannedFile: ScannedFile = {
            id: generateId(),
            name,
            path: `${path}/${name}`,
            size: file.size,
            modified: file.lastModified,
            extension: ext,
            fileHandle: file,
            selected: false,
            category: getFileCategory(ext),
          };
          if (matchesOptions(scannedFile, options)) {
            fileHandles.current.set(scannedFile.id, file);
            collected.push(scannedFile);
            onUpdate(collected.length, name);
          }
        } catch { /* skip unreadable */ }
      }
    }
  }, []);

  // ─── Main scan orchestrator ──────────────────────────────────────────────

  const startScan = useCallback(async (
    dirHandles: FileSystemDirectoryHandle[],
    options: ScanOptions = scanOptions,
  ) => {
    abortRef.current = false;
    fileHandles.current.clear();
    startTimeRef.current = Date.now();
    setStatus('scanning');
    setStats({ ...initialStats, phase: 'Collecting files…' });
    setDuplicateGroups([]);
    setAllFiles([]);

    const collected: ScannedFile[] = [];
    const onUpdate = (n: number, current: string) => {
      setStats(prev => ({
        ...prev, totalFiles: n, scannedFiles: n, currentFile: current, progress: 5,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    };

    for (const dirHandle of dirHandles) {
      await collectFiles(dirHandle, dirHandle.name, collected, onUpdate, options);
      if (abortRef.current) break;
    }

    if (abortRef.current) { setStatus('idle'); return; }

    setAllFiles(collected);
    setStatus('hashing');

    const groups: DuplicateGroup[] = [];

    if (options.scanMode === 'regular') {
      await runRegularScan(collected, options, groups);
    } else if (options.scanMode === 'image') {
      await runImageScan(collected, options, groups);
    } else if (options.scanMode === 'audio') {
      await runAudioScan(collected, options, groups);
    } else if (options.scanMode === 'video') {
      await runVideoScan(collected, options, groups);
    }

    if (abortRef.current) { setStatus('idle'); return; }

    // Sort groups by wasted space
    groups.sort((a, b) => b.wastedSpace - a.wastedSpace);

    const totalWasted = groups.reduce((acc, g) => acc + g.wastedSpace, 0);
    const totalDupeFiles = groups.reduce((acc, g) => acc + g.files.length - 1, 0);

    setDuplicateGroups(groups);
    setStatus('complete');
    setStats({
      totalFiles: collected.length,
      scannedFiles: collected.length,
      duplicateGroups: groups.length,
      duplicateFiles: totalDupeFiles,
      wastedSpace: totalWasted,
      currentFile: '',
      progress: 100,
      phase: 'Complete',
      elapsedMs: Date.now() - startTimeRef.current,
    });
  }, [collectFiles, scanOptions]);

  // ─── Regular Mode (MD5 content + name + size + date) ────────────────────

  const runRegularScan = useCallback(async (
    collected: ScannedFile[], options: ScanOptions, groups: DuplicateGroup[],
  ) => {
    // Group by size first for efficiency
    const sizeMap = new Map<number, ScannedFile[]>();
    for (const f of collected) {
      const arr = sizeMap.get(f.size) ?? [];
      arr.push(f);
      sizeMap.set(f.size, arr);
    }
    const sizeMatched = [...sizeMap.values()].filter(g => g.length > 1).flat();

    if (options.matchByContent) {
      const hashMap = new Map<string, ScannedFile[]>();
      let hashed = 0;
      for (const f of sizeMatched) {
        if (abortRef.current) break;
        try {
          const file = fileHandles.current.get(f.id);
          if (!file) continue;
          const hash = await hashFile(file);
          f.hash = hash;
          const key = `${f.size}-${hash}`;
          const arr = hashMap.get(key) ?? [];
          arr.push(f);
          hashMap.set(key, arr);
        } catch { /* skip */ }
        hashed++;
        const progress = 10 + Math.round((hashed / sizeMatched.length) * 80);
        setStats(prev => ({
          ...prev, scannedFiles: hashed, totalFiles: sizeMatched.length,
          currentFile: f.name, progress, phase: 'Computing MD5 hashes…',
          elapsedMs: Date.now() - startTimeRef.current,
        }));
      }
      for (const [key, files] of hashMap.entries()) {
        if (files.length < 2) continue;
        const groupId = generateId();
        files.forEach(f => (f.groupId = groupId));
        groups.push({
          id: groupId, hash: key, files, size: files[0].size,
          wastedSpace: files[0].size * (files.length - 1),
          category: files[0].category, matchType: 'exact',
        });
      }
    }

    if (options.matchByName) {
      const nameMap = new Map<string, ScannedFile[]>();
      for (const f of collected) {
        const key = options.matchBySimilarName
          ? f.name.replace(/\.[^.]+$/, '').toLowerCase()
            .replace(/[-_\s]+copy\d*/g, '').replace(/\s*\(\d+\)\s*$/g, '').trim()
          : f.name.toLowerCase();
        const arr = nameMap.get(key) ?? [];
        arr.push(f);
        nameMap.set(key, arr);
      }
      for (const [key, files] of nameMap.entries()) {
        if (files.length < 2) continue;
        // Avoid duplicating groups already found by content
        if (files.every(f => f.groupId)) continue;
        const groupId = generateId();
        files.forEach(f => { if (!f.groupId) f.groupId = groupId; });
        groups.push({
          id: groupId, hash: `name:${key}`, files, size: Math.max(...files.map(f => f.size)),
          wastedSpace: files.slice(1).reduce((a, f) => a + f.size, 0),
          category: files[0].category, matchType: 'exact',
        });
      }
    }

    if (options.matchBySize && !options.matchByContent) {
      for (const [, files] of sizeMap.entries()) {
        if (files.length < 2) continue;
        if (files.every(f => f.groupId)) continue;
        const groupId = generateId();
        files.forEach(f => { if (!f.groupId) f.groupId = groupId; });
        groups.push({
          id: groupId, hash: `size:${files[0].size}`, files, size: files[0].size,
          wastedSpace: files[0].size * (files.length - 1),
          category: files[0].category, matchType: 'similar',
        });
      }
    }
  }, []);

  // ─── Image Mode (perceptual hash + metadata) ─────────────────────────────

  const runImageScan = useCallback(async (
    collected: ScannedFile[], options: ScanOptions, groups: DuplicateGroup[],
  ) => {
    const imageFiles = collected.filter(f => IMAGE_EXTENSIONS.includes(f.extension));
    const total = imageFiles.length;
    let done = 0;

    // First pass: get dimensions + compute perceptual hashes
    for (const f of imageFiles) {
      if (abortRef.current) break;
      const file = fileHandles.current.get(f.id);
      if (!file) continue;

      try {
        // Get dimensions
        const dims = await getImageDimensions(file);
        if (dims) {
          f.imageWidth = dims.width;
          f.imageHeight = dims.height;
          // Filter by minimum dimensions
          if (options.minImageWidth > 0 && dims.width < options.minImageWidth) { done++; continue; }
          if (options.minImageHeight > 0 && dims.height < options.minImageHeight) { done++; continue; }
        }

        // Compute perceptual hash
        if (options.matchRotatedImages) {
          const hashes = await computeImagePerceptualHashWithRotations(file);
          if (hashes.length > 0) f.perceptualHash = hashes[0];
        } else {
          f.perceptualHash = await computeImagePerceptualHash(file) ?? undefined;
        }

        // Generate thumbnail
        f.thumbnailUrl = await generateThumbnail(file, 140) ?? undefined;

        // Also compute exact MD5 for exact matching
        f.hash = await hashFile(file);
      } catch { /* skip */ }

      done++;
      setStats(prev => ({
        ...prev, scannedFiles: done, totalFiles: total,
        currentFile: f.name, progress: Math.round((done / total) * 90),
        phase: `Analyzing image ${done}/${total}…`,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    }

    if (abortRef.current) return;

    // Group exact duplicates by MD5
    const exactMap = new Map<string, ScannedFile[]>();
    for (const f of imageFiles) {
      if (!f.hash) continue;
      const arr = exactMap.get(f.hash) ?? [];
      arr.push(f);
      exactMap.set(f.hash, arr);
    }
    for (const [hash, files] of exactMap.entries()) {
      if (files.length < 2) continue;
      const groupId = generateId();
      files.forEach(f => (f.groupId = groupId));
      const thumb = files.find(f => f.thumbnailUrl)?.thumbnailUrl;
      groups.push({
        id: groupId, hash, files, size: files[0].size,
        wastedSpace: files[0].size * (files.length - 1),
        category: 'image', matchType: 'exact', similarity: 100, previewUrl: thumb,
      });
    }

    // Group similar images by perceptual hash clustering
    const threshold = options.imageSimilarityThreshold;
    const ungrouped = imageFiles.filter(f => !f.groupId && f.perceptualHash);
    const usedIds = new Set<string>();

    for (let i = 0; i < ungrouped.length; i++) {
      if (abortRef.current) break;
      const a = ungrouped[i];
      if (usedIds.has(a.id) || !a.perceptualHash) continue;

      const group: ScannedFile[] = [a];
      let minSim = 100;

      for (let j = i + 1; j < ungrouped.length; j++) {
        const b = ungrouped[j];
        if (usedIds.has(b.id) || !b.perceptualHash) continue;
        const sim = perceptualSimilarity(a.perceptualHash, b.perceptualHash);
        if (sim >= threshold) {
          group.push(b);
          b.similarity = sim;
          minSim = Math.min(minSim, sim);
        }
      }

      if (group.length >= 2) {
        const groupId = generateId();
        group.forEach(f => { f.groupId = groupId; usedIds.add(f.id); });
        usedIds.add(a.id);
        const thumb = group.find(f => f.thumbnailUrl)?.thumbnailUrl;
        const totalSize = group.reduce((acc, f) => acc + f.size, 0);
        const maxSize = Math.max(...group.map(f => f.size));
        groups.push({
          id: groupId, hash: `phash:${a.perceptualHash?.slice(0, 16)}`, files: group,
          size: maxSize, wastedSpace: totalSize - maxSize,
          category: 'image', matchType: 'similar', similarity: minSim, previewUrl: thumb,
        });
      }
    }
  }, []);

  // ─── Audio Mode (fingerprint + tags + duration) ──────────────────────────

  const runAudioScan = useCallback(async (
    collected: ScannedFile[], options: ScanOptions, groups: DuplicateGroup[],
  ) => {
    const audioFiles = collected.filter(f => AUDIO_EXTENSIONS.includes(f.extension));
    const total = audioFiles.length;
    let done = 0;

    for (const f of audioFiles) {
      if (abortRef.current) break;
      const file = fileHandles.current.get(f.id);
      if (!file) continue;
      try {
        // Get duration via HTMLAudioElement
        const dur = await getMediaDuration(file);
        if (dur !== null) f.audioDuration = dur;

        if (options.matchByAudioContent) {
          f.audioFingerprint = await computeAudioFingerprint(file);
        }
        // Full MD5 for exact match
        f.hash = await hashFile(file);
      } catch { /* skip */ }

      done++;
      setStats(prev => ({
        ...prev, scannedFiles: done, totalFiles: total,
        currentFile: f.name, progress: Math.round((done / total) * 85),
        phase: `Analyzing audio ${done}/${total}…`,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    }

    if (abortRef.current) return;

    // Exact MD5 matches
    const exactMap = new Map<string, ScannedFile[]>();
    for (const f of audioFiles) {
      if (!f.hash) continue;
      const arr = exactMap.get(f.hash) ?? [];
      arr.push(f);
      exactMap.set(f.hash, arr);
    }
    for (const [hash, files] of exactMap.entries()) {
      if (files.length < 2) continue;
      const groupId = generateId();
      files.forEach(f => (f.groupId = groupId));
      groups.push({
        id: groupId, hash, files, size: files[0].size,
        wastedSpace: files[0].size * (files.length - 1),
        category: 'audio', matchType: 'exact', similarity: 100,
      });
    }

    // Similar by audio fingerprint (first 100KB similarity)
    if (options.matchByAudioContent) {
      const ungrouped = audioFiles.filter(f => !f.groupId && f.audioFingerprint);
      const fingerprintMap = new Map<string, ScannedFile[]>();
      for (const f of ungrouped) {
        const arr = fingerprintMap.get(f.audioFingerprint!) ?? [];
        arr.push(f);
        fingerprintMap.set(f.audioFingerprint!, arr);
      }
      for (const [fp, files] of fingerprintMap.entries()) {
        if (files.length < 2) continue;
        const groupId = generateId();
        files.forEach(f => (f.groupId = groupId));
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const maxSize = Math.max(...files.map(f => f.size));
        groups.push({
          id: groupId, hash: `afp:${fp}`, files, size: maxSize,
          wastedSpace: totalSize - maxSize, category: 'audio', matchType: 'similar', similarity: 95,
        });
      }
    }

    // Match by duration
    if (options.matchByDuration) {
      const durMap = new Map<number, ScannedFile[]>();
      for (const f of audioFiles.filter(f => !f.groupId && f.audioDuration)) {
        const bucket = Math.round((f.audioDuration ?? 0) / options.durationTolerance);
        const arr = durMap.get(bucket) ?? [];
        arr.push(f);
        durMap.set(bucket, arr);
      }
      for (const [, files] of durMap.entries()) {
        if (files.length < 2) continue;
        const groupId = generateId();
        files.forEach(f => (f.groupId = groupId));
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const maxSize = Math.max(...files.map(f => f.size));
        groups.push({
          id: groupId, hash: `dur:${files[0].audioDuration?.toFixed(0)}`, files,
          size: maxSize, wastedSpace: totalSize - maxSize,
          category: 'audio', matchType: 'similar', similarity: 80,
        });
      }
    }
  }, []);

  // ─── Video Mode ──────────────────────────────────────────────────────────

  const runVideoScan = useCallback(async (
    collected: ScannedFile[], options: ScanOptions, groups: DuplicateGroup[],
  ) => {
    const videoFiles = collected.filter(f => VIDEO_EXTENSIONS.includes(f.extension));
    const total = videoFiles.length;
    let done = 0;

    for (const f of videoFiles) {
      if (abortRef.current) break;
      const file = fileHandles.current.get(f.id);
      if (!file) continue;
      try {
        f.hash = await hashFile(file);
        const dur = await getMediaDuration(file);
        if (dur !== null) f.videoDuration = dur;
      } catch { /* skip */ }

      done++;
      setStats(prev => ({
        ...prev, scannedFiles: done, totalFiles: total,
        currentFile: f.name, progress: Math.round((done / total) * 85),
        phase: `Analyzing video ${done}/${total}…`,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    }

    if (abortRef.current) return;

    // Exact matches by MD5
    const exactMap = new Map<string, ScannedFile[]>();
    for (const f of videoFiles) {
      if (!f.hash) continue;
      const arr = exactMap.get(f.hash) ?? [];
      arr.push(f);
      exactMap.set(f.hash, arr);
    }
    for (const [hash, files] of exactMap.entries()) {
      if (files.length < 2) continue;
      const groupId = generateId();
      files.forEach(f => (f.groupId = groupId));
      groups.push({
        id: groupId, hash, files, size: files[0].size,
        wastedSpace: files[0].size * (files.length - 1),
        category: 'video', matchType: 'exact', similarity: 100,
      });
    }

    // Match by duration (similar videos)
    if (options.matchByDuration) {
      const durMap = new Map<number, ScannedFile[]>();
      for (const f of videoFiles.filter(ff => !ff.groupId && ff.videoDuration)) {
        const bucket = Math.round((f.videoDuration ?? 0) / Math.max(1, options.durationTolerance));
        const arr = durMap.get(bucket) ?? [];
        arr.push(f);
        durMap.set(bucket, arr);
      }
      for (const [, files] of durMap.entries()) {
        if (files.length < 2) continue;
        const groupId = generateId();
        files.forEach(f => (f.groupId = groupId));
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const maxSize = Math.max(...files.map(f => f.size));
        groups.push({
          id: groupId, hash: `vdur:${files[0].videoDuration?.toFixed(0)}`, files,
          size: maxSize, wastedSpace: totalSize - maxSize,
          category: 'video', matchType: 'similar', similarity: 75,
        });
      }
    }
  }, []);

  // ─── Stop scan ───────────────────────────────────────────────────────────

  const stopScan = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setStats(prev => ({ ...prev, phase: 'Stopped', currentFile: '' }));
  }, []);

  // ─── Selection helpers ───────────────────────────────────────────────────

  const toggleFileSelected = useCallback((id: string) => {
    setDuplicateGroups(prev =>
      prev.map(g => ({
        ...g,
        files: g.files.map(f => f.id === id ? { ...f, selected: !f.selected } : f),
      }))
    );
  }, []);

  const selectAllInGroup = useCallback((groupId: string, keepFirst = true) => {
    setDuplicateGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          files: g.files.map((f, i) => ({
            ...f, selected: keepFirst ? i > 0 : true,
          })),
        };
      })
    );
  }, []);

  const deselectAllInGroup = useCallback((groupId: string) => {
    setDuplicateGroups(prev =>
      prev.map(g => g.id !== groupId ? g : { ...g, files: g.files.map(f => ({ ...f, selected: false })) })
    );
  }, []);

  const selectAllDuplicates = useCallback(() => {
    setDuplicateGroups(prev =>
      prev.map(g => ({ ...g, files: g.files.map((f, i) => ({ ...f, selected: i > 0 })) }))
    );
  }, []);

  const deselectAll = useCallback(() => {
    setDuplicateGroups(prev =>
      prev.map(g => ({ ...g, files: g.files.map(f => ({ ...f, selected: false })) }))
    );
  }, []);

  const applySelectionRule = useCallback((rule: SelectionRule) => {
    setDuplicateGroups(prev =>
      prev.map(g => {
        const sorted = [...g.files];
        if (rule.type === 'keep_oldest') sorted.sort((a, b) => a.modified - b.modified);
        else if (rule.type === 'keep_newest') sorted.sort((a, b) => b.modified - a.modified);
        else if (rule.type === 'keep_largest') sorted.sort((a, b) => b.size - a.size);
        else if (rule.type === 'keep_smallest') sorted.sort((a, b) => a.size - b.size);
        else if (rule.type === 'keep_shortest_path') sorted.sort((a, b) => a.path.length - b.path.length);
        else if (rule.type === 'keep_path' && rule.pathContains) {
          sorted.sort((a) => a.path.includes(rule.pathContains!) ? -1 : 1);
        }
        const keepId = sorted[0].id;
        return { ...g, files: g.files.map(f => ({ ...f, selected: f.id !== keepId })) };
      })
    );
  }, []);

  const getSelectedFiles = useCallback(() => {
    return duplicateGroups.flatMap(g => g.files.filter(f => f.selected));
  }, [duplicateGroups]);

  const removeSelected = useCallback(() => {
    setDuplicateGroups(prev => {
      const next = prev.map(g => ({
        ...g,
        files: g.files.filter(f => !f.selected),
      })).filter(g => g.files.length >= 2);
      return next;
    });
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setDuplicateGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  return {
    status, stats, duplicateGroups, allFiles, scanOptions, setScanOptions,
    startScan, stopScan,
    toggleFileSelected, selectAllInGroup, deselectAllInGroup,
    selectAllDuplicates, deselectAll, applySelectionRule,
    getSelectedFiles, removeSelected, removeGroup,
  };
}
