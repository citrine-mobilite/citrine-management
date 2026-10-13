-- ==============================================================================
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

-- 1. Table users (12 enregistrements)
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-admin-1', '00000000-0000-4000-8000-000000000001', 'landrymouns@gmail.com', 'Landry Moutongo', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Générale', '+237 600 000 001', NULL, '{"id":"user-admin-1","role":"administrateur","department":"Direction Générale","name":"Landry Moutongo","status":"actif","createdAt":"2026-01-01T00:00:00.000Z","email":"landrymouns@gmail.com","phone":"+237 600 000 001"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-admin-2', '00000000-0000-4000-8000-000000000002', 'admin@citrine.cm', 'Administrateur Citrine', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Générale', '+237 600 000 000', NULL, '{"id":"user-admin-2","department":"Direction Générale","createdAt":"2026-01-01T00:00:00.000Z","phone":"+237 600 000 000","status":"actif","role":"administrateur","name":"Administrateur Citrine","email":"admin@citrine.cm"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-admin-3', '00000000-0000-4000-8000-000000000003', 'doloreskenne6@gmail.com', 'Dolores Kenne', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Générale', '+237 600 000 002', NULL, '{"id":"user-admin-3","createdAt":"2026-01-01T00:00:00.000Z","email":"doloreskenne6@gmail.com","status":"actif","phone":"+237 600 000 002","name":"Dolores Kenne","role":"administrateur","department":"Direction Générale"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-admin-4', '00000000-0000-4000-8000-000000000004', 'landrymoutongo97@gmail.com', 'Landry Moutongo 97', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Générale', '+237 600 000 003', NULL, '{"id":"user-admin-4","phone":"+237 600 000 003","createdAt":"2026-01-01T00:00:00.000Z","department":"Direction Générale","email":"landrymoutongo97@gmail.com","status":"actif","name":"Landry Moutongo 97","role":"administrateur"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-emp-1', '00000000-0000-4000-8000-000000000005', 'employe@citrine.cm', 'Employé Terrain', (SELECT id FROM public.roles WHERE code = 'EMPLOYEE'), TRUE, 'Logistique & Terrain', '+237 600 000 005', NULL, '{"id":"user-emp-1","status":"actif","phone":"+237 600 000 005","createdAt":"2026-01-01T00:00:00.000Z","email":"employe@citrine.cm","department":"Logistique & Terrain","name":"Employé Terrain","role":"employé"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-manager-1', '00000000-0000-4000-8000-000000000006', 'responsable@citrine.cm', 'Responsable Opérations', (SELECT id FROM public.roles WHERE code = 'EMPLOYEE'), TRUE, 'Opérations', '+237 600 000 004', NULL, '{"id":"user-manager-1","createdAt":"2026-01-01T00:00:00.000Z","phone":"+237 600 000 004","department":"Opérations","name":"Responsable Opérations","status":"actif","role":"responsable","email":"responsable@citrine.cm"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('user-super-admin', '00000000-0000-4000-8000-000000000007', 'admin@admin.com', 'Super Administrateur', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Générale', '+237 600 331', NULL, '{"id":"user-super-admin","status":"actif","department":"Direction Générale","role":"administrateur","name":"Super Administrateur","phone":"+237 600 000 000","email":"admin@admin.com","createdAt":"2026-01-01T00:00:00.000Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('usr-admin-1', '00000000-0000-4000-8000-000000000008', 'user8_1791816752296@citrine.cm', 'Landry Moutongo', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Générale', '+237 600 683', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '{"id":"usr-admin-1","role":"administrateur","lastLoginAt":"2026-07-24T17:00:00.000Z","createdAt":"2026-01-01T08:00:00.000Z","avatarUrl":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80","name":"Landry Moutongo","email":"landrymoutongo97@gmail.com","authMethod":"google","status":"actif","department":"Direction Générale"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('usr-admin-2', '00000000-0000-4000-8000-000000000009', 'user9_1791816752296@citrine.cm', 'Dolores Kenne', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction RH', '+237 600 431', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '{"id":"usr-admin-2","lastLoginAt":"2026-07-24T16:30:00.000Z","createdAt":"2026-01-01T08:00:00.000Z","role":"administrateur","status":"actif","authMethod":"google","email":"doloreskenne6@gmail.com","department":"Direction RH","name":"Dolores Kenne","avatarUrl":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('usr-admin-3', '00000000-0000-4000-8000-00000000000a', 'user10_1791816752296@citrine.cm', 'mouns eric', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'Direction Technique', '+237682891079', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop&q=80', '{"id":"usr-admin-3","phone":"+237682891079","lastLoginAt":"2026-07-24T17:15:00.000Z","name":"mouns eric","avatarUrl":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop&q=80","authMethod":"google","email":"landrymouns@gmail.com","department":"Direction Technique","createdAt":"2026-01-01T08:00:00.000Z","role":"administrateur","status":"actif"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('usr-emp-1785638247317', '00000000-0000-4000-8000-00000000000b', 'user11_1791816752296@citrine.cm', 'mouns eric', (SELECT id FROM public.roles WHERE code = 'ADMIN'), TRUE, 'employé', '+237 600 963', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop&q=80', '{"id":"usr-emp-1785638247317","role":"administrateur","department":"employé","authMethod":"password","createdAt":"2026-08-02T02:37:27.320Z","phone":"+237682891079","avatarUrl":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop&q=80","name":"mouns eric","email":"landrymouns@gmail.com","status":"actif"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, avatar_url, raw_data)
VALUES ('usr-emp-1785861154330', '00000000-0000-4000-8000-00000000000c', 'cmr.backendev@gmail.com', 'Test landry', (SELECT id FROM public.roles WHERE code = 'EMPLOYEE'), TRUE, 'informaticien', '682891079', '', '{"id":"usr-emp-1785861154330","department":"informaticien","createdAt":"2026-08-04T16:32:34.330Z","authMethod":"password","status":"actif","role":"employé","email":"cmr.backendev@gmail.com","name":"Test landry","phone":"682891079","avatarUrl":""}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, status = EXCLUDED.status, updated_at = NOW();

-- 2. Table employees (3 collaborateurs)
INSERT INTO public.employees (doc_id, user_id, role_id, name, first_name, last_name, email, phone, department, position, status, hire_date, salary, raw_data)
VALUES ('emp-1', '00000000-0000-4000-8000-000000000001', (SELECT id FROM public.roles WHERE code = 'EMPLOYEE'), 'Kenne Londo Doleres', NULL, NULL, 'Doleres.Kenne@citrine-mobilite.com', '+237 655500443', 'Opérations', 'Collaborateur', TRUE, '2026-06-01', 200000, '{"id":"emp-1","salary":200000,"hireDate":"2026-06-01","email":"Doleres.Kenne@citrine-mobilite.com","roleType":"gestionnaire de projet assistant","status":"en_poste","birthDate":"2000-05-01","phone":"+237 655500443","avatarUrl":"","name":"Kenne Londo Doleres"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, salary = EXCLUDED.salary, updated_at = NOW();
INSERT INTO public.employees (doc_id, user_id, role_id, name, first_name, last_name, email, phone, department, position, status, hire_date, salary, raw_data)
VALUES ('emp-1785638247317', '00000000-0000-4000-8000-000000000002', (SELECT id FROM public.roles WHERE code = 'EMPLOYEE'), 'Landry Moutongo', NULL, NULL, 'landrymouns@gmail.com', '+237 600 000 001', 'Opérations', 'Collaborateur', TRUE, '2026-07-08', 100000, '{"id":"emp-1785638247317","roleType":"administrateur","status":"en_poste","email":"landrymouns@gmail.com","name":"Landry Moutongo","salary":100000,"phone":"+237 600 000 001","avatarUrl":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop&q=80","hireDate":"2026-07-08","birthDate":"2026-08-04"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, salary = EXCLUDED.salary, updated_at = NOW();
INSERT INTO public.employees (doc_id, user_id, role_id, name, first_name, last_name, email, phone, department, position, status, hire_date, salary, raw_data)
VALUES ('emp-1785861154330', '00000000-0000-4000-8000-000000000003', (SELECT id FROM public.roles WHERE code = 'EMPLOYEE'), 'Test landry', NULL, NULL, 'cmr.backendev@gmail.com', '682891079', 'Opérations', 'Collaborateur', TRUE, '2026-08-04', 85000, '{"id":"emp-1785861154330","roleType":"informaticien","status":"en_poste","email":"cmr.backendev@gmail.com","salary":85000,"birthDate":"2026-08-04","hireDate":"2026-08-04","phone":"682891079","name":"Test landry","avatarUrl":""}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, email = EXCLUDED.email, salary = EXCLUDED.salary, updated_at = NOW();

-- 3. Table departments (5 départements)
INSERT INTO public.departments (doc_id, name, code, description, color, raw_data)
VALUES ('dept-exec', 'Direction Générale & Stratégie', 'DG', 'Pilotage stratégique, gouvernance et investissements', 'slate', '{"id":"dept-exec","name":"Direction Générale & Stratégie","code":"DG","description":"Pilotage stratégique, gouvernance et investissements","color":"slate","parentDepartmentId":null}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();
INSERT INTO public.departments (doc_id, name, code, description, color, raw_data)
VALUES ('dept-ops', 'Opérations, Flotte & Logistique', 'OPS', 'Gestion de la flotte, chauffeurs, régulation et terrain', 'emerald', '{"id":"dept-ops","name":"Opérations, Flotte & Logistique","code":"OPS","description":"Gestion de la flotte, chauffeurs, régulation et terrain","color":"emerald","parentDepartmentId":"dept-exec"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();
INSERT INTO public.departments (doc_id, name, code, description, color, raw_data)
VALUES ('dept-tech', 'Technologie & Systèmes d''Information', 'TECH', 'Développement d’applications, infrastructure et données', 'indigo', '{"id":"dept-tech","name":"Technologie & Systèmes d''Information","code":"TECH","description":"Développement d’applications, infrastructure et données","color":"indigo","parentDepartmentId":"dept-exec"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();
INSERT INTO public.departments (doc_id, name, code, description, color, raw_data)
VALUES ('dept-rh', 'Ressources Humaines & Juridique', 'RH', 'Gestion des talents, paie, contrats et conformité', 'amber', '{"id":"dept-rh","name":"Ressources Humaines & Juridique","code":"RH","description":"Gestion des talents, paie, contrats et conformité","color":"amber","parentDepartmentId":"dept-exec"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();
INSERT INTO public.departments (doc_id, name, code, description, color, raw_data)
VALUES ('dept-fin', 'Finance & Contrôle de Gestion', 'FIN', 'Trésorerie, comptabilité, recouvrement et budgets', 'cyan', '{"id":"dept-fin","name":"Finance & Contrôle de Gestion","code":"FIN","description":"Trésorerie, comptabilité, recouvrement et budgets","color":"cyan","parentDepartmentId":"dept-exec"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();

-- 4. Table tasks (1 tâches)
INSERT INTO public.tasks (doc_id, title, description, date, time, status, priority, assigned_to, raw_data)
VALUES ('task-1785778644074', 'test', 'test', '2026-07-08', '09:00', FALSE, 'medium', NULL, '{"id":"task-1785778644074","incidents":[],"subtasks":[],"employeeId":"emp-1","priority":"medium","attachments":[],"comments":[{"id":"comment-sys-1785778644074-hjb2j","timestamp":"2026-08-03T17:37:24.074Z","author":"Système (Administrateur)","text":"🆕 Tâche créée de manière planifiée par Administrateur"}],"date":"2026-07-08","description":"test","status":"todo","time":"09:00","title":"test"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, status = EXCLUDED.status, updated_at = NOW();

-- 5. Table reminders (3 rappels)
INSERT INTO public.reminders (doc_id, title, note, date, time, raw_data)
VALUES ('rem-1', 'Début officiel de la journée de pointage HERO Cab', 'Début officiel de la journée de pointage HERO Cab', NULL, '08:00', '{"id":"rem-1","time":"08:00","note":"Début officiel de la journée de pointage HERO Cab","triggerBefore":"5m","enabled":true,"soundEnabled":true,"employeeId":"all"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();
INSERT INTO public.reminders (doc_id, title, note, date, time, raw_data)
VALUES ('rem-2', 'Pause déjeuner équipe opérationnelle', 'Pause déjeuner équipe opérationnelle', NULL, '12:30', '{"id":"rem-2","time":"12:30","note":"Pause déjeuner équipe opérationnelle","triggerBefore":"none","enabled":true,"soundEnabled":true,"employeeId":"all"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();
INSERT INTO public.reminders (doc_id, title, note, date, time, raw_data)
VALUES ('rem-3', 'Clôture des pointages et rapport journalier', 'Clôture des pointages et rapport journalier', NULL, '17:00', '{"id":"rem-3","time":"17:00","note":"Clôture des pointages et rapport journalier","triggerBefore":"15m","enabled":true,"soundEnabled":true,"employeeId":"all"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();

-- 6. Table presences (3 pointages)
INSERT INTO public.presences (doc_id, employee_id, date, status, arrival_time, departure_time, raw_data)
VALUES ('p-1785861993442', 'emp-1', '2026-08-04', TRUE, '08:00', '22:19', '{"id":"p-1785861993442","arrivalTime":"08:00","departureTime":"22:19","date":"2026-08-04","status":"late","clockingMethod":"manual_admin","latitude":4.0157005023600805,"clockLocations":{"departure":{"time":"22:19","zoneName":"Bureau Principal - Douala III","method":"manual_admin","latitude":4.0157005023600805,"siteName":"Bureau Principal - Douala III","longitude":9.819983205664192},"arrival":{"time":"08:10","zoneName":"Bureau Principal - Douala III","longitude":9.819983205664192,"method":"manual_admin","siteName":"Bureau Principal - Douala III","latitude":4.0157005023600805}},"pauseStart":null,"siteName":"Bureau Principal - Douala III","departureReason":"Sortie tardive enregistrée après 17h30","employeeId":"emp-1","updatedAt":"2026-09-18T05:26:14.245Z","pauseEnd":null,"departureReasonStatus":"rejected","longitude":9.819983205664192,"location":"Bureau Principal - Douala III (Douala III, Cameroun (base))"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.presences (doc_id, employee_id, date, status, arrival_time, departure_time, raw_data)
VALUES ('p-1785878641828', 'emp-1785638247317', '2026-08-04', TRUE, '22:24', '22:24', '{"id":"p-1785878641828","clockingMethod":"manual_admin","location":"Bureau Principal - Douala III (Douala III, Cameroun (base))","clockLocations":{"departure":{"time":"22:24","longitude":9.819983205664192,"method":"manual_admin","siteName":"Bureau Principal - Douala III","latitude":4.0157005023600805,"zoneName":"Bureau Principal - Douala III"},"arrival":{"zoneName":"Bureau Principal - Douala III","time":"22:24","siteName":"Bureau Principal - Douala III","latitude":4.0157005023600805,"longitude":9.819983205664192,"method":"manual_admin"}},"date":"2026-08-04","siteName":"Bureau Principal - Douala III","departureReason":"Sortie tardive enregistrée après 17h30","pauseEnd":null,"departureTime":"22:24","employeeId":"emp-1785638247317","arrivalTime":"22:24","latitude":4.0157005023600805,"pauseStart":null,"longitude":9.819983205664192,"departureReasonStatus":"rejected","status":"late","updatedAt":"2026-09-18T05:26:12.546Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.presences (doc_id, employee_id, date, status, arrival_time, departure_time, raw_data)
VALUES ('p-1785878654823', 'emp-1785861154330', '2026-08-04', TRUE, '22:24', '22:24', '{"id":"p-1785878654823","departureReason":"Sortie tardive enregistrée après 17h30","pauseEnd":null,"longitude":9.819983205664192,"status":"late","siteName":"Bureau Principal - Douala III","departureTime":"22:24","clockingMethod":"manual_admin","location":"Bureau Principal - Douala III (Douala III, Cameroun (base))","pauseStart":null,"employeeId":"emp-1785861154330","clockLocations":{"departure":{"time":"22:24","longitude":9.819983205664192,"latitude":4.0157005023600805,"siteName":"Bureau Principal - Douala III","zoneName":"Bureau Principal - Douala III","method":"manual_admin"},"arrival":{"longitude":9.819983205664192,"siteName":"Bureau Principal - Douala III","latitude":4.0157005023600805,"method":"manual_admin","zoneName":"Bureau Principal - Douala III","time":"22:24"}},"updatedAt":"2026-09-18T05:26:16.104Z","date":"2026-08-04","arrivalTime":"22:24","latitude":4.0157005023600805,"departureReasonStatus":"rejected"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  status = EXCLUDED.status, updated_at = NOW();

-- 7. Table inventory (4 matériels)
INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, raw_data)
VALUES ('inv-1', 'Ordinateur Portable Dell Latitude 5420', 'Ordinateur Portable Dell Latitude 5420', 'Matériel Informatique', 9, TRUE, 'Bureau Principal HQ - Salle 102', '{"id":"inv-1","reference":"INV-2026-001","status":"neuf","createdAt":"2026-08-02T02:39:11.788Z","updatedAt":"2026-08-03T08:03:24.374Z","quantity":9,"location":"Bureau Principal HQ - Salle 102","assignments":[{"status":"usage","assignedAt":"2026-08-03T08:03:24.374Z","id":"asn-1785744204374-7yn","employeeName":"Kenne Londo Doleres","quantity":1,"employeeId":"emp-1"}],"unitPrice":650000,"designation":"Ordinateur Portable Dell Latitude 5420","category":"Matériel Informatique","notes":"Matériel configuré avec suite bureautique et VPN.","quantitiesByStatus":{"endommage":1,"en_reparation":1,"hors_service":2,"neuf":4,"bon_etat":1,"usage":0},"assignedToId":"emp-1"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, quantity = EXCLUDED.quantity, updated_at = NOW();
INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, raw_data)
VALUES ('inv-2', 'Fauteuil de bureau ergonomique Mesh Black', 'Fauteuil de bureau ergonomique Mesh Black', 'Mobilier & Bureau', 12, TRUE, 'Bureau Principal HQ - Open Space', '{"id":"inv-2","unitPrice":85000,"designation":"Fauteuil de bureau ergonomique Mesh Black","status":"bon_etat","category":"Mobilier & Bureau","quantity":12,"createdAt":"2026-08-02T02:39:11.788Z","updatedAt":"2026-08-02T02:39:11.788Z","location":"Bureau Principal HQ - Open Space","reference":"INV-2026-002","notes":"Acheté en 2025, parfait état de marche."}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, quantity = EXCLUDED.quantity, updated_at = NOW();
INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, raw_data)
VALUES ('inv-3', 'Vidéoprojecteur Epson Full HD EB-FH52', 'Vidéoprojecteur Epson Full HD EB-FH52', 'Matériel Informatique', 2, TRUE, 'Salle de Réunion Douala', '{"id":"inv-3","status":"usage","notes":"Lampe vérifiée en Juin 2026.","designation":"Vidéoprojecteur Epson Full HD EB-FH52","updatedAt":"2026-08-02T02:39:11.788Z","createdAt":"2026-08-02T02:39:11.788Z","reference":"INV-2026-003","unitPrice":380000,"quantity":2,"category":"Matériel Informatique","location":"Salle de Réunion Douala"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, quantity = EXCLUDED.quantity, updated_at = NOW();
INSERT INTO public.inventory (doc_id, name, designation, category, quantity, status, location, raw_data)
VALUES ('inv-4', 'Imprimante Multifonction HP LaserJet Pro', 'Imprimante Multifonction HP LaserJet Pro', 'Matériel Informatique', 1, TRUE, 'Atelier Maintenance Akwa', '{"id":"inv-4","category":"Matériel Informatique","quantity":1,"location":"Atelier Maintenance Akwa","status":"en_reparation","unitPrice":240000,"notes":"Changement du rouleau d''entraînement de papier en cours.","designation":"Imprimante Multifonction HP LaserJet Pro","reference":"INV-2026-004","createdAt":"2026-08-02T02:39:11.788Z","updatedAt":"2026-08-02T02:39:11.788Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, quantity = EXCLUDED.quantity, updated_at = NOW();

-- 8. Table partners (5 partenaires)
INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, raw_data)
VALUES ('part-1', 'Jean-Paul', 'Fotso', '+237 699 11 22 33', 'jeanpaul.fotso@gmail.com', 'Motoman', TRUE, '{"id":"part-1","lastName":"Fotso","firstName":"Jean-Paul","phone":"+237 699 11 22 33","email":"jeanpaul.fotso@gmail.com","category":"Motoman","status":"actif","address":"Douala, Makepe","notes":"Chauffeur moto principal pour livraisons urgentes centre-ville.","createdAt":"2026-08-03T21:15:22.603Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, raw_data)
VALUES ('part-2', 'Emmanuel', 'Mvondo', '+237 677 88 99 00', 'emmanuel.mvondo@yahoo.fr', 'Taximan', TRUE, '{"id":"part-2","lastName":"Mvondo","firstName":"Emmanuel","phone":"+237 677 88 99 00","email":"emmanuel.mvondo@yahoo.fr","category":"Taximan","status":"actif","address":"Douala, Akwa","notes":"Taxi partenaire courses direction aéroport et réunions clients.","createdAt":"2026-08-03T21:15:22.603Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, raw_data)
VALUES ('part-3', 'Marie Claire', 'Nkamgang', '+237 655 44 33 22', 'marieclaire@outlook.com', 'Particulier', TRUE, '{"id":"part-3","lastName":"Nkamgang","firstName":"Marie Claire","phone":"+237 655 44 33 22","email":"marieclaire@outlook.com","category":"Particulier","status":"futur_partenaire","address":"Yaoundé, Bastos","notes":"Prospect intéressé par nos services de sous-traitance administrative.","createdAt":"2026-08-03T21:15:22.603Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, raw_data)
VALUES ('part-4', 'SARL', 'Global Service', '+237 633 22 11 00', 'contact@globalservice.cm', 'Fournisseur', TRUE, '{"id":"part-4","lastName":"Global Service","firstName":"SARL","phone":"+237 633 22 11 00","email":"contact@globalservice.cm","category":"Fournisseur","status":"actif","address":"Douala, Bonanjo","notes":"Fournisseur de matériel bureautique et consommables.","createdAt":"2026-08-03T21:15:22.603Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.partners (doc_id, first_name, last_name, phone, email, category, status, raw_data)
VALUES ('part-5', 'Eric', 'Tchap', '+237 688 99 00 11', 'eric.tchap@techservices.cm', 'Prestataire', FALSE, '{"id":"part-5","lastName":"Tchap","firstName":"Eric","phone":"+237 688 99 00 11","email":"eric.tchap@techservices.cm","category":"Prestataire","status":"inactif","address":"Douala, Bepanda","notes":"Maintenance réseau et câblage informatique.","createdAt":"2026-08-03T21:15:22.603Z"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name, status = EXCLUDED.status, updated_at = NOW();

-- 9. Table company_settings
INSERT INTO public.company_settings (doc_id, name, company_name, work_start_time, qr_code_secret, raw_data)
VALUES ('main_config', 'main_config', 'Citrine Mobilité', '08:00', 'CITRINE-2026', '{"id":"main_config","lateThresholdTime":"08:15","enableDocuments":false,"defaultSalary":0,"hqLatitude":0,"hqName":"","allowedOfficeIPs":[],"enableInventory":false,"qrCodeSecret":"","enableLogs":false,"kioskPin":"JS3P-NJJB-5X3U-AV33","enableCommunications":false,"officeWifiSsid":"","hqAddress":"","hqLongitude":0,"workStartTime":"08:00","enableOrgChart":true,"enableDiscipline":true,"enablePartners":false,"siteLocations":[],"enableFinances":false}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  name = EXCLUDED.name, raw_data = EXCLUDED.raw_data, updated_at = NOW();

-- 10. Table documents
INSERT INTO public.documents (doc_id, title, category, format_type, raw_data)
VALUES ('doc-template-1', 'Contrat de Travail à Durée Indéterminée (CDI) - Chauffeur HERO Cab', 'contract', 'word', '{"id":"doc-template-1","title":"Contrat de Travail à Durée Indéterminée (CDI) - Chauffeur HERO Cab","category":"contract","format":"word","createdAt":"2026-10-01T20:36:27.002Z","updatedAt":"2026-10-01T20:36:27.002Z","author":"Direction RH","status":"valide"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();
INSERT INTO public.documents (doc_id, title, category, format_type, raw_data)
VALUES ('doc-template-2', 'Fiche d''Attestation de Présence et d''Assiduité Mensuelle', 'report', 'excel', '{"id":"doc-template-2","title":"Fiche d''Attestation de Présence et d''Assiduité Mensuelle","category":"report","format":"excel","createdAt":"2026-10-01T20:36:27.002Z","updatedAt":"2026-10-01T20:36:27.002Z","author":"Service Contrôle Interne","status":"valide"}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  title = EXCLUDED.title, updated_at = NOW();

-- 11. Table salary_payments
INSERT INTO public.salary_payments (doc_id, employee_id, period, base_amount, net_amount, status, raw_data)
VALUES ('pay-juillet-2026-emp-5', 'emp-5', 'Juillet 2026', 1200000, 1200000, FALSE, '{"id":"pay-juillet-2026-emp-5","netAmount":1200000,"employeeId":"emp-5","period":"Juillet 2026","status":"draft","deductions":0,"bonusAmount":0,"advanceAmount":0,"notes":"Généré automatiquement d''après la configuration de base.","paymentMethod":"transfer","baseAmount":1200000}'::jsonb)
ON CONFLICT (doc_id) DO UPDATE SET 
  net_amount = EXCLUDED.net_amount, status = EXCLUDED.status, updated_at = NOW();

-- 12. Connection and Audit Logs
INSERT INTO public.connection_logs (doc_id, user_id, user_name, user_email, status, details)
VALUES ('conn-log-1', '00000000-0000-4000-8000-000000000001', 'Landry Moutongo', 'landrymouns@gmail.com', TRUE, 'Connexion initiale Super Admin')
ON CONFLICT (doc_id) DO NOTHING;

COMMIT;
