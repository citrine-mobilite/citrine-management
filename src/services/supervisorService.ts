import { COLLECTIONS, subscribeToCollection, saveDocument, deleteDocument, getCollection } from './dataService';

export interface BuildingSupervisor {
  id: string;
  domain: string; // ex: 'electricite', 'plomberie', 'maconnerie', 'climatisation_maintenance', ou personnalisé
  label: string;
  supervisorName: string;
  phone?: string;
  email?: string;
  createdAt?: string;
}

export const INITIAL_BUILDING_SUPERVISORS: BuildingSupervisor[] = [
  {
    id: 'sup-elec',
    domain: 'electricite',
    label: 'Électricité',
    supervisorName: 'Ing. Mbah (Superviseur Électricité)',
    phone: '+237 690 12 34 56',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup-plomb',
    domain: 'plomberie',
    label: 'Plomberie',
    supervisorName: 'Jean-Pierre Tientcheu (Superviseur Plomberie)',
    phone: '+237 671 23 45 67',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup-macon',
    domain: 'maconnerie',
    label: 'Maçonnerie / BTP',
    supervisorName: 'Marc Kouam (Superviseur Maçonnerie)',
    phone: '+237 695 34 56 78',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup-clim',
    domain: 'climatisation_maintenance',
    label: 'Climatisation & Maintenance',
    supervisorName: 'Ibrahim Aboubakar (Superviseur Maintenance)',
    phone: '+237 679 45 67 89',
    createdAt: new Date().toISOString(),
  },
];

export function subscribeToBuildingSupervisors(callback: (supervisors: BuildingSupervisor[]) => void) {
  return subscribeToCollection<BuildingSupervisor>(COLLECTIONS.BUILDING_SUPERVISORS, async (data) => {
    if (!data || data.length === 0) {
      try {
        const existing = await getCollection<BuildingSupervisor>(COLLECTIONS.BUILDING_SUPERVISORS);
        if (existing.length === 0) {
          for (const s of INITIAL_BUILDING_SUPERVISORS) {
            await saveDocument(COLLECTIONS.BUILDING_SUPERVISORS, s);
          }
          callback(INITIAL_BUILDING_SUPERVISORS);
          return;
        }
        callback(existing);
        return;
      } catch (err) {
        console.warn('Error seeding building supervisors:', err);
      }
    }
    callback(data && data.length > 0 ? data : INITIAL_BUILDING_SUPERVISORS);
  });
}

export async function saveBuildingSupervisor(supervisor: BuildingSupervisor): Promise<BuildingSupervisor> {
  const item: BuildingSupervisor = {
    ...supervisor,
    id: supervisor.id || `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: supervisor.createdAt || new Date().toISOString(),
  };
  return await saveDocument(COLLECTIONS.BUILDING_SUPERVISORS, item);
}

export async function removeBuildingSupervisor(id: string): Promise<boolean> {
  return await deleteDocument(COLLECTIONS.BUILDING_SUPERVISORS, id);
}
