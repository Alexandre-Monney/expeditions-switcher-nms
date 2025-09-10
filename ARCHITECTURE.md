# 🏗️ Architecture du Projet NMS Expedition Manager

## 📋 Vue d'Ensemble

Cette documentation décrit l'architecture modulaire adoptée pour améliorer la maintenabilité, la testabilité et l'extensibilité du projet NMS Expedition Manager.

### 🎯 Objectifs de l'Architecture

- **Séparation des responsabilités** : Chaque module a un rôle bien défini
- **Testabilité** : Modules isolés et facilement mockables  
- **Maintenabilité** : Code organisé et structure claire
- **Extensibilité** : Ajout facile de nouvelles fonctionnalités
- **État centralisé** : Gestion d'état prévisible avec pattern observer

## 🗂️ Structure des Dossiers

```
src/
├── core/                    # Logique métier et contrôleurs
│   ├── __tests__/          # Tests des contrôleurs
│   ├── PlatformController.js    # Gestion des plateformes
│   └── ExpeditionController.js  # Gestion des expéditions
├── ui/                      # Interface utilisateur
│   ├── state/              # Gestion d'état
│   │   └── AppState.js     # État centralisé de l'application
│   ├── screens/            # Écrans de l'application
│   │   ├── ScreenManager.js     # Gestionnaire de navigation
│   │   ├── SetupScreen.js       # Écran de configuration
│   │   └── MainScreen.js        # Écran principal
│   ├── components/         # Composants réutilisables
│   │   └── MessageSystem.js     # Système de notifications
│   └── NMSApp.js          # Point d'entrée de l'application
├── services/               # Services backend (existants)
│   ├── configManager.js
│   ├── expeditionManager.js
│   ├── processMonitor.js
│   └── steamDetection.js
└── utils/                  # Utilitaires (prévu pour l'avenir)
```

## 🧩 Architecture en Couches

### 1. **Couche État (State Layer)**

#### `src/ui/state/AppState.js`
**Responsabilité** : Gestion centralisée de l'état de l'application

**Fonctionnalités** :
- État immutable avec pattern observer
- Gestion des abonnements (subscribe/unsubscribe)
- Méthodes de mise à jour d'état typées
- Système de messages intégré avec auto-cleanup
- Reset complet de l'état

**État géré** :
```javascript
{
  config: null,                    // Configuration utilisateur
  selectedPlatform: null,          // Plateforme sélectionnée  
  selectedSteamId: null,          // Steam ID sélectionné
  currentScreen: 'loading',       // Écran actuel
  currentState: null,             // État des expéditions
  availableExpeditions: [],       // Expéditions disponibles
  selectedExpeditionId: null,     // Expédition sélectionnée
  nmsRunning: false,              // Statut NMS
  messages: []                    // Messages de notification
}
```

### 2. **Couche Contrôleur (Controller Layer)**

#### `src/core/PlatformController.js`
**Responsabilité** : Logique de gestion des plateformes

**Fonctionnalités** :
- Chargement et sauvegarde de la configuration
- Détection des Steam IDs
- Validation des configurations
- Gestion du changement de plateforme

**APIs principales** :
```javascript
async loadConfig()                    // Charge la configuration
selectPlatform(platform)             // Sélectionne une plateforme
async detectSteamIds()               // Détecte les Steam IDs
canContinueSetup()                   // Validation du setup
async saveConfiguration()            // Sauvegarde la config
async changePlatform()               // Change de plateforme
```

#### `src/core/ExpeditionController.js`
**Responsabilité** : Logique de gestion des expéditions

**Fonctionnalités** :
- Gestion du cycle de vie des expéditions
- Monitoring du processus NMS
- Activation/désactivation des expéditions
- Gestion des sauvegardes

**APIs principales** :
```javascript
async refreshExpeditionState()       // Rafraîchit l'état
async loadAvailableExpeditions()     // Charge les expéditions
async activateExpedition(id)         // Active une expédition
async restoreOriginal()              // Restaure l'original
startNMSMonitoring()                 // Démarre le monitoring
stopNMSMonitoring()                  // Arrête le monitoring
```

### 3. **Couche Interface (UI Layer)**

#### `src/ui/screens/ScreenManager.js`
**Responsabilité** : Navigation et gestion des écrans

**Fonctionnalités** :
- Enregistrement des écrans
- Navigation centralisée  
- Gestion des transitions
- État de chargement

#### `src/ui/screens/SetupScreen.js`
**Responsabilité** : Interface de configuration initiale

**Fonctionnalités** :
- Sélection de plateforme avec UI
- Détection et sélection Steam ID
- Validation et continuation
- Gestion des événements UI

#### `src/ui/screens/MainScreen.js`  
**Responsabilité** : Interface principale de l'application

**Fonctionnalités** :
- Affichage des informations de plateforme
- Gestion des expéditions (sélection, activation, restauration)
- Monitoring en temps réel du statut NMS
- Mise à jour dynamique de l'interface

#### `src/ui/components/MessageSystem.js`
**Responsabilité** : Système de notifications utilisateur

**Fonctionnalités** :
- Affichage des messages typés (success, error, info, warning)
- Auto-dismiss avec timeout configurable
- Gestion manuelle des messages
- Interface utilisateur interactive

### 4. **Couche Service (Service Layer)**
**Responsabilité** : Logique métier backend (inchangée)

Services existants conservés :
- `configManager.js` : Gestion des fichiers de configuration
- `expeditionManager.js` : Opérations sur les fichiers d'expédition
- `processMonitor.js` : Surveillance des processus système
- `steamDetection.js` : Détection des installations Steam

## 🔄 Flux de Données

### Pattern Observer avec AppState

1. **Contrôleur** met à jour l'état via `appState.setState()`
2. **AppState** notifie tous les abonnés du changement  
3. **Écrans** reçoivent les mises à jour et actualisent l'UI
4. **Utilisateur** interagit avec l'UI
5. **Écran** appelle les méthodes du contrôleur approprié

```
[User Action] → [Screen] → [Controller] → [Service] 
                   ↑              ↓
                [UI Update] ← [AppState] ← [setState()]
```

### Exemple : Activation d'Expédition

1. Utilisateur clique "Activer Expédition" dans `MainScreen`
2. `MainScreen` appelle `expeditionController.activateExpedition(id)`
3. `ExpeditionController` vérifie l'état NMS et appelle `electronAPI.activateExpedition()`
4. `ExpeditionController` met à jour l'état via `appState.addMessage()` et `appState.updateExpeditionState()`
5. `MainScreen` reçoit les mises à jour d'état et actualise l'UI

## 🧪 Stratégie de Tests

### Coverage Actuelle : **195 tests** 

**Tests par couche** :
- **State Layer** : 20 tests (AppState.test.js)
- **Controller Layer** : 45 tests (PlatformController + ExpeditionController)  
- **Service Layer** : 77 tests (services existants)
- **UI Layer** : 53 tests (renderer.test.js)

**Types de tests** :
- **Tests unitaires** : Chaque module testé isolément
- **Tests d'intégration** : Interactions entre modules
- **Tests UI** : Comportements de l'interface utilisateur
- **Tests de régression** : Conservation des fonctionnalités existantes

**Mocking Strategy** :
- `electronAPI` mockée dans tous les tests de contrôleurs
- `AppState` isolé avec listeners mockés
- Services backend mockés pour les tests UI

## 🚀 Points d'Extension

### Ajout d'un Nouveau Contrôleur

1. Créer `src/core/NewController.js`
2. Ajouter les tests `src/core/__tests__/NewController.test.js`
3. Instancier dans `src/ui/NMSApp.js`
4. Ajouter les nouveaux champs d'état dans `AppState.js`

### Ajout d'un Nouvel Écran

1. Créer `src/ui/screens/NewScreen.js`
2. Implémenter les méthodes `show()`, `hide()`, `handleStateChange()`
3. Enregistrer dans `ScreenManager` via `NMSApp.js`
4. Ajouter les routes dans la logique de navigation

### Ajout de Composants

1. Créer dans `src/ui/components/NewComponent.js`
2. Suivre le pattern d'abonnement à l'AppState
3. Ajouter les tests correspondants
4. Intégrer dans les écrans nécessaires

## 🔧 Configuration & Build

### Scripts Disponibles
```bash
npm test           # Lance tous les tests (195 tests)
npm run test:watch # Mode watch pour le développement  
npm run test:coverage # Rapport de couverture
npm start          # Lance l'application en développement
```

### Fichiers de Configuration
- `jest.config.js` : Configuration des tests
- `jest.setup.js` : Setup global des tests
- `package.json` : Dépendances et scripts

## 📚 Bonnes Pratiques

### Développement
1. **Un seul contrôleur par écran** : Évite la complexité
2. **État immutable** : Toujours utiliser `setState()` 
3. **Tests d'abord** : Écrire les tests avant les fonctionnalités
4. **Responsabilité unique** : Un module = une responsabilité
5. **Nommage explicite** : Code auto-documenté

### Architecture  
1. **Couches respectées** : Ne pas bypass les couches
2. **Dépendances claires** : UI → Controller → Service
3. **État centralisé** : Toute donnée partagée dans AppState
4. **Communication asynchrone** : Tous les appels service en async/await

### Tests
1. **Tests isolés** : Chaque test indépendant
2. **Mocking approprié** : Mock des dépendances externes
3. **Cas limites** : Tester les erreurs et edge cases  
4. **Lisibilité** : Tests comme documentation

## 🎯 Avantages de l'Architecture

**Maintenabilité** :
- Code organisé en modules logiques
- Responsabilités clairement séparées
- Structure prévisible et cohérente

**Testabilité** :
- Modules isolés facilement mockables
- Coverage de 100% sur la logique critique
- Tests de régression complets

**Extensibilité** :
- Ajout facile de nouvelles fonctionnalités
- Pattern répétable pour nouveaux modules
- Architecture scalable

**Robustesse** :
- Gestion d'état centralisée et prévisible
- Gestion d'erreurs systématique
- Isolation des pannes

Cette architecture prépare le projet pour une croissance future tout en maintenant la qualité et la fiabilité du code existant.