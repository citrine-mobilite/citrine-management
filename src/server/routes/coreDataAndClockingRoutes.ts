import {
  getCollectionData,
  saveDocumentData,
  deleteDocumentData,
  getOrCreateUserRecord,
  executeCollaboratorCreationTransaction,
  executeAtomicClockingTransaction,
  checkClockingEligibilityBackend,
} from '../../db/repository';

export async function handleCoreDataAndClockingRoutes(
  urlPath: string,
  method: string,
  rawUrl: string,
  body: any,
  res: any
): Promise<boolean> {
  if (urlPath === '/health' || urlPath === '/api/health') {
    res.status(200).json({
      status: 'ok',
      environment: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      smtpHostConfigured: Boolean(process.env.SMTP_HOST),
      smtpUserConfigured: Boolean(process.env.SMTP_USER),
      hrEmailConfigured: Boolean(process.env.HR_NOTIFICATION_EMAIL),
      supabaseConfigured: Boolean(process.env.SUPABASE_URL),
    });
    return true;
  }

  if (urlPath === '/database/status' || urlPath === '/api/database/status') {
    const isSql = Boolean(process.env.SQL_HOST || process.env.DATABASE_URL || process.env.SUPABASE_URL);
    res.status(200).json({
      success: true,
      isSqlConfigured: isSql,
      localPersistence: true,
      message: isSql ? 'Base de données SQL / Supabase active' : 'Persistance locale active',
    });
    return true;
  }

  const dataMatch = urlPath.match(/^\/data\/([^\/]+)(?:\/([^\/]+))?$/);
  if (dataMatch) {
    const collection = decodeURIComponent(dataMatch[1]);
    const docId = dataMatch[2] ? decodeURIComponent(dataMatch[2]) : undefined;

    if (method === 'GET') {
      try {
        const data = await getCollectionData(collection);
        res.status(200).json({ success: true, data });
      } catch (error: any) {
        console.error(`[API /data/${collection} GET error]:`, error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch data' });
      }
      return true;
    }

    if (method === 'POST') {
      try {
        const saved = await saveDocumentData(collection, body);
        res.status(200).json({ success: true, data: saved });
      } catch (error: any) {
        console.error(`[API /data/${collection} POST error]:`, error);
        res.status(500).json({ success: false, error: error.message || 'Failed to save data' });
      }
      return true;
    }

    if (method === 'DELETE') {
      try {
        if (!docId) {
          res.status(400).json({ success: false, error: 'Identifiant manquant pour la suppression.' });
          return true;
        }
        await deleteDocumentData(collection, docId);
        res.status(200).json({ success: true });
      } catch (error: any) {
        console.error(`[API /data/${collection}/${docId} DELETE error]:`, error);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete data' });
      }
      return true;
    }
  }

  if (urlPath === '/users/sync' && method === 'POST') {
    try {
      const { uid, email, name, role } = body;
      if (!uid || !email) {
        res.status(400).json({ success: false, error: 'Missing uid or email' });
        return true;
      }
      const user = await getOrCreateUserRecord(uid, email, name, role);
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('[API /users/sync Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to sync user' });
    }
    return true;
  }

  if (urlPath === '/collaborators/transactional' && method === 'POST') {
    try {
      if (!body?.name || !body?.email) {
        res.status(400).json({ success: false, error: 'Nom et adresse email requis.' });
        return true;
      }
      const result = await executeCollaboratorCreationTransaction(body);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[API /collaborators/transactional Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Échec de la transaction.' });
    }
    return true;
  }

  if (urlPath === '/clocking/atomic' && method === 'POST') {
    try {
      if (!body?.presence) {
        res.status(400).json({ success: false, error: 'Données de présence manquantes.' });
        return true;
      }
      const result = await executeAtomicClockingTransaction(body);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[API /clocking/atomic Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Échec du pointage atomique.' });
    }
    return true;
  }

  if (urlPath === '/clocking/eligibility' && method === 'GET') {
    try {
      const queryString = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
      const searchParams = new URLSearchParams(queryString);
      const result = await checkClockingEligibilityBackend({
        employeeId: searchParams.get('employeeId') || undefined,
        userId: searchParams.get('userId') || undefined,
        email: searchParams.get('email') || undefined,
      });
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[API /clocking/eligibility Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur vérification éligibilité.' });
    }
    return true;
  }

  if (urlPath === '/realtime/broadcast' && method === 'POST') {
    res.status(200).json({ success: true, acknowledged: true });
    return true;
  }

  return false;
}
