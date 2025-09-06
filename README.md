# 🚀 NMS Expedition Manager

Une application Electron pour gérer facilement les expéditions passées de No Man's Sky en mode hors ligne.

## 📖 Concept

No Man's Sky propose des expéditions événementielles limitées dans le temps. Une fois terminées, ces expéditions ne sont plus accessibles via les serveurs officiels. Cependant, il est possible de les rejouer en mode hors ligne en manipulant les fichiers de configuration.

**Ce que fait l'application** :
- Automatise le processus de swap des fichiers d'expédition
- Évite les manipulations manuelles fastidieuses
- Sécurise les sauvegardes avec un système de backup automatique
- Propose une interface simple pour switcher entre expéditions

## 🎯 État Actuel (MVP Complet ✅)

### 🚀 Fonctionnalités Core Implémentées
- **Setup initial** avec sélection de plateforme (Steam, MS Store, GOG, Game Pass)
- **Détection automatique Steam ID** avec scan des dossiers utilisateur  
- **Configuration persistante** stockée dans `~/.nms-utils/config.json`
- **Interface utilisateur complète** moderne et responsive avec gestion d'expéditions
- **Changement de plateforme** via bouton dans l'interface principale *(entièrement testé)*
- **Gestion multi-écrans** (Loading, Setup, Main) avec navigation fluide
- **Tests complets** couvrant backend + frontend (117 tests avec 90%+ couverture)
- **Packaging production** avec electron-builder configuré pour toutes plateformes

### 🔧 Architecture Technique
- **Electron** avec sécurité renforcée (`contextIsolation`, `nodeIntegration: false`)
- **Structure modulaire** services backend séparés du frontend
- **Communication sécurisée** via `contextBridge` et IPC
- **Support multi-plateformes** Windows/Mac avec chemins appropriés

## ✅ Fonctionnalités Implémentées

### 🔍 **Système de détection de processus NMS**
- ✅ Détection multi-plateforme (Windows, macOS, Linux)
- ✅ Support multiples noms de processus (NMS.exe, NoMansSky.exe, No Man's Sky)
- ✅ Surveillance temps réel avec callbacks configurables
- ✅ Extraction informations processus (PID, mémoire, heure de démarrage)
- ✅ APIs IPC sécurisées pour communication main/renderer

### 🎮 **Interface utilisateur complète**
- ✅ Setup initial avec sélection de plateforme
- ✅ Logos officiels des plateformes de jeu intégrés
- ✅ Détection automatique des Steam IDs
- ✅ Interface responsive optimisée (1400×900) avec effets visuels
- ✅ Changement de plateforme post-configuration
- ✅ **Interface de gestion d'expéditions complète** avec sélection, prévisualisation, activation
- ✅ **Surveillance temps réel du statut NMS** avec désactivation boutons si jeu actif
- ✅ **Système de messages utilisateur** avec notifications success/error/info

### 📦 **Gestion d'expéditions complète**
- ✅ **Service ExpeditionManager** complet avec backup/restore automatique
- ✅ Métadonnées complètes de **18 expéditions** (2021-2025) avec descriptions, difficulté, récompenses
- ✅ **Fichiers JSON d'expéditions inclus** - Prêt à l'emploi !
- ✅ Images officielles des posters d'expéditions
- ✅ **Détection d'état intelligent** (online/expedition/error/no_cache)
- ✅ **Interface utilisateur intuitive** avec prévisualisation détaillée des expéditions
- ✅ **Système de backup automatique** avant chaque changement
- ✅ Structure organisée et documentée avec validation d'erreurs

### 🧪 **Framework de tests robuste**
- ✅ Jest configuré avec **117 tests** (unitaires + UI + expéditions)
- ✅ Tests UI avec jsdom pour le DOM complet
- ✅ **Couverture 90%+** backend + frontend + interface expéditions
- ✅ **64 nouveaux tests** pour interface de gestion d'expéditions
- ✅ Tests du changement de plateforme complets
- ✅ Mocking approprié des modules système
- ✅ Console.error supprimé pour un output propre
- ✅ Tests pour tous les cas d'erreur et edge cases

### 📦 **Packaging et Distribution**
- ✅ **electron-builder** configuré pour Windows, macOS, Linux
- ✅ **Scripts npm** pour build multi-plateformes (`npm run build:win`, etc.)
- ✅ **Configuration NSIS** avec options d'installation personnalisées  
- ✅ **Optimisation taille** avec compression maximum
- ✅ **Script de création d'icônes** automatisé avec placeholders
- ✅ **Documentation BUILD.md** complète pour la distribution
- ✅ **Build testé** - Génère des exécutables fonctionnels (~190MB)

## 🚧 Prochaines Étapes

### 🎯 **Phase Finale - Test & Distribution**
- [ ] **Test Windows** - Validation fonctionnelle sur PC Windows réel
- [ ] **Icônes finales** - Remplacer placeholders par design NMS professionnel  
- [ ] **Signature de code** - Certificat pour éviter warnings sécurité Windows
- [ ] **GitHub Release** - Packaging automatisé avec Actions CI/CD
- [ ] **Documentation utilisateur** - Guide d'installation et usage

### 🚀 **Améliorations Futures (Post-MVP)**
- [ ] **Auto-update** - Système de mise à jour automatique intégré
- [ ] **Historique des activations** - Log des changements avec dates/heures
- [ ] **Thème sombre/clair** - Options d'affichage utilisateur

### 🌐 **Expansion Communautaire**
- [ ] **Wiki intégré** - Guides et astuces par expédition
- [ ] **Support multi-langues** - Français, Anglais, autres

## 🔄 Méthode de Switch des Expéditions

### Principe Technique
L'application utilise une méthode de **swap sécurisé** des fichiers de cache NMS pour activer les expéditions hors ligne.

### Fichier Cible : `SEASON_DATA_CACHE.JSON`
- **Localisation** : `{cachePath}/SEASON_DATA_CACHE.JSON`
- **Rôle** : Contient les données de progression de l'expédition active
- **Format** : JSON avec structure complexe de sauvegarde NMS

### Workflow de Switch (3 étapes)

#### 1. **Backup Sécurisé**
```
SEASON_DATA_CACHE.JSON → SEASON_DATA_CACHE_original.JSON
```
- Sauvegarde automatique du fichier original
- Vérification d'intégrité avant backup
- Gestion des erreurs si le fichier est verrouillé (NMS en cours)

#### 2. **Activation Expédition**
```
src/data/expeditions/{expedition}.json → SEASON_DATA_CACHE.JSON
```
- Copie du fichier d'expédition choisi
- Remplacement du cache actuel
- Validation du format JSON avant activation

#### 3. **Restauration Online**
```
SEASON_DATA_CACHE_original.JSON → SEASON_DATA_CACHE.JSON
```
- Restauration du fichier original pour retour online
- Nettoyage automatique du backup
- Vérification de la cohérence des données

### Sécurités Implémentées
- **Détection processus NMS** : Empêche les modifications si le jeu tourne
- **Validation JSON** : Vérification de l'intégrité avant chaque opération
- **Backup automatique** : Aucune perte de données possible
- **Rollback d'urgence** : Restauration en cas d'erreur

### Bibliothèque d'Expéditions Intégrée
- **18 expéditions** prêtes à l'emploi (2021-2025)
- **Fichiers JSON** validés et testés
- **Métadonnées** : Noms, descriptions, dates, récompenses
- **Images** : Posters officiels de chaque expédition

## 🎮 Workflow Utilisateur Cible

### Premier Lancement
1. Sélection de la plateforme (Steam, MS Store, etc.)
2. Détection automatique Steam ID si applicable
3. Validation de la configuration et du cache path

### Utilisation Normale
1. **Mode Online Actuel** :
   - Liste déroulante des 18 expéditions disponibles
   - Bouton "Passer à cette expédition" (avec backup auto)
   - Message "Switch effectué, passer hors ligne pour jouer"
   - **Sécurité** : Vérification que NMS n'est pas en cours

2. **Mode Offline Expédition** :
   - Affichage de l'expédition active avec poster et métadonnées
   - Bouton "Revenir en mode online" (restauration backup)
   - **Sécurité** : Validation de l'intégrité avant restauration

3. **Changement d'Expédition** :
   - Switch direct entre expéditions (sans retour online)
   - Backup intelligent : garde l'original, remplace juste l'expédition active

## 🛠️ Installation & Développement

### Prérequis
- Node.js 16+
- No Man's Sky installé sur une des plateformes supportées

### Installation
```bash
git clone https://github.com/Alexandre-Monney/expeditions-switcher-nms.git
cd expeditions-switcher-nms
npm install
```

### Lancement
```bash
npm start
```

### Tests
```bash
npm test                # Lancer tous les tests (117 tests)
npm run test:watch      # Mode watch avec relance automatique
npm run test:coverage   # Avec rapport de couverture
```

### Développement
```bash
npm run test:watch      # Tests en mode watch pendant le développement
```

### Structure du Projet
```
src/
├── services/
│   ├── configManager.js         # Configuration utilisateur
│   ├── steamDetection.js        # Détection automatique Steam IDs
│   ├── processMonitor.js        # Surveillance processus NMS
│   │   └── __tests__/               # Tests services (36 tests)
├── __tests__/                   # Tests UI (15 tests)
└── jest.setup.js                # Configuration Jest globale
└── data/
    └── expeditions/
        ├── expeditions-metadata.json  # Métadonnées de 18 expéditions
        ├── 01_pioneers.json           # Fichiers JSON d'expéditions
        ├── 02_beachhead.json          # (18 fichiers inclus)
        └── ...                        # Prêt à l'emploi !
assets/images/
├── platform-logos/              # Steam, MS Store, GOG, Game Pass
└── expeditions/                 # 18 posters officiels d'expéditions
```

## 📦 Packaging & Distribution

### Installation d'Electron Builder

Pour créer des exécutables de production, nous utilisons `electron-builder` :

```bash
npm install --save-dev electron-builder
```

### Configuration Package.json

Ajoutez les scripts de build dans `package.json` :

```json
{
  "main": "main.js",
  "homepage": "./",
  "scripts": {
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "dist": "npm run build"
  },
  "build": {
    "appId": "com.alexandremonney.nms-expedition-manager",
    "productName": "NMS Expedition Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!**/.git/*",
      "!**/node_modules/.cache/*",
      "!**/{.nyc_output,coverage,__tests__,test,tests,spec,specs}/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ],
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
  }
}
```

### Création des Icônes

Créez les icônes dans le dossier `assets/` :
- **Windows** : `icon.ico` (256x256, format ICO)
- **macOS** : `icon.icns` (512x512, format ICNS)
- **Linux** : `icon.png` (512x512, format PNG)

### Build de Production

#### Windows (depuis n'importe quel OS)
```bash
npm run build:win
```
Génère :
- `dist/NMS Expedition Manager Setup 1.0.0.exe` - Installateur NSIS
- `dist/win-unpacked/` - Version portable

#### macOS (depuis macOS uniquement)
```bash
npm run build:mac
```
Génère :
- `dist/NMS Expedition Manager-1.0.0.dmg` - Image disque macOS

#### Linux (depuis Linux/macOS)
```bash
npm run build:linux
```
Génère :
- `dist/NMS Expedition Manager-1.0.0.AppImage` - Application portable Linux

#### Build Multi-Plateformes
```bash
npm run build
```

### Distribution

#### Pour Windows
1. **L'installateur NSIS** (`Setup.exe`) :
   - Installation complète dans `Program Files`
   - Raccourcis automatiques (Bureau + Menu Démarrer)
   - Désinstallateur intégré
   - Auto-update supporté

2. **Version portable** (`win-unpacked/`) :
   - Dossier à distribuer directement
   - Aucune installation requise
   - Idéal pour tests ou déploiements spécifiques

#### Signature et Certification (Optionnel)
Pour éviter les avertissements Windows Defender :
```bash
# Installer electron-builder avec signature
npm install --save-dev electron-builder

# Configuration avec certificat (dans build config)
"win": {
  "certificateFile": "path/to/certificate.p12",
  "certificatePassword": "password"
}
```

### Optimisation de Taille

Pour réduire la taille des exécutables :

```json
"build": {
  "compression": "maximum",
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Déploiement Automatique

GitHub Actions pour builds automatiques :

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '16'
    - run: npm install
    - run: npm test
    - run: npm run build
```

### Taille des Builds
- **Windows** : ~150-200 MB (installateur)
- **macOS** : ~150-200 MB (DMG)
- **Linux** : ~150-200 MB (AppImage)

*Les builds incluent le runtime Node.js et Chromium, d'où la taille importante mais garantissant la compatibilité.*

## 🔮 Idées Futures

### Fonctionnalités Communautaires
- **Partage d'expéditions** - Repository communautaire de fichiers JSON
- **Ratings & Reviews** - Système de notation des expéditions
- **Wiki intégré** - Guides et astuces par expédition

### Intégrations
- **Discord Rich Presence** - Afficher l'expédition en cours
- **Captures d'écran** - Galerie automatique des moments forts
- **Statistiques** - Temps de jeu par expédition, succès débloqués

### Outils Avancés
- **Éditeur de sauvegardes** - Modifications avancées des fichiers
- **Backup cloud** - Synchronisation configurations multi-appareils
- **Mode développeur** - Outils pour créer ses propres expéditions

### Expérience Utilisateur
- **Thèmes personnalisables** - Interface adaptable
- **Raccourcis clavier** - Actions rapides sans souris
- **Mode compact** - Interface réduite dans la barre système

## 🤝 Contribution

Projet en développement actif. Les contributions sont les bienvenues !

### Priorités de Développement
1. Finir le MVP (détection processus + swap fichiers)
2. Tests et stabilisation
3. Fonctionnalités avancées
4. Packaging et distribution

## 📄 Licence

MIT - Voir fichier LICENSE (à créer)