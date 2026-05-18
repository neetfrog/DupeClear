# Production Release Checklist

## ✅ Completed Setup
- [x] Electron main process configured
- [x] Electron preload script for IPC
- [x] Windows installer builder (NSIS)
- [x] Portable exe builder
- [x] GitHub Actions workflow for releases
- [x] Build commands tested and working
- [x] Development guide created

## 📋 Before First Release

- [ ] **Update package.json metadata**
  - [ ] Set `"author"` to your name/email
  - [ ] Verify `"description"` is accurate
  - [ ] Update version number if not `1.0.0`

- [ ] **Add App Icon** (recommended)
  - [ ] Create or find 256×256 PNG icon
  - [ ] Save as `public/icon.ico` (can use ICO format or PNG)
  - [ ] Rebuild with `npm run build:win` to test

- [ ] **Setup GitHub (if not done)**
  - [ ] Create GitHub repository
  - [ ] Push code: `git push -u origin main`
  - [ ] Verify `.github/workflows/release.yml` exists

- [ ] **Test Local Build**
  ```bash
  npm run build:win
  # Check release/ folder for .exe files
  # Test running: release\DupeClear-1.0.0-portable.exe
  ```

- [ ] **Create First Release**
  ```bash
  # Update version if needed
  npm version patch  # or minor/major
  
  # Create and push tag
  git tag v1.0.0
  git push origin v1.0.0
  
  # Wait for GitHub Actions to complete
  # Check: https://github.com/YOUR_USERNAME/DupeClear/releases
  ```

## 🚀 Release Process (Recurring)

### Every Release:
1. Update version: `npm version patch` (auto-commits and tags)
2. Push: `git push && git push --tags`
3. GitHub Actions builds automatically
4. Download built .exe from Releases tab

### Manual Build (without GitHub):
```bash
npm run build:win
# Files in: release/
```

## 📦 Distributable Files

After `npm run build:win`, you'll have:

| File | Purpose | Size* |
|------|---------|-------|
| `DupeClear Setup 1.0.0.exe` | Full installer with uninstaller | ~200MB |
| `DupeClear-1.0.0-portable.exe` | Portable (no installation) | ~190MB |

*Approximate sizes (varies with dependencies)

## 🔧 Troubleshooting

### Build fails: "missing main.js"
- ✅ Already fixed in configuration

### Build fails: "icon.ico not found"
- Create placeholder: `echo. > public\icon.ico`
- Or add real 256×256 icon as PNG

### GitHub Actions doesn't run
- Check repo settings → Actions → enabled
- Verify workflow file at: `.github/workflows/release.yml`
- Check Actions tab for error logs

### Need to skip signing warnings
- ✅ Already configured to skip (unsigned releases are fine)

## 📞 Getting Help

- **Electron docs:** https://www.electronjs.org/docs
- **electron-builder:** https://www.electron.build
- **GitHub Actions:** https://docs.github.com/actions

---

**Next Step:** Run `npm run build:win` and verify the .exe files in `release/` folder work!
