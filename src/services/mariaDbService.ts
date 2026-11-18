import { mapCollectionToTable } from './mariaDb/tableMapper';
import { fetchCollection, deleteDocument, subscribeToCollection } from './mariaDb/collectionOps';
import { saveDocument } from './mariaDb/saveDocumentHandler';

export {
  mapCollectionToTable,
  fetchCollection,
  saveDocument,
  deleteDocument,
  subscribeToCollection,
};

export const mariaDbService = {
  fetchCollection,
  saveDocument,
  deleteDocument,
  subscribeToCollection,
  mapCollectionToTable,
};
