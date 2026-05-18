# DupeClear - Quick Start Guide

## For Users (Installing the App)

### Windows Users
1. Go to [Releases](../../releases)
2. Download the latest **DupeClear-X.X.X.exe** (installer)
   - Or download **DupeClear-X.X.X-portable.exe** (portable)
3. Run the file
4. Follow the installation wizard

**No installation required for portable version - just run the EXE!**

---

## For Developers (Building the App)

### First Time Setup
```bash
# Clone repository
git clone <your-repo>
cd DuplicateClear

# Install dependencies
npm install
```

### Development
```bash
# Start dev server (React hot reload)
npm run dev

# Run with Electron window
npm run dev:electron

# Open DevTools by pressing F12 in Electron window
```

### Building for Distribution
```bash
# Build both installer and portable exe
npm run build

# Just installer
npm run build:win

# Just portable
npm run build:portable
```

Built files go to `release/` folder.

### Creating a Release
```bash
# 1. Update version in package.json
# "version": "1.0.1"

# 2. Create and push tag
git add package.json
git commit -m "Release 1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1

# 3. GitHub Actions automatically builds and uploads!
# Check: https://github.com/YOUR_USERNAME/DuplicateClear/releases
```

---

## File Structure
```
DuplicateClear/
├── src/                    # React app
│   ├── components/        # UI components
│   ├── hooks/            # React hooks
│   ├── utils/            # Helper functions
│   └── main.tsx          # React entry
├── public/
│   ├── electron.ts       # Electron main process
│   ├── preload.ts        # Secure IPC bridge
│   └── icon.ico          # App icon (add your own!)
├── dist/                 # Built React app (after build)
├── dist-electron/        # Built Electron files (after build)
├── release/              # Windows installers (after build)
├── package.json          # Dependencies & scripts
├── vite.config.ts        # Build config
├── PRODUCTION.md         # Detailed production guide
└── QUICKSTART.md         # This file
```

---

## Troubleshooting

### "npm install" fails
```bash
# Try clearing cache
npm cache clean --force
npm install
```

### "Port 5173 already in use"
```bash
# Use different port
npm run dev -- --port 5174
```

### Build fails with "icon.ico not found"
```bash
# Create a placeholder (replace with real icon later)
echo. > public\icon.ico
```

### Electron window doesn't load
- Press F12 to see error messages
- Check console tab
- Try `npm run dev:electron` to see logs

---

## Next Steps

1. ✅ Replace app icon: Drop 256x256 PNG/ICO in `public/icon.ico`
2. ✅ Update metadata in `package.json`:
   - `"author"` - Your name
   - `"description"` - What the app does
3. ✅ Update repository URL in this guide
4. ✅ Create first release with `git tag v1.0.0 && git push --tags`

---

## Key Commands
| Command | What it does |
|---------|-------------|
| `npm run dev` | React dev server (http://localhost:5173) |
| `npm run dev:electron` | Dev server + Electron app |
| `npm run build` | Build installers for Windows |
| `npm run electron` | Run Electron with built app |

---

**Need help?** Check [PRODUCTION.md](PRODUCTION.md) for detailed documentation.
