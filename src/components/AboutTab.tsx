import { Cpu, Image, Music, Film, HardDrive, Zap, Shield, ExternalLink } from 'lucide-react';

export default function AboutTab() {
  const features = [
    { icon: HardDrive, label: 'Regular Scan', desc: 'MD5 content hashing with size pre-filter for speed. Also matches by filename, similar names, size, and modified date.' },
    { icon: Image, label: 'Image Mode', desc: 'Perceptual hashing (dHash 8×8) to find visually similar images even after resizing, re-encoding, or editing. Rotation-aware.' },
    { icon: Music, label: 'Audio Mode', desc: 'Fingerprints first 100KB of audio to detect re-encoded duplicates. Also matches by duration with configurable tolerance.' },
    { icon: Film, label: 'Video Mode', desc: 'Exact video matching via MD5 and duration-based similarity grouping for near-duplicate video detection.' },
    { icon: Zap, label: 'Selection Assistant', desc: 'Auto-mark files with rules: keep oldest, newest, largest, smallest, shortest path, or by specific folder.' },
    { icon: Shield, label: 'Privacy First', desc: '100% local processing. No files, hashes, or metadata ever leave your machine.' },
  ];

  const tech = [
    { name: 'React 19', url: 'https://react.dev', desc: 'UI framework' },
    { name: 'Vite', url: 'https://vite.dev', desc: 'Build tool' },
    { name: 'Tailwind CSS v4', url: 'https://tailwindcss.com', desc: 'Styling' },
    { name: 'SparkMD5', url: 'https://github.com/satazor/js-spark-md5', desc: 'MD5 hashing' },
    { name: 'Framer Motion', url: 'https://www.framer.com/motion/', desc: 'Animations' },
    { name: 'Lucide React', url: 'https://lucide.dev', desc: 'Icons' },
    { name: 'File System Access API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API', desc: 'Browser filesystem' },
    { name: 'Canvas API (dHash)', url: 'https://en.wikipedia.org/wiki/Perceptual_hashing', desc: 'Image hashing' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent rounded-2xl border border-violet-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-900/40">
            <HardDrive size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DupeClear</h1>
            <div className="text-violet-300 text-sm mt-0.5">Open Source Duplicate File Finder</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge bg-violet-500/20 text-violet-300">v2.0.0</span>
              <span className="badge bg-emerald-500/20 text-emerald-300">MIT License</span>
              <span className="badge bg-blue-500/20 text-blue-300">Free Forever</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/neetfrog/DuplicateClear/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400 transition"
              >
                Download for Windows
              </a>
              <a
                href="https://github.com/neetfrog/DuplicateClear/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-violet-300 hover:text-violet-100 transition"
              >
                View releases ↗
              </a>
            </div>
          </div>
        </div>
        <p className="mt-4 text-gray-300 text-sm leading-relaxed">
          DupeClear is a powerful, fully open-source duplicate file finder inspired by Duplicate Cleaner Pro.
          It runs entirely in your browser using the File System Access API — no installation required,
          no data sent to servers. All scanning, hashing, and analysis happens locally on your machine.
        </p>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
          <Cpu size={16} className="text-violet-400" />
          Detection Algorithms
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex gap-3 px-4 py-3 bg-[#0d1120] rounded-xl border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-violet-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{f.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Algorithm details */}
      <div className="bg-[#0d1120] rounded-2xl border border-white/[0.06] p-5">
        <h2 className="text-white font-bold text-sm mb-3">How Image Similarity Works (dHash)</h2>
        <ol className="space-y-2 text-gray-400 text-xs leading-relaxed">
          <li className="flex gap-2"><span className="text-violet-400 font-bold">1.</span>Resize image to 9×8 pixels using HTML Canvas</li>
          <li className="flex gap-2"><span className="text-violet-400 font-bold">2.</span>Convert to grayscale using luminance formula (R×0.299 + G×0.587 + B×0.114)</li>
          <li className="flex gap-2"><span className="text-violet-400 font-bold">3.</span>For each row, compare adjacent pixel brightness — left brighter = 1, right brighter = 0</li>
          <li className="flex gap-2"><span className="text-violet-400 font-bold">4.</span>Produces a 64-bit binary fingerprint that survives resizing, compression, minor edits</li>
          <li className="flex gap-2"><span className="text-violet-400 font-bold">5.</span>Compare images by Hamming distance — threshold controls similarity tolerance</li>
        </ol>
      </div>

      {/* Browser requirements */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <div className="text-amber-300 text-sm font-semibold mb-1">Browser Requirements</div>
        <div className="text-amber-200/60 text-xs leading-relaxed">
          Requires <strong>Chrome 86+</strong> or <strong>Edge 86+</strong> for the File System Access API
          (<code>showDirectoryPicker</code>). Firefox does not support this API yet.
          For full Windows integration, consider wrapping with Electron.
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <h2 className="text-white font-bold text-base mb-3">Open Source Tech Stack</h2>
        <div className="grid grid-cols-2 gap-2">
          {tech.map(t => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#0d1120] rounded-xl border border-white/[0.06] hover:border-violet-500/30 transition-colors group"
            >
              <div>
                <div className="text-gray-200 text-sm font-medium group-hover:text-violet-300 transition-colors">{t.name}</div>
                <div className="text-gray-600 text-xs">{t.desc}</div>
              </div>
              <ExternalLink size={11} className="text-gray-700 group-hover:text-violet-400 transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-700 text-xs pt-2">
        DupeClear v2.0.0 · Open Source · MIT License · Made with ❤️ for the community
      </div>
    </div>
  );
}
