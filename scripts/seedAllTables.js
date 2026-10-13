import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load firestoreDatabaseExport.json
const rawExportPath = path.resolve('src/data/firestoreDatabaseExport.json');
const rawExport = JSON.parse(fs.readFileSync(rawExportPath, 'utf8'));
const collections = rawExport.collections || {};

// Configure Postgres pool
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function run() {
  console.log('🚀 Starting comprehensive data provisioning across all tables...');
  const client = await pool.connect();
  const sqlStatements = [];

  try {
    await client.query('BEGIN');

    // 1. DEPARTMENTS
    const departments = collections.departments || [
      { id: 'dept_dir', name: 'Direction Générale', code: 'DIR', description: 'Direction et stratégie', color: '#1E3A8A' },
      { id: 'dept_rh', name: 'Ressources Humaines', code: 'RH', description: 'Gestion du personnel et paie', color: '#047857' },
      { id: 'dept_log', name: 'Logistique & Exploitation', code: 'LOG', description: 'Flotte, régulation et terrain', color: '#D97706' },
      { id: 'dept_fin', name: 'Finance & Comptabilité', code: 'FIN', description: 'Trésorerie, facturation et budgets', color: '#4F46E5' },
      { id: 'dept_it', name: 'Systèmes d\'Information', code: 'IT', description: 'Infrastructure, logiciels et sécurité', color: '#0D9488' }
    ];
    for (const d of departments) {
      const q = `
        INSERT INTO public.departments (doc_id, name, code, description, color, icon_name, manager_id, manager_name, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [d.id, d.name, d.code || null, d.description || null, d.color || '#2A7B76', d.iconName || null, d.managerId || null, d.managerName || null, JSON.stringify(d)]);
      sqlStatements.push(`INSERT INTO public.departments (doc_id, name, code, description, color, icon_name, raw_data) VALUES ('${d.id}', '${d.name.replace(/'/g, "''")}', '${d.code || ''}', '${(d.description || '').replace(/'/g, "''")}', '${d.color || '#2A7B76'}', '${d.iconName || ''}', '${JSON.stringify(d).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${departments.length} departments.`);

    // 2. USERS
    const users = collections.users || [];
    for (const u of users) {
      const q = `
        INSERT INTO public.users (doc_id, uid, email, name, role, status, department, phone, avatar_url, employee_id, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [u.id || u.uid, u.uid || u.id, u.email || '', u.name || null, u.role || 'Employé', u.status || 'actif', u.department || null, u.phone || null, u.avatarUrl || null, u.employeeId || null, JSON.stringify(u)]);
      sqlStatements.push(`INSERT INTO public.users (doc_id, uid, email, name, role, status, raw_data) VALUES ('${u.id || u.uid}', '${u.uid || u.id}', '${u.email || ''}', '${(u.name || '').replace(/'/g, "''")}', '${u.role || 'Employé'}', '${u.status || 'actif'}', '${JSON.stringify(u).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${users.length} users.`);

    // 3. EMPLOYEES
    const employees = collections.employees || [];
    for (const e of employees) {
      const q = `
        INSERT INTO public.employees (doc_id, name, first_name, last_name, email, phone, role, role_type, department, position, status, hire_date, salary, avatar_url, user_id, manager_id, team, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, salary = EXCLUDED.salary, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [
        e.id, 
        e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim(), 
        e.firstName || null, 
        e.lastName || null, 
        e.email || null, 
        e.phone || null, 
        e.role || 'Employé', 
        e.roleType || null, 
        e.department || null, 
        e.position || null, 
        e.status || 'en_poste', 
        e.hireDate || null, 
        e.salary || 0, 
        e.avatarUrl || null, 
        e.userId || null, 
        e.managerId || null, 
        e.team || null, 
        JSON.stringify(e)
      ]);
      sqlStatements.push(`INSERT INTO public.employees (doc_id, name, email, phone, role, department, position, status, salary, raw_data) VALUES ('${e.id}', '${(e.name || '').replace(/'/g, "''")}', '${e.email || ''}', '${e.phone || ''}', '${e.role || 'Employé'}', '${(e.department || '').replace(/'/g, "''")}', '${(e.position || '').replace(/'/g, "''")}', '${e.status || 'en_poste'}', ${e.salary || 0}, '${JSON.stringify(e).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${employees.length} employees.`);

    // 4. TASKS
    const tasks = collections.tasks || [
      { id: 'task_001', title: 'Inspection de sécurité flotte Japoma', description: 'Vérification complète extincteurs, pneus et kits secours sur les 15 véhicules.', status: 'todo', priority: 'high', assignedTo: 'Michel Tchakounte', department: 'Logistique & Exploitation', dueDate: '2026-10-20' },
      { id: 'task_002', title: 'Audit mensuel des pointages & retards', description: 'Clôture du registre de présence et consolidation pour les fiches de paie.', status: 'in_progress', priority: 'medium', assignedTo: 'Carine Mbida', department: 'Ressources Humaines', dueDate: '2026-10-25' },
      { id: 'task_003', title: 'Renouvellement des contrats partenaires Moto', description: 'Édition des avenants trimestriels pour les 25 motomen affiliés.', status: 'completed', priority: 'low', assignedTo: 'Patrick Ewane', department: 'Opérations', dueDate: '2026-10-15' }
    ];
    for (const t of tasks) {
      const q = `
        INSERT INTO public.tasks (doc_id, title, description, date, time, status, priority, assigned_to, department, due_date, is_milestone, milestone_progress, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (doc_id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [t.id, t.title, t.description || null, t.date || null, t.time || null, t.status || 'todo', t.priority || 'medium', t.assignedTo || null, t.department || null, t.dueDate || null, Boolean(t.isMilestone), t.milestoneProgress || 0, JSON.stringify(t)]);
      sqlStatements.push(`INSERT INTO public.tasks (doc_id, title, description, status, priority, assigned_to, department, due_date, raw_data) VALUES ('${t.id}', '${t.title.replace(/'/g, "''")}', '${(t.description || '').replace(/'/g, "''")}', '${t.status || 'todo'}', '${t.priority || 'medium'}', '${(t.assignedTo || '').replace(/'/g, "''")}', '${(t.department || '').replace(/'/g, "''")}', '${t.dueDate || ''}', '${JSON.stringify(t).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${tasks.length} tasks.`);

    // 5. TASK PROJECTS
    const projects = [
      { id: 'proj_001', name: 'Déploiement Bornes QR Japoma & Akwa', description: 'Installation des tablettes de pointage autonome', color: '#2A7B76', icon: 'QrCode' },
      { id: 'proj_002', name: 'Certification HSE Norme Transport 2026', description: 'Mise en conformité du registre hygiène et sécurité', color: '#D97706', icon: 'ShieldCheck' },
      { id: 'proj_003', name: 'Refonte Partenariats Flotte & Motomen', description: 'Standardisation des contrats et tarifications', color: '#4F46E5', icon: 'Handshake' }
    ];
    for (const p of projects) {
      const q = `
        INSERT INTO public.task_projects (doc_id, name, description, color, icon, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [p.id, p.name, p.description || null, p.color || null, p.icon || null, JSON.stringify(p)]);
      sqlStatements.push(`INSERT INTO public.task_projects (doc_id, name, description, color, icon, raw_data) VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', '${(p.description || '').replace(/'/g, "''")}', '${p.color || '#2A7B76'}', '${p.icon || ''}', '${JSON.stringify(p).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${projects.length} projects.`);

    // 6. REMINDERS
    const reminders = collections.reminders || [
      { id: 'rem_001', title: 'Rappel Clôture de Paie Mensuelle', note: 'Envoyer les fichiers virements bancaires', date: '2026-10-25', time: '10:00' },
      { id: 'rem_002', title: 'Inspection périodique extincteurs Siège', note: 'Passage du technicien agréé', date: '2026-10-28', time: '14:30' }
    ];
    for (const r of reminders) {
      const q = `
        INSERT INTO public.reminders (doc_id, title, note, date, time, location, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (doc_id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [r.id, r.title || r.note || 'Rappel', r.note || r.title || null, r.date || null, r.time || null, r.location || null, JSON.stringify(r)]);
      sqlStatements.push(`INSERT INTO public.reminders (doc_id, title, note, date, time, raw_data) VALUES ('${r.id}', '${(r.title || r.note || 'Rappel').replace(/'/g, "''")}', '${(r.note || r.title || '').replace(/'/g, "''")}', '${r.date || ''}', '${r.time || ''}', '${JSON.stringify(r).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${reminders.length} reminders.`);

    // 7. PRESENCES
    const presences = collections.presences || [
      { id: 'pres_001', employeeId: 'emp_001', date: '2026-10-12', status: 'present', arrivalTime: '07:54', departureTime: '16:35', clockingMethod: 'qr_code' },
      { id: 'pres_002', employeeId: 'emp_002', date: '2026-10-12', status: 'present', arrivalTime: '08:02', departureTime: null, clockingMethod: 'badge_code_16' },
      { id: 'pres_003', employeeId: 'emp_003', date: '2026-10-12', status: 'present', arrivalTime: '07:48', departureTime: null, clockingMethod: 'qr_code' }
    ];
    for (const pr of presences) {
      const q = `
        INSERT INTO public.presences (doc_id, employee_id, date, status, arrival_time, departure_time, clocking_method, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (doc_id) DO UPDATE SET status = EXCLUDED.status, arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [pr.id, pr.employeeId || null, pr.date || null, pr.status || 'present', pr.arrivalTime || null, pr.departureTime || null, pr.clockingMethod || null, JSON.stringify(pr)]);
      sqlStatements.push(`INSERT INTO public.presences (doc_id, employee_id, date, status, arrival_time, departure_time, clocking_method, raw_data) VALUES ('${pr.id}', '${pr.employeeId || ''}', '${pr.date || ''}', '${pr.status || 'present'}', '${pr.arrivalTime || ''}', '${pr.departureTime || ''}', '${pr.clockingMethod || ''}', '${JSON.stringify(pr).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${presences.length} presences.`);

    // 8. INVENTORY
    const inventory = collections.inventory_items || [
      { id: 'inv_001', name: 'Toyota Yaris Flotte #01', designation: 'Véhicule VTC Toyota Yaris CM-402-LT', category: 'Véhicule', quantity: 1, status: 'bon_etat', location: 'Base Japoma', unitPrice: 7500000 },
      { id: 'inv_002', name: 'Smartphone Pointage Borne Akwa', designation: 'Tablette Samsung Galaxy Tab A8', category: 'Informatique', quantity: 1, status: 'bon_etat', location: 'Siège Akwa', unitPrice: 150000 },
      { id: 'inv_003', name: 'Gilets Haute Visibilité Citrine', designation: 'Gilets jaunes sécurité réfléchissants', category: 'EPI & Sécurité', quantity: 35, status: 'bon_etat', location: 'Magasin Central', unitPrice: 3500 },
      { id: 'inv_004', name: 'Kit Outillage Diagnostic OBD-II', designation: 'Valise diagnostic multimarques Launch', category: 'Outillage Atelier', quantity: 2, status: 'bon_etat', location: 'Atelier Japoma', unitPrice: 450000 }
    ];
    for (const inv of inventory) {
      const q = `
        INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, unit_price, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, quantity = EXCLUDED.quantity, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [inv.id, inv.name || 'Matériel', inv.designation || null, inv.category || null, inv.quantity || 0, inv.status || 'bon_etat', inv.location || null, inv.unitPrice || 0, JSON.stringify(inv)]);
      sqlStatements.push(`INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, unit_price, raw_data) VALUES ('${inv.id}', '${(inv.name || inv.designation || 'Matériel').replace(/'/g, "''")}', '${(inv.designation || inv.name || '').replace(/'/g, "''")}', '${(inv.category || '').replace(/'/g, "''")}', ${inv.quantity || 0}, '${inv.status || 'bon_etat'}', '${(inv.location || '').replace(/'/g, "''")}', ${inv.unitPrice || 0}, '${JSON.stringify(inv).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${inventory.length} inventory items.`);

    // 9. PARTNERS
    const partners = collections.partners || [
      { id: 'part_001', firstName: 'Jean-Paul', lastName: 'Kamga', phone: '+237 699 11 22 33', email: 'kamga.jp@gmail.com', category: 'Taximan', status: 'actif', address: 'Douala - Bepanda' },
      { id: 'part_002', firstName: 'Boris', lastName: 'Fomekong', phone: '+237 677 44 55 66', email: 'fomekong.b@yahoo.fr', category: 'Motoman', status: 'actif', address: 'Douala - Ndokoti' },
      { id: 'part_003', firstName: 'Garage Auto', lastName: 'Performances', phone: '+237 655 00 11 22', email: 'contact@autoperf-dla.cm', category: 'Prestataire', status: 'actif', address: 'Zone Industrielle Bassa' }
    ];
    for (const p of partners) {
      const q = `
        INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, address, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (doc_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [p.id, p.firstName || null, p.lastName || null, p.phone || null, p.email || null, p.category || 'Partenaire', p.status || 'actif', p.address || null, JSON.stringify(p)]);
      sqlStatements.push(`INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, address, raw_data) VALUES ('${p.id}', '${(p.firstName || '').replace(/'/g, "''")}', '${(p.lastName || '').replace(/'/g, "''")}', '${p.phone || ''}', '${p.email || ''}', '${p.category || 'Partenaire'}', '${p.status || 'actif'}', '${(p.address || '').replace(/'/g, "''")}', '${JSON.stringify(p).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${partners.length} partners.`);

    // 10. COMPANY SETTINGS
    const companySettings = collections.company_settings || [
      { id: 'main_company_settings', name: 'Citrine Entreprise SARL', companyName: 'Citrine Entreprise SARL', workStartTime: '08:00', plannedDepartureTime: '16:30', qrCodeSecret: 'CITRINE-SECURE-POINTAGE-2026', doorQrCodeToken: 'CITRINE_DOOR_HQ_MAIN_2026' }
    ];
    for (const cs of companySettings) {
      const q = `
        INSERT INTO public.company_settings (doc_id, name, company_name, work_start_time, planned_departure_time, qr_code_secret, door_qr_code_token, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (doc_id) DO UPDATE SET name = EXCLUDED.name, company_name = EXCLUDED.company_name, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [cs.id, cs.name || cs.companyName || 'Citrine', cs.companyName || 'Citrine', cs.workStartTime || '08:00', cs.plannedDepartureTime || '16:30', cs.qrCodeSecret || 'CITRINE_SECRET_2026', cs.doorQrCodeToken || 'DOOR_HQ_2026', JSON.stringify(cs)]);
      sqlStatements.push(`INSERT INTO public.company_settings (doc_id, name, company_name, work_start_time, planned_departure_time, raw_data) VALUES ('${cs.id}', '${(cs.name || 'Citrine').replace(/'/g, "''")}', '${(cs.companyName || 'Citrine').replace(/'/g, "''")}', '${cs.workStartTime || '08:00'}', '${cs.plannedDepartureTime || '16:30'}', '${JSON.stringify(cs).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned company settings.`);

    // 11. FINANCIAL TRANSACTIONS
    const transactions = collections.financial_transactions || [
      { id: 'tx_001', date: '2026-10-10', type: 'income', category: 'Recettes VTC Semaine #41', amount: 1450000, description: 'Versement recettes hebdomadaires chauffeurs Yango/Citrine', recipientOrSource: 'Régie Flotte Japoma', status: 'validated' },
      { id: 'tx_002', date: '2026-10-11', type: 'expense', category: 'Carburant Flotte', amount: 320000, description: 'Recharge cartes carburant TotalEnergies véhicules', recipientOrSource: 'Station Total Akwa', status: 'validated' }
    ];
    for (const tx of transactions) {
      const q = `
        INSERT INTO public.financial_transactions (doc_id, date, type, category, amount, description, recipient_or_source, status, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (doc_id) DO UPDATE SET amount = EXCLUDED.amount, type = EXCLUDED.type, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [tx.id, tx.date || null, tx.type || 'expense', tx.category || 'Opérations', tx.amount || 0, tx.description || null, tx.recipientOrSource || null, tx.status || 'validated', JSON.stringify(tx)]);
      sqlStatements.push(`INSERT INTO public.financial_transactions (doc_id, date, type, category, amount, description, recipient_or_source, status, raw_data) VALUES ('${tx.id}', '${tx.date || ''}', '${tx.type || 'expense'}', '${(tx.category || '').replace(/'/g, "''")}', ${tx.amount || 0}, '${(tx.description || '').replace(/'/g, "''")}', '${(tx.recipientOrSource || '').replace(/'/g, "''")}', '${tx.status || 'validated'}', '${JSON.stringify(tx).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${transactions.length} financial transactions.`);

    // 12. SALARY PAYMENTS & DEBTS
    const salaryPayments = collections.salary_payments || [
      { id: 'sal_001', employeeId: 'emp_001', period: '2026-09', baseAmount: 350000, bonusAmount: 50000, deductions: 0, netAmount: 400000, status: 'paid', paymentMethod: 'transfer', paidAt: '2026-09-30' }
    ];
    for (const sp of salaryPayments) {
      const q = `
        INSERT INTO public.salary_payments (doc_id, employee_id, period, base_amount, bonus_amount, deductions, net_amount, status, payment_method, paid_at, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (doc_id) DO UPDATE SET net_amount = EXCLUDED.net_amount, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [sp.id, sp.employeeId || null, sp.period || null, sp.baseAmount || 0, sp.bonusAmount || 0, sp.deductions || 0, sp.netAmount || 0, sp.status || 'paid', sp.paymentMethod || 'transfer', sp.paidAt || null, JSON.stringify(sp)]);
      sqlStatements.push(`INSERT INTO public.salary_payments (doc_id, employee_id, period, base_amount, bonus_amount, deductions, net_amount, status, payment_method, raw_data) VALUES ('${sp.id}', '${sp.employeeId || ''}', '${sp.period || ''}', ${sp.baseAmount || 0}, ${sp.bonusAmount || 0}, ${sp.deductions || 0}, ${sp.netAmount || 0}, '${sp.status || 'paid'}', '${sp.paymentMethod || 'transfer'}', '${JSON.stringify(sp).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned salary payments.`);

    // 13. JOB OFFERS & CANDIDATURES
    const jobOffers = [
      { id: 'job-001', title: 'Superviseur Logistique & Dispatch Flotte', department: 'Logistique & Exploitation', location: 'Base Japoma - Douala', contractType: 'CDI', openingsCount: 2, description: 'Supervision des départs/retours, plannings de tournée et coordination chauffeurs.', status: 'ouvert' },
      { id: 'job-002', title: 'Chauffeur VTC / Livreur Professionnel', department: 'Opérations Terrain', location: 'Douala (Akwa / Bonanjo)', contractType: 'CDD', openingsCount: 5, description: 'Transport passagers et livraisons colis entreprises partenaires.', status: 'en_cours' },
      { id: 'job-003', title: 'Mécanicien Automobile Flotte & VTC', department: 'Maintenance & Atelier', location: 'Atelier Japoma', contractType: 'CDI', openingsCount: 1, description: 'Maintenance préventive, diagnostics valise électronique et révisions moteurs.', status: 'ouvert' }
    ];
    for (const jo of jobOffers) {
      const q = `
        INSERT INTO public.job_offers (doc_id, title, department, location, contract_type, openings_count, description, status, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (doc_id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [jo.id, jo.title, jo.department || null, jo.location || null, jo.contractType || 'CDI', jo.openingsCount || 1, jo.description || null, jo.status || 'ouvert', JSON.stringify(jo)]);
      sqlStatements.push(`INSERT INTO public.job_offers (doc_id, title, department, location, contract_type, openings_count, description, status, raw_data) VALUES ('${jo.id}', '${jo.title.replace(/'/g, "''")}', '${(jo.department || '').replace(/'/g, "''")}', '${(jo.location || '').replace(/'/g, "''")}', '${jo.contractType || 'CDI'}', ${jo.openingsCount || 1}, '${(jo.description || '').replace(/'/g, "''")}', '${jo.status || 'ouvert'}', '${JSON.stringify(jo).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${jobOffers.length} job offers.`);

    // 14. EXPENSE CLAIMS
    const expenseClaims = [
      { id: 'exp_001', reference: 'NDF-2026-0012', employeeId: 'emp_001', employeeName: 'Michel Tchakounte', title: 'Frais péage et mission contrôle axe Douala-Kribi', amount: 45000, category: 'transport', paymentMode: 'orange_money', status: 'approuve' },
      { id: 'exp_002', reference: 'NDF-2026-0013', employeeId: 'emp_002', employeeName: 'Serge Ndjock', title: 'Achat ampoules halogènes rechange dépannage nuit', amount: 12500, category: 'materiel_urgence', paymentMode: 'cash', status: 'soumis' }
    ];
    for (const ec of expenseClaims) {
      const q = `
        INSERT INTO public.expense_claims (doc_id, reference, employee_id, employee_name, title, amount, category, payment_mode, status, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (doc_id) DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [ec.id, ec.reference || null, ec.employeeId || null, ec.employeeName || null, ec.title, ec.amount || 0, ec.category || 'transport', ec.paymentMode || 'cash', ec.status || 'soumis', JSON.stringify(ec)]);
      sqlStatements.push(`INSERT INTO public.expense_claims (doc_id, reference, employee_id, employee_name, title, amount, category, payment_mode, status, raw_data) VALUES ('${ec.id}', '${ec.reference || ''}', '${ec.employeeId || ''}', '${(ec.employeeName || '').replace(/'/g, "''")}', '${ec.title.replace(/'/g, "''")}', ${ec.amount || 0}, '${ec.category || 'transport'}', '${ec.paymentMode || 'cash'}', '${ec.status || 'soumis'}', '${JSON.stringify(ec).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned ${expenseClaims.length} expense claims.`);

    // 15. HSE INCIDENTS
    const hseIncidents = [
      { id: 'hse_001', reference: 'HSE-2026-0004', site: 'Base Logistique Japoma', type: 'situation_dangereuse', severity: 'modere', date: '2026-10-08', title: 'Sol glissant hydrocarbures zone lavage', description: 'Traces huile moteur non absorbées près du quai #2.', status: 'actions_lancees' }
    ];
    for (const h of hseIncidents) {
      const q = `
        INSERT INTO public.hse_incidents (doc_id, reference, site, type, severity, date, title, description, status, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (doc_id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [h.id, h.reference || null, h.site, h.type || null, h.severity || 'faible', h.date || null, h.title, h.description || null, h.status || 'signale', JSON.stringify(h)]);
      sqlStatements.push(`INSERT INTO public.hse_incidents (doc_id, reference, site, type, severity, date, title, description, status, raw_data) VALUES ('${h.id}', '${h.reference || ''}', '${h.site.replace(/'/g, "''")}', '${h.type || ''}', '${h.severity || 'faible'}', '${h.date || ''}', '${h.title.replace(/'/g, "''")}', '${(h.description || '').replace(/'/g, "''")}', '${h.status || 'signale'}', '${JSON.stringify(h).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned HSE incident.`);

    // 16. VISITOR LOGS
    const visitorLogs = [
      { id: 'vis_001', visitorName: 'Armand Bilong', visitorCompany: 'TotalEnergies Cameroun', visitorPhone: '+237 690 12 34 56', siteLocation: 'Siège Akwa', purpose: 'rdv_commercial', hostEmployeeName: 'Direction Générale', badgeNumber: 'VIS-04', checkInDate: '2026-10-12', checkInTime: '09:30', status: 'sur_site' }
    ];
    for (const v of visitorLogs) {
      const q = `
        INSERT INTO public.visitor_logs (doc_id, visitor_name, visitor_company, visitor_phone, site_location, purpose, host_employee_name, badge_number, check_in_date, check_in_time, status, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (doc_id) DO UPDATE SET visitor_name = EXCLUDED.visitor_name, status = EXCLUDED.status, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [v.id, v.visitorName, v.visitorCompany || null, v.visitorPhone || '', v.siteLocation || 'Siège Akwa', v.purpose || 'rdv_commercial', v.hostEmployeeName || 'Accueil', v.badgeNumber || 'VIS-01', v.checkInDate || '2026-10-12', v.checkInTime || '09:00', v.status || 'sur_site', JSON.stringify(v)]);
      sqlStatements.push(`INSERT INTO public.visitor_logs (doc_id, visitor_name, visitor_company, visitor_phone, site_location, purpose, host_employee_name, badge_number, check_in_date, check_in_time, status, raw_data) VALUES ('${v.id}', '${v.visitorName.replace(/'/g, "''")}', '${(v.visitorCompany || '').replace(/'/g, "''")}', '${v.visitorPhone || ''}', '${v.siteLocation || 'Siège Akwa'}', '${v.purpose || 'rdv_commercial'}', '${v.hostEmployeeName || 'Accueil'}', '${v.badgeNumber || 'VIS-01'}', '${v.checkInDate || ''}', '${v.checkInTime || ''}', '${v.status || 'sur_site'}', '${JSON.stringify(v).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned visitor logs.`);

    // 17. IDEAS & SURVEYS
    const ideas = [
      { id: 'idea_001', title: 'Borne de recharge solaire pour motomen à Japoma', description: 'Installer 2 panneaux solaires avec multiprises pour permettre aux motomen de recharger leurs smartphones.', category: 'innovation_logistique', isAnonymous: false, authorName: 'Boris Fomekong', status: 'a_letude', likesCount: 8 }
    ];
    for (const i of ideas) {
      const q = `
        INSERT INTO public.idea_suggestions (doc_id, title, description, category, is_anonymous, author_name, status, likes_count, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (doc_id) DO UPDATE SET title = EXCLUDED.title, likes_count = EXCLUDED.likes_count, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [i.id, i.title, i.description || null, i.category || 'vie_au_bureau', Boolean(i.isAnonymous), i.authorName || null, i.status || 'soumise', i.likesCount || 0, JSON.stringify(i)]);
      sqlStatements.push(`INSERT INTO public.idea_suggestions (doc_id, title, description, category, is_anonymous, author_name, status, likes_count, raw_data) VALUES ('${i.id}', '${i.title.replace(/'/g, "''")}', '${(i.description || '').replace(/'/g, "''")}', '${i.category || 'vie_au_bureau'}', ${Boolean(i.isAnonymous)}, '${(i.authorName || '').replace(/'/g, "''")}', '${i.status || 'soumise'}', ${i.likesCount || 0}, '${JSON.stringify(i).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned idea suggestions.`);

    // 18. NOTIFICATIONS
    const notifications = collections.notifications || [
      { id: 'notif_001', title: 'Système Opérationnel Citrine', message: 'La base de données relationnelle a été initialisée avec succès.', type: 'system', isRead: false }
    ];
    for (const n of notifications.slice(0, 10)) {
      const q = `
        INSERT INTO public.notifications (doc_id, title, message, type, is_read, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (doc_id) DO UPDATE SET title = EXCLUDED.title, is_read = EXCLUDED.is_read, raw_data = EXCLUDED.raw_data;
      `;
      await client.query(q, [n.id, n.title || 'Notification', n.message || n.content || '', n.type || 'system', Boolean(n.isRead), JSON.stringify(n)]);
      sqlStatements.push(`INSERT INTO public.notifications (doc_id, title, message, type, is_read, raw_data) VALUES ('${n.id}', '${(n.title || 'Notification').replace(/'/g, "''")}', '${(n.message || n.content || '').replace(/'/g, "''")}', '${n.type || 'system'}', ${Boolean(n.isRead)}, '${JSON.stringify(n).replace(/'/g, "''")}') ON CONFLICT (doc_id) DO NOTHING;`);
    }
    console.log(`✅ Provisioned notifications.`);

    await client.query('COMMIT');
    console.log('🎉 ALL TABLES HAVE BEEN SUCCESSFULLY PROVISIONED WITH COMPLETE BUSINESS DATA!');

    // Write supabase_seed.sql
    fs.writeFileSync(
      'supabase_seed.sql',
      `-- ==============================================================================
-- CITRINE MANAGEMENT - JEU DE DONNÉES DE DÉPART (SEEDING) POUR SUPABASE
-- Project ID: svvgziqcdahkgyugqlvk
-- Exécutez ce script dans votre éditeur SQL Supabase après supabase_schema.sql :
-- https://supabase.com/dashboard/project/svvgziqcdahkgyugqlvk/sql/new
-- ==============================================================================

${sqlStatements.join('\n\n')}
`
    );
    console.log('📄 File supabase_seed.sql created successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during data provisioning:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
