# 🚀 Guide de Build et Distribution

Ce guide explique comment créer des exécutables de production pour NMS Expedition Manager.

## ⚡ Build Rapide

### Windows
```bash
npm run build:win
```
Génère : `dist/NMS Expedition Manager Setup 1.0.0.exe`

### macOS
```bash
npm run build:mac
```
Génère : `dist/NMS Expedition Manager-1.0.0.dmg`

### Linux
```bash
npm run build:linux
```
Génère : `dist/NMS Expedition Manager-1.0.0.AppImage`

## 🎯 Test Rapide (Version non-packagée)

Pour tester plus rapidement sans créer l'installateur :

```bash
# Windows unpacked
npm run build:win -- --dir

# macOS unpacked  
npm run build:mac -- --dir

# Linux unpacked
npm run build:linux -- --dir
```

Les builds unpacked sont dans `dist/win-unpacked/`, `dist/mac/`, `dist/linux-unpacked/`

## 📦 Structure des Builds

### Windows
- **`Setup.exe`** : Installateur complet avec raccourcis
- **`win-unpacked/`** : Version portable (pas d'installation)

### macOS
- **`.dmg`** : Image disque macOS standard
- **`mac/`** : Application .app (drag & drop)

### Linux
- **`.AppImage`** : Application portable Linux
- **`linux-unpacked/`** : Dossier d'application

## 🎨 Icônes Personnalisées

### 1. Créer vos icônes
```bash
npm run create-icons
```

### 2. Remplacer les icônes
- Éditez `assets/icon.svg` avec votre design
- Créez `assets/icon.png` (512×512)
- Convertissez vers `assets/icon.ico` (Windows)
- Créez `assets/icon.icns` (macOS)

### 3. Activer les icônes
Décommentez les lignes `"icon"` dans `package.json` :

```json
"win": {
  "target": [...],
  "icon": "assets/icon.ico"
},
"mac": {
  "target": "dmg",
  "icon": "assets/icon.icns"
},
"linux": {
  "target": "AppImage", 
  "icon": "assets/icon.png"
}
```

## 🚨 Troubleshooting

### Build Windows depuis macOS/Linux
- ✅ Fonctionne nativement avec electron-builder
- ⚠️ Peut nécessiter Wine pour la signature

### Build macOS depuis Windows/Linux
- ❌ Impossible (limitations Apple)
- ✅ Utilisez GitHub Actions ou une VM macOS

### Erreurs communes

**"Application icon is not set"**
- Normal si aucune icône n'est configurée
- L'icône Electron par défaut sera utilisée

**"Code signing warnings"**
- Normal sans certificat de signature
- L'application fonctionnera mais aura un avertissement sécurité

**Taille importante (~150-200MB)**
- Normal : inclut Node.js + Chromium
- Garantit la compatibilité sur tous les systèmes

## 📋 Checklist de Release

- [ ] Tests passent : `npm test`
- [ ] Application fonctionne : `npm start`
- [ ] Icônes créées et configurées
- [ ] Version mise à jour dans `package.json`
- [ ] Build testé : `npm run build:win -- --dir`
- [ ] Build final : `npm run build:win`
- [ ] Installateur testé sur machine cible

## 🌐 Distribution

### GitHub Releases
1. Tag version : `git tag v1.0.0`
2. Push : `git push origin v1.0.0`
3. Upload builds sur GitHub Releases

### Site Web
- Hébergez les `.exe`, `.dmg`, `.AppImage`
- Fournissez checksums SHA256

### Auto-Update (Optionnel)
Ajoutez dans `package.json` :
```json
"build": {
  "publish": {
    "provider": "github"
  }
}
```

---

**🎉 C'est prêt !** Vous pouvez maintenant distribuer NMS Expedition Manager sur toutes les plateformes !