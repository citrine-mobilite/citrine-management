# CITRINE MANAGEMENT : SYSTÈME INTÉGRÉ ERP, SIRH & PILOTAGE OPÉRATIONNEL

---

## 1. Vision et Positionnement Stratégique

**Citrine** est la plateforme intégrée de gestion opérationnelle, de ressources humaines et de pilotage d'entreprise conçue sur-mesure pour **Citrine SARL**, acteur de référence basé au Cameroun (siège social à Douala, base logistique à Japoma et représentations à Akwa).

Face aux défis conjoints de mobilité, de ponctualité, de gestion rigoureuse de la masse salariale en Francs CFA (XAF), de sécurité des sites industriels et de réactivité managériale, Citrine unifie l'ensemble des flux de l'entreprise au sein d'une interface web et mobile unifiée (PWA), ultra-rapide et résiliente en mode **"Offline-First"**.

---

## 2. Piliers et Valeurs Fondatrices

* **Continuité d'Activité & Résilience Hors-Ligne (Offline-First)** : Grâce au cache local intelligent (`localStorage` et IndexedDB) couplé à la synchronisation bidirectionnelle Google Firebase Firestore, les collaborateurs et managers continuent d'opérer même en cas d'instabilité du réseau Internet.
* **Gouvernance & Sécurité Cloisonnée (RBAC Multi-Rôles)** : Matrice d'habilitations stricte à 3 niveaux (*Employé / Collaborateur*, *Responsable d'Unité*, *Administrateur Général*) garantissant l'intégrité et la confidentialité des données financières et RH.
* **Sobriété, Élégance & Ergonomie Industrielle** : Design épuré respectant l'identité visuelle de Citrine (palette émeraude/vert sauge `#2A7B76`, fonds pierre/albâtre, cartes aérées, typographie soignée).
* **Adaptabilité Modulaire Intégrale (Feature Flags)** : Chaque domaine d'activité peut être activé ou désactivé dynamiquement depuis la console d'administration selon les priorités stratégiques de l'entreprise.

---

## 3. Cartographie Complète des Modules de la Plateforme

### A. Socle RH, Présences & Espace Collaborateur
1. **Pilotage des Présences & Borne Kiosk** :
   * Pointage individuel géolocalisé GPS (Douala Akwa & Japoma) avec calcul automatique des retards selon seuils paramétrables.
   * Mode Borne Kiosk sécurisé par QR Code et code PIN pour badgeage rapide sur site.
   * Protocole adaptable de pointage des pauses (pointage simplifié en 2 étapes ou pointage complet en 4 étapes).
   * Feuilles d'émargement numériques et motifs obligatoires pour retards justifiés.
2. **Espace Personnel Collaborateur (Portail Salarié)** :
   * Badge virtuel officiel haute définition avec QR Code de signature chiffrée.
   * Consultation du relevé individuel d'heures, des tâches assignées et des bulletins de paie.
   * Soumission et suivi des demandes d'avances sur salaire.
3. **Gestion des Collaborateurs & Annuaire du Personnel** :
   * Fiches salariés complètes, contrats, départements, coordonnées et statuts professionnels.
   * Organigramme interactif des équipes et suivi de carrière.
4. **Statistiques & Ponctualité RH** :
   * Taux d'assiduité, classement de ponctualité, volume d'heures supplémentaires et indicateurs de performance collective.
5. **Règles Disciplinaires & Catalogue des Sanctions** :
   * Nomenclature officielle des motifs RH (renvois, suspensions, mutations, avertissements, fins de période d'essai).

### B. Pilotage des Opérations, Tâches & Patrimoine
6. **Gestion des Tâches & Jalons (Kanban)** :
   * Organisation en 4 colonnes (*À faire, En cours, En attente, Complété*), priorités visuelles, affectations multiples et dates d'échéance.
7. **Parc d'Inventaire & Dotations Matérielles** :
   * Traçabilité des équipements informatiques, clés, téléphones et outillages confiés aux collaborateurs avec valorisation du patrimoine en FCFA.
8. **Partenaires d'Affaires & Clients** :
   * Répertoire d'entreprises, conventions externes, sous-traitants et prestataires de services avec système d'évaluation.
9. **Alertes, Rappels & Notifications Sonores** :
   * Synthèse sonore native (Web Audio API), alertes push et rappels programmables avec fonction d'ajournement (*Snooze*).
10. **Communications & Diffusion Multicanal** :
    * Envois de notes de service, convocations et notifications officielles par WhatsApp Business Cloud API et courriels certifiés.
11. **Générateur de Documents Contractuels** :
    * Création et impression immédiate de contrats (CDI, CDD, période d'essai), ordres de mission et attestations de travail au format PDF officiel Citrine.
12. **Finances & Masse Salariale** :
    * Traitement des salaires en FCFA (XAF), gestion des acomptes, avances sur salaire et clôture périodique de paie.
13. **Appels d'Équipe & Salons Collaboratifs** :
    * Salles de visioconférence et appels audio intégrés pour les réunions de coordination à distance.

---

## 4. Les 5 Nouveaux Modules Stratégiques de la Plateforme

Pour répondre à la montée en puissance de l'activité sur les sites de Douala et Japoma, la plateforme a été enrichie de 5 modules métiers à forte valeur ajoutée :

### 1. Module Recrutement & Vivier de Candidatures (ATS Interne)
* **Publication & Gestion des Offres** : Création d'opportunités de recrutement avec critères détaillés (intitulé, département, site d'affectation, type de contrat CDI/CDD/Stage, fourchette salariale en XAF, date limite).
* **Pipeline de Sélection Dynamique** : Traitement visuel des candidatures à travers 6 étapes normalisées (*Nouvelle ➔ Présélectionnée ➔ Entretien RH ➔ Entretien Technique ➔ Offre / Retenu ➔ Rejeté*).
* **Évaluation & Vivier de Talents** : Système de notation par étoiles, suivi des dates d'entretien, liens vers CV numériques et bouton de conversion directe d'un candidat retenu en collaborateur officiel dans l'annuaire RH.

### 2. Notes de Frais & Remboursement des Dépenses de Mission
* **Déclaration Dématérialisée** : Saisie rapide des dépenses engagées pour le compte de Citrine (carburant, péage, transport urbain, hébergement, restauration de mission, fournitures et outillage).
* **Circuit d'Approbation à Double Seuil** : Soumission par l'employé avec justificatif ➔ Validation par le manager de pôle ➔ Mise en paiement par la direction financière.
* **Modes de Règlement Adaptés au Contexte Local** : Remboursement tracé par Virement Bancaire, Mobile Money (MTN MoMo, Orange Money) ou Caisse Espèces avec reçus comptables.

### 3. Registre Hygiène, Sécurité & Environnement (HSE) & Signalement d'Incidents
* **Signalement Rapide sur le Terrain** : Déclaration instantanée d'accidents, presque-accidents, risques environnementaux ou situations dangereuses sur les sites (Base Logistique Japoma, Siège Akwa, Chantiers).
* **Évaluation de Gravité & Actions Correctives (CAPA)** : Classification (*Mineur, Moyen, Grave, Critique*), fiches d'investigation, assignation de responsables et liste de contrôle des mesures préventives et correctives.
* **Indicateur Statistique de Sécurité** : Compteur dynamique en temps réel des *"Jours consécutifs sans accident avec arrêt de travail"*.

### 4. Registre d'Accueil & Gestion des Visiteurs du Siège (Japoma & Akwa)
* **Émargement Numérique en Temps Réel** : Enregistrement complet des arrivées (nom, entreprise représentée, pièce d'identité/CNI, collaborateur hôte, motif de rendez-vous, numéro de badge remis, immatriculation du véhicule).
* **Traçabilité des Flux de Personnes** : Indicateur en direct des *"Visiteurs actuellement sur site"*, badge vert pulsant, filtrage par site (Japoma / Akwa).
* **Sortie Instantanée en 1 Clic** : Horodatage précis du départ, libération immédiate du badge physique et historique complet pour la sécurité du site.

### 5. Boîte à Idées Interne, Signalements & Sondages d'Entreprise
* **Boîte à Idées Participative** : Espace d'innovation collaborative permettant à chaque collaborateur de soumettre des propositions d'amélioration continue, avec possibilité d'anonymat garanti.
* **Démocratie Participative & Upvotes** : Système de vote par les collègues (pouces levés), statuts de concrétisation par la direction (*Soumise ➔ À l'étude ➔ Approuvée ➔ En cours ➔ Déployée*).
* **Sondages & Consultations d'Entreprise** : Enquêtes d'opinion internes à questions à choix multiples, dépouillement en temps réel et jauges de satisfaction du personnel.

---

## 5. Administration & Paramétrage Entreprise

La section **Configuration Entreprise** propose une administration étanche structurée en 6 sous-domaines indépendants :
1. **Identité Juridique & Siège Social** : Stockage pérenne du logo officiel en base de données Firestore, raison sociale, forme juridique (SARL), capital social (10 000 000 FCFA), NIU, RCCM et adresses officielles.
2. **Horaires de Travail, Pauses & Périmètre GPS** : Définition des plages de travail (08:00), seuil d'alerte de retard (08:15), fenêtres de pause, heure d'activation de sortie (16:30) et géolocalisation haute précision par coordonnées GPS.
3. **Activation Sélective des Modules (Feature Flags)** : Interrupteurs permettant d'activer ou masquer chaque module du système en un clic.
4. **Règles RH & Motifs Réglementaires** : Gestion de la table des motifs disciplinaires avec formulaires d'ajout et d'édition.
5. **Sécurité, Wi-Fi & Bornes QR Code** : Régénération des clés secrètes de signature QR, déclaration du SSID Wi-Fi autorisé et filtrage d'adresses IP.
6. **Maintenance Firestore** : Console de diagnostic, réinitialisation et contrôle de santé des collections de données.

---

## 6. Architecture Technique et Performance

* **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide Icons, architecture modulaire découplée (composants strictement inférieurs à 300 lignes).
* **Backend & Cloud** : Google Firebase Firestore (données temps réel et requêtes optimisées), Firebase Authentication et règles de sécurité sécurisées.
* **PWA & Mobilité** : Progressive Web App installable sur Android, iOS et Desktop, avec Service Worker, gestion du mode hors ligne et retour visuel du statut de connectivité.
* **Performance** : Découpage intelligent par chargement différé (*React.lazy* et *Suspense*), skeleton loaders personnalisés et préchargement au survol.

---

## 7. Synthèse

**Citrine Management** transcende le simple rôle de logiciel de gestion pour devenir le véritable système d'exploitation de Citrine SARL. Alliant rigueur comptable, bienveillance RH, sécurité industrielle et modernité technologique, elle offre à la direction une visibilité totale et aux équipes un environnement de travail fluide, valorisant et efficace.

---
*Document officiel de présentation de la plateforme Citrine - Version actualisée 2026.*
