-- Seed idempotent des rôles et départements de base de Citrine Management.
-- À exécuter après 001_schema.sql et avant l'import des utilisateurs.
INSERT INTO roles (uid, doc_id, name, code, description, permissions, raw_data, created_at, updated_at)
VALUES
(UUID(), 'role_super_admin', 'Super Administrateur', 'SUPER_ADMIN',
 'Administrateur système et IT avec accès complet', JSON_OBJECT('all', true),
 JSON_OBJECT('name','Super Administrateur','code','SUPER_ADMIN','permissions',JSON_OBJECT('all',true)), NOW(3), NOW(3)),
(UUID(), 'role_responsable', 'Responsable d''Unité', 'RESPONSABLE',
 'Responsable de département et validation des pointages et congés',
 JSON_OBJECT('manage_tasks',true,'validate_presences',true,'view_team',true),
 JSON_OBJECT('name','Responsable d''Unité','code','RESPONSABLE'), NOW(3), NOW(3)),
(UUID(), 'role_employe', 'Collaborateur / Employé', 'EMPLOYE',
 'Accès collaborateur : pointage, tâches assignées, fiches de paie',
 JSON_OBJECT('self_clocking',true,'view_assigned_tasks',true),
 JSON_OBJECT('name','Collaborateur / Employé','code','EMPLOYE'), NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 name = VALUES(name), description = VALUES(description),
 permissions = VALUES(permissions), raw_data = VALUES(raw_data), updated_at = NOW(3);

INSERT INTO departments (uid, doc_id, name, code, budget_xaf, raw_data, created_at, updated_at)
VALUES
(UUID(), 'dept_direction', 'Direction Générale', 'DIR', 10000000, JSON_OBJECT('name','Direction Générale','code','DIR'), NOW(3), NOW(3)),
(UUID(), 'dept_it', 'Systèmes d''Information & IT', 'IT', 5000000, JSON_OBJECT('name','Systèmes d''Information & IT','code','IT'), NOW(3), NOW(3)),
(UUID(), 'dept_rh', 'Ressources Humaines', 'RH', 4000000, JSON_OBJECT('name','Ressources Humaines','code','RH'), NOW(3), NOW(3)),
(UUID(), 'dept_logistique', 'Logistique & Opérations', 'LOG', 8000000, JSON_OBJECT('name','Logistique & Opérations','code','LOG'), NOW(3), NOW(3)),
(UUID(), 'dept_finance', 'Comptabilité & Finances', 'FIN', 6000000, JSON_OBJECT('name','Comptabilité & Finances','code','FIN'), NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 code = VALUES(code), budget_xaf = VALUES(budget_xaf), updated_at = NOW(3);
