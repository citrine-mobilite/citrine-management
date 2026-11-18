# Déploiement OVH cPanel — management.citrine-mobilite.com

## Préconditions à confirmer auprès de l'hébergeur

L'application est un serveur Express/Node.js qui écoute sur `PORT` (par défaut 3000) et doit être exposé sous HTTPS sur `management.citrine-mobilite.com`.

Le cPanel actuellement disponible ne propose pas de gestionnaire Node.js/Passenger. Il faut donc confirmer avec OVH ou l'administrateur du serveur que le vhost Apache du sous-domaine peut faire un reverse proxy vers `127.0.0.1:3000` et que les modules `mod_proxy` et `mod_proxy_http` sont actifs. Un fichier `.htaccess` ne peut pas activer ces modules à lui seul.

Exemple de directives à intégrer dans le VirtualHost Apache par l'administrateur (ne pas coller dans `.htaccess` sans confirmation du fournisseur) :

```apache
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

Le certificat TLS doit être installé sur le vhost public.

## Préparation du serveur

Depuis le compte cPanel :

```bash
cd ~/repositories/citrine-management
git checkout migration/mariadb
npm install --no-audit --no-fund
npm run build
```

Créer le fichier privé `~/repositories/citrine-management/.env` à partir de `.env.example`, renseigner les identifiants MariaDB et les secrets SMTP/Pusher, puis :

```bash
chmod 600 .env
```

Ne jamais copier le contenu de ce fichier dans GitHub ou dans une conversation.

## Démarrage et surveillance

Les scripts fournis utilisent le compte cPanel, sans privilèges root :

- `scripts/ovh_management_start.sh` : démarrage manuel.
- `scripts/ovh_management_watchdog.sh` : contrôle de santé et redémarrage si nécessaire.

Après avoir testé le démarrage manuel et vérifié `https://management.citrine-mobilite.com/api/health`, créer cette tâche Cron cPanel (une fois par minute) :

```cron
* * * * * /bin/bash /home/citrinemobilite/repositories/citrine-management/scripts/ovh_management_watchdog.sh >/dev/null 2>&1
```

Le script écrit les logs dans `~/logs/management.log`. Le PID est conservé dans `~/.management-node.pid`.

**Ne supprime pas le cron de test Node actuellement présent sur l'hébergement avant que le nouveau serveur soit démarré et vérifié.** Une fois le watchdog de production validé, remplacer uniquement le cron de test par celui ci-dessus.

## Contrôles après déploiement

```bash
curl -i http://127.0.0.1:3000/api/health
tail -n 100 ~/logs/management.log
```

Vérifier également :
- connexion utilisateur ;
- lecture et écriture des collections ;
- création et modification d'un collaborateur ;
- pointage, incidents et notifications ;
- appels WebRTC entre deux comptes ;
- envoi SMTP ;
- réception des notifications Pusher Beams.

## Limite actuelle

Le dépôt contient les scripts et le serveur configurables, mais le reverse proxy Apache, le certificat du sous-domaine, les variables secrètes et l'import réel des données doivent être configurés sur le serveur. Ces opérations ne sont pas exécutées par un commit GitHub.
