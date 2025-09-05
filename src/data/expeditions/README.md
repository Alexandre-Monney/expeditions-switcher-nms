# 📦 Expedition Files Directory

Ce dossier contient les fichiers JSON des expéditions de No Man's Sky pour le mode hors ligne.

## 📋 Structure des Fichiers

### Nommage
Les fichiers doivent suivre la convention : `nom_expedition.json`

**Exemples** :
- `pioneer.json` - Expédition Pioneer
- `emergence.json` - Expédition Emergence  
- `cartographers.json` - Expédition Cartographers
- `leviathan.json` - Expédition Leviathan
- `polestar.json` - Expédition Polestar
- `omega.json` - Expédition Omega

### Format
Chaque fichier JSON doit être une copie valide du fichier `SEASON_DATA_CACHE.JSON` modifié pour l'expédition correspondante.

## 🎯 Utilisation

Les fichiers de cette directory seront :
1. **Scannés automatiquement** par l'application au démarrage
2. **Listés dans le sélecteur** d'expéditions de l'interface
3. **Utilisés pour le swap** avec le fichier original de NMS

## 📝 Métadonnées (Optionnel)

Vous pouvez ajouter un fichier `expeditions-metadata.json` pour enrichir les informations :

```json
{
  "pioneer": {
    "displayName": "Pioneer",
    "description": "The first expedition of No Man's Sky",
    "difficulty": "Easy",
    "duration": "2 weeks",
    "rewards": ["Golden Vector ship", "Pioneer title"],
    "releaseDate": "2021-03-31"
  },
  "emergence": {
    "displayName": "Emergence", 
    "description": "Face the horrors of space",
    "difficulty": "Hard",
    "duration": "2 weeks", 
    "rewards": ["Living Frigate", "Bone modifications"],
    "releaseDate": "2021-05-19"
  }
}
```

## ⚠️ Important

- **Ne pas commiter** de vrais fichiers JSON d'expéditions dans le repo public
- Les fichiers JSON peuvent être volumineux (plusieurs MB)
- Vérifiez que vos fichiers JSON sont valides avant de les ajouter
- Testez toujours en mode hors ligne avant utilisation

## 🔍 Validation

L'application vérifiera automatiquement :
- ✅ Format JSON valide
- ✅ Structure de base conforme à NMS
- ✅ Taille de fichier raisonnable
- ⚠️ Absence de données corrompues