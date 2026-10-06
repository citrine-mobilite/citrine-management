import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function seedDatabase() {
  console.log('--- Démarrage de l\'importation Firestore complète ---');
  
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  const app = !getApps().length ? initializeApp(config) : getApp();
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });

  const dataPath = path.resolve(process.cwd(), 'src/data/firestoreDatabaseExport.json');
  const databaseData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const collections = databaseData.collections;
  let totalDocsWritten = 0;

  for (const [colName, docs] of Object.entries(collections)) {
    if (!Array.isArray(docs)) continue;
    console.log(`Insertion dans la collection: "${colName}" (${docs.length} documents)...`);
    
    for (const docData of docs as any[]) {
      const docId = docData.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const docRef = doc(db, colName, docId);
      await setDoc(docRef, docData, { merge: true });
      totalDocsWritten++;
    }
  }

  // Also make sure default company_settings exists with modern toggles
  const defaultSettingsRef = doc(db, 'company_settings', 'default');
  await setDoc(defaultSettingsRef, {
    id: 'default',
    enableFinances: false,
    enableDocuments: false,
    enableCommunications: false,
    enableLogs: false,
    enableInventory: false,
    enablePartners: false,
    enablePricing: false,
    enableDiscipline: true,
    enableOrgChart: true,
    enableStatistics: true,
    enableTeamCalls: true,
    enableCalls: true,
    qrCodeSecret: "",
    officeWifiSsid: "",
    allowedOfficeIPs: [],
    siteLocations: [],
    workStartTime: "08:00",
    lateThresholdTime: "08:15",
    defaultSalary: 0
  }, { merge: true });

  console.log(`✅ Importation terminée avec succès ! ${totalDocsWritten} documents insérés dans Firestore.`);
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Erreur lors de l\'importation:', err);
  process.exit(1);
});
