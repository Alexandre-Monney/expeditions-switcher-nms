# 🚀 NMS Expedition Manager

Une application Electron pour gérer facilement les expéditions passées de No Man's Sky en mode hors ligne.

## 📖 Concept

No Man's Sky propose des expéditions événementielles limitées dans le temps. Une fois terminées, ces expéditions ne sont plus accessibles via les serveurs officiels. Cependant, il est possible de les rejouer en mode hors ligne en manipulant les fichiers de configuration.

**Ce que fait l'application** :
- Automatise le processus de swap des fichiers d'expédition
- Évite les manipulations manuelles fastidieuses
- Sécurise les sauvegardes avec un système de backup automatique
- Propose une interface simple pour switcher entre expéditions

## 🎯 État Actuel (MVP en cours)

### ✅ Fonctionnalités Implémentées
- **Setup initial** avec sélection de plateforme (Steam, MS Store, GOG, Game Pass)
- **Détection automatique Steam ID** avec scan des dossiers utilisateur
- **Configuration persistante** stockée dans `~/.nms-utils/config.json`
- **Interface utilisateur** moderne et responsive
- **Changement de plateforme** via bouton dans l'interface principale *(entièrement testé)*
- **Gestion multi-écrans** (Loading, Setup, Main)
- **Tests complets** couvrant backend + frontend (53 tests)

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
- ✅ Interface responsive avec effets visuels
- ✅ Changement de plateforme post-configuration

### 📦 **Bibliothèque d'expéditions**
- ✅ Métadonnées complètes de **18 expéditions** (2021-2025)
- ✅ **Fichiers JSON d'expéditions inclus** - Prêt à l'emploi !
- ✅ Images officielles des posters d'expéditions
- ✅ Structure organisée et documentée
- ✅ Validation et gestion d'erreurs

### 🧪 **Framework de tests robuste**
- ✅ Jest configuré avec **53 tests** (unitaires + UI)
- ✅ Tests UI avec jsdom pour le DOM
- ✅ Couverture complète backend + frontend
- ✅ Tests du changement de plateforme (21 nouveaux tests)
- ✅ Mocking approprié des modules système
- ✅ Console.error supprimé pour un output propre
- ✅ Tests pour tous les cas d'erreur et edge cases

## 🚧 Fonctionnalités À Développer

### Phase 2 - Fonctionnalités Core
- [ ] **Détection état fichiers** - Identifier si on est en mode online/offline
- [ ] **Système de swap fichiers** - Logique de remplacement sécurisé avec backups
- [ ] **Interface principale dynamique** - Select d'expéditions + boutons d'action

### Phase 2 - Améliorations UX  
- [ ] **Validation sécurité** - Vérifications avant manipulation fichiers
- [ ] **Messages d'état** - Feedback utilisateur pour chaque opération
- [ ] **Gestion d'erreurs** - Récupération automatique en cas de problème
- [ ] **Logs d'activité** - Historique des opérations effectuées

### Phase 3 - Fonctionnalités Avancées
- [ ] **Tracking progression** - Marquer les expéditions comme complétées
- [ ] **Métadonnées expéditions** - Descriptions, récompenses, difficultés
- [ ] **Import/Export** - Partage de configurations entre utilisateurs
- [ ] **Auto-update** - Mise à jour automatique de la bibliothèque d'expéditions

## 🎮 Workflow Utilisateur Cible

### Premier Lancement
1. Sélection de la plateforme (Steam, MS Store, etc.)
2. Détection automatique Steam ID si applicable
3. Validation de la configuration

### Utilisation Normale
1. **Mode Online Actuel** :
   - Liste déroulante des expéditions disponibles
   - Bouton "Passer à cette expédition"
   - Message "Switch effectué, passer hors ligne pour jouer"

2. **Mode Offline Expédition** :
   - Affichage de l'expédition active
   - Bouton "Revenir en mode online"
   - Restauration automatique de la configuration originale

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
npm test                # Lancer tous les tests (53 tests)
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