# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-06 - Interface Core Complète

### ✨ Ajouté - Interface de Gestion d'Expéditions
- Interface complète de gestion d'expéditions avec sélection, prévisualisation et activation
- Surveillance temps réel du statut NMS avec désactivation des boutons pendant que le jeu tourne
- Système de messages utilisateur avec notifications success/error/info
- Détection d'état intelligent (online/expedition/error/no_cache) 
- Prévisualisation détaillée des expéditions avec métadonnées, récompenses et difficulté
- Gestion complète des états UI avec sections dynamiques selon le mode actuel

### ✨ Ajouté - Packaging et Distribution
- Configuration complète d'electron-builder pour Windows, macOS et Linux
- Scripts npm pour build multi-plateformes (`npm run build:win`, `build:mac`, `build:linux`)
- Configuration NSIS avec options d'installation personnalisées pour Windows
- Script automatisé de création d'icônes avec placeholders SVG/PNG
- Documentation BUILD.md complète pour la distribution
- Build testé générant des exécutables fonctionnels (~190MB)

### ✨ Ajouté - Tests Complets
- 64 nouveaux tests pour l'interface de gestion d'expéditions
- Couverture de tests portée à 117 tests avec plus de 90% de couverture
- Tests pour tous les composants UI : états, sélection, activation, messages
- Tests d'edge cases et gestion d'erreurs robustes
- Validation complète des interactions utilisateur et des API calls

### 🐛 Corrigé - Détection Processus macOS  
- Correction du faux positif de détection NMS sur macOS
- Remplacement de `ps aux | grep` par `pgrep -f` pour une détection plus précise
- Évite la détection des processus Electron de l'app elle-même
- Mise à jour des tests correspondants pour le nouveau comportement

### 🎨 Amélioré - Interface Utilisateur
- Optimisation de la taille de fenêtre (1400×900) pour une meilleure utilisation de l'espace
- Réduction des paddings et marges pour minimiser le scroll sur petits écrans
- Interface plus compacte sans perte de lisibilité
- Amélioration de l'expérience utilisateur sur différentes tailles d'écran

### 📚 Mis à jour - Documentation
- Mise à jour du README avec l'état complet du MVP
- Ajout de la section packaging et distribution
- Mise à jour du nombre de tests (117 au lieu de 53)
- Documentation des prochaines étapes et améliorations futures
- Ajout du guide BUILD.md pour la création d'exécutables

## [1.0.0] - État Initial MVP

### Ajouté - Fonctionnalités Core
- Système de détection de processus NMS multi-plateforme
- Interface utilisateur complète avec sélection de plateforme
- Détection automatique des Steam IDs
- Framework de tests complet avec Jest (53 tests)
- Bibliothèque complète de 18 expéditions avec métadonnées
- Images officielles des posters d'expéditions
- Logos des plateformes de jeu (Steam, MS Store, GOG, Game Pass)
- Documentation complète (README, CLAUDE.md)
- Configuration Electron sécurisée
- APIs IPC pour communication main/renderer
- Surveillance temps réel des processus
- Support multi-plateforme (Windows, macOS, Linux)

### Architecture
- Services backend modulaires et testés
- Interface responsive avec effets visuels
- Système de configuration persistante
- Structure extensible pour futures fonctionnalités

### Tests
- 53 tests unitaires avec Jest
- Couverture complète des services
- Mocking approprié des modules système
- Tests des cas d'erreur et edge cases

### Documentation  
- README complet avec instructions d'installation
- Documentation technique détaillée
- Guide de contribution et architecture
- Métadonnées complètes des expéditions

## [0.1.0] - Version initiale

### Ajouté
- Structure de base du projet Electron
- Configuration Git et npm
- Première interface utilisateur