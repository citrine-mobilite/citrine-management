# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE DÉTAILLÉ
## Plateforme Intégrée ERP, SIRH & Exploitation Opérationnelle - CITRINE SARL

---

### DOCUMENT CONTROL & MÉTADONNÉES DU PROJET

| Information | Valeur |
| :--- | :--- |
| **Nom de l'Entreprise** | **CITRINE SARL** |
| **Siège Social & Sites** | Siège Social : Douala - Akwa | Base Logistique : Douala - Japoma (Cameroun) |
| **Intitulé du Projet** | Plateforme Intégrée ERP, SIRH & Pilotage Opérationnel Citrine |
| **Auteurs** | Direction des Systèmes d'Information, Lead Architecte React/Firebase, Expert UI/UX & DRH Citrine |
| **Version du Document** | **5.0 (Intégration ATS, Notes de Frais, HSE, Visiteurs & Sondages)** |
| **Statut** | Validé / Conforme à la Plateforme Actuelle en Production |
| **Technologies Clés** | React 18, TypeScript, Tailwind CSS, Google Firebase Firestore, Firebase Auth, PWA, Web Audio API |

---

## 1. VISION D'ENSEMBLE ET GOUVERNANCE MULTI-RÔLES (RBAC)

La plateforme applicative **Citrine** centralise, automatise et fiabilise l'ensemble des flux opérationnels, humains, comptables et logistiques de l'entreprise. Conçue pour répondre aux réalités d'exploitation au Cameroun (Douala Akwa et base de Japoma), elle intègre nativement une tolérance aux coupures réseau grâce à son architecture **Offline-First**.

L'application repose sur un contrôle d'accès strict selon trois profils d'utilisateurs :

1. **Le Profil Employé (Collaborateur / Agent opérationnel)** :
   * Accès à son Espace Personnel dédié (pointage d'arrivée/départ géolocalisé, badge QR personnel, suivi de ses tâches et jalons).
   * Consultation de son historique d'assiduité, de ses heures supplémentaires et de ses bulletins de paie.
   * Soumission directe de demandes d'avances sur salaire.
   * Déclaration de notes de frais de mission avec justificatifs.
   * Signalement immédiat des incidents ou situations à risque Hygiène, Sécurité & Environnement (HSE).
   * Consultation des visiteurs attendus pour son compte à l'accueil.
   * Dépôt d'idées d'amélioration (avec option d'anonymat) et participation aux sondages internes.

2. **Le Profil Responsable (Manager de pôle / Chef d'équipe)** :
   * Supervision en temps réel de la présence et de la ponctualité de son département.
   * Validation des justifications de retard et des pointages manuels de régularisation.
   * Attribution et pilotage des tâches et projets sur le tableau Kanban.
   * Premier niveau d'avis motivé sur les demandes d'avances sur salaire et notes de frais.
   * Suivi du matériel confié aux collaborateurs et des partenaires externes.
   * Enquête et suivi des plans d'actions correctives sur les incidents HSE de son secteur.
   * Consultation des flux de visiteurs orientés vers son unité de travail.

3. **Le Profil Administrateur (Direction Générale / Super-Admin)** :
   * Maîtrise totale des accès, des rôles système et de la masse salariale en Francs CFA (XAF).
   * Validation finale et mise en paiement des acomptes, avances et notes de frais.
   * Pilotage global du recrutement : publication des offres d'emploi, gestion du pipeline de sélection des candidats et conversion directe des profils retenus en salariés officiels.
   * Supervision du registre officiel d'accueil des visiteurs du siège (Japoma / Akwa) et émargement de sécurité.
   * Analyse des statistiques consolidées HSE (taux de résolution CAPA, jours sans accident).
   * Gestion de la boîte à idées et création de sondages institutionnels à l'échelle de l'entreprise.
   * Configuration intégrale de l'entreprise : logo en base de données, horaires de travail, rayon GPS, catalogue des motifs disciplinaires, bornes QR et interrupteurs de modules (*Feature Flags*).

---

## 2. SPÉCIFICATIONS DÉTAILLÉES DES MODULES FONCTIONNELS

---

### MODULE 1 : SUIVI DES PRÉSENCES, GÉOLOCALISATION & BORNE KIOSK

#### Description
Le module garantit la traçabilité des heures de travail sur les différents sites de Citrine. Il combine le badgeage individuel sur smartphone/PC validé par coordonnées GPS et une borne fixe (*Kiosk*) tactile installée aux accès des bâtiments.

* **En tant qu'Employé** : Clique sur "Pointer mon arrivée" au début du service. L'application vérifie la conformité de la position GPS par rapport aux coordonnées du siège. Si le pointage intervient après l'heure seuil de retard, la saisie d'un motif explicatif est exigée. En fin de journée, l'employé valide sa sortie.
* **En tant que Responsable** : Visualise le tableau de bord d'assiduité en temps réel (présents, retards, absents, en mission). Valide ou rejette les justifications de retards et supervise la feuille d'émargement quotidienne.
* **En tant qu'Administrateur** : Définit les heures de début de service (08:00), les seuils de retard (08:15) et le protocole de pause (2 étapes directes ou 4 étapes avec pause déjeuner). Configure le mode Kiosk plein écran verrouillé par mot de passe.

---

### MODULE 2 : ESPACE COLLABORATEUR (PORTAIL PERSONNEL)

#### Description
Espace individualisé sécurisé centralisant la relation professionnelle entre le salarié et Citrine SARL.

* **En tant qu'Employé** : Visualise sa fiche d'identité professionnelle, son département et son type de contrat. Affiche son badge virtuel officiel muni d'un QR code chiffré. Rédige ses demandes d'avances sur salaire en Francs CFA et télécharge ses fiches de paie validées.
* **En tant que Responsable** : Accède au trombinoscope de son équipe pour consulter les plannings théoriques et vérifier la disponibilité de ses collaborateurs.
* **En tant qu'Administrateur** : Génère les comptes d'accès, attribue les identifiants initiaux et réinitialise les clés de badgeage en cas de perte de smartphone.

---

### MODULE 3 : STATISTIQUES, PONCTUALITÉ & ANALYSE D'ASSIDUITÉ

#### Description
Module analytique traduisant les flux de badgeage en indicateurs de performance RH.

* **En tant qu'Employé** : Consulte sa jauge personnelle d'assiduité mensuelle et son historique de ponctualité.
* **En tant que Responsable** : Analyse les courbes d'assiduité de son département, détecte les retards récurrents et quantifie les heures supplémentaires accumulées.
* **En tant qu'Administrateur** : Dispose de graphiques croisés comparant les performances entre départements, calcule le coût global des heures supplémentaires et exporte les rapports annuels.

---

### MODULE 4 : GESTION DES COLLABORATEURS & ANNUAIRE RH

#### Description
Registre officiel du personnel réunissant données administratives, professionnelles et contractuelles.

* **En tant qu'Employé** : Utilise l'annuaire pour rechercher les coordonnées professionnelles d'un collègue (téléphone, email, poste) sans accès aux informations confidentielles (salaires).
* **En tant que Responsable** : Filtre l'effectif de son unité par statut (*Actif, En congé, Suspendu*) et formule des appréciations lors des bilans périodiques.
* **En tant qu'Administrateur** : Crée et met à jour les fiches salariés complètes (salaire de base en XAF, taux horaire, contrat CDI/CDD/Stage, département d'affectation, impression de badge).

---

### MODULE 5 : GESTION DES TÂCHES & KANBAN OPÉRATIONNEL

#### Description
Outil collaboratif de planification des opérations sous forme de tableau Kanban dynamique à 4 colonnes (*À faire, En cours, En attente, Complété*).

* **En tant qu'Employé** : Visualise ses missions attribuées, met à jour leur avancement par glisser-déposer (*Drag & Drop*) et consigne des commentaires de terrain.
* **En tant que Responsable** : Crée des tâches, fixe le niveau de priorité (*Basse, Moyenne, Haute, Urgente*), affecte les exécutants et supervise les jalons d'échéance.
* **En tant qu'Administrateur** : Vue d'ensemble sur l'ensemble des projets de l'entreprise, avec possibilité de réassigner les chantiers transversaux.

---

### MODULE 6 : RECRUTEMENT & VIVIER DE CANDIDATURES (ATS INTERNE)

#### Description
Système complet de suivi des candidatures (Applicant Tracking System) gérant l'ensemble du cycle de recrutement de Citrine.

* **En tant qu'Employé** : Peut consulter les opportunités internes publiées par l'entreprise afin de postuler ou recommander des candidatures externes.
* **En tant que Responsable** : Participe aux jurys d'embauche, consulte les CV des candidats présélectionnés pour son unité, enregistre ses appréciations d'entretiens techniques et attribue des notes d'évaluation par étoiles.
* **En tant qu'Administrateur** :
  * Crée et publie les fiches d'offres d'emploi (intitulé, contrat, site d'affectation Akwa/Japoma, compétences requises, salaire cible en XAF).
  * Fait évoluer les candidatures dans le pipeline de recrutement (*Nouvelle ➔ Présélectionnée ➔ Entretien RH ➔ Entretien Technique ➔ Offre / Retenu ➔ Rejeté*).
  * **Fonctionnalité clé** : Convertit en un clic un candidat retenu en collaborateur officiel dans l'annuaire RH, avec transfert automatique des coordonnées et création de son profil salarié.

---

### MODULE 7 : NOTES DE FRAIS & REMBOURSEMENT DE MISSIONS

#### Description
Dématérialisation et sécurisation du cycle des dépenses engagées par le personnel dans le cadre des déplacements et missions de terrain.

* **En tant qu'Employé** :
  * Déclare ses dépenses en sélectionnant la catégorie : Carburant, Péage, Transport urbain, Restauration de mission, Hébergement ou Achats de fournitures.
  * Saisit le montant exact en Francs CFA (XAF), précise la mission associée et renseigne les références du reçu ou de la facture justificative.
  * Suit le statut de sa note de frais (*En attente ➔ Approuvée ➔ Rejetée ➔ Remboursée*).
* **En tant que Responsable** : Examine la cohérence des frais déclarés par rapport à l'ordre de mission initial et émet une validation managériale.
* **En tant qu'Administrateur** :
  * Valide définitivement les montants et effectue le remboursement comptable.
  * Choisit le canal d'indemnisation approprié : Virement bancaire, Paiement Mobile Money (MTN MoMo, Orange Money) ou Caisse Espèces, avec archivage de la date et référence du règlement.

---

### MODULE 8 : REGISTRE HYGIÈNE, SÉCURITÉ & ENVIRONNEMENT (HSE) & INCIDENTS

#### Description
Dispositif d'alerte, de traçabilité des risques professionnels et de pilotage des plans d'actions correctives et préventives (CAPA).

* **En tant qu'Employé** : Signale en direct un danger, presque-accident ou incident corporel/matériel survenu sur site (Base Japoma, bureaux Akwa ou chantiers extérieurs). Renseigne le lieu, la date, l'heure et la description des faits.
* **En tant que Responsable** : Reçoit l'alerte, initie l'investigation terrain, qualifie la gravité (*Mineur, Moyen, Grave, Critique*) et définit des mesures immédiates de mise en sécurité.
* **En tant qu'Administrateur** :
  * Supervise le plan d'actions correctives (CAPA) avec suivi interactif des tâches cochables.
  * Analyse les indicateurs HSE, notamment le compteur d'entreprise *"Jours consécutifs sans accident avec arrêt de travail"*.
  * Édite le registre réglementaire annuel d'hygiène et de sécurité au travail.

---

### MODULE 9 : REGISTRE D'ACCUEIL & GESTION DES VISITEURS (JAPOMA / AKWA)

#### Description
Registre d'accueil électronique assurant la traçabilité intégrale des personnes externes accédant aux locaux de Citrine.

* **En tant qu'Employé** : Notifié lorsqu'un visiteur externe s'enregistre à l'accueil en sollicitant un rendez-vous avec lui.
* **En tant que Responsable** : Peut consulter les flux d'intervenants extérieurs et prestataires orientés vers son pôle d'activité.
* **En tant qu'Administrateur (et Agent d'Accueil / Sécurité)** :
  * Enregistre l'entrée du visiteur : Nom complet, société représentée, pièce d'identité (CNI/Passeport), contact téléphonique, collaborateur visité, motif du rendez-vous, numéro de badge remis et immatriculation du véhicule.
  * Supervise en temps réel l'indicateur lumineux des *"Visiteurs actuellement présents sur le site"* (badge vert pulsant).
  * Enregistre le départ en 1 clic : l'heure de sortie est instantanément horodatée et le badge est remis en disponibilité.

---

### MODULE 10 : BOÎTE À IDÉES INTERNE & SONDAGES D'ENTREPRISE

#### Description
Plateforme d'innovation participative et de consultation collective du climat d'entreprise.

* **En tant qu'Employé** :
  * Propose une suggestion d'amélioration dans l'un des domaines (*Conditions de travail, Sécurité, Innovation, Éco-gestes, Vie d'équipe*), avec option de publication nominative ou **strictement anonyme**.
  * Découvre les idées déposées par ses collègues et vote pour ses favorites via un système d'upvotes (*Pouces levés*).
  * Répond aux sondages d'opinion lancés par la direction.
* **En tant que Responsable** : Examine les propositions relatives à l'organisation de son service et encourage la dynamique d'amélioration continue.
* **En tant qu'Administrateur** :
  * Met à jour le statut des idées (*Soumise ➔ À l'étude ➔ Approuvée ➔ En cours ➔ Déployée*).
  * Crée et publie des sondages d'entreprise à choix multiples, avec analyse en direct des taux de participation et diagrammes de résultats.

---

### MODULE 11 : PARC D'INVENTAIRE & GESTION DU MATÉRIEL

#### Description
Inventaire physique et valorisation financière du matériel informatique, téléphones, véhicules et outillages confiés aux collaborateurs.

* **En tant qu'Employé** : Consulte la liste des dotations professionnelles inscrites sous sa responsabilité et signale tout dysfonctionnement ou casse.
* **En tant que Responsable** : Assure l'affectation du matériel disponible aux nouveaux arrivants de son équipe et contrôle l'état d'usure.
* **En tant qu'Administrateur** : Enregistre les acquisitions avec référence interne, prix d'achat en FCFA et amortissement. Prononce la réforme ou mise au rebut des équipements.

---

### MODULE 12 : PARTENAIRES D'AFFAIRES & CLIENTS

#### Description
Répertoire officiel des conventions, prestataires extérieurs, transporteurs et sous-traitants.

* **En tant qu'Employé** : Accède aux contacts téléphoniques certifiés d'un prestataire pour organiser une intervention d'urgence.
* **En tant que Responsable** : Référence de nouveaux partenaires et attribue une note d'évaluation sur la qualité des prestations.
* **En tant qu'Administrateur** : Valide les conventions-cadres, négocie les tarifs préférentiels et conserve les pièces contractuelles.

---

### MODULE 13 : CENTRE DE MESSAGERIE (WHATSAPP CLOUD API & EMAILS)

#### Description
Canal multicanal d'émission de notes de service, convocations et confirmations officielles.

* **En tant qu'Employé** : Reçoit ses notifications officielles directement sur WhatsApp ou par courriel électronique.
* **En tant que Responsable** : Rédige et diffuse des communications groupées ciblées sur son équipe de travail.
* **En tant qu'Administrateur** : Configure les clés d'API sécurisées et définit les modèles de messages institutionnels de Citrine.

---

### MODULE 14 : GÉNÉRATEUR DE DOCUMENTS CONTRACTUELS ET RH

#### Description
Moteur de génération automatisée de documents officiels au format PDF haute résolution avec charte graphique Citrine.

* **En tant qu'Employé** : Demande et télécharge son attestation d'emploi ou certificat de travail tamponné numériquement.
* **En tant que Responsable** : Émet des ordres de mission pour les déplacements professionnels de son équipe.
* **En tant qu'Administrateur** : Édite les contrats de travail (CDI, CDD, période d'essai, avenants) pré-remplis automatiquement avec les informations salariales et juridiques du collaborateur.

---

### MODULE 15 : FINANCES, MASSE SALARIALE & AVANCES SUR SALAIRE

#### Description
Gestion sociale de la rémunération en Francs CFA (XAF), traitement des avances, calcul du net à payer et clôture de paie.

* **En tant qu'Employé** : Formule une demande d'avance sur salaire chiffrée avec motif et suit son statut d'approbation.
* **En tant que Responsable** : Émet un avis managérial motivé sur la demande d'avance avant transmission à la direction financière.
* **En tant qu'Administrateur** : Approuve le déblocage des fonds, choisit le mode de versement (Virement, Mobile Money, Espèces) et valide la retenue sur le prochain bulletin de paie lors de la clôture mensuelle.

---

### MODULE 16 : SALONS COLLABORATIFS & APPELS D'ÉQUIPE

#### Description
Système de communication audio et visioconférence intégré pour organiser des réunions internes sans dépendance d'outils tiers.

* **En tant qu'Employé** : Rejoint le salon audio/visio de son unité d'un clic pour échanger avec son équipe.
* **En tant que Responsable** : Anime des points opérationnels quotidiens avec ses agents sur le terrain.
* **En tant qu'Administrateur** : Ouvre des salons de crise ou des réunions de direction sécurisées.

---

### MODULE 17 : JOURNAUX D'AUDIT, SÉCURITÉ & LOGS SYSTÈME

#### Description
Journal d'événements inaltérable garantissant la traçabilité totale des accès et opérations sensibles.

* **En tant qu'Employé** : Consulte l'historique personnel de ses propres actions (badgeages, requêtes).
* **En tant que Responsable** : Visualise le flux d'activité de son département.
* **En tant qu'Administrateur** : Dispose de la console d'audit complète affichant horodatage à la seconde, adresse IP, identité de l'auteur et détail de chaque modification de données.

---

### MODULE 18 : CONFIGURATION ENTREPRISE & INTERRUPTEURS MODULAIRES (SETTINGS)

#### Description
Console d'administration globale découpée en 6 sous-domaines thématiques :

1. **Identité Juridique** : Stockage du logo d'entreprise en base Firestore, raison sociale, capital (10 000 000 FCFA), NIU, RCCM et contacts du siège.
2. **Horaires & Périmètre GPS** : Configuration des horaires contractuels, seuil de retard dynamique et détection des coordonnées GPS du siège.
3. **Activation Sélective des Modules (Feature Flags)** : Interrupteurs permettant d'activer ou masquer chaque module de la plateforme à volonté.
4. **Catalogue des Motifs Disciplinaires** : Nomenclature officielle des sanctions et changements de statuts RH.
5. **Sécurité & Bornes QR Code** : Signature chiffrée des QR codes, réseau Wi-Fi de confiance et adresses IP agréées.
6. **Maintenance Firestore** : Vérification de cohérence et réinitialisation sécurisée des tables de données.

---

## 3. MATRICE COMPLÈTE DES DROITS ET HABILITATIONS (RBAC)

| Domaine / Module | Rôle Employé | Rôle Responsable | Rôle Administrateur |
| :--- | :---: | :---: | :---: |
| **Pointage Présences & Kiosk** | Pointage GPS / QR & Motif | Supervision Équipe & Émargement | Paramétrage Horaires & Kiosk |
| **Espace Personnel** | Profil, Badge QR & Fiches | Consultation Fiches Unité | Gestion Comptes & Identifiants |
| **Statistiques Assiduité** | Jauge Personnelle | Analyse Équipe & Heures Supp | Indicateurs Globaux & Exports |
| **Annuaire RH** | Recherche Coordonnées | Filtrage Statuts Unité | Création Fiches & Salaires |
| **Gestion des Tâches** | Exécution & Commentaires | Attribution & Kanban Équipe | Supervision Tous Chantiers |
| **Recrutement (ATS)** | Consultation Offres | Évaluation & Entretiens | Gestion Offres, Pipeline & Embauche |
| **Notes de Frais** | Saisie Frais & Reçus | Validation Managériale | Approbation Financière & Paiement |
| **Registre HSE & Incidents** | Signalement Risque / Incident | Qualification & Mesures Immédiates | Pilotage CAPA & Compteur Jours |
| **Accueil & Visiteurs Siège** | Notification Arrivée Visiteur | Consultation Flux Visiteurs | Émargement Entrée/Sortie & Badges |
| **Boîte à Idées & Sondages** | Dépôt d'Idée & Vote / Réponse | Encouragement des Démarches | Validation Idées & Création Sondages |
| **Inventaire & Matériel** | Consultation Matériel Confié | Affectation aux Collaborateurs | Valorisation & Réforme |
| **Partenaires & Clients** | Recherche Contacts | Référencement & Notation | Validation Accords-Cadres |
| **Communications** | Réception Messages | Envois Groupés à l'Équipe | Configuration Clés API & Trame |
| **Générateur Documents** | Télécharger ses Attestations | Ordres de Mission | Modèles Contrats & Édition PDF |
| **Finances & Avances** | Demande d'Avance en XAF | Avis Managérial Motivé | Décision, Paiement & Clôture Paie |
| **Appels d'Équipe** | Connexion au Salon | Animation Réunion Audio/Visio | Création Salons Direction |
| **Journaux d'Audit** | Relevé Personnel | Suivi Activités Service | Audit Global Sécurité & IP |
| **Configuration Entreprise** | Aucun Accès | Aucun Accès | Maîtrise Totale des 6 Domaines |

---

## 4. ARCHITECTURE TECHNIQUE & RÉSILIENCE HORS-LIGNE

```
+---------------------------------------------------------------------------------------+
|                                    APPLICATION CLIENT                                 |
|                       React 18 + TypeScript + Tailwind CSS (PWA)                     |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  |                 COUCHE DE PERSISTANCE LOCALE (OFFLINE-FIRST)                    |  |
|  |    Cache Local Storage + IndexedDB <--------> Moteur de Synchronisation Queue    |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            |
                      (Synchronisation Temps Réel Automatique)
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                  INFRASTRUCTURE CLOUD                                 |
|                                                                                       |
|  +---------------------------------------+ +---------------------------------------+  |
|  |         Firebase Firestore            | |       Firebase Authentication         |  |
|  |  Base NoSQL Temps Réel (18 Collections)| |  Contrôle des Accès & Jetons JWT     |  |
|  +---------------------------------------+ +---------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 5. RECOMMANDATIONS & CONFORMITÉ DU CODE

Conformément aux normes architecturales de l'application :
1. **Modularité Stricte** : Chaque composant applicatif est segmenté en sous-modules spécialisés ne dépassant pas le seuil de 300 lignes.
2. **Typage Fort** : Tous les modèles de données sont typés sous TypeScript dans `/src/types/`.
3. **Pérennité des Données** : Les paramètres et le logo d'entreprise sont conservés directement dans Firestore pour une disponibilité permanente sur tous les terminaux.
4. **Expérience Utilisateur** : Feedback immédiat via sons Web Audio API, notifications Toast et états de chargement Skeleton.

---
*Cahier des charges officiel de la plateforme Citrine SARL - Version 5.0 approuvée pour déploiement.*
