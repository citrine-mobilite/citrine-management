import { saveDocument as saveMariaDbDocument } from './collectionOps';

export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  return saveMariaDbDocument(collectionName, item);
}
