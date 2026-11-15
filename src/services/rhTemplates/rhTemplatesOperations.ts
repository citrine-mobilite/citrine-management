import { RHDocTemplate } from '../../types';

export const RH_TEMPLATES_OPERATIONS: RHDocTemplate[] = [
  {
    id: 'tpl-internship',
    name: 'Attestation de Fin de Stage',
    category: 'internship',
    formatType: 'word',
    description: "Attestation de validation d'un stage académique ou professionnel.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Stagiaire', type: 'text', defaultValue: 'Sandrine FOTSO' },
      { key: 'institution', label: 'Établissement / Université', type: 'text', defaultValue: 'Institut Universitaire de la Côte (IUC)' },
      { key: 'department', label: "Service d'accueil", type: 'text', defaultValue: 'Ressources Humaines & Gestion du Personnel' },
      { key: 'startDate', label: 'Date de début', type: 'date', defaultValue: '2024-03-01' },
      { key: 'endDate', label: 'Date de fin', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'evaluationSummary', label: 'Appréciation générale', type: 'textarea', defaultValue: "Le stagiaire a fait preuve d'assiduité, de rigueur et d'une excellente capacité d'intégration dans nos équipes." }
    ],
    bodyTemplate: `ATTESTATION DE FIN DE STAGE PROFESSIONNEL

La Direction Générale de CITRINE SARL certifie par la présente que :

M./Mme {{employeeName}}, étudiant(e) à {{institution}}, a effectué un stage professionnel au sein de notre établissement, département {{department}}, du {{startDate}} au {{endDate}}.

BILAN ET APPRÉCIATION :
{{evaluationSummary}}

La présente attestation est délivrée pour servir de validation académique et professionnelle.`
  },
  {
    id: 'tpl-mission',
    name: 'Ordre de Mission & Déplacement Professionnel',
    category: 'mission',
    formatType: 'word',
    description: "Autorisation officielle et cadrage d'un déplacement de travail extérieur.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Collaborateur missionné', type: 'text', defaultValue: 'Éric MBIDA' },
      { key: 'positionTitle', label: 'Poste', type: 'text', defaultValue: 'Ingénieur Contrôle Qualité' },
      { key: 'destination', label: 'Lieu de destination', type: 'text', defaultValue: 'Kribi - Port Autonome & Zone Industrielle' },
      { key: 'departureDate', label: 'Date de départ', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'returnDate', label: 'Date de retour prévue', type: 'date', defaultValue: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
      { key: 'missionPurpose', label: 'Objet de la mission', type: 'textarea', defaultValue: "Audit technique sur site, inspection des équipements et réunion d'avancement avec le partenaire." },
      { key: 'transportMode', label: 'Moyen de transport', type: 'text', defaultValue: "Véhicule de service d'entreprise" }
    ],
    bodyTemplate: `ORDRE DE MISSION PROFESSIONNEL

Il est ordonné à :
M./Mme {{employeeName}}, exerçant les fonctions de {{positionTitle}},

De se rendre en mission officielle à : {{destination}}

PÉRIODE DE LA MISSION :
- Départ : {{departureDate}}
- Retour prévu : {{returnDate}}
- Mode de transport : {{transportMode}}

OBJET ET PROGRAMME DE TRAVAIL :
{{missionPurpose}}

Les autorités civiles et militaires ainsi que les représentants locaux sont priés de faciliter le bon accomplissement de cette mission.`
  },
  {
    id: 'tpl-discharge',
    name: "Décharge de Matériel & Restitution d'Équipement",
    category: 'discharge',
    formatType: 'word',
    description: "Attestation de mise à disposition ou de restitution de matériel de l'entreprise.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Bénéficiaire', type: 'text', defaultValue: 'Gilles BIKOI' },
      { key: 'movementType', label: 'Type de mouvement', type: 'select', defaultValue: 'Attribution / Mise à disposition', options: ['Attribution / Mise à disposition', 'Restitution définitive / Fin de poste', 'Échange pour maintenance'] },
      { key: 'equipmentList', label: 'Détail des matériels & N° de série', type: 'textarea', defaultValue: "- PC Portable Dell Latitude 5420 (S/N: DL-984210)\n- Chargeur secteur officiel + Sacoche renforcée\n- Badge sécurisé d'accès aux locaux N° B-104\n- Clé 4G professionnelle Orange" },
      { key: 'terms', label: 'Engagement de garde', type: 'textarea', defaultValue: "Le collaborateur s'engage à utiliser ces matériels exclusivement à des fins professionnelles et à les conserver en parfait état d'entretien." }
    ],
    bodyTemplate: `BORDEREAU DE DÉCHARGE ET MISE À DISPOSITION DE MATÉRIEL

TYPE D'OPÉRATION : {{movementType}}

BÉNÉFICIAIRE :
M./Mme {{employeeName}}

INVENTAIRE DES ÉQUIPEMENTS :
{{equipmentList}}

ENGAGEMENTS :
{{terms}}

En cas de perte, vol par négligence ou détérioration anormale, le collaborateur devra en informer sans délai la Direction.`
  },
  {
    id: 'tpl-convocation',
    name: 'Convocation à Entretien Préalable',
    category: 'disciplinary',
    formatType: 'word',
    description: 'Lettre formelle de convocation avant toute prise de décision disciplinaire.',
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Collaborateur', type: 'text', defaultValue: 'Marc NANA' },
      { key: 'positionTitle', label: 'Poste', type: 'text', defaultValue: 'Agent Commercial' },
      { key: 'meetingDate', label: "Date de l'entretien", type: 'date', defaultValue: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] },
      { key: 'meetingTime', label: 'Heure', type: 'text', defaultValue: '10h30' },
      { key: 'meetingLocation', label: 'Lieu de convocation', type: 'text', defaultValue: 'Bureau de la Direction RH, Siège Japoma' },
      { key: 'reason', label: 'Motifs reprochés', type: 'textarea', defaultValue: 'Absences injustifiées et manquements constatés aux consignes de sécurité le 12/03/2026.' }
    ],
    bodyTemplate: `LETTRE DE CONVOCATION À UN ENTRETIEN PRÉALABLE

À l'attention de M./Mme {{employeeName}}, {{positionTitle}}

Monsieur / Madame,

Nous vous informons par la présente que nous sommes amenés à envisager à votre encontre une mesure disciplinaire suite aux faits suivants :
{{reason}}

Conformément à la réglementation du travail, nous vous prions de vous présenter à un entretien préalable qui se tiendra :
- Le : {{meetingDate}}
- À : {{meetingTime}}
- Lieu : {{meetingLocation}}

Lors de cet entretien, vous pourrez exposer vos explications sur les faits qui vous sont reprochés et vous faire assister par un délégué du personnel de votre choix.`
  },
  {
    id: 'tpl-warning',
    name: 'Notification de Sanction (Avertissement Écrit)',
    category: 'disciplinary',
    formatType: 'word',
    description: "Notification officielle d'une sanction inscrite au dossier du salarié.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Marc NANA' },
      { key: 'positionTitle', label: 'Fonction', type: 'text', defaultValue: 'Agent Commercial' },
      { key: 'incidentSummary', label: 'Rappel des faits fautifs', type: 'textarea', defaultValue: 'Retards répétés non justifiés et non-respect du port des équipements de protection individuelle (EPI) sur site.' },
      { key: 'decision', label: 'Décision retenue', type: 'text', defaultValue: 'Avertissement formel avec inscription au dossier individuel' },
      { key: 'injonction', label: 'Consigne impérative', type: 'textarea', defaultValue: 'Nous vous enjoignons de vous conformer immédiatement aux règles établies. Toute récidive conduira à des mesures disciplinaires plus sévères.' }
    ],
    bodyTemplate: `NOTIFICATION OFFICIELLE DE SANCTION DISCIPLINAIRE

À M./Mme {{employeeName}}, {{positionTitle}}

Monsieur / Madame,

À la suite de l'examen de votre situation et des explications recueillies, nous vous notifions par la présente la décision suivante :

NATURE DE LA SANCTION : {{decision}}

RAPPEL DES FAITS REPROCHÉS :
{{incidentSummary}}

INJONCTION DE LA DIRECTION :
{{injonction}}

Le présent document est versé à votre dossier administratif.`
  }
];
