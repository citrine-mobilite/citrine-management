const fs = require('fs');
const path = require('path');

// Helper to escape SQL strings
function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
  if (typeof str === 'number') return isNaN(str) ? '0' : String(str);
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Helper for boolean status
function boolStatus(val) {
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'string') {
    const low = val.toLowerCase();
    if (['actif', 'en_poste', 'present', 'validated', 'success', 'soumis', 'sur_site', 'ouvert', 'actif', 'valide'].includes(low)) return 'TRUE';
    if (['inactif', 'suspendu', 'cloture', 'rejete', 'refuse', 'draft', 'todo', 'pending', 'signale'].includes(low)) return 'FALSE';
  }
  return 'TRUE';
}

function jsonEsc(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

// Generate valid deterministic UUID v4 for users based on index
function getUuid(index) {
  const hex = index.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

const exportData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/firestoreDatabaseExport.json'), 'utf8'));
const cols = exportData.collections;

let sql = `-- ==============================================================================
-- CITRINE MANAGEMENT - SCRIPT DE PROVISIONNEMENT DES DONNÉES (SEED DATA)
-- Project ID: svvgziqcdahkgyugqlvk
-- Aligné aux exigences : UUIDs valides, ID auto-incrémentés, Status booléens
-- ==============================================================================

BEGIN;

-- 0. Table des Rôles (IDs auto-incrémentés)
INSERT INTO public.roles (doc_id, name, code, description, permissions)
VALUES 
  ('role-admin', 'Administrateur', 'ADMIN', 'Accès total à la plateforme et supervision', '{"all": true}'::jsonb),
  ('role-rh', 'Responsable RH & Paie', 'RH', 'Gestion des collaborateurs, pointages et fiches de paie', '{"rh": true, "employees": true}'::jsonb),
  ('role-employee', 'Employé / Collaborateur', 'EMPLOYEE', 'Accès personnel aux pointages, tâches et documents', '{"self": true}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

`;

// 1. users
if (cols.users && cols.users.length) {
  sql += `-- 1. Table users (${cols.users.length} enregistrements)\n`;
  let idx = 1;
  const usedPhones = new Set();
  const usedEmails = new Set();

  for (const u of cols.users) {
    const docId = u.id || u.uid || `user-${idx}`;
    const uid = getUuid(idx);
    const roleName = (u.role || '').toLowerCase();
    let roleCode = 'EMPLOYEE';
    if (roleName.includes('admin')) roleCode = 'ADMIN';
    else if (roleName.includes('rh') || roleName.includes('manager')) roleCode = 'RH';

    let phone = u.phone;
    if (!phone || usedPhones.has(phone)) {
      phone = `+237 600 ${String(Math.floor(100 + Math.random() * 899))}`;
      while (usedPhones.has(phone)) {
        phone = `+237 600 ${String(Math.floor(100 + Math.random() * 899))}`;
      }
    }
    usedPhones.add(phone);

    let email = u.email;
    if (!email || usedEmails.has(email)) {
      email = `user${idx}_${Date.now()}@citrine.cm`;
    }
    usedEmails.add(email);

    const st = boolStatus(u.status);
    sql += `INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES (${esc(docId)}, ${esc(uid)}, ${esc(email)}, ${esc(u.name || 'Utilisateur')}, (SELECT id FROM public.roles WHERE code = '${roleCode}'), ${st}, ${esc(u.department || 'Direction Générale')}, ${esc(phone)}, ${esc(u.avatarUrl)}, ${jsonEsc(u)})
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();\n`;
    idx++;
  }
  sql += '\n';
}

// 2. employees
if (cols.employees && cols.employees.length) {
  sql += `-- 2. Table employees (${cols.employees.length} collaborateurs)\n`;
  let idx = 1;
  const usedEmpPhones = new Set();
  const usedEmpEmails = new Set();

  for (const e of cols.employees) {
    const docId = e.id || `emp-${idx}`;
    const name = e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Collaborateur';
    const userUid = getUuid(idx);
    let roleCode = 'EMPLOYEE';
    if ((e.role || '').toLowerCase().includes('admin')) roleCode = 'ADMIN';
    else if ((e.role || '').toLowerCase().includes('rh')) roleCode = 'RH';

    let phone = e.phone;
    if (!phone || usedEmpPhones.has(phone)) {
      phone = `+237 655 ${String(Math.floor(100 + Math.random() * 899))}`;
      while (usedEmpPhones.has(phone)) {
        phone = `+237 655 ${String(Math.floor(100 + Math.random() * 899))}`;
      }
    }
    usedEmpPhones.add(phone);

    let email = e.email;
    if (!email || usedEmpEmails.has(email)) {
      email = `collab${idx}_${Date.now()}@citrine.cm`;
    }
    usedEmpEmails.add(email);

    const st = boolStatus(e.status);
    sql += `INSERT INTO public.employees (doc_id, user_id, role_id, name, first_name, last_name, email, phone, department, position, status, hire_date, salary, raw_data)
VALUES (${esc(docId)}, ${esc(userUid)}, (SELECT id FROM public.roles WHERE code = '${roleCode}'), ${esc(name)}, ${esc(e.firstName)}, ${esc(e.lastName)}, ${esc(email)}, ${esc(phone)}, ${esc(e.department || 'Opérations')}, ${esc(e.position || 'Collaborateur')}, ${st}, ${esc(e.hireDate || '2026-01-01')}, ${Number(e.salary || 150000)}, ${jsonEsc(e)})
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, salary = EXCLUDED.salary, updated_at = NOW();\n`;
    idx++;
  }
  sql += '\n';
}

// 3. departments
if (cols.departments && cols.departments.length) {
  sql += `-- 3. Table departments (${cols.departments.length} départements)\n`;
  for (const d of cols.departments) {
    const docId = d.id;
    sql += `INSERT INTO public.departments (doc_id, name, code, description, color, raw_data)
VALUES (${esc(docId)}, ${esc(d.name)}, ${esc(d.code)}, ${esc(d.description)}, ${esc(d.color)}, ${jsonEsc(d)})
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 4. tasks
if (cols.tasks && cols.tasks.length) {
  sql += `-- 4. Table tasks (${cols.tasks.length} tâches)\n`;
  for (const t of cols.tasks) {
    const docId = t.id;
    const st = boolStatus(t.status);
    sql += `INSERT INTO public.tasks (doc_id, title, description, date, time, status, priority, assigned_to, raw_data)
VALUES (${esc(docId)}, ${esc(t.title)}, ${esc(t.description)}, ${esc(t.date)}, ${esc(t.time)}, ${st}, ${esc(t.priority || 'medium')}, ${esc(t.assignedTo)}, ${jsonEsc(t)})
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, status = EXCLUDED.status, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 5. reminders
if (cols.reminders && cols.reminders.length) {
  sql += `-- 5. Table reminders (${cols.reminders.length} rappels)\n`;
  for (const r of cols.reminders) {
    const docId = r.id;
    const title = r.title || r.note || 'Rappel';
    sql += `INSERT INTO public.reminders (doc_id, title, note, date, time, raw_data)
VALUES (${esc(docId)}, ${esc(title)}, ${esc(r.note || title)}, ${esc(r.date)}, ${esc(r.time)}, ${jsonEsc(r)})
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 6. presences
if (cols.presences && cols.presences.length) {
  sql += `-- 6. Table presences (${cols.presences.length} pointages)\n`;
  for (const p of cols.presences) {
    const docId = p.id;
    const st = boolStatus(p.status);
    sql += `INSERT INTO public.presences (doc_id, employee_id, date, status, arrival_time, departure_time, raw_data)
VALUES (${esc(docId)}, ${esc(p.employeeId)}, ${esc(p.date)}, ${st}, ${esc(p.arrivalTime)}, ${esc(p.departureTime)}, ${jsonEsc(p)})
ON CONFLICT (doc_id) DO UPDATE SET 
  status = EXCLUDED.status, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 7. inventory
if (cols.inventory_items && cols.inventory_items.length) {
  sql += `-- 7. Table inventory (${cols.inventory_items.length} matériels)\n`;
  for (const i of cols.inventory_items) {
    const docId = i.id;
    const name = i.name || i.designation || 'Équipement';
    const st = boolStatus(i.status);
    sql += `INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, raw_data)
VALUES (${esc(docId)}, ${esc(name)}, ${esc(i.designation || name)}, ${esc(i.category)}, ${Number(i.quantity || 1)}, ${st}, ${esc(i.location)}, ${jsonEsc(i)})
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, quantity = EXCLUDED.quantity, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 8. partners
if (cols.partners && cols.partners.length) {
  sql += `-- 8. Table partners (${cols.partners.length} partenaires)\n`;
  for (const p of cols.partners) {
    const docId = p.id;
    const st = boolStatus(p.status);
    sql += `INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, raw_data)
VALUES (${esc(docId)}, ${esc(p.firstName)}, ${esc(p.lastName)}, ${esc(p.phone)}, ${esc(p.email)}, ${esc(p.category)}, ${st}, ${jsonEsc(p)})
ON CONFLICT (doc_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name, status = EXCLUDED.status, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 9. company_settings
if (cols.company_settings && cols.company_settings.length) {
  sql += `-- 9. Table company_settings\n`;
  for (const cs of cols.company_settings) {
    const docId = cs.id;
    sql += `INSERT INTO public.company_settings (doc_id, name, company_name, work_start_time, qr_code_secret, raw_data)
VALUES (${esc(docId)}, ${esc(cs.name || 'main_config')}, ${esc(cs.companyName || 'Citrine Mobilité')}, ${esc(cs.workStartTime || '08:00')}, ${esc(cs.qrCodeSecret || 'CITRINE-2026')}, ${jsonEsc(cs)})
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, raw_data = EXCLUDED.raw_data, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 10. documents
if (cols.documents && cols.documents.length) {
  sql += `-- 10. Table documents\n`;
  for (const docItem of cols.documents) {
    const docId = docItem.id;
    sql += `INSERT INTO public.documents (doc_id, title, category, format_type, raw_data)
VALUES (${esc(docId)}, ${esc(docItem.title)}, ${esc(docItem.category)}, ${esc(docItem.format || docItem.formatType)}, ${jsonEsc(docItem)})
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 11. salary_payments
if (cols.salary_payments && cols.salary_payments.length) {
  sql += `-- 11. Table salary_payments\n`;
  for (const sp of cols.salary_payments) {
    const docId = sp.id;
    const st = boolStatus(sp.status);
    sql += `INSERT INTO public.salary_payments (doc_id, employee_id, period, base_amount, net_amount, status, raw_data)
VALUES (${esc(docId)}, ${esc(sp.employeeId)}, ${esc(sp.period)}, ${Number(sp.baseSalary || sp.baseAmount || 0)}, ${Number(sp.netAmount || 0)}, ${st}, ${jsonEsc(sp)})
ON CONFLICT (doc_id) DO UPDATE SET 
  net_amount = EXCLUDED.net_amount, status = EXCLUDED.status, updated_at = NOW();\n`;
  }
  sql += '\n';
}

// 12. Connection and Audit Logs
sql += `-- 12. Connection and Audit Logs\n`;
sql += `INSERT INTO public.connection_logs (doc_id, user_id, user_name, user_email, status, details)
VALUES ('conn-log-1', '00000000-0000-4000-8000-000000000001', 'Landry Moutongo', 'landrymouns@gmail.com', TRUE, 'Connexion initiale Super Admin')
ON CONFLICT (doc_id) DO NOTHING;\n\n`;

sql += `COMMIT;
`;

fs.writeFileSync(path.join(__dirname, '../supabase_seed_data.sql'), sql, 'utf8');
console.log('Successfully generated boolean-status supabase_seed_data.sql!');
