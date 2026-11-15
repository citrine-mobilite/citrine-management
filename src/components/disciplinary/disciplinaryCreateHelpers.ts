import { DisciplinaryIncident, Employee, IncidentCategory, IncidentSeverity } from '../../types';

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  retard_repete: 'Retards Répétés',
  absence_injustifiee: 'Absence Injustifiée',
  insubordination: 'Insubordination / Non-respect des consignes',
  negligence_materiel: 'Négligence de matériel',
  faute_professionnelle: 'Faute Professionnelle',
  comportement_inadapte: 'Comportement Inadapté',
  autre: 'Autre manquement',
};

export const CATEGORY_SUGGESTIONS: Record<IncidentCategory, string> = {
  retard_repete: 'Retards successifs constatés aux prises de poste sans justificatif valable transmis à la hiérarchie.',
  absence_injustifiee: 'Absence non autorisée et non justifiée au poste de travail sans information préalable.',
  insubordination: 'Refus de se conformer aux consignes directes de travail et aux instructions de service.',
  negligence_materiel: "Négligence manifeste et défaut d'entretien sur les équipements ou matériels de travail confiés.",
  faute_professionnelle: "Manquement avéré aux obligations contractuelles et aux règles d'exercice professionnel.",
  comportement_inadapte: 'Attitude inconvenante contraire au bon fonctionnement du service et au règlement intérieur.',
  autre: "Constat de manquement disciplinaire porté à l'attention de la direction.",
};

interface BuildIncidentParams {
  selectedEmp: Employee;
  date: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: string;
  witnesses: string;
  authorName: string;
  authorRole: string;
}

export function buildDisciplinaryIncidentPayload({
  selectedEmp,
  date,
  category,
  severity,
  title,
  description,
  location,
  witnesses,
  authorName,
  authorRole,
}: BuildIncidentParams): DisciplinaryIncident {
  const empName =
    selectedEmp.name ||
    `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim() ||
    'Collaborateur';
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const finalTitle = title.trim() || `Manquement : ${categoryLabel} (${empName})`;
  const nowIso = new Date().toISOString();

  return {
    id: `DISC-2026-${Math.floor(100 + Math.random() * 900)}`,
    employeeId: selectedEmp.id,
    employeeName: empName,
    employeeRole: selectedEmp.role || selectedEmp.roleType || 'Collaborateur',
    employeeDepartment: selectedEmp.department || 'Direction Générale & Stratégie',
    date: date || nowIso.split('T')[0],
    category,
    severity,
    title: finalTitle,
    description: description.trim(),
    location: location.trim() || 'Bureaux Citrine (HQ)',
    witnesses: witnesses.trim(),
    reportedBy: authorName || 'Conseil de Direction',
    reportedByRole: authorRole,
    status: 'ouvert',
    ruleViolated: 'Article 14 - Règlement Intérieur',
    comments: [],
    history: [
      {
        id: `h-${Date.now()}`,
        date: nowIso,
        action: 'Ouverture du dossier disciplinaire',
        authorName: authorName || 'Conseil de Direction',
        notes: 'Enregistrement initial du constat RH et consignation du dossier.',
      },
    ],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
