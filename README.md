# 🍽️ O'CAVIAR - Système de Gestion de Commandes

## 📋 Description
Système complet de gestion de commandes pour le restaurant O'CAVIAR incluant :
- Site front-end avec menu et panier
- Formulaire de commande en ligne
- Tableau de bord admin
- Sauvegarde des commandes

---

## 🚀 Installation et Démarrage

### 1. Installer les dépendances
```bash
npm install
```

### 2. Lancer le serveur
```bash
npm start
```
ou
```bash
node server.js
```

Le serveur sera disponible sur : **http://localhost:3000**

---

## 📱 Pages Disponibles

### Client
- **index.html** - Page d'accueil avec menu, champagne et navigation
- **commande.html** - Formulaire de commande détaillé

### Admin
- **admin/login.html** - Page de connexion administrateur
- **admin/dashboard.html** - Tableau de bord avec toutes les commandes

---

## 🔐 Accès Admin

Pour accéder au panneau admin :
1. Allez sur : `http://localhost:3000/admin/login.html`
2. **Identifiants par défaut :**
   - Utilisateur : `admin`
   - Mot de passe : `1234`

---

## 💼 Fonctionnalités du Formulaire de Commande

### Gestion du Panier
✅ Affichage en temps réel du panier  
✅ Calcul automatique des prix  
✅ Suppression d'articles  
✅ Sauvegarde localStorage  

### Informations Client
✅ Nom complet  
✅ Téléphone (obligatoire pour la livraison)  
✅ Email (optionnel)  

### Mode de Livraison
✅ **Livraison à domicile** (+500 FCFA)  
✅ **Retrait au restaurant** (Gratuit)  
✅ Champ adresse conditionnel  

### Mode de Paiement
✅ Wave  
✅ Orange Money  
✅ À la livraison  

### Extras
✅ Instructions spéciales  
✅ Validation complète du formulaire  

---

## 📊 Tableau de Bord Admin

### Statistiques en temps réel
- Total des commandes
- Commandes en attente
- Commandes confirmées
- Revenu total

### Gestion des Commandes
✅ Voir tous les détails d'une commande  
✅ Visualiser le panier du client  
✅ Modifier le statut (En attente → Confirmée → Livrée)  
✅ Filtrer par statut  
✅ Actualisation automatique toutes les 30 secondes  

---

## 📁 Structure des Fichiers

```
site web/
├── index.html              # Page d'accueil
├── commande.html           # Formulaire de commande
├── server.js              # Serveur Express
├── commandes.json         # Données des commandes (créé automatiquement)
├── package.json           # Dépendances
├── package-lock.json
├── admin/
│   ├── login.html         # Page de connexion admin
│   ├── dashboard.html     # Tableau de bord
│   └── server.js          # Serveur admin (facultatif)
├── controllers/           # À développer
├── routes/                # À développer
└── backend/
```

---

## 🔌 API Endpoints

### POST `/api/login`
Authentification admin
```json
{
  "username": "admin",
  "password": "1234"
}
```

### POST `/api/order`
Création de commande
```json
{
  "nom": "Jean Dupont",
  "telephone": "+225 07 18 18 65 65",
  "email": "jean@email.com",
  "livraison": "livraison",
  "adresse": "Rue L100, Cocody",
  "paiement": "wave",
  "notes": "Sans oignon",
  "panier": {
    "Poulet frit": 2,
    "Attieke": 1
  },
  "total": 8000,
  "subtotal": 7500,
  "fraisLivraison": 500
}
```

---

## 💳 Tarification

### Plats Principaux
- Poulet frit: 3 500 FCFA
- Poulet Mayo: 3 500 FCFA
- Poulet sauté: 3 500 FCFA
- Poisson braisé: 4 000 FCFA
- Poisson frit: 4 000 FCFA
- Mouton sauté: 4 000 FCFA
- Pintade sautée: 4 000 FCFA
- Pintade frite: 4 000 FCFA
- Brochette d'escargot: 2 500 FCFA
- Brochette de viande: 2 500 FCFA

### Garnitures
- Attieke: 1 000 FCFA
- Alloco: 1 000 FCFA
- Fritte: 1 000 FCFA
- Salade: 1 000 FCFA
- Igname: 1 000 FCFA

### Boissons
- Jus: 800 FCFA
- Sucreries: 800 FCFA
- Café: 800 FCFA
- Thé: 800 FCFA
- Boissons énergisantes: 1 200 FCFA

### Frais
- Livraison: 500 FCFA
- Retrait: Gratuit

---

## 📞 Coordonnées du Restaurant

- **Adresse:** RUE L100, COCODY, ABIDJAN, Côte d'Ivoire
- **Téléphone:** 07 18 18 65 65
- **Email:** ocaviar9@gmail.com

---

## 🔧 Améliorations Futures

- [ ] Intégration paiement temps réel (Wave, Orange Money)
- [ ] Système de notifiation SMS/Email
- [ ] Historique des commandes client
- [ ] Gestion des utilisateurs multiples (admins)
- [ ] Rapports et analytics
- [ ] Synchronisation multi-appareils
- [ ] Application mobile

---

## 🛠️ Technologies Utilisées

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Stockage:** JSON (fichier local)
- **API:** REST

---

## 📝 Notes

- Les commandes sont sauvegardées dans `commandes.json`
- La base de données peut être remplacée par MongoDB/MySQL
- Les identifiants admin sont modifiables dans `server.js`

---

**Réalisé pour O'CAVIAR - Restaurant Africain** 🍽️
