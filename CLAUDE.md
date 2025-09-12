# CLAUDE.md - Configuration & Décisions Techniques

## 📝 Configuration Sauvegardée

### Architecture du Projet
- **Framework**: Electron avec architecture processus principal/rendu sécurisée
- **Structure**: 
  ```
  src/
  ├── services/          # Services backend (Node.js)
  │   ├── configManager.js     # Gestion configuration utilisateur
  │   └── steamDetection.js    # Détection automatique Steam IDs
  ├── ui/               # Interface utilisateur (à venir)
  └── data/
      └── expeditions/  # Bibliothèque fichiers expéditions JSON
  assets/images/        # Logos plateformes (à remplir)
  ```

### Configuration Utilisateur
**Fichier**: `~/.nms-utils/config.json`
```json
{
  "platform": "steam|msstore|gog|gamepass",
  "steamId": "st_76561198123456789" // Si Steam uniquement, format st_ requis,
  "firstSetup": false,
  "cachePath": "/path/to/NMS/cache"
}
```

### Chemins des Fichiers NMS par Plateforme
- **Steam PC**: `%APPDATA%\HelloGames\NMS\st_{steam_id}\cache\` (format st_ + 17 chiffres) 
- **GamePass**: `%APPDATA%\HelloGames\NMS\DefaultUser\cache\` avec fallback vers `%APPDATA%\HelloGames\NMS\cache\`

**Fichier cible**: `SEASON_DATA_CACHE.JSON`

## 🎯 Décisions Techniques Importantes

### Sécurité Electron
- ✅ `nodeIntegration: false` - Pas d'accès Node.js direct dans le rendu
- ✅ `contextIsolation: true` - Isolation contexte obligatoire
- ✅ Communication via `contextBridge` et `ipcRenderer` uniquement
- ✅ Preload script pour exposer APIs sécurisées

### Gestion des Plateformes
**Décision**: Demander à l'utilisateur au lieu de détecter automatiquement
- Plus fiable que la détection automatique
- Évite les faux positifs
- Interface plus claire pour l'utilisateur
- Exception: Auto-détection Steam IDs dans les dossiers existants

### Détection Steam ID
**Logique**: Scan des dossiers `%APPDATA%\HelloGames\NMS\` pour trouver les IDs Steam (format `st_\d{17}`) avec fichier `SEASON_DATA_CACHE.JSON` présent.
- **Format requis**: `st_` + 17 chiffres (ex: `st_76561198123456789`)
- **Validation stricte**: Regex `/^st_\d{17}$/` pour éviter les faux positifs
- Si plusieurs IDs → proposer la liste
- Si un seul → sélection automatique  
- Fallback sur le plus récemment modifié

### Chemins Résilients Xbox Game Pass
**Logique**: Système de fallback intelligent pour gérer les variations de structure
- **Vérification 1**: `%APPDATA%\HelloGames\NMS\DefaultUser\cache\`
- **Vérification 2**: `%APPDATA%\HelloGames\NMS\cache\` si DefaultUser absent
- **Fallback**: DefaultUser si aucun des deux n'existe (sera créé par le jeu)
- **Plateformes concernées**: Xbox Game Pass

### Workflow de Swap des Fichiers
1. **Backup**: `SEASON_DATA_CACHE.JSON` → `SEASON_DATA_CACHE_original.JSON`
2. **Activation**: Copier fichier expédition → `SEASON_DATA_CACHE.JSON`  
3. **Restauration**: Inverser le processus

## 🔧 APIs Electron Exposées

```javascript
window.electronAPI = {
  // Configuration
  loadConfig: () => Promise<Config>,
  saveConfig: (config) => Promise<boolean>,
  
  // Steam detection
  detectSteamIds: () => Promise<SteamData[]>,
  getMainSteamId: () => Promise<SteamData>,
  
  // Process monitoring
  isNMSRunning: () => Promise<boolean>,
  getNMSProcessInfo: () => Promise<ProcessInfo>,
  startNMSMonitoring: (interval) => Promise<boolean>,
  stopNMSMonitoring: () => Promise<boolean>,
  
  // Process monitoring events
  onNMSStatusChange: (callback) => void,
  removeNMSStatusListener: () => void
}
```

## 🎨 Interface Utilisateur

### Écrans
1. **Loading** → **Setup** (premier lancement) → **Main**
2. **Main** ← **Setup** (via bouton "Changer plateforme")

### États UI
- **Setup**: Sélection plateforme + détection Steam ID si nécessaire
- **Main**: Interface principale avec info plateforme + bouton changement

### Fonctionnalité de changement de plateforme
- **Bouton "Changer plateforme"** dans l'écran principal
- **Retour au setup** pour nouvelle sélection
- **Sauvegarde automatique** de la nouvelle configuration
- **Gestion Steam ID** (reset pour non-Steam, conservation pour Steam)
- **Mise à jour UI** temps réel avec nouvelles informations plateforme

## 🚀 Commandes de Développement

```bash
# Lancement
npm start

# Tests
npm test                # Lancer tous les tests (53 tests)
npm run test:watch      # Mode watch avec relance automatique
npm run test:coverage   # Avec rapport de couverture

# Build (à configurer)
npm run build
```

## 📊 État des Tests

### Couverture actuelle
- **ConfigManager**: 21 tests (11 base + 6 platform change + 4 resilient paths) ✅
- **SteamDetection**: 7 tests (format st_ validé) ✅  
- **ProcessMonitor**: 16 tests ✅
- **UI Tests (Renderer)**: 50 tests ✅
- **ExpeditionManager**: 23 tests ✅
- **Steam Integration**: 6 tests ✅
- **Total**: 134 tests, tous passés ✅

### Frameworks utilisés
- **Jest** pour les tests unitaires
- **jsdom** pour les tests UI/DOM
- **Mocking** des modules fs, path, os, child_process
- **Coverage** intégré et configuré
- **Console.error supprimé** pour un output propre

### Tests de changement de plateforme
- **Backend**: 6 tests couvrant la logique de ConfigManager
- **Frontend**: 15 tests couvrant l'interface utilisateur
- **Cas couverts**: Switching platforms, Steam ID handling, UI states, error cases

### Tests de chemins résilients (Nouveauté)
- **Plateformes concernées**: Xbox Game Pass
- **Scénarios testés**: DefaultUser exists, direct cache exists, neither exists
- **Validation**: Fallback logic complet avec _dirExists helper
- **Couverture**: 4 nouveaux tests pour chaque plateforme non-Steam

## 📋 Variables d'Environnement
Aucune pour le moment - Configuration stockée localement.

## 🎨 Interface & UX

### Assets
- **Icône application**: `assets/icons/app-icon.png` (1024x1024 PNG)
- **Configuration Windows**: Application Windows uniquement
- **Logos plateformes**: Steam, Xbox Game Pass

### Expérience Utilisateur
- **Interface épurée**: Suppression des emojis décoratifs des titres principaux
- **Titres simplifiés**: 
  - "NMS Expedition Manager" (sans 🚀)
  - "État Actuel" (sans 📊) 
  - "Gestion des Expéditions" (sans 🌌)
- **Icônes contextuelles**: Emojis fonctionnels conservés (🔄, ⚙️, ⚠️)
- **Status block amélioré**: Icône d'expédition centrée et agrandie au lieu de l'emoji fusée

### Gestion des Plateformes - UI
- **Sélection visuelle**: Logos des plateformes avec feedback hover/selected
- **Fix Steam**: Correction visibilité logo Steam (filter: brightness/contrast)
- **Responsive**: Interface adaptative selon la plateforme sélectionnée

## 🔒 Sécurité & Bonnes Pratiques
- Pas de secrets dans le code
- Configuration utilisateur en local uniquement
- Validation des chemins de fichiers
- Gestion d'erreurs robuste pour les opérations fichiers
- **Code clean**: Suppression de tous les commentaires pour un code auto-documenté

## 📝 Conventions de Développement

### Qualité du Code
- **Nommage explicite**: Variables et méthodes auto-documentées
- **Pas de commentaires**: Code suffisamment clair sans paraphrase
- **Architecture modulaire**: Services séparés et responsabilités claires

### Git & Commits
- **Conventional Commits** obligatoire pour tous les commits
- Format : `type(scope): description`
- Types : `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`
- Exemples :
  - `feat(expedition): add expedition selection interface`
  - `fix(ui): correct Steam logo visibility when selected`
  - `refactor: remove all comments from codebase for cleaner code`
  - `docs: update README with packaging instructions`
- Commits atomiques : une fonctionnalité/fix par commit
- Messages descriptifs en anglais avec détails dans le body si nécessaire

### Pull Requests
- **Descriptions concises** avec structure standardisée :
  - **Problème** : Quelle problématique on résout
  - **Solution** : Approche choisie pour la résoudre
  - **Test** : Comment tester/valider (si pertinent)
- Éviter les descriptions trop détaillées ou verbeuses
- Focus sur le "pourquoi" plutôt que le "comment"

## 🚨 Règles Git Importantes

### Commits
- **JAMAIS de commit direct sur main** - toujours passer par des branches
- Utiliser des branches pour toute modification : `fix/`, `feat/`, etc.
- Merger uniquement via Pull Requests

## 📝 Notes Techniques

### Métadonnées Windows (à investiguer plus tard)
- **Problème** : `publisherName` et `verInfo` non supportés dans electron-builder v26
- **Alternatives potentielles** :
  - `legalTrademarks` : pour informations légales 
  - `releaseInfo` : pour métadonnées de release
  - Downgrade electron-builder vers version qui supporte ces propriétés
  - Configuration dans `nsis` section au lieu de `win`
- **Status** : Ignoré pour v1.0.x, fonctionnel sans ces métadonnées