import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Dossier et fichier de persistance locale permanente pour la base de données
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'citrine_db.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not initialize local data file:', err);
  }
}

function readLocalDb(): Record<string, any[]> {
  try {
    ensureDataFile();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content) || {};
    }
  } catch (err) {
    console.warn('Error reading local db file:', err);
  }
  return {};
}

function writeLocalDb(data: Record<string, any[]>): void {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db file:', err);
  }
}

// Vérification de la disponibilité d'une base relationnelle Cloud SQL / PostgreSQL
export function isSqlConfigured(): boolean {
  return Boolean(process.env.SQL_HOST || process.env.DATABASE_URL);
}

// Helper to extract clean object from row
function rowToItem(row: any) {
  if (!row) return null;
  const raw = (row.rawData && typeof row.rawData === 'object') ? row.rawData : {};
  return {
    ...raw,
    ...row,
    id: row.docId || String(row.id),
    _dbId: row.id,
  };
}

export async function getCollectionData(collectionName: string): Promise<any[]> {
  if (!isSqlConfigured()) {
    const localDb = readLocalDb();
    return localDb[collectionName] || [];
  }
  try {
    switch (collectionName) {
      case 'departments': {
        const rows = await db.select().from(schema.departments);
        return rows.map(rowToItem);
      }
      case 'users': {
        const rows = await db.select().from(schema.users);
        return rows.map(rowToItem);
      }
      case 'employees': {
        const rows = await db.select().from(schema.employees);
        return rows.map(rowToItem);
      }
      case 'tasks': {
        const rows = await db.select().from(schema.tasks);
        return rows.map(rowToItem);
      }
      case 'task_projects': {
        const rows = await db.select().from(schema.taskProjects);
        return rows.map(rowToItem);
      }
      case 'reminders': {
        const rows = await db.select().from(schema.reminders);
        return rows.map(rowToItem);
      }
      case 'presences': {
        const rows = await db.select().from(schema.presences);
        return rows.map(rowToItem);
      }
      case 'attendance_incidents': {
        const rows = await db.select().from(schema.attendanceIncidents);
        return rows.map(rowToItem);
      }
      case 'badge_codes_16': {
        const rows = await db.select().from(schema.badgeCodes16);
        return rows.map(rowToItem);
      }
      case 'dynamic_qr_sessions': {
        const rows = await db.select().from(schema.dynamicQrSessions);
        return rows.map(rowToItem);
      }
      case 'inventory_items':
      case 'inventory': {
        const rows = await db.select().from(schema.inventory);
        return rows.map(rowToItem);
      }
      case 'disciplinary_incidents': {
        const rows = await db.select().from(schema.disciplinaryIncidents);
        return rows.map(rowToItem);
      }
      case 'documents': {
        const rows = await db.select().from(schema.documents);
        return rows.map(rowToItem);
      }
      case 'rh_document_templates': {
        const rows = await db.select().from(schema.rhDocumentTemplates);
        return rows.map(rowToItem);
      }
      case 'processflow_salary_debts': {
        const rows = await db.select().from(schema.processflowSalaryDebts);
        return rows.map(rowToItem);
      }
      case 'salary_payments': {
        const rows = await db.select().from(schema.salaryPayments);
        return rows.map(rowToItem);
      }
      case 'financial_transactions': {
        const rows = await db.select().from(schema.financialTransactions);
        return rows.map(rowToItem);
      }
      case 'partners': {
        const rows = await db.select().from(schema.partners);
        return rows.map(rowToItem);
      }
      case 'notifications': {
        const rows = await db.select().from(schema.notifications);
        return rows.map(rowToItem);
      }
      case 'company_settings': {
        const rows = await db.select().from(schema.companySettings);
        return rows.map(rowToItem);
      }
      case 'calls': {
        const rows = await db.select().from(schema.calls);
        return rows.map(rowToItem);
      }
      case 'user_presences': {
        const rows = await db.select().from(schema.userPresences);
        return rows.map(rowToItem);
      }
      case 'job_offers': {
        const rows = await db.select().from(schema.jobOffers);
        return rows.map(rowToItem);
      }
      case 'job_applications': {
        const rows = await db.select().from(schema.jobApplications);
        return rows.map(rowToItem);
      }
      case 'expense_claims': {
        const rows = await db.select().from(schema.expenseClaims);
        return rows.map(rowToItem);
      }
      case 'hse_incidents': {
        const rows = await db.select().from(schema.hseIncidents);
        return rows.map(rowToItem);
      }
      case 'visitor_logs': {
        const rows = await db.select().from(schema.visitorLogs);
        return rows.map(rowToItem);
      }
      case 'idea_suggestions': {
        const rows = await db.select().from(schema.ideaSuggestions);
        return rows.map(rowToItem);
      }
      case 'enterprise_surveys': {
        const rows = await db.select().from(schema.enterpriseSurveys);
        return rows.map(rowToItem);
      }
      case 'connection_logs': {
        const rows = await db.select().from(schema.connectionLogs);
        return rows.map(rowToItem);
      }
      case 'admin_audit_logs':
      case 'citrine_admin_audit_operations_v1': {
        const rows = await db.select().from(schema.adminAuditLogs);
        return rows.map(rowToItem);
      }
      default: {
        const rows = await db.select().from(schema.genericCollections).where(eq(schema.genericCollections.collection, collectionName));
        return rows.map(r => ({ ...(r.data as object || {}), id: r.docId, _dbId: r.id }));
      }
    }
  } catch (error) {
    console.error(`Database query failed for collection ${collectionName}:`, error);
    throw new Error(`Failed to query database for ${collectionName}.`, { cause: error });
  }
}

export async function saveDocumentData(collectionName: string, item: any): Promise<any> {
  const docId = String(item.id || item.docId || `doc_${Date.now()}`);
  const savedItem = { ...item, id: docId, updatedAt: new Date().toISOString() };

  // 1. Toujours enregistrer immédiatement dans la persistance locale sur disque
  try {
    const localDb = readLocalDb();
    const list = localDb[collectionName] || [];
    const idx = list.findIndex((i: any) => String(i.id || i.docId) === docId);
    if (idx >= 0) {
      list[idx] = savedItem;
    } else {
      list.push(savedItem);
    }
    localDb[collectionName] = list;
    writeLocalDb(localDb);
  } catch (diskErr) {
    console.warn(`[Local DB save notice for ${collectionName}]:`, diskErr);
  }

  if (!isSqlConfigured()) {
    return savedItem;
  }
  try {
    switch (collectionName) {
      case 'departments': {
        await db.insert(schema.departments).values({
          docId,
          name: item.name || '',
          code: item.code || null,
          description: item.description || null,
          color: item.color || null,
          iconName: item.iconName || null,
          managerId: item.managerId || null,
          managerName: item.managerName || null,
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.departments.docId,
          set: {
            name: item.name || '',
            description: item.description || null,
            rawData: item,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'employees': {
        const resolvedRoleId = item.roleId ? Number(item.roleId) : (item.role_id ? Number(item.role_id) : (String(item.roleType).toLowerCase().includes('admin') ? 1 : String(item.roleType).toLowerCase().includes('responsable') ? 2 : 3));
        const resolvedUserId = item.userId || item.user_id || null;
        await db.insert(schema.employees).values({
          docId,
          userId: resolvedUserId,
          roleId: resolvedRoleId,
          name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || null,
          firstName: item.firstName || null,
          lastName: item.lastName || null,
          email: item.email || null,
          phone: item.phone || null,
          roleType: item.roleType || null,
          department: item.department || null,
          position: item.position || null,
          status: item.status || 'en_poste',
          salary: String(item.salary || 0),
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.employees.docId,
          set: {
            userId: resolvedUserId,
            roleId: resolvedRoleId,
            name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || null,
            email: item.email || null,
            phone: item.phone || null,
            roleType: item.roleType || null,
            department: item.department || null,
            status: item.status || 'en_poste',
            salary: String(item.salary || 0),
            rawData: item,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'tasks': {
        try {
          const existing = await db.select().from(schema.tasks).where(eq(schema.tasks.docId, docId)).limit(1);
          if (existing.length > 0) {
            await db.update(schema.tasks).set({
              title: item.title || 'Sans titre',
              description: item.description || null,
              date: item.date || null,
              time: item.time || null,
              status: String(item.status || 'todo'),
              priority: item.priority || 'medium',
              assignedTo: item.assignedTo || null,
              department: item.department || null,
              dueDate: item.dueDate || null,
              rawData: item,
              updatedAt: new Date(),
            }).where(eq(schema.tasks.docId, docId));
          } else {
            await db.insert(schema.tasks).values({
              docId,
              title: item.title || 'Sans titre',
              description: item.description || null,
              date: item.date || null,
              time: item.time || null,
              status: String(item.status || 'todo'),
              priority: item.priority || 'medium',
              assignedTo: item.assignedTo || null,
              department: item.department || null,
              dueDate: item.dueDate || null,
              rawData: item,
            });
          }
        } catch (sqlErr: any) {
          console.warn('[SQL tasks insert warning]:', sqlErr?.message || sqlErr);
        }
        break;
      }
      case 'presences': {
        await db.insert(schema.presences).values({
          docId,
          employeeId: item.employeeId || null,
          date: item.date || null,
          status: item.status || 'present',
          arrivalTime: item.arrivalTime || null,
          departureTime: item.departureTime || null,
          clockingMethod: item.clockingMethod || null,
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.presences.docId,
          set: {
            status: item.status || 'present',
            arrivalTime: item.arrivalTime || null,
            departureTime: item.departureTime || null,
            rawData: item,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'inventory_items':
      case 'inventory': {
        await db.insert(schema.inventory).values({
          docId,
          name: item.name || item.designation || 'Matériel',
          designation: item.designation || item.name || null,
          category: item.category || null,
          quantity: item.quantity || 0,
          status: item.status || 'bon_etat',
          location: item.location || null,
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.inventory.docId,
          set: {
            name: item.name || item.designation || 'Matériel',
            quantity: item.quantity || 0,
            status: item.status || 'bon_etat',
            rawData: item,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'partners': {
        await db.insert(schema.partners).values({
          docId,
          firstName: item.firstName || null,
          lastName: item.lastName || null,
          phone: item.phone || null,
          email: item.email || null,
          category: item.category || null,
          status: item.status || 'actif',
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.partners.docId,
          set: {
            phone: item.phone || null,
            status: item.status || 'actif',
            rawData: item,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'company_settings': {
        await db.insert(schema.companySettings).values({
          docId,
          name: item.name || item.companyName || 'Citrine',
          companyName: item.companyName || item.name || 'Citrine',
          workStartTime: item.workStartTime || null,
          plannedDepartureTime: item.plannedDepartureTime || null,
          qrCodeSecret: item.qrCodeSecret || null,
          doorQrCodeToken: item.doorQrCodeToken || null,
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.companySettings.docId,
          set: {
            companyName: item.companyName || item.name || 'Citrine',
            rawData: item,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'connection_logs': {
        await db.insert(schema.connectionLogs).values({
          docId,
          userId: item.userId || null,
          userName: item.userName || null,
          userEmail: item.userEmail || null,
          timestamp: item.timestamp || new Date().toISOString(),
          ipAddress: item.ipAddress || null,
          location: item.location || null,
          authMethod: item.authMethod || 'password',
          status: item.status || 'success',
          details: item.details || null,
          rawData: item,
        });
        break;
      }
      case 'admin_audit_logs':
      case 'citrine_admin_audit_operations_v1': {
        await db.insert(schema.adminAuditLogs).values({
          docId,
          timestamp: item.timestamp || new Date().toISOString(),
          authorName: item.authorName || 'Super Admin',
          authorRole: item.authorRole || null,
          targetUserId: item.targetUserId || null,
          targetEmployeeId: item.targetEmployeeId || null,
          targetName: item.targetName || 'Collaborateur',
          operationType: item.operationType || 'creation',
          operationLabel: item.operationLabel || null,
          details: item.details || null,
          ipAddress: item.ipAddress || null,
          rawData: item,
        });
        break;
      }
      case 'notifications': {
        await db.insert(schema.notifications).values({
          docId,
          title: item.title || 'Notification',
          message: item.content || item.message || null,
          content: item.content || item.message || null,
          type: item.type || 'system',
          recipient: item.recipient || null,
          targetUserId: item.targetUserId || null,
          isRead: Boolean(item.isRead),
          payload: item.payload ? (typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload)) : null,
          rawData: item,
        }).onConflictDoUpdate({
          target: schema.notifications.docId,
          set: {
            title: item.title || 'Notification',
            message: item.content || item.message || null,
            content: item.content || item.message || null,
            type: item.type || 'system',
            recipient: item.recipient || null,
            targetUserId: item.targetUserId || null,
            isRead: Boolean(item.isRead),
            payload: item.payload ? (typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload)) : null,
            rawData: item,
          }
        });
        break;
      }
      default: {
        const existing = await db.select().from(schema.genericCollections).where(and(eq(schema.genericCollections.collection, collectionName), eq(schema.genericCollections.docId, docId)));
        if (existing.length > 0) {
          await db.update(schema.genericCollections).set({
            data: item,
            updatedAt: new Date(),
          }).where(and(eq(schema.genericCollections.collection, collectionName), eq(schema.genericCollections.docId, docId)));
        } else {
          await db.insert(schema.genericCollections).values({
            collection: collectionName,
            docId,
            data: item,
            updatedAt: new Date(),
          });
        }
        break;
      }
    }
    return { ...item, id: docId };
  } catch (error) {
    console.error(`Database save failed for ${collectionName}/${docId}:`, error);
    return item;
  }
}

export async function deleteDocumentData(collectionName: string, id: string): Promise<boolean> {
  try {
    const localDb = readLocalDb();
    if (localDb[collectionName]) {
      localDb[collectionName] = localDb[collectionName].filter((i: any) => String(i.id || i.docId) !== String(id));
      writeLocalDb(localDb);
    }
  } catch (err) {
    console.warn(`[Local DB delete notice for ${collectionName}:${id}]:`, err);
  }

  if (!isSqlConfigured()) {
    return true;
  }
  try {
    switch (collectionName) {
      case 'departments':
        await db.delete(schema.departments).where(eq(schema.departments.docId, id));
        break;
      case 'users':
        await db.delete(schema.users).where(eq(schema.users.docId, id));
        break;
      case 'employees':
        await db.delete(schema.employees).where(eq(schema.employees.docId, id));
        break;
      case 'tasks':
        await db.delete(schema.tasks).where(eq(schema.tasks.docId, id));
        break;
      case 'task_projects':
        await db.delete(schema.taskProjects).where(eq(schema.taskProjects.docId, id));
        break;
      case 'reminders':
        await db.delete(schema.reminders).where(eq(schema.reminders.docId, id));
        break;
      case 'presences':
        await db.delete(schema.presences).where(eq(schema.presences.docId, id));
        break;
      case 'inventory_items':
      case 'inventory':
        await db.delete(schema.inventory).where(eq(schema.inventory.docId, id));
        break;
      case 'disciplinary_incidents':
        await db.delete(schema.disciplinaryIncidents).where(eq(schema.disciplinaryIncidents.docId, id));
        break;
      case 'partners':
        await db.delete(schema.partners).where(eq(schema.partners.docId, id));
        break;
      case 'company_settings':
        await db.delete(schema.companySettings).where(eq(schema.companySettings.docId, id));
        break;
      case 'notifications':
        await db.delete(schema.notifications).where(eq(schema.notifications.docId, id));
        break;
      case 'job_offers':
        await db.delete(schema.jobOffers).where(eq(schema.jobOffers.docId, id));
        break;
      case 'expense_claims':
        await db.delete(schema.expenseClaims).where(eq(schema.expenseClaims.docId, id));
        break;
      case 'connection_logs':
        await db.delete(schema.connectionLogs).where(eq(schema.connectionLogs.docId, id));
        break;
      case 'admin_audit_logs':
      case 'citrine_admin_audit_operations_v1':
        await db.delete(schema.adminAuditLogs).where(eq(schema.adminAuditLogs.docId, id));
        break;
      default:
        await db.delete(schema.genericCollections).where(
          and(
            eq(schema.genericCollections.collection, collectionName),
            eq(schema.genericCollections.docId, id)
          )
        );
        break;
    }
    return true;
  } catch (error) {
    console.error(`Database delete failed for ${collectionName}/${id}:`, error);
    return false;
  }
}

export async function getOrCreateUserRecord(uid: string, email: string, name?: string, role?: string) {
  if (!isSqlConfigured()) {
    return null;
  }
  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }
    const [inserted] = await db.insert(schema.users).values({
      docId: uid,
      uid,
      email,
      name: name || null,
    }).onConflictDoUpdate({
      target: schema.users.uid,
      set: {
        email,
        name: name || null,
        updatedAt: new Date(),
      }
    }).returning();
    return inserted;
  } catch (error) {
    console.error(`Error in getOrCreateUserRecord for ${uid}:`, error);
    return null;
  }
}
