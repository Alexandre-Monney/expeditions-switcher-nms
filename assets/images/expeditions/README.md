# 🖼️ Expedition Images Directory

Ce dossier contient les images/posters des expéditions de No Man's Sky.

## 📋 Structure des Images

### Nommage
Les fichiers images doivent suivre la convention : `expedition_name.jpg` ou `expedition_name.png`

**Exemples** :
- `01_pioneers.jpg` - Image de l'expédition Pioneers
- `02_beachhead.png` - Image de l'expédition Beachhead  
- `03_cartographers.jpg` - Image de l'expédition Cartographers
- etc.

### Formats Supportés
- **JPEG** (.jpg, .jpeg) - Recommandé pour les photos
- **PNG** (.png) - Recommandé pour les images avec transparence
- **WebP** (.webp) - Format moderne, plus léger

### Taille Recommandée
- **Largeur** : 400-800px
- **Ratio** : 16:9 ou 4:3
- **Poids** : < 500KB par image

## 🎯 Sources Suggérées

### Officielles
- Site officiel No Man's Sky (nomanssky.com)
- Comptes sociaux Hello Games
- Steam Store pages des expéditions
- Screenshots in-game des bannières

### Fan-made
- Wiki No Man's Sky (nomanssky.fandom.com)
- Communauté Reddit r/NoMansSkyTheGame
- Screenshots communautaires

## 🔧 Intégration

Une fois ajoutées, les images seront automatiquement :
- ✅ **Détectées** par l'application
- ✅ **Affichées** dans l'interface utilisateur
- ✅ **Liées** aux métadonnées des expéditions

## 📝 Template Métadonnées

```json
{
  "01_pioneers": {
    "imageUrl": "assets/images/expeditions/01_pioneers.jpg",
    "displayName": "The Pioneers",
    "description": "...",
    "rewards": ["..."]
  }
}
```