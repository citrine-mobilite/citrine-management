# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE DÉTAILLÉ
## Plateforme Intégrée de Gestion Logistique, RH et Opérationnelle - CITRINE

---

### DOCUMENT CONTROL & MÉTADONNÉES DU PROJET

| Information | Valeur |
| :--- | :--- |
| **Nom de l'Entreprise** | **CITRINE** |
| **Intitulé du Projet** | Plateforme ERP Logistique, RH & Opérationnelle Citrine |
| **Auteurs** | Équipe Architecture & Direction Technique (Tech Lead, Architecte Logiciel, Lead Dev Full Stack, UX/UI Expert, DevOps) |
| **Version du Document** | 4.0 (Spécifications Operatoires Multi-Rôles et Guides Rédigés) |
| **Statut** | Validé / Prêt pour Présentation Administrative & Déploiement Industrialisé |
| **Technologies Clés** | React 18, TypeScript, Tailwind CSS, IndexedDB (`idb`), Firebase Firestore & Auth, Service Worker / Push API, Resend / WhatsApp Cloud API |

---

## 1. VISION D'ENSEMBLE ET ARCHITECTURE TRIPLE-FILTRAGE (RBAC)

La plateforme applicative **Citrine** a été spécialement conçue pour centraliser, automatiser et sécuriser l'intégralité des flux logistiques, administratifs, financiers et humains de l'entreprise. Grâce à une conception centrée sur l'utilisateur et une séparation stricte des privilèges d'accès, la plateforme offre une expérience adaptée aux besoins précis de chaque intervenant de la chaîne opérationnelle.

La gouvernance des données repose sur une matrice de droits à trois niveaux d'habilitation (Role-Based Access Control) :

1. **Le Profil Employé (Agent de terrain / Exécutant)** : Ce profil dispose d'une interface épurée orientée vers l'action quotidienne. L'employé interagit avec la plateforme pour effectuer son pointage géolocalisé, consulter son planning de travail, gérer ses tâches attribuées, effectuer des simulations de tarifs de transport et consulter ses bulletins de salaire.
2. **Le Profil Responsable (Chef d'équipe / Manager de pôle)** : Ce profil bénéficie d'outils de supervision de proximité. Le responsable valide les justificatifs de retard, approuve les demandes d'avances sur salaire, attribue les projets sur le tableau Kanban, gère le matériel attribué à son équipe et évalue l'assiduité de son pôle.
3. **Le Profil Administrateur (Direction générale / Administrateur système)** : Ce profil détient les droits de contrôle total sur l'application. L'administrateur configure les barèmes tarifaires, gère la création des comptes utilisateurs, supervise les finances de la masse salariale, accède aux journaux d'audit de sécurité et active ou désactive les modules applicatifs à l'aide des interrupteurs de fonctionnalités (*Feature Flags*).

---

## 2. DÉTAIL DES MODULES FONCTIONNELS ET MANUELS D'UTILISATION PAR PROFIL

---

### MODULE 1 : COMPARATEUR TARIFAIRE LOGISTIQUE ET SÉCURITÉ OFFLINE-FIRST

#### Description Générale du Module
Le module de comparateur tarifaire constitue le cœur de l'optimisation des coûts de transport de la société Citrine. Il permet d'estimer, de simuler et de comparer en temps réel les coûts des trajets en calculant les tarifs appliqués par les différents acteurs du marché (Yango Eco et Confort, Gozem Eco et Confort, TripMaster, HeroKlandoo ainsi que les Taxis traditionnels). L'algorithme prend en compte la distance kilométrique, la durée estimée du parcours, la période temporelle de la journée (matin, midi, soirée) ainsi que les conditions météorologiques (beau temps ou temps pluvieux). Grâce à l'intégration de la technologie **IndexedDB** (`idb`), l'ensemble de ces fonctionnalités reste pleinement opérationnel même en l'absence totale de connexion internet.

#### A. En tant qu'Employé :
Lorsqu'un employé souhaite évaluer le coût d'un déplacement professionnel, il se rend sur l'onglet du comparateur de tarifs. L'agent peut soit saisir directement dans la barre de recherche le nom du lieu de départ et du lieu d'arrivée, soit sélectionner un itinéraire préenregistré dans la liste déroulante des trajets fréquents de Citrine. L'utilisateur affine ensuite sa recherche en cochant la période de la journée durant laquelle le trajet aura lieu, puis en indiquant la météo actuelle au moyen d'un bouton bascule. Dès que ces paramètres sont renseignés, l'application affiche un tableau comparatif instantané classant tous les transporteurs partenaires par ordre croissant de prix. Un indicateur visuel met en évidence l'option la plus économique ainsi que l'option la plus rapide pour guider le choix de l'agent. Si la connexion internet vient à être interrompue pendant l'intervention sur le terrain, un badge d'avertissement jaune s'affiche en haut de l'écran pour indiquer le passage en mode hors ligne, permettant à l'employé de continuer à consulter et enregistrer ses simulations en toute fluidité.

#### B. En tant que Responsable :
Le responsable de pôle utilise ce module pour contrôler et valider les notes de frais de transport soumises par les membres de son équipe. En accédant à la grille globale des tarifs, le manager peut effectuer un filtrage croisé par période horaire, par condition météorologique ou par zone géographique afin de vérifier si le montant réclamé par un coursier correspond aux barèmes de la période considérée. Il peut également ajouter de nouvelles destinations récurrentes dans le catalogue pour faciliter les futures démarches de ses collaborateurs. En cas de contestation sur le prix d'une course, le responsable peut simuler le trajet exact effectué à l'heure précise de la mission pour constater d'éventuelles majorations dues aux embouteillages ou à la pluie.

#### C. En tant qu'Administrateur :
L'administrateur détient l'autorité exclusive sur le paramétrage de l'algorithme de calcul des coûts. En ouvrant le panneau de configuration des tarifs, l'administrateur définit le prix du tarif de base, le coût au kilomètre parcouru, le tarif à la minute écoulée ainsi que les coefficients de majoration applicables en cas de forte pluie ou de trajet nocturne. L'administrateur peut à tout moment ajouter une nouvelle ligne de transport dans la base de données Firestore ou supprimer des trajets obsolètes. En période de retour de connexion après un travail en zone isolée, l'administrateur dispose d'un bouton de synchronisation manuelle qui pousse l'intégralité des enregistrements conservés en local dans la base de données centrale afin de garantir la cohérence des données comptables de Citrine.

---

### MODULE 2 : SUIVI DES PRÉSENCES ET BORNE KIOSK DE POINTAGE (GPS & QR CODE)

#### Description Générale du Module
Ce module offre une traçabilité rigoureuse des heures d'arrivée et de départ des collaborateurs de Citrine. Il combine le pointage individuel géolocalisé via smartphone ou ordinateur portable avec un système de borne fixe (*Kiosk*) installée à l'accueil des locaux ou sur les sites d'intervention. La borne Kiosk permet un enregistrement rapide par lecture de badge QR Code ou par saisie d'un code PIN confidentiel.

#### A. En tant qu'Employé :
Au début de sa journée de travail, l'employé ouvre l'application Citrine sur son appareil ou s'approche de la borne Kiosk du bureau. S'il utilise son appareil personnel, il clique sur le bouton de pointage d'entrée, ce qui déclenche une demande d'autorisation de géolocalisation GPS afin de certifier sa présence effective sur le site de travail. Si l'employé arrive après l'heure officielle d'embauche, une fenêtre surgissante l'invite obligatoirement à saisir un motif de justification rédigé pour expliquer la cause de son retard. S'il préfère utiliser la borne Kiosk physique de l'entreprise, l'employé présente simplement la carte virtuelle contenant son QR Code nominatif devant la caméra de la tablette, ce qui valide son pointage en moins de deux secondes avec un signal sonore de confirmation. En fin de journée, l'employé réitère la procédure en cliquant sur le bouton de pointage de sortie pour enregistrer la fin de son service.

#### B. En tant que Responsable :
Le responsable de pôle accède à un tableau de bord d'assiduité actualisé en temps réel qui liste l'ensemble des membres de son service. Le manager peut filtrer la vue pour afficher séparément les collaborateurs présents, les employés en retard, les agents absents et les personnes en mission extérieure. Lorsqu'un employé soumet une justification de retard, une alerte visuelle apparaît sur l'écran du responsable, lui permettant de lire l'explication fournie et de cliquer sur le bouton d'approbation ou de rejet. Le responsable peut également ouvrir la carte interactive des pointages pour vérifier la position géographique exacte transmise lors du déclenchement du GPS. En cas d'oubli de badge ou de problème technique rencontré par un agent sur le terrain, le responsable dispose de l'habilitation nécessaire pour effectuer un pointage manuel d'ajustement afin de régulariser le relevé d'heures de son collaborateur.

#### C. En tant qu'Administrateur :
L'administrateur est chargé de configurer le comportement global du système de pointage de Citrine. Depuis son espace de gestion, il définit les heures officielles de début et de fin de service pour chaque département de l'entreprise, tout en ajustant la tolérance de retard autorisée avant le déclenchement d'un signalement. Pour mettre en service une borne Kiosk dans un bâtiment, l'administrateur active le mode Kiosk plein écran et verrouille l'interface au moyen d'un mot de passe de sécurité pour empêcher toute manipulation non autorisée par des tiers. Il effectue également le contrôle des tentatives de fraude ou des anomalies de coordonnées GPS et procède à la clôture mensuelle du registre de présence en vue du calcul de la paie.

---

### MODULE 3 : ESPACE COLLABORATEUR (PORTAIL EMPLOYÉ DÉDIÉ)

#### Description Générale du Module
L'Espace Collaborateur constitue le portail personnel sécurisé de chaque salarié de Citrine. Il centralise toutes les informations relatives à sa situation contractuelle, son historique de pointage, son badge officiel, ses tâches en cours, ses demandes financières et ses bulletins de salaire.

#### A. En tant qu'Employé :
En se connectant à son espace personnel, l'employé accède immédiatement à un tableau de bord récapitulant sa situation au sein de l'entreprise. Il peut visualiser sa fiche d'identité professionnelle indiquant son poste, son département d'affectation et la nature de son contrat de travail. L'employé peut afficher à tout moment son badge officiel contenant un QR Code unique haute définition, qu'il peut enregistrer sur son téléphone pour badger rapidement sur le site. Il peut consulter le journal complet de ses heures de travail pour vérifier le nombre d'heures effectuées dans le mois ainsi que le cumul de ses heures supplémentaires. Depuis ce même espace, l'employé peut rédiger une demande d'avance sur salaire en précisant le montant requis et le motif de la demande, puis suivre en direct l'avancement de la validation par la direction. Enfin, il peut télécharger en un clic l'historique de ses bulletins de paie validés au format PDF.

#### B. En tant que Responsable :
Le responsable de pôle consulte la déclinaison d'équipe de l'espace collaborateur afin d'avoir une vue d'ensemble sur le profil des agents placés sous sa direction. Le manager peut passer en revue les fiches de ses collaborateurs pour vérifier leurs horaires théoriques, leurs qualifications actuelles ainsi que leur volume de travail. Cette consultation lui permet d'adapter l'attribution des projets en veillant à ne pas surcharger certains salariés tout en préservant l'équité au sein du service.

#### C. En tant qu'Administrateur :
L'administrateur gère l'attribution et la sécurité des accès au portail collaborateur. Lorsqu'un nouveau salarié rejoint l'effectif de Citrine, l'administrateur crée ses identifiants de connexion et génère son jeton unique de badge QR Code. En cas de perte de téléphone ou de suspicion de compromission de sécurité, l'administrateur peut réinitialiser le mot de passe de l'utilisateur ou régénérer un nouveau jeton de badge en un seul clic. Il modifie également les éléments fixes de la fiche du salarié tels que le salaire de base, le taux horaire contractuel ou l'intitulé du poste occupé.

---

### MODULE 4 : STATISTIQUES, PONCTUALITÉ ET ANALYSE D'ASSIDUITÉ

#### Description Générale du Module
Ce module décisionnel transforme les données brutes accumulées lors des pointages quotidien en indicateurs clés de performance (KPIs) et en graphiques statistiques interactifs. Il permet d'évaluer la ponctualité globale, le taux d'absentéisme et le volume des heures supplémentaires réalisées au sein de l'entreprise Citrine.

#### A. En tant qu'Employé :
L'employé accède à une vue synthétique restreinte à ses propres performances individuelles. Un indicateur circulaire lui présente son taux personnel d'assiduité exprimé en pourcentage pour le mois en cours. Il peut consulter un historique visuel comparant ses heures d'arrivée effectives par rapport à l'heure officielle d'embauche, lui permettant ainsi de mesurer sa propre ponctualité et de prendre les dispositions nécessaires pour corriger d'éventuels retards récurrents.

#### B. En tant que Responsable :
Le responsable de pôle exploite le tableau de bord analytique de son département pour piloter l'efficacité de son équipe. Il peut filtrer les résultats par semaine, par mois ou par collaborateur afin d'identifier rapidement les tendances d'absentéisme ou les retards répétés. L'outil calcule automatiquement le cumul des heures supplémentaires effectuées par chaque agent, offrant au manager des données chiffrées précises pour arbitrer l'attribution des repos compensateurs ou la validation des majorations de salaire lors des réunions d'évaluation.

#### C. En tant qu'Administrateur :
L'administrateur bénéficie d'une vision globale et consolidée de l'ensemble des services de Citrine. À travers des graphiques comparatifs avancés générés par la bibliothèque Recharts (histogrammes d'assiduité, diagrammes de répartition des motifs d'absence), l'administrateur évalue la performance relative de chaque département. Il peut mesurer l'impact financier du volume global d'heures supplémentaires à l'échelle de l'entreprise et exporter des rapports statistiques complets destinés au conseil d'administration pour orienter les décisions stratégiques des ressources humaines.

---

### MODULE 5 : GESTION DES COLLABORATEURS ET ANNUAIRE RH

#### Description Générale du Module
L'annuaire RH centralise l'ensemble du registre du personnel de Citrine en conservant l'historique administratif, les coordonnées de contact, la structure hiérarchique et le suivi contractuel de chaque employé.

#### A. En tant qu'Employé :
L'employé utilise ce module comme un trombinoscope et un annuaire d'entreprise. Dans la barre de recherche, il peut taper le nom d'un collègue, un numéro de téléphone ou le nom d'un département pour trouver instantanément les coordonnées professionnelles d'un collaborateur. Cet outil facilite la communication interne en permettant de contacter rapidement un collègue par courriel ou par téléphone pour les besoins d'une mission. Pour des raisons de confidentialité, l'employé ne peut pas visualiser les données sensibles telles que les salaires ou les adresses personnelles des autres membres du personnel.

#### B. En tant que Responsable :
Le responsable de pôle accède à la liste détaillée des agents qui composent son unité opérationnelle. Il peut filtrer l'annuaire par statut contractuel (*Actif, En congé, Suspendu, Inactif*) afin d'adapter la planification des interventions sur le terrain. Lorsqu'un nouvel arrivant intègre son service, le responsable peut renseigner des notes d'évaluation interne sur son profil ou lui attribuer du matériel de fonction directement depuis sa fiche collaborateur.

#### C. En tant qu me Administrateur :
L'administrateur dispose des droits d'édition complète sur l'ensemble des fiches du personnel de Citrine. Pour enregistrer un nouveau salarié, l'administrateur remplit le formulaire de création en indiquant le nom, le prénom, l'adresse email, le numéro de téléphone, le département, le salaire de base mensuel en FCFA et le taux horaire retenu. C'est également à ce niveau que l'administrateur attribue le rôle système du compte (*Employé, Responsable ou Administrateur*) et procède à l'impression du badge officiel ou à l'exportation globale du fichier du personnel.

---

### MODULE 6 : GESTION DES TÂCHES ET SUIVI KANBAN (PROJETS & OPÉRATIONS)

#### Description Générale du Module
Ce module de gestion du travail permet d'organiser, de planifier et d'exécuter les différentes missions logistiques et administratives de Citrine. Il offre deux modes de visualisation complémentaires : une vue en liste synthétique et un tableau Kanban interactif structuré en quatre colonnes (*À faire, En cours, En attente, Complété*).

#### A. En tant qu'Employé :
Lorsque l'employé ouvre le module de gestion des tâches, il retrouve l'ensemble des cartes de travail qui lui ont été personnellement attribuées par sa hiérarchie. L'agent peut classer sa liste par ordre de priorité afin de traiter en premier lieu les urgences signalées par un étiquetage rouge. Pour informer son équipe de l'avancement de son travail, l'employé fait simplement glisser sa carte de tâche de la colonne *À faire* vers la colonne *En cours*, puis vers la colonne *Complété* une fois la mission achevée. Il peut cliquer sur une carte pour ouvrir la fenêtre de détail et rédiger un commentaire ou ajouter une observation explicative sur les difficultés rencontrées sur le terrain.

#### B. En tant que Responsable :
Le responsable de pôle utilise le tableau Kanban comme un outil de pilotage du flux de travail de son équipe. Pour créer une nouvelle tâche, le manager clique sur le bouton de création, saisit le titre de la mission, rédige la description de la consigne, définit la date limite d'exécution et sélectionne un ou plusieurs exécutants parmi ses collaborateurs. Il attribue également un niveau de priorité (*Basse, Moyenne, Haute, Urgente*). En observant le tableau d'ensemble, le responsable peut rapidement repérer les cartes bloquées dans la colonne *En attente* et réorganiser les charges de travail en déplaçant les cartes d'un agent à un autre pour éviter les retards.

#### C. En tant qu'Administrateur :
L'administrateur détient une vue transversale sur l'intégralité des chantiers et des projets menés au sein de l'entreprise Citrine. Il a la possibilité d'intervenir sur n'importe quel tableau pour réattribuer des tâches en masse lors d'une restructuration de service ou pour clôturer des projets terminés. L'administrateur peut également analyser les délais moyens d'exécution des tâches par département afin d'optimiser les processus opérationnels de la société.

---

### MODULE 7 : RAPPELS ET ALERTES SONORES MULTI-NIVEAUX

#### Description Générale du Module
Ce module prévient les oublis d'échéances stratégiques en combinant des alertes visuelles dans l'application, des notifications push sur le système d'exploitation et des signaux sonores synthétisés via la **Web Audio API**.

#### A. En tant qu'Employé :
L'employé utilise ce module pour programmer ses propres rappels personnels liés à ses tâches quotidiennes, comme l'heure d'un appel téléphonique important ou le départ d'une livraison. Lors de la création du rappel, l'agent choisit le moment du déclenchement ainsi que le délai d'avertissement préalable ($5min, 15min, 30min$). Lorsque l'heure fixée arrive, l'application émet un signal sonore caractéristique et affiche un bandeau de notification à l'écran, permettant à l'employé soit d'éteindre l'alarme en cliquant sur le bouton de confirmation, soit de la repousser de quelques minutes au moyen de la fonction d'ajournement (*Snooze*).

#### B. En tant que Responsable :
Le responsable de pôle s'appuie sur ce module pour diffuser des avertissements collectifs à destination des membres de son service. Il peut programmer un rappel pour une réunion d'équipe imprévue ou fixer une alerte sonore sur les postes de ses agents quelques minutes avant l'échéance d'un livrable prioritaire. Le manager peut vérifier dans l'historique des notifications si l'alerte a bien été reçue par les collaborateurs concernés.

#### C. En tant qu'Administrateur :
L'administrateur gère le paramétrage technique et la diffusion des alertes à l'échelle globale de Citrine. Il peut programmer des rappels institutionnels destinés à l'ensemble du personnel, tels que l'annonce d'une fermeture exceptionnelle des bureaux ou l'échéance du renouvellement des assurances de la flotte automobile. L'administrateur configure également l'intensité et la fréquence des signaux sonores dans les paramètres généraux de l'application.

---

### MODULE 8 : PARC D'INVENTAIRE ET GESTION DU MATÉRIEL

#### Description Générale du Module
Ce module de comptabilisation et de traçabilité permet de gérer l'ensemble des biens, fournitures, téléphones, matériels informatiques, outillages et véhicules appartenant à l'entreprise Citrine.

#### A. En tant qu'Employé :
L'employé consulte la section inventaire de son profil pour prendre connaissance de la liste exacte des biens de l'entreprise qui lui ont été officiellement confiés (par exemple un ordinateur portable référencé `INV-2026-042` ou un téléphone de fonction). Si le salarié constate une dégradation, une panne ou la perte d'un équipement qui lui est attribué, il peut directement cliquer sur l'équipement concerné pour déclarer un incident et demander un remplacement ou une réparation auprès du service logistique.

#### B. En tant que Responsable :
Le responsable de pôle effectue l'affectation et le suivi du matériel au sein de son service. Lorsqu'un agent rejoint son équipe, le responsable ouvre le catalogue de l'inventaire, sélectionne un bien disponible et l'attribue au profil du salarié. Il procède également à des contrôles d'inventaire physiques récurrents pour s'assurer du bon état des équipements distribués et met à jour leur statut (*Neuf, Bon état, Usagé, En réparation*) en fonction des retours du terrain.

#### C. En tant qu'Administrateur :
L'administrateur est responsable de l'enregistrement initial et de la valorisation du patrimoine matériel de Citrine. Pour intégrer un nouvel équipement dans l'application, l'administrateur renseigne sa désignation, sa catégorie, sa référence interne, sa valeur d'achat en FCFA, son emplacement physique par défaut ainsi que les consignes d'entretien. L'outil calcule automatiquement la valeur globale du parc matériel de l'entreprise. L'administrateur est également la seule personne habilitée à prononcer le retrait définitif ou la mise au rebut d'un bien réformé.

---

### MODULE 9 : GESTION DES PARTENAIRES ET PRESTATAIRES EXTERNES

#### Description Générale du Module
Ce registre d'entreprise centralise le réseau de partenaires d'affaires de Citrine, incluant les chauffeurs indépendants, les motomen, les flottes de Taxis, les sous-traitants logistiques et les fournisseurs de services.

#### A. En tant qu'Employé :
L'employé consulte le répertoire des partenaires pour trouver rapidement les coordonnées téléphoniques d'un prestataire externe dans le cadre d'une intervention sur le terrain. En saisissant le nom d'un quartier ou la catégorie du service recherché dans la barre de recherche, l'agent accède immédiatement au contact du sous-traitant pour organiser une course ou solliciter un dépannage rapide.

#### B. En tant que Responsable :
Le responsable de pôle enrichit l'annuaire des partenaires en enregistrant les nouveaux sous-traitants identifiés lors des missions opérationnelles. Il renseigne les coordonnées complètes du partenaire, sélectionne sa catégorie d'activité et indique les tarifs négociés. À l'issue d'une prestation, le responsable peut attribuer une note de fiabilité sur la fiche du partenaire pour guider les choix futurs de son équipe.

#### C. En tant qu'Administrateur :
L'administrateur gère l'approbation formelle des conventions de partenariat de Citrine. Il valide le passage d'un prospect au statut de partenaire *Actif*, négocie les accords-cadres tarifaires à grande échelle et conserve les pièces administratives obligatoires liées aux contrats de sous-traitance.

---

### MODULE 10 : CENTRE DE COMMUNICATION (WHATSAPP CLOUD API & EMAILS)

#### Description Générale du Module
Ce centre d'expédition multicanal permet à Citrine de diffuser des messages d'information, des consignes de service et des documents officiels directement par **WhatsApp Cloud API** ou par **Courriel (Resend/SMTP)**.

#### A. En tant qu'Employé :
L'employé bénéficie de ce module en tant que destinataire privilégié des informations de l'entreprise. Il reçoit sur son application WhatsApp personnelle ou dans sa boîte de messagerie électronique ses notifications de planning, ses convocations administratives ainsi que la confirmation de la mise à disposition de son bulletin de paie mensuel.

#### B. En tant que Responsable :
Le responsable de pôle utilise l'interface de communication pour envoyer des messages groupés à l'ensemble des membres de son unité. Après avoir rédigé son texte ou sélectionné un modèle de message prédéfini, le manager choisit le canal le plus approprié en fonction de l'urgence (WhatsApp pour un avertissement immédiat sur le terrain, ou Email pour une consigne de service formelle). Il peut ensuite suivre dans l'historique d'envoi le statut de distribution de ses messages.

#### C. En tant qu'Administrateur :
L'administrateur assure la configuration technique et la sécurité des canaux de communication. Dans le panneau de réglage des connexions externes, l'administrateur renseigne les clés d'API secrètes du compte WhatsApp Business ainsi que les identifiants du serveur SMTP de messagerie. Il crée également les trames de messages officielles de Citrine et supervise les journaux de diffusion pour détecter d'éventuelles erreurs de transmission.

---

### MODULE 11 : GENERATEUR DE DOCUMENTS CONTRACTUELS ET RH

#### Description Générale du Module
Le générateur de documents permet de créer instantanément des pièces administratives et contractuelles parfaitement mises en page et prêtes pour l'impression ou l'exportation au format PDF.

#### A. En tant qu'Employé :
Depuis son espace personnel, l'employé peut formuler une demande de document administratif, telle qu'une attestation de travail ou une demande de certificat d'emploi. Dès que la demande est validée par les services administratifs, le salarié peut télécharger directement son document PDF officiel comportant les en-têtes et le tampon numérique de Citrine.

#### B. En tant que Responsable :
Le responsable de pôle peut solliciter la génération automatique d'ordres de mission pour les agents appelés à se déplacer en dehors de leur zone habituelle d'affectation. Le manager vérifie la conformité des dates et des objectifs renseignés sur le document avant de le transmettre à l'agent concerné.

#### C. En tant qu'Administrateur :
L'administrateur est le principal utilisateur du générateur de contrats. Lorsqu'un nouveau collaborateur est embauché, l'administrateur sélectionne le type de modèle souhaité (Contrat CDI, Contrat CDD, Période d'essai ou Avenant), puis le système pré-remplit automatiquement toutes les clauses légales avec les données de la fiche RH du salarié (nom, prénom, salaire, poste, horaires). L'administrateur édite également les trames de documents et génère l'ensemble des bulletins de paie mensuels en fin de cycle comptable.

---

### MODULE 12 : FINANCES, MASSE SALARIALE ET AVANCES SUR SALAIRE

#### Description Générale du Module
Ce module financier assure la gestion de la comptabilité sociale, le suivi des dépenses salariales, la gestion des demandes d'avances sur salaire et la comptabilisation des paiements effectués par Citrine.

#### A. En tant qu'Employé :
Lorsqu'un employé fait face à une urgence financière, il ouvre l'onglet des demandes d'avance de son espace collaborateur. L'agent remplit le formulaire en indiquant le montant souhaité en FCFA ainsi que le motif explicatif de sa demande. Une fois le formulaire soumis, l'employé peut suivre l'évolution de son dossier à travers trois états successifs (*En attente, Approuvé, Rejeté*). Lorsque l'avance est accordée et versée, le montant est automatiquement consigné dans son relevé de compte personnel et sera déduit de son prochain bulletin de paie.

#### B. En tant que Responsable :
Le responsable de pôle intervient comme premier niveau de vérification lors de l'émission d'une demande d'avance par un membre de son équipe. Le manager consulte le dossier, vérifie l'assiduité et la qualité du travail du salarié concerné, puis émet un avis favorable ou défavorable motivé à l'attention de la direction financière.

#### C. En tant qu'Administrateur :
L'administrateur détient le pouvoir de décision financière finale. En ouvrant la console de gestion des avances, il examine les demandes soumises, prend connaissance de l'avis du responsable de pôle et clique sur le bouton d'approbation ou de rejet. S'il approuve la demande, l'administrateur sélectionne le mode de versement effectué (virement bancaire, transfert Mobile Money ou paiement en espèces) pour débloquer les fonds. Lors de la clôture mensuelle de la paie, l'administrateur valide le calcul global du salaire net à verser après déduction automatique des avances et ajout des primes ou heures supplémentaires, puis enregistre la transaction financière dans le journal comptable de Citrine.

---

### MODULE 13 : REGISTRE D'AUDIT, NOTIFICATIONS ET LOGS SYSTÈME

#### Description Générale du Module
Le journal d'audit est un registre de sécurité inaltérable qui enregistre automatiquement chaque événement, modification de donnée, tentative de connexion ou transaction effectuée sur la plateforme Citrine.

#### A. En tant qu'Employé :
L'employé a accès à un relevé simplifié affichant l'historique des notifications système qui lui ont été personnellement adressées, comme la confirmation d'enregistrement de ses pointages ou la validation de ses demandes.

#### B. En tant que Responsable :
Le responsable de pôle peut consulter le fil d'actualité des activités au sein de son service pour suivre en temps réel les actions réalisées par ses collaborateurs (mise à jour d'une tâche, pointage d'arrivée, déclaration d'un matériel défectueux).

#### C. En tant qu'Administrateur :
L'administrateur accède à la console d'audit globale de sécurité. L'outil présente un tableau chronologique détaillé indiquant pour chaque action : la date et l'heure exactes à la seconde près, l'adresse IP de l'utilisateur, l'identité de l'auteur et la nature précise de l'opération effectuée (ex: *Suppression d'un trajet tarifaire, Modification d'un taux horaire, Validation d'une avance sur salaire*). L'administrateur peut utiliser la barre de recherche et les filtres de sécurité pour mener des investigations en cas de comportement suspect ou d'erreur de manipulation.

---

### MODULE 14 : GESTION DES UTILISATEURS, DROITS ET INTERRUPTEURS DE MODULES (FEATURE FLAGS)

#### Description Générale du Module
Ce module d'administration système permet d'accorder les accès applicatifs et d'activer ou de désactiver à la volée les briques fonctionnelles de la plateforme Citrine en fonction des décisions stratégiques de la direction.

#### A. En tant qu'Employé :
Ce module est totalement invisible et inaccessible pour l'employé afin d'assurer la sécurité du système.

#### B. En tant que Responsable :
Ce module est également strictement restreint et inaccessible pour le responsable de pôle.

#### C. En tant qu'Administrateur (Exclusif) :
L'administrateur utilise ce panneau pour gérer l'annuaire des comptes utilisateurs de l'application. Pour créer un accès, il saisit l'adresse email professionnelle du salarié, attribue son rôle (*Employé, Responsable ou Administrateur*) et génère un mot de passe temporaire. L'administrateur gère également le panneau des interrupteurs de fonctionnalités (*Feature Flags*), lui permettant de cocher ou décocher des boutons bascules pour masquer ou faire apparaître instantanément des modules entiers dans l'interface de tous les utilisateurs :
* `enablePricing` : Active ou masque le comparateur tarifaire logistique.
* `enableInventory` : Active ou masque le module de gestion du parc matériel.
* `enablePartners` : Active ou masque le répertoire des partenaires externes.
* `enableCommunications` : Active ou masque la passerelle d'envoi WhatsApp et Mail.
* `enableDocuments` : Active ou masque le générateur automatique de contrats.
* `enableFinances` : Active ou masque le module comptable de paie et d'avances.
* `enableLogs` : Active ou masque la console d'audit de sécurité.

---

## 3. MATRICE SYNTHÉTIQUE DES DROITS ET PRIVILÈGES (RBAC)

| Module applicatif | Rôle Employé | Rôle Responsable | Rôle Administrateur |
| :--- | :---: | :---: | :---: |
| **Comparateur Tarifs** | Consultation & Simulation | Validation Frais & Filtrage | Configuration Barèmes & Sync |
| **Pointage Présences** | Pointage GPS, Kiosk & Motif | Supervision Équipe & Carte | Verrouillage Kiosk & Horaires |
| **Espace Collaborateur** | Consultation Profil & Badge | Consultation Profil Équipe | Gestion Droits & Mots de Passe |
| **Statistiques Assiduité** | Graphique Personnel | KPIs Équipe & Heures Supp | Analytics Globaux & Exports |
| **Annuaire RH** | Recherche Coordonnées | Suivi Présence Service | Édition Salaires & Statuts |
| **Gestion des Tâches** | Exécution & Commentaires | Assignation & Kanban Équipe | Supervision Tous Projets |
| **Rappels & Alertes** | Program. Rappels Perso | Diffusion Alertes Service | Config Sonore & Push Globale |
| **Inventaire Matériel** | Voir ses Équipements | Affectation & Inventaire | Saisie Valeurs & Rebuts |
| **Partenaires Externe** | Recherche Contacts | Ajout & Évaluation Rendu | Validation Contrats & Tarifs |
| **Centre Communication** | Réception Messages | Envoi Groupé à l'Équipe | Paramétrage Clés API & Trame |
| **Générateur Documents** | Télécharger ses Fiches | Génération Ordres Mission | Édition Modèles & Contrats |
| **Finances & Avances** | Demande d'Avance | Avis Motivé sur Demandes | Approbation & Clôture Paie |
| **Journal d'Audit** | Relevé Personnel | Journal d'Activité Équipe | Audit Global Sécurité & IP |
| **Feature Flags / Settings** | Aucun Accès | Aucun Accès | Gestion Rôles & Modules |

---

## 4. ARCHITECTURE TECHNIQUE & RÉSILIENCE HORS LIGNE

```
+---------------------------------------------------------------------------------+
|                                    FRONTEND                                     |
|                      React 18 + TypeScript + Tailwind CSS                       |
|  +---------------------------------------------------------------------------+  |
|  |                     MOTEUR OFFLINE-FIRST (IndexedDB / idb)                 |  |
|  |   Lecture / Écriture locale instantanée <---> Queue de Synchronisation    |  |
|  +---------------------------------------------------------------------------+  |
+----------------------------------------+----------------------------------------+
                                         |
                            (Auto Sync lors du retour Réseau)
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                                BACKEND & BAAS                                   |
|  +-----------------------------------+   +-----------------------------------+  |
|  |         Firebase Firestore        |   |       Firebase Authentication     |  |
|  |   Base de données Temps Réel      |   |   Gestion Sécurisée des Accès     |  |
|  +-----------------------------------+   +-----------------------------------+  |
+---------------------------------------------------------------------------------+
```

---

*Document officiel de spécifications produit rédigé pour la Direction Générale et l'Équipe Technique de CITRINE.*
