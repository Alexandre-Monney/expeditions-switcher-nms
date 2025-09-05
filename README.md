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
- **Changement de plateforme** via bouton dans l'interface principale
- **Gestion multi-écrans** (Loading, Setup, Main)

### 🔧 Architecture Technique
- **Electron** avec sécurité renforcée (`contextIsolation`, `nodeIntegration: false`)
- **Structure modulaire** services backend séparés du frontend
- **Communication sécurisée** via `contextBridge` et IPC
- **Support multi-plateformes** Windows/Mac avec chemins appropriés

## 🚧 Fonctionnalités À Développer

### Phase 1 - Fonctionnalités Core
- [ ] **Détection processus NMS** - Vérifier si le jeu est en cours d'exécution
- [ ] **Détection état fichiers** - Identifier si on est en mode online/offline
- [ ] **Système de swap fichiers** - Logique de remplacement sécurisé avec backups
- [ ] **Bibliothèque expéditions** - Gestion des fichiers JSON d'expéditions
- [ ] **Interface principale** - Select d'expéditions + boutons d'action

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

### Lancement
```bash
npm install
npm start
```

### Structure du Projet
```
src/
├── services/
│   ├── configManager.js      # Configuration utilisateur
│   ├── steamDetection.js     # Détection Steam IDs
│   ├── processMonitor.js     # Détection processus NMS (à venir)
│   ├── fileManager.js        # Gestion fichiers + swapping (à venir)
│   └── expeditionLibrary.js  # Bibliothèque expéditions (à venir)
├── ui/                       # Composants interface (à venir)
└── data/
    └── expeditions/          # Fichiers JSON expéditions
assets/images/                # Logos plateformes (à remplir)
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