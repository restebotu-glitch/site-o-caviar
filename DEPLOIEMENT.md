# Guide de Déploiement (Mise en ligne du site)

Ce guide vous explique pas à pas comment installer votre site O'CAVIAR sur un vrai serveur sur internet (comme un VPS Hostinger, OVH ou LWS) pour qu'il soit accessible au monde entier 24h/24.

---

## Étape 1 : Obtenir un Serveur (VPS)
1. Achetez un abonnement **VPS** (Serveur Privé Virtuel) chez un hébergeur comme **Hostinger**, **OVH**, ou **LWS**. 
   *(Si Hostinger propose un "Hébergement Cloud avec Node.js", c'est encore plus facile).*
2. Achetez un nom de domaine (exemple : `www.ocaviar.ci`).
3. L'hébergeur vous donnera des accès "SSH" (une adresse IP, un nom d'utilisateur `root`, et un mot de passe).

---

## Étape 2 : Se connecter au Serveur
1. Ouvrez votre terminal (PowerShell sous Windows ou le terminal de votre Mac/Linux).
2. Tapez cette commande (remplacez l'IP par celle de votre serveur) :
   ```bash
   ssh root@192.168.x.x
   ```
3. Entrez le mot de passe fourni par l'hébergeur. Vous êtes maintenant "dans" le serveur !

---

## Étape 3 : Installer les outils nécessaires
Une fois sur le serveur, mettez-le à jour et installez Node.js :
```bash
# Mise à jour du serveur (si c'est un serveur Linux Ubuntu/Debian)
apt update && apt upgrade -y

# Installation de Node.js et de NPM
apt install nodejs npm -y

# Installation de Git (pour récupérer votre code)
apt install git -y
```

---

## Étape 4 : Récupérer votre code depuis GitHub
1. Téléchargez votre code privé depuis votre GitHub :
   ```bash
   git clone https://github.com/VOTRE_NOM/VOTRE_PROJET.git
   ```
   *(GitHub vous demandera votre nom d'utilisateur et un jeton d'accès/mot de passe).*

2. Entrez dans le dossier du projet :
   ```bash
   cd VOTRE_PROJET
   ```

---

## Étape 5 : Préparer et Lancer le projet
1. Installez toutes les dépendances magiques du site (Express, Helmet, bcrypt...) :
   ```bash
   npm install
   ```

2. Créez votre fichier secret `.env` de production :
   ```bash
   nano .env
   ```
   *(Copiez-collez y vos mots de passe et clés secrètes comme décrit dans `.env.example`, puis sauvegardez avec `Ctrl+X`, puis `Y` et `Entrée`).*

3. **L'astuce en Or : Utiliser PM2**
   Si vous tapez juste `node server.js` et que vous fermez votre ordinateur, le site va s'éteindre.
   Pour que le site reste allumé 24h/24, installez l'outil de gestion PM2 :
   ```bash
   npm install -g pm2
   
   # Lancer le serveur pour de bon
   pm2 start server.js --name "ocaviar"
   
   # Faire en sorte qu'il se relance tout seul si le serveur redémarre
   pm2 startup
   pm2 save
   ```

---

## Étape 6 : Lier le nom de domaine
1. Dans le panel de votre hébergeur, allez dans la section "Domaines" ou "DNS".
2. Pointez votre domaine web (`ocaviar.ci`) vers l'adresse IP numérique de votre serveur.
3. Sur votre serveur, vous devrez souvent configurer un "Reverse Proxy" (Nginx) pour dire au serveur : 
   *"Quand quelqu'un tape ocaviar.ci sur internet, envoie-le secrètement vers le port 3000 de mon application Node.js"*.

🎉 **C'est terminé ! Votre site est en ligne avec le GPS fonctionnel et un panel admin ultra-sécurisé.**
