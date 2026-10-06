# 🏢 Citrine Management - Solution Globale de Gestion ERP & Ressources Humaines

Citrine Management est un progiciel de gestion intégré (ERP) et une plateforme d'administration des ressources humaines (SIRH), spécialement conçue pour structurer, sécuriser et optimiser le pilotage opérationnel des entreprises, des équipes, du matériel et des finances.

---

## 🚀 Vue d'Ensemble des Modules & Fonctionnalités

L'application propose une architecture modulaire activable à la demande, structurée autour de plusieurs pôles d'activités majeurs :

### 1. 👥 Gestion des Collaborateurs & Effectifs (SIRH)
* **Registre Unique du Personnel** : Fiches de profils exhaustives (identifiants, contacts, date d'embauche, poste, département, salaire de base, RIB).
* **Organigramme Interactif** : Génération visuelle dynamique de la structure hiérarchique de l'entreprise et des départements.
* **Gestion Disciplinaire** : Registre d'incidents (retards répétés, absences injustifiées, fautes) avec seuil de gravité, attribution de sanctions et historique.
* **Génération d'Avertissements PDF** : Édition automatique des lettres d'avertissement et sanctions prêtes à imprimer sous format officiel PDF.

### 2. ⏱️ Pointage, Présences & Assiduité (Contrôle d'Accès)
* **Pointage Intelligent Multi-canaux** : Enregistrement des 4 états clés de la journée (Arrivée, Début de Pause, Retour de Pause, Départ) avec heure exacte.
* **Géolocalisation & Anti-fraude** : Vérification de la position GPS lors des pointages et de la conformité du réseau Wi-Fi / IP de l'entreprise.
* **Mode Borne (Kiosk)** : Écran de pointage rapide d'équipe sécurisé par code PIN, avec scan de QR Codes uniques pour éviter les falsifications.
* **Analyse de l'Assiduité** : Calcul automatique des taux d'assiduité (présence) et de ponctualité (respect des horaires de seuil réglementaires).

### 3. 📋 Datatable de Validation des Demandes & Urgences
* **🚨 Urgences de Présence** : Signalement instantané des retards imprévus, prolongations de pause ou départs anticipés par les employés depuis leur mobile.
* **Tableau de Validation managérial** : Datatable dynamique permettant aux gestionnaires d'approuver ou de rejeter les demandes d'ajustements d'heures ou d'urgences.
* **Motifs Décisionnels Obligatoires** : Exigence stricte de saisie d'un motif ou commentaire par le gestionnaire pour valider ou rejeter toute demande (y compris pour re-valider une demande précédemment rejetée).

### 4. 💰 Module Finance, Trésorerie & Salaires
* **Grand Livre de Caisse** : Suivi rigoureux de la trésorerie en temps réel (encaissements, décaissements, ventilations catégorielles, justificatifs et reçus).
* **Gestion des Prêts & Acomptes** : Demandes d'avances sur salaire ou de prêts de secours formulées par les employés, validation managériale, et mise en place d'un échéancier de remboursement automatique prélevé sur les salaires futurs.
* **Édition des Bulletins de Paie** : Génération automatique des fiches de salaire mensuelles au franc près (XAF) prenant en compte :
  * Le salaire de base,
  * Les retenues automatiques pour absence injustifiée,
  * Les retenues automatiques des échéances de prêts en cours,
  * L'édition de primes, indemnités ou retenues manuelles exceptionnelles,
  * Le calcul des impôts et cotisations réglementaires.
* **Téléchargement PDF des Bulletins** : Génération instantanée et sécurisée de bulletins de paie professionnels prêts à la signature.

### 5. 📋 Gestion des Tâches & Jalons (Kanban)
* **Tableau Agile / Kanban** : Suivi de projets collaboratif divisé par états (À faire, En cours, En attente, Terminé).
* **Attribution des Tâches** : Assignation à un ou plusieurs collaborateurs, niveau de priorité (Basse, Moyenne, Haute), date d'échéance et description détaillée.
* **Suivi interactif** : Ajout de pièces jointes (fichiers, images), commentaires de suivi en temps réel et logs de modifications.

### 6. 📄 Générateur de Documents & Modèles (GMAO / Juridique)
* **Modèles de Documents Prédéfinis** : Contrats de travail, avenants contractuels, accords de confidentialité, lettres d'avertissement.
* **Champs de Fusion Dynamiques** : Remplissage automatique des informations du collaborateur, de l'entreprise, des salaires et des dates pour zéro erreur de saisie.
* **Téléchargement Exportable** : Extraction de documents finalisés au format **Microsoft Word (.docx)** et **PDF**.

### 7. 📦 Gestion de l'Inventaire & Matériel (Logistique)
* **Registre de Stock** : Suivi des équipements de l'entreprise (matériel informatique, terminaux, véhicules, fournitures).
* **Assignation du Matériel** : Attribution d'équipements à des employés spécifiques, états des stocks (Disponible, Assigné, En réparation, Hors d'usage).

### 8. 🔔 Module d'Alertes, Rappels & Notifications
* **Rappels Automatisés** : Détection des échéances de tâches, des retards de pointage ou des validations en attente.
* **Canaux de Notifications** : Routage automatique des notifications système via **E-mail** et **WhatsApp API**.
* **Journal de communication** : Console globale d'audit des messages envoyés pour une traçabilité totale.

### 9. 📥 Système d'Exports Universel
* **Export Excel** : Un bouton d'export Excel (.xlsx) est intégré sur l'ensemble des datatables (Utilisateurs, Collaborateurs, Pointages, Transactions financières, Demandes).
* **Export PDF** : Un bouton de génération de rapports PDF tabulaires professionnels équipe toutes les grilles de données du système.

---

## 🛠️ Architecture Technique & Sécurité

* **Frontend** : React.js (TypeScript), Tailwind CSS pour une interface responsive et fluide (Zero-Pill design, sobre et moderne).
* **Backend de Persistance** : Firebase Firestore (Base de données en temps réel) et LocalStorage (mécanisme de cache pour haute résilience hors-ligne).
* **Sécurité & Confidentialité (PBKDF2)** :
  * Chiffrement cryptographique fort et salage de tous les mots de passe.
  * Masquage total des mots de passe dans les tables et interfaces système.
  * Validation stricte des accès et permissions (RBAC) au niveau de l'Iframe client et des règles de sécurité Firestore.

---

## 💻 Installation & Lancement Local

### Prérequis
* Node.js (version 18 ou supérieure)

### Étapes d'installation
1. **Cloner et installer les dépendances** :
   ```bash
   npm install
   ```
2. **Configurer l'environnement** :
   Compléter les variables d'environnement dans le fichier `.env.local` si nécessaire.
3. **Lancer le serveur de développement local** :
   ```bash
   npm run dev
   ```
   L'application sera lancée sur `http://localhost:3000`.
4. **Compiler l'application pour la production** :
   ```bash
   npm run build
   ```
