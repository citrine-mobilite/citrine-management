import { saveMariaDbDocument } from '../mariaDbCollections';

export async function saveDocumentData(collectionName: string, item: any): Promise<any> {
  return saveMariaDbDocument(collectionName, item);
}
