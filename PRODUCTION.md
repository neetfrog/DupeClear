# DupeClear - Production Build Guide

This document covers production setup and deployment of DupeClear as an Electron application.

## What Was Added for Production

### 1. **Electron Setup**
- Main process: `public/electron.ts` - Handles window creation and IPC
- Preload script: `public/preload.ts` - Secure context isolation
- Auto-updates configured for GitHub releases

### 2. **Build Configuration**
- **electron-builder** - Automated Windows installer and portable exe generation
- Builds to `release/` directory:
  - `DupeClear-1.0.0.exe` - NSIS installer (with uninstall, shortcuts)
  - `DupeClear-1.0.0-portable.exe` - Standalone portable version

### 3. **GitHub Actions Workflow**
- Automatic release builds on git tags (`v1.0.0`)
- Builds Windows installer and portable exe
- Auto-uploads to GitHub Releases section

## Development Setup

### Prerequisites
- Node.js 18+ (npm/yarn)
- Git

### Installation
```bash
npm install
```

### Development
Run with hot reload:
```bash
npm run dev
```

Run with Electron:
```bash
npm run dev:electron
```

## Building for Production

### Build Windows Installer + Portable
```bash
npm run build
```

This creates:
- `release/DupeClear-1.0.0.exe` (installer)
- `release/DupeClear-1.0.0-portable.exe` (portable)

### Build Installer Only
```bash
npm run build:win
```

### Build Portable Only
```bash
npm run build:portable
```

### Files Output Location
- Compiled app: `dist/`
- Electron files: `dist-electron/`
- Installers: `release/`

## Release to GitHub

### Manual Release

1. **Update version in package.json**
   ```json
   "version": "1.0.1"
   ```

2. **Create a git tag and push**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **GitHub Actions will:**
   - Build the application
   - Generate Windows installer and portable exe
   - Create a GitHub Release with files ready to download

### Automatic Release (After Setup)

1. Update version in `package.json`
2. Commit and tag: `git tag v1.0.X && git push --tags`
3. GitHub Actions automatically builds and uploads to Releases tab

## GitHub Setup Instructions

### Enable GitHub Actions (One-time setup)

1. **Go to GitHub repository settings:**
   - Settings → Actions → General
   - Ensure "Actions is enabled"

2. **Create a Personal Access Token** (if needed):
   - Settings → Developer settings → Personal access tokens
   - Generate token with `repo` scope
   - Add as repository secret: `GITHUB_TOKEN`

### Download Releases

Users can download from: `https://github.com/YOUR_USERNAME/DupeClear/releases`

Files available:
- `DupeClear-X.X.X.exe` - Installer (recommended for most users)
- `DupeClear-X.X.X-portable.exe` - Portable version

## Important Notes

### Application Icon
Currently using default Electron icon. To customize:
1. Place `icon.ico` (256x256) in `public/`
2. Update `electron.ts` line if path changes

### Auto-Update
Auto-update is disabled by default. To enable:
- Set `PUBLISH_RELEASE=true` in GitHub Actions
- Or modify `electron-builder` config to use your release server

### Code Signing (Windows)
For production, consider:
1. Code signing certificate (paid or free options)
2. Update `package.json` build.win.certificateFile
3. Set cert password in CI/CD secrets

## Troubleshooting

### Build fails with "icon.ico not found"
```bash
# Create a temporary icon (you should replace this)
echo "Default icon" > public/icon.ico
```

### Port 5173 already in use
```bash
npm run dev -- --port 5174
```

### GitHub Actions fails
- Check Actions logs: Your repo → Actions → Latest workflow
- Ensure Node.js 20 is available
- Verify `npm ci` and build scripts work locally

## Next Steps

1. ✅ Set up GitHub repository (if not already done)
2. ✅ Replace icon in `public/` with your custom icon
3. ✅ Update author info in `package.json`
4. ✅ Create first release with `git tag v1.0.0 && git push --tags`
5. ✅ Download from GitHub Releases to verify build works

## Package.json Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run dev:electron` | Dev server + Electron window |
| `npm run build:vite` | Build React app only |
| `npm run build:win` | Build installer & portable |
| `npm run build` | Full build (Vite + Electron) |
| `npm run electron` | Run Electron app |
| `npm run release` | Build + upload to GitHub |

---

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Status:** Production Ready
