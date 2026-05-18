# DuplicateClear 🔍

**Fast, Open-Source Duplicate File Finder** — Scan directories and remove duplicate files powered by cryptographic hashing.

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.1-green)
![Platform](https://img.shields.io/badge/platform-Windows-brightgreen)

## 📥 Download

### [⬇️ Get DuplicateClear for Windows](https://github.com/neetfrog/DuplicateClear/releases)

- **Portable** - No installation required, run directly
- **Installer** - Standard Windows setup

---

## ✨ Features

- 🔍 **Smart Duplicate Detection** - Uses MD5/SHA hashing for accurate detection
- 📊 **Real-time Statistics** - View scan progress and duplicate counts
- 🎯 **Flexible Selection** - Choose which duplicates to keep or delete
- ⚡ **Fast Scanning** - Optimized for performance
- 🎨 **Modern UI** - Beautiful React-based interface
- 💾 **Batch Operations** - Delete multiple files at once

## 🚀 Quick Start

### Windows Users
1. [Download from Releases](https://github.com/neetfrog/DuplicateClear/releases)
2. Run the portable EXE or installer
3. Select folder to scan
4. Review and delete duplicates

### Developers
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build:win

# Create release
npm version patch
git push --tags
```

## 📋 Usage

1. **Scan** - Select one or more folders to scan for duplicates
2. **Review** - Analyze results with detailed statistics
3. **Select** - Choose which duplicate files to keep/remove
4. **Delete** - Safely remove selected duplicates

## 🛠️ Development

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Desktop**: Electron 31
- **Build**: Vite + Tailwind CSS
- **Distribution**: electron-builder

### Scripts
```bash
npm run dev          # Dev server with hot reload
npm run dev:electron # Dev server + Electron window
npm run build:win    # Build installer + portable
npm run build        # Full build
```

## 📦 Architecture

```
src/
├── components/     # UI components
├── hooks/         # React hooks
├── utils/         # Helper functions
└── types.ts       # TypeScript types

public/
├── electron.ts    # Electron main process
└── preload.ts     # IPC bridge
```

## 🔐 Security

- Context isolation enabled
- No Node.js integration in renderer
- Secure IPC communication
- No remote code execution

## 📝 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup guide
- **[PRODUCTION.md](PRODUCTION.md)** - Production deployment guide
- **[RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md)** - Release process
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🤝 Contributing

This is an open-source project. Contributions welcome!

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- [GitHub Repository](https://github.com/neetfrog/DuplicateClear)
- [Releases & Downloads](https://github.com/neetfrog/DuplicateClear/releases)
- [Issues](https://github.com/neetfrog/DuplicateClear/issues)

---

**Made with ❤️ by neetfrog**
