import { COLLECTIONS, subscribeToCollection, saveDocument, deleteDocument, getCollection } from './dataService';

export interface BuildingSupervisor {
  id: string;
  domain: string;
  label: string;
  supervisorName: string;
  phone?: string;
  email?: string;
  createdAt?: string;
}

export function subscribeToBuildingSupervisors(callback: (supervisors: BuildingSupervisor[]) => void) {
  return subscribeToCollection<BuildingSupervisor>(COLLECTIONS.BUILDING_SUPERVISORS, async (data) => {
    const rawList = data || [];
    const uniqueMap = new Map<string, BuildingSupervisor>();
    for (const item of rawList) {
      const key = item.id || `${item.domain}-${item.supervisorName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    callback(Array.from(uniqueMap.values()));
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
