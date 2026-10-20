import { AbsenceRecord, AbsenceType, AbsenceStatus } from '../types/absenceTypes';
import { Employee, Presence } from '../types';
import { saveDocument, getCollection, COLLECTIONS } from './dataService';
import { isEmployeeOnlyRole } from '../utils/roleUtils';

export class AbsenceService {
  /**
   * Récupère toutes les absences consignées en base de données
   */
  async getAbsences(): Promise<AbsenceRecord[]> {
    try {
      const records = await getCollection<AbsenceRecord>(COLLECTIONS.ABSENCES);
      return Array.isArray(records) ? records : [];
    } catch (err) {
      console.warn('[AbsenceService] Erreur lors de la récupération des absences:', err);
      return [];
    }
  }

  /**
   * Enregistre ou met à jour une absence
   */
  async saveAbsence(record: AbsenceRecord): Promise<boolean> {
    try {
      await saveDocument(COLLECTIONS.ABSENCES, record);
      return true;
    } catch (err) {
      console.error('[AbsenceService] Erreur sauvegarde absence:', err);
      return false;
    }
  }

  /**
   * Vérifie et consigne automatiquement les absences pour les employés en poste
   * qui n'ont pas badgé sur une journée ouvrée (lundi à vendredi).
   * RÈGLE CRITIQUE : Le statut de l'employé reste "en_poste", mais une entrée est créée dans la table "absences".
   */
  async checkAndRecordUnbadgedAbsences(
    employees: Employee[],
    presences: Presence[],
    targetDate: string,
    existingAbsences: AbsenceRecord[] = []
  ): Promise<AbsenceRecord[]> {
    // Vérifier si la date cible est un jour ouvré (Lundi = 1, ..., Vendredi = 5)
    const [y, m, d] = targetDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Samedi ou Dimanche -> Aucun pointage exigé, pas d'absence automatique
      return [];
    }

    // Filtrer les employés contractuellement en poste et astreints au pointage
    const clockableInPosteEmployees = employees.filter((emp) => {
      // 1. Rôle subordonné astreint au badge (pas de badge pour DG / Admin)
      const isRoleAstreint = isEmployeeOnlyRole(emp.role || emp.roleType || emp.position);
      if (!isRoleAstreint) return false;

      // 2. Statut RH actuel : strictly "en_poste"
      const statusKey = emp.employmentStatus || (typeof emp.status === 'string' ? emp.status : (emp.status ? 'en_poste' : 'parti'));
      if (statusKey !== 'en_poste') {
        // En mission, congés, permission, maladie, etc. -> pas d'absence
        return false;
      }

      return true;
    });

    const newAbsencesToSave: AbsenceRecord[] = [];

    for (const emp of clockableInPosteEmployees) {
      const empIdStr = String(emp.id);

      // A-t-il badgé pour cette date ?
      const pres = presences.find(
        (p) => String(p.employeeId) === empIdStr && p.date === targetDate
      );
      const hasBadged = Boolean(pres?.arrivalTime || (pres?.status === 'present' || pres?.status === 'late'));

      if (!hasBadged) {
        // L'employé en poste n'a pas badgé : vérifier si une entrée dans la table "absences" existe déjà
        const alreadyRecorded = existingAbsences.some(
          (abs) => String(abs.employeeId) === empIdStr && abs.date === targetDate
        );

        if (!alreadyRecorded) {
          const newAbsence: AbsenceRecord = {
            id: `abs_${Date.now()}_${emp.id}_${Math.random().toString(36).substring(2, 6)}`,
            doc_id: `abs_${emp.id}_${targetDate}`,
            employeeId: empIdStr,
            employeeName: emp.name,
            date: targetDate,
            type: 'non_pointe' as AbsenceType,
            origin: 'automatique_fin_de_journee',
            reason: 'Journée entière non pointée au bureau',
            status: 'injustifiee' as AbsenceStatus,
            createdAt: new Date().toISOString(),
          };

          newAbsencesToSave.push(newAbsence);
          // Persistance immédiate en base de données
          await this.saveAbsence(newAbsence);
        }
      }
    }

    return newAbsencesToSave;
  }

  /**
   * Justifie une absence
   */
  async justifyAbsence(
    absence: AbsenceRecord,
    justificationText: string,
    justifiedByAuthor: string
  ): Promise<AbsenceRecord> {
    const updated: AbsenceRecord = {
      ...absence,
      status: 'justifiee' as AbsenceStatus,
      justification: justificationText,
      justifiedAt: new Date().toISOString(),
      justifiedBy: justifiedByAuthor,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAbsence(updated);
    return updated;
  }
}

export const absenceService = new AbsenceService();
