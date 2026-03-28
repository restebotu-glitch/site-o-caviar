# 🔧 Guide de Dépannage - Connexion Admin

## ✅ Solutions pour le problème de connexion

### 1️⃣ Vérifier que le serveur fonctionne

```bash
# Ouvrez un terminal dans le dossier du site web
cd "c:\Users\Chanc\OneDrive\Desktop\site web"

# Lancez le serveur
npm start
# ou
node server.js
```

Vous devriez voir : **"Serveur lancé sur http://localhost:3000"**

### 2️⃣ Vérifier les identifiants

**Utilisateur:** `admin`  
**Mot de passe:** `1234`

⚠️ Les champs acceptent :
- Lettres et chiffres
- Pas d'espaces supplémentaires (ils sont automatiquement supprimés)
- Les caractères spéciaux sont aussi supprimés

### 3️⃣ Tester la connexion

#### Option A : Via le navigateur
1. Allez sur : `http://localhost:3000/admin/login.html`
2. Entrez : `admin` et `1234`
3. Appuyez sur **Se Connecter**

#### Option B : Via le script de test
```bash
# Dans le dossier du projet
node test.js
```

Cela affichera des informations détaillées sur chaque endpoint.

---

## 🐛 Problèmes courants et solutions

### ❌ "Erreur serveur: [erreur]"

**Cause probable:** Le serveur n'est pas en cours d'exécution

**Solution:**
```bash
npm start
```

Assurez-vous que vous voyez : `Serveur lancé sur http://localhost:3000`

---

### ❌ "Identifiants incorrects"

**Vérifiez:**
1. Le texte entré est bien `admin` (pas Admin, ADMIN, etc.)
2. Le mot de passe est `1234` (pas d'espaces)
3. Le serveur affiche bien les logs de connexion

**Déboguer:**
```bash
# Ouvrez la console du navigateur (F12)
# Allez dans l'onglet "Console"
# Essayez de vous connecter
# Vous devriez voir les logs du succès/échec
```

---

### ❌ "Port 3000 déjà utilisé"

**Cause:** Un autre processus utilise le port 3000

**Solution (Windows):**
```powershell
# Trouvez le processus sur le port 3000
netstat -ano | findstr :3000

# Tuez le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F

# Relancez le serveur
npm start
```

---

### ❌ "Fetch failed / Network error"

**Cause:** Problème de communication avec le serveur

**Vérifiez:**
1. Le serveur est lancé (`npm start`)
2. L'URL est correcte : `http://localhost:3000`
3. Aucun pare-feu ne bloque le port 3000

---

## 🔍 Déboguer la connexion

### Étape 1: Vérifier les logs serveur
```bash
# Dans le terminal où le serveur tourne, vous devriez voir :
🔐 Tentative de connexion avec: admin
✅ Authentification réussie
```

### Étape 2: Vérifier les logs navigateur
1. Ouvrez le navigateur avec F12
2. Allez dans Console
3. Essayez de vous connecter
4. Cherchez les messages de log (lines commençant par "Réponse serveur:" ou les erreurs)

### Étape 3: Faire un test manuel (curl)
```bash
# Testez l'API directement
curl -X POST http://localhost:3000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"1234\"}"

# Vous devriez voir: {"success":true,"message":"Connexion réussie"}
```

---

## ✨ Vérifier que tout fonctionne

### Checklist:
- [ ] Serveur lancé avec `npm start`
- [ ] Pas d'erreur dans le terminal serveur
- [ ] Page `http://localhost:3000` accessible
- [ ] Page `http://localhost:3000/admin/login.html` accessible
- [ ] Identifiants corrects : `admin` / `1234`
- [ ] Connexion réussie → redirection vers dashboard
- [ ] Dashboard affiche les commandes

---

## 📞 Support

Si le problème persiste :
1. Vérifiez que Node.js est installé : `node --version`
2. Vérifiez que npm est installé : `npm --version`
3. Réinstallez les dépendances : `npm install`
4. Relancez le serveur : `npm start`

---

## 🎯 Améliorations apportées

✅ Meilleure gestion des erreurs de connexion  
✅ Logs détaillés dans la console  
✅ Meilleure validation des champs  
✅ Messages d'alerte clairs  
✅ Vérification de l'authentification robuste  
✅ API endpoints mieux structurés  

---

**Date de dernière mise à jour:** 20 février 2026
