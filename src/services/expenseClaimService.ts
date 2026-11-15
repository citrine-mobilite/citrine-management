import { ExpenseClaim } from '../types';
import {
  COLLECTIONS,
  subscribeToCollection,
  saveDocument,
  deleteDocument,
} from './dataService';

export function subscribeToExpenseClaims(callback: (claims: ExpenseClaim[]) => void) {
  return subscribeToCollection<ExpenseClaim>(COLLECTIONS.EXPENSE_CLAIMS, (data) => {
    callback(Array.isArray(data) ? data : []);
  });
}

export async function saveExpenseClaim(claim: ExpenseClaim): Promise<void> {
  await saveDocument(COLLECTIONS.EXPENSE_CLAIMS, claim);
}

export async function deleteExpenseClaim(claimId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.EXPENSE_CLAIMS, claimId);
}
