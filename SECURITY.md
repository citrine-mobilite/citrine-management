# Sécurité et exploitation

## Secrets

- Ne jamais committer .env, les exports de données, les clés privées, les mots de passe MariaDB, SMTP ou Pusher.
- Les variables SQL_*, SMTP_*, PUSHER_BEAMS_SECRET_KEY et CRON_SECRET sont réservées au serveur.
- CRON_SECRET doit contenir au moins 32 caractères aléatoires. Les routes /api/cron/* exigent l'en-tête x-cron-secret.
- Le dépôt public a historiquement contenu une clé Supabase service_role dans un ancien bundle API généré. Le bundle a été retiré de la branche de migration, mais cela ne révoque pas la clé : elle doit être révoquée et renouvelée dans Supabase. La réécriture de l'historique Git ne remplace jamais cette rotation.
- Les anciennes valeurs QR par défaut ont été supprimées. Configurer un nouveau secret et un nouveau jeton QR dans les paramètres de l'entreprise avant de réactiver le pointage, puis remplacer le QR physique.
- Si le contrôle GPS est activé dans les paramètres du QR, renseigner OFFICE_LATITUDE, OFFICE_LONGITUDE et OFFICE_GPS_RADIUS_METERS avec les coordonnées et le rayon autorisés.

## Authentification et accès

- Les sessions sont stockées sous forme de hash dans auth_sessions et expirent après 12 heures.
- Le serveur émet un cookie de session HttpOnly, SameSite=Lax et Secure en production HTTPS.
- Les mots de passe PBKDF2 sont vérifiés côté serveur. Les anciens hashes bcrypt sont acceptés pour permettre une migration progressive, puis convertis après une connexion réussie.
- Les routes de gestion, de finance, de messagerie, de pointage et de temps réel appliquent des contrôles d'accès par rôle et, pour les employés, des restrictions sur leurs propres données.
- Les mots de passe initiaux doivent comporter au moins 12 caractères ; aucun mot de passe universel n'est prévu.

## Base de données

- Utiliser un compte MariaDB limité à la base Citrine Management, jamais le compte administrateur global du serveur.
- Appliquer les migrations sur une base vide ou de test avant la production.
- Faire une sauvegarde avant toute importation ou fusion.
- L'export Supabase est un fichier sensible : transférer par SCP, ne pas envoyer par e-mail ou messagerie, et le supprimer après validation.

## Déploiement

- Ne pas exposer le port Node directement sur Internet : Apache doit faire le reverse proxy local vers 127.0.0.1:PORT.
- Activer HTTPS avant d'utiliser les cookies de session.
- Les routes de santé /api/health et /api/ready distinguent respectivement la disponibilité du processus et celle de MariaDB.