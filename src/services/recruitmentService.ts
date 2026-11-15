import { JobOffer, JobApplication } from '../types';
import {
  COLLECTIONS,
  subscribeToCollection,
  saveDocument,
  deleteDocument,
} from './dataService';

export function subscribeToJobOffers(callback: (offers: JobOffer[]) => void) {
  return subscribeToCollection<JobOffer>(COLLECTIONS.JOB_OFFERS, (data) => {
    callback(Array.isArray(data) ? data : []);
  });
}

export function subscribeToJobApplications(callback: (apps: JobApplication[]) => void) {
  return subscribeToCollection<JobApplication>(COLLECTIONS.JOB_APPLICATIONS, (data) => {
    callback(Array.isArray(data) ? data : []);
  });
}

export async function saveJobOffer(offer: JobOffer): Promise<void> {
  await saveDocument(COLLECTIONS.JOB_OFFERS, offer);
}

export async function deleteJobOffer(offerId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.JOB_OFFERS, offerId);
}

export async function saveJobApplication(app: JobApplication): Promise<void> {
  await saveDocument(COLLECTIONS.JOB_APPLICATIONS, app);
}

export async function deleteJobApplication(appId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.JOB_APPLICATIONS, appId);
}
