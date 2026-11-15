import { RHDocTemplate } from '../../types';

export const RH_TEMPLATES_ADMINISTRATIVE: RHDocTemplate[] = [
  {
    id: 'tpl-memo',
    name: 'Note de Service / Directive Interne',
    category: 'memo',
    formatType: 'word',
    description: "Diffusion collective d'instructions, organisation interne et consignes générales.",
    defaultSignature: false,
    fields: [
      { key: 'subject', label: 'Objet de la Note', type: 'text', defaultValue: 'Mise à jour des horaires et respect du pointage de présence' },
      { key: 'targetAudience', label: 'Destinataires', type: 'text', defaultValue: 'Ensemble du personnel et chefs de départements' },
      { key: 'urgency', label: "Niveau d'urgence", type: 'select', defaultValue: 'Important', options: ['Normal', 'Important', 'Urgent / Immédiat'] },
      { key: 'effectiveDate', label: "Date d'effet", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'mainDirective', label: 'Contenu des consignes', type: 'textarea', defaultValue: "À compter de la date mentionnée, l'ensemble des collaborateurs est tenu d'émarger à l'arrivée (08h00) et au départ (17h00). Tout retard ou empêchement doit être notifié au service RH avant 08h30." }
    ],
    bodyTemplate: `NOTE DE SERVICE INTERNE

DESTINATAIRES : {{targetAudience}}
DATE D'APPLICATION : {{effectiveDate}}
NIVEAU D'URGENCE : {{urgency}}

OBJET : {{subject}}

1. DISPOSITIONS GÉNÉRALES
La présente note de service a pour objet de rappeler et d'actualiser les règles organisationnelles applicables au sein de notre établissement.

2. CONSIGNES & DIRECTIVES
{{mainDirective}}

3. ENTRÉE EN VIGUEUR
Les présentes dispositions entrent en vigueur dès leur diffusion et s'imposent à l'ensemble des collaborateurs concernés.

La Direction générale compte sur l'implication et le sens des responsabilités de chacun pour leur stricte application.`
  },
  {
    id: 'tpl-contract',
    name: 'Contrat de Travail (CDI / CDD)',
    category: 'contract',
    formatType: 'word',
    description: "Contrat individuel d'embauche fixant les fonctions, la rémunération et les engagements réciproques.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom & Prénom du Salarié', type: 'text', defaultValue: 'Jean-Marc DUPONT' },
      { key: 'contractType', label: 'Nature du Contrat', type: 'select', defaultValue: 'CDI (Durée Indéterminée)', options: ['CDI (Durée Indéterminée)', 'CDD (Durée Déterminée - 6 mois)', 'CDD (Durée Déterminée - 12 mois)', 'Contrat de Projet'] },
      { key: 'positionTitle', label: 'Fonction / Poste occupé', type: 'text', defaultValue: "Ingénieur d'Affaires / Chef de Projet" },
      { key: 'monthlySalary', label: 'Salaire brut mensuel (FCFA)', type: 'number', defaultValue: '450000' },
      { key: 'startDate', label: 'Date de prise de fonction', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'trialPeriodMonths', label: "Période d'essai (mois)", type: 'number', defaultValue: '3' },
      { key: 'workplace', label: "Lieu d'affectation", type: 'text', defaultValue: 'Douala (avec déplacements sur chantiers)' }
    ],
    bodyTemplate: `CONTRAT DE TRAVAIL : {{contractType}}

ENTRE LES SOUSSIGNÉS :
CITRINE SARL, société à responsabilité limitée, immatriculée au RCCM de Douala sous le N° CM-DLA-01-2026-B13-00011, représentée par sa Direction Générale,
Ci-après désignée "L'Employeur",

D'une part,

ET :
M./Mme {{employeeName}},
Ci-après désigné(e) "Le Salarié",

D'autre part,

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 - ENGAGEMENT ET FONCTION
L'Employeur engage le Salarié en qualité de {{positionTitle}}, sous le régime d'un {{contractType}}, à compter du {{startDate}}.

ARTICLE 2 - PÉRIODE D'ESSAI
Le présent contrat est soumis à une période d'essai de {{trialPeriodMonths}} mois, renouvelable une fois conformément aux dispositions du Code du Travail.

ARTICLE 3 - LIEU D'EXÉCUTION
Le Salarié exercera ses fonctions principalement à : {{workplace}}. Il pourra être amené à effectuer des missions sur l'ensemble des sites de l'entreprise.

ARTICLE 4 - RÉMUNÉRATION
En contrepartie de l'accomplissement de ses fonctions, le Salarié percevra une rémunération brute mensuelle de {{monthlySalary}} FRANCS CFA, soumise aux cotisations sociales légales.

ARTICLE 5 - CONFIDENTIALITÉ ET LOYAUTÉ
Le Salarié s'engage à observer une discrétion absolue sur toutes les informations stratégiques et professionnelles dont il aura connaissance.`
  },
  {
    id: 'tpl-attestation',
    name: "Attestation d'Emploi & Présence",
    category: 'attestation',
    formatType: 'word',
    description: 'Attestation certifiant que le collaborateur fait actuellement partie du personnel actif.',
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Paul KOUASSI' },
      { key: 'positionTitle', label: 'Poste Occupé', type: 'text', defaultValue: 'Responsable Logistique & Approvisionnements' },
      { key: 'hireDate', label: "Date d'embauche initiale", type: 'date', defaultValue: '2024-02-01' },
      { key: 'department', label: 'Département', type: 'text', defaultValue: 'Exploitation & Flotte' },
      { key: 'purpose', label: 'Motif de délivrance', type: 'text', defaultValue: 'Faire valoir ce que de droit auprès des organismes compétents' }
    ],
    bodyTemplate: `ATTESTATION D'EMPLOI ET DE PRÉSENCE

Nous soussignés, Direction des Ressources Humaines de CITRINE SARL, attestons par la présente que :

M./Mme {{employeeName}} est employé(e) au sein de notre établissement depuis le {{hireDate}}, en qualité de {{positionTitle}}, au sein du département {{department}}.

L'intéressé(e) est à ce jour en activité régulière et n'a fait l'objet d'aucune mesure de rupture ou de préavis.

La présente attestation lui est délivrée sur sa demande pour : {{purpose}}.`
  },
  {
    id: 'tpl-certificate',
    name: 'Certificat de Travail (Fin de Contrat)',
    category: 'certificate',
    formatType: 'word',
    description: 'Document légal remis au collaborateur à la fin de son contrat de travail.',
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Collaborateur', type: 'text', defaultValue: 'Marthe NGOUANFO' },
      { key: 'positionTitle', label: 'Fonction occupée', type: 'text', defaultValue: 'Comptable Trésorerie' },
      { key: 'startDate', label: "Date d'entrée", type: 'date', defaultValue: '2023-01-15' },
      { key: 'endDate', label: 'Date de sortie définitive', type: 'date', defaultValue: new Date().toISOString().split('T')[0] }
    ],
    bodyTemplate: `CERTIFICAT DE TRAVAIL RÉGLEMENTAIRE

Nous soussignés, CITRINE SARL, certifions que :

M./Mme {{employeeName}} a été employé(e) au sein de notre société du {{startDate}} au {{endDate}}.

Durant cette période, l'intéressé(e) a occupé successivement et avec compétence le poste de :
{{positionTitle}}.

M./Mme {{employeeName}} quitte notre société libre de tout engagement envers elle.

En foi de quoi, le présent certificat de travail lui est délivré pour servir et valoir ce que de droit conformément au Code du Travail.`
  },
  {
    id: 'tpl-amendment',
    name: 'Avenant au Contrat de Travail',
    category: 'amendment',
    formatType: 'word',
    description: 'Modification officielle de clauses contractuelles (salaire, promotion, temps de travail).',
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Alain TCHAKOUNTE' },
      { key: 'newPosition', label: 'Nouvelle Fonction / Promotion', type: 'text', defaultValue: 'Superviseur Général des Chantiers' },
      { key: 'newSalary', label: 'Nouveau Salaire Brut (FCFA)', type: 'number', defaultValue: '550000' },
      { key: 'effectiveDate', label: "Date d'effet de l'avenant", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'reason', label: 'Motif de la modification', type: 'text', defaultValue: 'Reconnaissance des performances et élargissement des responsabilités' }
    ],
    bodyTemplate: `AVENANT N° 01 AU CONTRAT DE TRAVAIL

ENTRE :
La société CITRINE SARL,
D'une part,

ET :
M./Mme {{employeeName}},
D'autre part,

IL A ÉTÉ CONVENU LA MODIFICATION SUIVANTE :

ARTICLE 1 - NOUVELLES ATTRIBUTIONS
À compter du {{effectiveDate}}, le Salarié est promu aux fonctions de : {{newPosition}}.

ARTICLE 2 - REVALORISATION DE LA RÉMUNÉRATION
En contrepartie de ses responsabilités élargies, le salaire mensuel brut du Salarié est fixé à {{newSalary}} FCFA.

ARTICLE 3 - MAINTIEN DES AUTRES CLAUSES
Toutes les autres clauses du contrat de travail initial non expressément modifiées par le présent avenant demeurent inchangées et pleinement applicables.`
  }
];
