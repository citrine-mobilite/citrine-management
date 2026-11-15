import { mapCollectionToTable } from './supabase/tableMapper';
import { fetchCollection, deleteDocument, subscribeToCollection } from './supabase/collectionOps';
import { saveDocument } from './supabase/saveDocumentHandler';

export {
  mapCollectionToTable,
  fetchCollection,
  saveDocument,
  deleteDocument,
  subscribeToCollection,
};

export const supabaseService = {
  fetchCollection,
  saveDocument,
  deleteDocument,
  subscribeToCollection,
  mapCollectionToTable,
};
