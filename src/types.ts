export interface ScannedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  modified: number;
  created?: number;
  extension: string;
  hash?: string;
  perceptualHash?: string; // for images
  audioFingerprint?: string; // for audio
  imageWidth?: number;
  imageHeight?: number;
  audioDuration?: number;
  audioBitrate?: number;
  audioArtist?: string;
  audioTitle?: string;
  audioAlbum?: string;
  videoWidth?: number;
  videoHeight?: number;
  videoDuration?: number;
  fileHandle?: File;
  groupId?: string;
  selected: boolean;
  category: FileCategory;
  similarity?: number; // 0-100 for fuzzy matches
  thumbnailUrl?: string; // object URL for preview
}

export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other';

export type ScanMode = 'regular' | 'image' | 'audio' | 'video';

export interface DuplicateGroup {
  id: string;
  hash: string;
  files: ScannedFile[];
  size: number;
  wastedSpace: number;
  category: FileCategory;
  matchType: 'exact' | 'similar';
  similarity?: number; // 0-100
  previewUrl?: string;
}

export type ScanStatus =
  | 'idle'
  | 'scanning'
  | 'hashing'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface ScanOptions {
  scanMode: ScanMode;
  // Regular mode
  matchByContent: boolean;
  matchByName: boolean;
  matchBySimilarName: boolean;
  matchBySize: boolean;
  matchByModifiedDate: boolean;
  dateTolerance: number; // seconds
  sizeTolerance: number; // bytes
  // Image mode
  imageSimilarityThreshold: number; // 0-100
  matchRotatedImages: boolean;
  minImageWidth: number;
  minImageHeight: number;
  // Audio mode
  matchByAudioTags: boolean;
  matchByAudioContent: boolean;
  audioSimilarityThreshold: number;
  matchByDuration: boolean;
  durationTolerance: number; // seconds
  // General filters
  minFileSize: number;
  maxFileSize: number;
  includeExtensions: string[];
  excludeExtensions: string[];
  skipHiddenFiles: boolean;
  skipSystemFiles: boolean;
  ignoreWithinSameFolder: boolean;
}

export interface ScanStats {
  totalFiles: number;
  scannedFiles: number;
  duplicateGroups: number;
  duplicateFiles: number;
  wastedSpace: number;
  currentFile: string;
  progress: number;
  phase: string;
  elapsedMs: number;
}

export type SortField = 'name' | 'size' | 'path' | 'modified' | 'group' | 'similarity';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grouped' | 'flat' | 'thumbnail';
export type ActiveTab = 'scan' | 'results' | 'folders' | 'settings' | 'about';
export type ResultsSubTab = 'all' | 'images' | 'audio' | 'video' | 'documents' | 'other';

export interface SelectionRule {
  type: 'keep_oldest' | 'keep_newest' | 'keep_largest' | 'keep_smallest' | 'keep_path' | 'keep_shortest_path';
  pathContains?: string;
}
