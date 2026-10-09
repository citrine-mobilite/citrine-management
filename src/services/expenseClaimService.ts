import { ExpenseClaim } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument, 
  getCollection 
} from './firestoreService';

export const INITIAL_EXPENSE_CLAIMS: ExpenseClaim[] = [
  {
    id: 'exp-001',
    reference: 'NDF-2026-0038',
    employeeId: 'emp-1',
    employeeName: 'Jean-Marc Bassong',
    employeeDepartment: 'Logistique & Exploitation',
    title: 'Carburant mission convoi Japoma -> Limbé',
    missionLocation: 'Limbé / Sud-Ouest',
    expenseDate: '2026-10-06',
    category: 'carburant',
    amount: 45000,
    receiptNumber: 'TOTAL-LIM-88912',
    receiptDescription: 'Plein gazole Station Total Japoma pour camionnette plateau',
    paymentMode: 'orange_money',
    status: 'approuve',
    approvedBy: 'Marcelle Ewandé (DAF)',
    approvedAt: '2026-10-07T11:00:00Z',
    notes: 'Mission officielle de livraison matériel partenaires validée.',
    createdAt: '2026-10-06T18:30:00Z'
  },
  {
    id: 'exp-002',
    reference: 'NDF-2026-0039',
    employeeId: 'emp-2',
    employeeName: 'Alain Fotso',
    employeeDepartment: 'Maintenance & Atelier',
    title: 'Achat filtre à huile d\'urgence et liquide de frein',
    missionLocation: 'Douala - Bassa / Akwa',
    expenseDate: '2026-10-07',
    category: 'materiel_urgence',
    amount: 28500,
    receiptNumber: 'FACT-CFA-4402',
    receiptDescription: 'Pièces de rechange pour véhicule VTC #CM-412 tombé en panne sèche',
    paymentMode: 'cash',
    status: 'en_verification',
    notes: 'Facture papier tamponnée conservée à la caisse Japoma.',
    createdAt: '2026-10-07T14:10:00Z'
  },
  {
    id: 'exp-003',
    reference: 'NDF-2026-0040',
    employeeId: 'emp-3',
    employeeName: 'Sandrine Mpondo',
    employeeDepartment: 'Commercial & Partenariats',
    title: 'Déjeuner de travail & transport RDV Partenaire Gozem',
    missionLocation: 'Douala - Bonanjo',
    expenseDate: '2026-10-08',
    category: 'restauration',
    amount: 18000,
    receiptNumber: 'REST-BON-1092',
    receiptDescription: 'Repas professionnel avec le responsable opérationnel Gozem',
    paymentMode: 'mtn_momo',
    status: 'soumis',
    notes: 'Validation accordée préalablement par la Direction Générale.',
    createdAt: '2026-10-08T16:20:00Z'
  },
  {
    id: 'exp-004',
    reference: 'NDF-2026-0035',
    employeeId: 'emp-1',
    employeeName: 'Jean-Marc Bassong',
    employeeDepartment: 'Logistique & Exploitation',
    title: 'Péages autoroute et ravitaillement mission Edéa',
    missionLocation: 'Edéa',
    expenseDate: '2026-09-28',
    category: 'peage',
    amount: 12000,
    receiptNumber: 'PEAGE-EDEA-X14',
    receiptDescription: 'Tickets de péage aller-retour + eau minérale équipage',
    paymentMode: 'cash',
    status: 'rembourse',
    approvedBy: 'Direction Citrine',
    approvedAt: '2026-09-29T10:00:00Z',
    reimbursedAt: '2026-09-30T15:00:00Z',
    createdAt: '2026-09-28T20:00:00Z'
  }
];

export function subscribeToExpenseClaims(callback: (claims: ExpenseClaim[]) => void) {
  return subscribeToCollection<ExpenseClaim>(COLLECTIONS.EXPENSE_CLAIMS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<ExpenseClaim>(COLLECTIONS.EXPENSE_CLAIMS);
        if (existing.length === 0) {
          for (const claim of INITIAL_EXPENSE_CLAIMS) {
            await saveDocument(COLLECTIONS.EXPENSE_CLAIMS, claim);
          }
          callback(INITIAL_EXPENSE_CLAIMS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding expense claims:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_EXPENSE_CLAIMS);
  });
}

export async function saveExpenseClaim(claim: ExpenseClaim): Promise<void> {
  await saveDocument(COLLECTIONS.EXPENSE_CLAIMS, claim);
}

export async function deleteExpenseClaim(claimId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.EXPENSE_CLAIMS, claimId);
}
