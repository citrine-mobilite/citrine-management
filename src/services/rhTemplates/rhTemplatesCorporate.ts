import { RHDocTemplate } from '../../types';

export const RH_TEMPLATES_CORPORATE: RHDocTemplate[] = [
  {
    id: 'tpl-job-description',
    name: 'Fiche de Poste & Définition des Missions',
    category: 'job_description',
    formatType: 'word',
    description: "Descriptif type des responsabilités, compétences et indicateurs de performance d'un poste.",
    defaultSignature: false,
    fields: [
      { key: 'jobTitle', label: 'Intitulé du Poste', type: 'text', defaultValue: "Chef d'Équipe Logistique & Parc" },
      { key: 'department', label: 'Département', type: 'text', defaultValue: 'Opérations & Maintenance' },
      { key: 'hierarchicalSupervisor', label: 'Supérieur Hiérarchique', type: 'text', defaultValue: "Directeur d'Exploitation" },
      { key: 'primaryMissions', label: 'Missions Principales', type: 'textarea', defaultValue: "1. Planifier les rotations de véhicules et le pointage des chauffeurs.\n2. Contrôler les carnets de bord et la consommation de carburant.\n3. Veiller à la disponibilité opérationnelle du matériel 24/7." },
      { key: 'requiredSkills', label: 'Compétences Requises', type: 'textarea', defaultValue: 'Rigueur organisationnelle, maîtrise de la gestion de flotte, sens du leadership et gestion du stress.' }
    ],
    bodyTemplate: `FICHE DE POSTE ET RÉFÉRENTIEL DE MISSIONS

INTITULÉ DU POSTE : {{jobTitle}}
DÉPARTEMENT       : {{department}}
RATTACHEMENT      : {{hierarchicalSupervisor}}

1. FINALITÉ DU POSTE
Le titulaire du poste garantit la fluidité, la sécurité et la conformité des processus qui lui sont confiés.

2. MISSIONS PRINCIPALES ET ACTIVITÉS CLÉS
{{primaryMissions}}

3. COMPÉTENCES ET PRÉREQUIS TECHNIQUES
{{requiredSkills}}

Document type émis par la Direction des Ressources Humaines.`
  },
  {
    id: 'tpl-regulation',
    name: 'Règlement Intérieur & Charte de Conduite',
    category: 'regulation',
    formatType: 'word',
    description: "Modèle de charte collective fixant les règles de sécurité, d'éthique et de discipline générale.",
    defaultSignature: false,
    fields: [
      { key: 'scope', label: "Périmètre d'application", type: 'text', defaultValue: 'Ensemble des sites, ateliers et bureaux de CITRINE SARL' },
      { key: 'workHours', label: 'Horaires collectifs', type: 'text', defaultValue: 'Du lundi au vendredi : 08h00 - 12h30 et 13h30 - 17h00' },
      { key: 'safetyRules', label: 'Règles de sécurité clés', type: 'textarea', defaultValue: 'Le port des EPI (casque, gilet, chaussures de sécurité) est strictement obligatoire sur toutes les zones techniques.' },
      { key: 'ethicsSummary', label: 'Dispositions éthiques', type: 'textarea', defaultValue: 'Intolérance totale envers le harcèlement, la discrimination et toute forme de corruption.' }
    ],
    bodyTemplate: `RÈGLEMENT INTÉRIEUR ET CHARTE DE BONNE CONDUITE

PÉRIMÈTRE D'APPLICATION : {{scope}}

ARTICLE 1 - HORAIRES DE TRAVAIL ET PONCTUALITÉ
{{workHours}}
Tout retard ou absence doit être impérativement signalé au supérieur hiérarchique dès le début de journée.

ARTICLE 2 - HYGIÈNE ET SÉCURITÉ AU TRAVAIL
{{safetyRules}}

ARTICLE 3 - ÉTHIQUE ET PROBITÉ
{{ethicsSummary}}

Le présent règlement est porté à la connaissance de tout le personnel par affichage et remise lors de l'intégration.`
  },
  {
    id: 'tpl-evaluation',
    name: "Grille d'Évaluation & Entretien Annuel",
    category: 'evaluation',
    formatType: 'word',
    description: "Trame d'entretien professionnel périodique, évaluation des objectifs et besoins en formation.",
    defaultSignature: false,
    fields: [
      { key: 'campaignYear', label: 'Année de la Campagne', type: 'text', defaultValue: `${new Date().getFullYear()}` },
      { key: 'evaluationCriteria', label: "Critères d'évaluation", type: 'textarea', defaultValue: "1. Atteinte des objectifs quantitatifs et qualitatifs fixés\n2. Rigueur professionnelle et respect des délais\n3. Esprit d'équipe et communication avec les pairs\n4. Autonomie et force de proposition" },
      { key: 'developmentPlans', label: "Axes d'amélioration & Formations envisagées", type: 'textarea', defaultValue: 'Formation aux nouveaux outils de gestion de projet et perfectionnement en sécurité industrielle.' }
    ],
    bodyTemplate: `GRILLE DE SYNTHÈSE - ENTRETIEN ANNUEL D'ÉVALUATION

CAMPAGNE D'ÉVALUATION : Année {{campaignYear}}

1. GRILLE DE NOTATION DES COMPÉTENCES
{{evaluationCriteria}}

2. PLAN DE DÉVELOPPEMENT ET SOUHAITS D'ÉVOLUTION
{{developmentPlans}}

3. CONCLUSION GÉNÉRALE
Document support d'entretien professionnel à renseigner lors de l'échange bilatéral.`
  },
  {
    id: 'tpl-proforma',
    name: 'Facture Proforma / Proposition Commerciale',
    category: 'proforma',
    formatType: 'word',
    description: 'Facture proforma commerciale pour propositions de services, ventes de matériel ou prestations.',
    defaultSignature: false,
    fields: [
      { key: 'clientName', label: 'Nom du Client / Entreprise', type: 'text', defaultValue: 'Société Générale de Bâtiment (SGB)' },
      { key: 'clientAddress', label: 'Adresse du Client', type: 'text', defaultValue: 'Boulevard de la Liberté, Douala' },
      { key: 'projectName', label: 'Intitulé du Projet / Prestation', type: 'text', defaultValue: 'Fourniture et installation de matériel informatique et mobilier' },
      { key: 'itemDescription', label: 'Description des articles ou prestations', type: 'textarea', defaultValue: "- 05 Ordinateurs Portables Dell Latitude 5420\n- 05 Fauteuils ergonomiques Mesh Black\n- 01 Imprimante Multifonction HP LaserJet" },
      { key: 'quantity', label: 'Quantité globale', type: 'number', defaultValue: '11' },
      { key: 'totalAmount', label: 'Montant Total HT (FCFA)', type: 'number', defaultValue: '4250000' },
      { key: 'validityDays', label: 'Validité de l offre (jours)', type: 'number', defaultValue: '30' },
      { key: 'paymentTerms', label: 'Conditions de règlement', type: 'text', defaultValue: '50% à la commande, solde à la livraison' }
    ],
    bodyTemplate: `FACTURE PROFORMA / PROPOSITION COMMERCIALE

RÉFÉRENCE : PRO-2026-001
DATE : {{effectiveDate}}

CLIENT :
{{clientName}}
Adresse : {{clientAddress}}

OBJET : {{projectName}}

--------------------------------------------------------------------------------
DÉTAIL DES PRESTATIONS OU ÉQUIPEMENTS :
{{itemDescription}}

QUANTITÉ TOTALE : {{quantity}} unités
MONTANT TOTAL H.T. : {{totalAmount}} FCFA
TVA (19.25%) : En sus / Applicable selon régime

--------------------------------------------------------------------------------
CONDITIONS COMMERCIALES ET MODALITÉS :
- Validité de l'offre : {{validityDays}} jours à compter de l'émission.
- Conditions de règlement : {{paymentTerms}}.
- Délai de livraison : Selon disponibilité en stock ou sur planning.

Arrêtée la présente facture proforma à la somme de : [{{totalAmount}}] FRANCS CFA.

Pour accord et acceptation,
La Direction Commerciale & Financière`
  }
];
