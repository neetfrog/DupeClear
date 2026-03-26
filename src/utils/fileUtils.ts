import SparkMD5 from 'spark-md5';
import { FileCategory, ScannedFile, ScanOptions } from '../types';

// ─── Category detection ───────────────────────────────────────────────────────

export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase();
  const categories: Record<FileCategory, string[]> = {
    image: ['jpg','jpeg','jpe','png','gif','bmp','webp','svg','ico','tiff','tif','heic','heif','raw','cr2','nef','arw','crw','dng','orf','raf','rw2','psd','avif'],
    video: ['mp4','avi','mkv','mov','wmv','flv','webm','m4v','mpeg','mpg','3gp','3g2','ts','vob','mts','asf','f4v'],
    audio: ['mp3','wav','flac','aac','ogg','m4a','wma','opus','aiff','ape','alac'],
    document: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','rtf','odt','ods','odp','csv','md','json','xml','html','htm'],
    archive: ['zip','rar','7z','tar','gz','bz2','xz','iso','cab','dmg'],
    other: [],
  };
  for (const [category, exts] of Object.entries(categories)) {
    if (exts.includes(ext)) return category as FileCategory;
  }
  return 'other';
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Hashing ──────────────────────────────────────────────────────────────────

export async function hashFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    let offset = 0;

    function loadNext() {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    }

    reader.onload = (e) => {
      if (!e.target?.result) return;
      spark.append(e.target.result as ArrayBuffer);
      offset += chunkSize;
      if (offset < file.size) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };
    reader.onerror = () => reject(reader.error);
    loadNext();
  });
}

// ─── Perceptual Image Hashing (dHash 8x8 = 64-bit) ───────────────────────────

export async function computeImagePerceptualHash(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const SIZE = 9; // 9x8 to get 8 horizontal differences
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); URL.revokeObjectURL(url); return; }
        ctx.drawImage(img, 0, 0, SIZE, 8);
        const data = ctx.getImageData(0, 0, SIZE, 8).data;

        // Convert to grayscale and compute dHash
        let hash = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const idx1 = (row * SIZE + col) * 4;
            const idx2 = (row * SIZE + col + 1) * 4;
            const gray1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
            const gray2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;
            hash += gray1 < gray2 ? '1' : '0';
          }
        }
        URL.revokeObjectURL(url);
        resolve(hash);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ─── Hamming distance between two binary hash strings ────────────────────────

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export function perceptualSimilarity(a: string, b: string): number {
  const dist = hammingDistance(a, b);
  return Math.max(0, Math.round((1 - dist / 64) * 100));
}

// ─── Perceptual Image Hash with rotation variants ────────────────────────────

export async function computeImagePerceptualHashWithRotations(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const SIZE = 9;
        const hashes: string[] = [];
        const rotations = [0, 90, 180, 270];

        for (const angle of rotations) {
          const canvas = document.createElement('canvas');
          const rad = angle === 0 ? 0 : (angle * Math.PI) / 180;
          if (angle === 90 || angle === 270) {
            canvas.width = 8;
            canvas.height = SIZE;
          } else {
            canvas.width = SIZE;
            canvas.height = 8;
          }
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rad);
          ctx.drawImage(img, -SIZE / 2, -4, SIZE, 8);

          // Flatten back to 9x8
          const flat = document.createElement('canvas');
          flat.width = SIZE;
          flat.height = 8;
          const fctx = flat.getContext('2d');
          if (!fctx) continue;
          fctx.drawImage(canvas, 0, 0, SIZE, 8);
          const data = fctx.getImageData(0, 0, SIZE, 8).data;
          let hash = '';
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              const idx1 = (row * SIZE + col) * 4;
              const idx2 = (row * SIZE + col + 1) * 4;
              const gray1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
              const gray2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;
              hash += gray1 < gray2 ? '1' : '0';
            }
          }
          hashes.push(hash);
        }
        URL.revokeObjectURL(url);
        resolve(hashes);
      } catch {
        URL.revokeObjectURL(url);
        resolve([]);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    img.src = url;
  });
}

// ─── Get image dimensions ────────────────────────────────────────────────────

export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ─── Generate thumbnail ───────────────────────────────────────────────────────

export async function generateThumbnail(file: File, size = 120): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ratio = img.naturalWidth / img.naturalHeight;
        canvas.width = ratio >= 1 ? size : Math.round(size * ratio);
        canvas.height = ratio >= 1 ? Math.round(size / ratio) : size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ─── Audio fingerprint (lightweight: hash first 100KB of audio data) ─────────

export async function computeAudioFingerprint(file: File): Promise<string> {
  // Use a partial hash of first 100KB + file duration estimated from size/bitrate
  const SAMPLE_SIZE = Math.min(100 * 1024, file.size);
  const slice = file.slice(0, SAMPLE_SIZE);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return reject('no result');
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(e.target.result as ArrayBuffer);
      resolve(spark.end());
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(slice);
  });
}

// ─── Get audio/video metadata via HTML5 Media element ────────────────────────

export async function getMediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement('audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(el.duration || null); };
    el.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    el.src = url;
  });
}

// ─── Similarity helpers ───────────────────────────────────────────────────────

export function similarFileName(a: string, b: string): boolean {
  // Normalize: lowercase, remove copy/number suffixes like "(1)", "_copy", " - Copy"
  const normalize = (s: string) => s
    .replace(/\.[^.]+$/, '') // remove ext
    .toLowerCase()
    .replace(/[-_\s]+copy\d*/g, '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .replace(/\s*-\s*\d+$/g, '')
    .trim();
  return normalize(a) === normalize(b);
}

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── Matching ────────────────────────────────────────────────────────────────

export function matchesOptions(file: ScannedFile, options: ScanOptions): boolean {
  if (file.size < options.minFileSize) return false;
  if (options.maxFileSize > 0 && file.size > options.maxFileSize) return false;
  if (options.skipHiddenFiles && file.name.startsWith('.')) return false;

  const ext = file.extension.toLowerCase();
  if (options.includeExtensions.length > 0) {
    if (!options.includeExtensions.map(e => e.toLowerCase()).includes(ext)) return false;
  }
  if (options.excludeExtensions.length > 0) {
    if (options.excludeExtensions.map(e => e.toLowerCase()).includes(ext)) return false;
  }
  return true;
}

// ─── ID generator ────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  scanMode: 'regular',
  matchByContent: true,
  matchByName: false,
  matchBySimilarName: false,
  matchBySize: false,
  matchByModifiedDate: false,
  dateTolerance: 60,
  sizeTolerance: 0,
  imageSimilarityThreshold: 90,
  matchRotatedImages: true,
  minImageWidth: 0,
  minImageHeight: 0,
  matchByAudioTags: false,
  matchByAudioContent: true,
  audioSimilarityThreshold: 90,
  matchByDuration: false,
  durationTolerance: 2,
  minFileSize: 1,
  maxFileSize: 0,
  includeExtensions: [],
  excludeExtensions: ['tmp', 'temp', 'lnk', 'db', 'ini', 'log', 'cache'],
  skipHiddenFiles: true,
  skipSystemFiles: true,
  ignoreWithinSameFolder: false,
};

// ─── Category colors & icons ──────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<FileCategory, string> = {
  image: '#a78bfa',
  video: '#f472b6',
  audio: '#34d399',
  document: '#60a5fa',
  archive: '#fb923c',
  other: '#94a3b8',
};

export const CATEGORY_ICONS: Record<FileCategory, string> = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  document: '📄',
  archive: '🗜️',
  other: '📁',
};

export const IMAGE_EXTENSIONS = ['jpg','jpeg','jpe','png','gif','bmp','webp','tiff','tif','heic','heif','avif'];
export const AUDIO_EXTENSIONS = ['mp3','wav','flac','aac','ogg','m4a','wma','opus','aiff','ape'];
export const VIDEO_EXTENSIONS = ['mp4','avi','mkv','mov','wmv','flv','webm','m4v','mpeg','mpg','3gp','vob'];
