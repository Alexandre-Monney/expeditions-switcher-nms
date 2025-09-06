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
  "steamId": "76561198xxx" // Si Steam uniquement,
  "firstSetup": false,
  "cachePath": "/path/to/NMS/cache"
}
```

### Chemins des Fichiers NMS par Plateforme
- **Steam PC**: `%APPDATA%\HelloGames\NMS\{steam_id}\cache\`
- **Steam Mac**: `~/Library/Application Support/HelloGames/NMS/cache/`  
- **MS Store/GOG/GamePass**: `%APPDATA%\HelloGames\NMS\cache\`

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
**Logique**: Scan des dossiers `%APPDATA%\HelloGames\NMS\` pour trouver les IDs Steam (format `\d{17}`) avec fichier `SEASON_DATA_CACHE.JSON` présent.
- Si plusieurs IDs → proposer la liste
- Si un seul → sélection automatique
- Fallback sur le plus récemment modifié

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
- **ConfigManager**: 17 tests (11 + 6 platform change) ✅
- **SteamDetection**: 7 tests ✅  
- **ProcessMonitor**: 16 tests ✅
- **UI Tests (Renderer)**: 15 tests ✅
- **Total**: 53 tests, tous passés ✅

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

## 📋 Variables d'Environnement
Aucune pour le moment - Configuration stockée localement.

## 🔒 Sécurité & Bonnes Pratiques
- Pas de secrets dans le code
- Configuration utilisateur en local uniquement
- Validation des chemins de fichiers
- Gestion d'erreurs robuste pour les opérations fichiers

## 📝 Conventions de Développement

### Git & Commits
- **Conventional Commits** obligatoire pour tous les commits
- Format : `type(scope): description`
- Types : `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`
- Exemples :
  - `feat(expedition): add expedition selection interface`
  - `fix(processMonitor): correct macOS detection false positive`
  - `docs: update README with packaging instructions`
- Commits atomiques : une fonctionnalité/fix par commit
- Messages descriptifs en anglais avec détails dans le body si nécessaire