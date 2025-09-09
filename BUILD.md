# 🚀 Guide de Build et Distribution

Ce guide explique comment créer des exécutables de production pour NMS Expedition Manager.

**⚠️ Note importante**: Cette application est conçue uniquement pour Windows. Le support macOS/Linux a été supprimé.

## ⚡ Build Rapide

### Windows
```bash
npm run build:win
```
Génère : `dist/NMS Expedition Manager Setup 1.0.0.exe`

## 🎯 Test Rapide (Version non-packagée)

Pour tester plus rapidement sans créer l'installateur :

```bash
# Windows unpacked
npm run build:win -- --dir
```

Le build unpacked est dans `dist/win-unpacked/`

## 📦 Structure des Builds

### Windows
- **`Setup.exe`** : Installateur complet avec raccourcis
- **`win-unpacked/`** : Version portable (pas d'installation)

## 🚨 Troubleshooting

### Application Windows uniquement
- ✅ Conçue spécifiquement pour Windows
- ❌ Support macOS/Linux supprimé

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
- Hébergez les `.exe`
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

**🎉 C'est prêt !** Vous pouvez maintenant distribuer NMS Expedition Manager pour Windows !