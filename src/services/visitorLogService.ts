import { VisitorLog } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument, 
  getCollection 
} from './firestoreService';

export const INITIAL_VISITOR_LOGS: VisitorLog[] = [
  {
    id: 'vis-001',
    visitorName: 'Bertrand Tchounkeu',
    visitorCompany: 'Cameroun Transit Logistics (CTL)',
    visitorPhone: '+237 699 11 22 33',
    idCardNumber: '1102938475',
    siteLocation: 'Base Logistique Japoma',
    purpose: 'rdv_commercial',
    hostEmployeeName: 'Jean-Marc Bassong',
    hostDepartment: 'Logistique & Exploitation',
    badgeNumber: 'BADGE-JAP-04',
    vehiclePlate: 'LT 892 GA',
    checkInTime: '08:45',
    checkInDate: new Date().toISOString().split('T')[0],
    status: 'sur_site',
    notes: 'Réunion de cadrage pour l\'affrètement de 3 camions plateau.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'vis-002',
    visitorName: 'Esther Bilog',
    visitorCompany: 'Cabinet Audit & Conseils Douala',
    visitorPhone: '+237 677 44 55 66',
    idCardNumber: '1098472831',
    siteLocation: 'Siège Akwa',
    purpose: 'partenaire_institutionnel',
    hostEmployeeName: 'Marcelle Ewandé',
    hostDepartment: 'Direction Financière',
    badgeNumber: 'BADGE-AKW-02',
    checkInTime: '09:15',
    checkInDate: new Date().toISOString().split('T')[0],
    status: 'sur_site',
    notes: 'Revue intermédiaire des pièces comptables du 3ème trimestre.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'vis-003',
    visitorName: 'Paul-Émile Nguema',
    visitorCompany: 'Gozem Cameroun SAS',
    visitorPhone: '+237 650 99 88 77',
    idCardNumber: '1203948576',
    siteLocation: 'Siège Akwa',
    purpose: 'reunion_direction',
    hostEmployeeName: 'Direction Générale Citrine',
    hostDepartment: 'Direction Générale',
    badgeNumber: 'BADGE-AKW-01',
    vehiclePlate: 'CE 451 AA',
    checkInTime: '07:30',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutTime: '09:00',
    status: 'sorti',
    notes: 'Partenariat interopérabilité courses partagées.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'vis-004',
    visitorName: 'Serge Ndjock',
    visitorCompany: 'Candidat Chauffeur VTC',
    visitorPhone: '+237 694 55 12 03',
    idCardNumber: '1182736450',
    siteLocation: 'Base Logistique Japoma',
    purpose: 'entretien_embauche',
    hostEmployeeName: 'Carine Mbida',
    hostDepartment: 'Ressources Humaines',
    badgeNumber: 'BADGE-JAP-09',
    checkInTime: '10:00',
    checkInDate: new Date().toISOString().split('T')[0],
    status: 'attendu',
    notes: 'Convocation pour signature proposition embauche.',
    createdAt: new Date().toISOString()
  }
];

export function subscribeToVisitorLogs(callback: (logs: VisitorLog[]) => void) {
  return subscribeToCollection<VisitorLog>(COLLECTIONS.VISITOR_LOGS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<VisitorLog>(COLLECTIONS.VISITOR_LOGS);
        if (existing.length === 0) {
          for (const log of INITIAL_VISITOR_LOGS) {
            await saveDocument(COLLECTIONS.VISITOR_LOGS, log);
          }
          callback(INITIAL_VISITOR_LOGS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding visitor logs:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_VISITOR_LOGS);
  });
}

export async function saveVisitorLog(log: VisitorLog): Promise<void> {
  await saveDocument(COLLECTIONS.VISITOR_LOGS, log);
}

export async function deleteVisitorLog(logId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.VISITOR_LOGS, logId);
}
