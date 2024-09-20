# GLPI Connector to CSV Exporter

Ce projet est un script Node.js qui permet de se connecter à une instance GLPI, de récupérer des informations sur les ordinateurs selon des critères de recherche spécifiques, puis de les exporter dans un fichier CSV. Ce fichier CSV est universel et peut être utilisé par d'autres applications, telles que Zabbix.

## Fonctionnalités

- **Connexion à l'API GLPI** : Récupération des informations sur les ordinateurs via l'API GLPI.
- **Critères de recherche personnalisés** : Permet de filtrer les données à récupérer grâce à des variables d'environnement.
- **Résolution DNS** : Résout les noms d'hôtes en adresses IP à l'aide du DNS.
- **Détection du système d'exploitation** : Détecte si la machine exécute Windows ou Linux en fonction des ports ouverts.
- **Exportation CSV** : Exporte les données récupérées au format CSV avec les informations sur le nom d'hôte, l'adresse IP et le système d'exploitation.

## Prérequis

- Node.js (version 14 ou supérieure)
- Un compte GLPI avec un `user_token` et un `app_token` valides
- Fichier `.env` configuré (voir la section [Configuration](#configuration))
