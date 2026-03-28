require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

// Security: require a strong JWT secret from environment
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('WARN: JWT_SECRET not set in environment. Using fallback secret for development only.');
  JWT_SECRET = 'dev_jwt_secret_change_me';
}

function verifierAdminWeb(req, res, next) {
  if (req.path === '/login.html' || req.path === '/index.html' || req.path === '/') return next();
  const token = req.cookies.admin_token;
  if (!token) return res.redirect('/admin/login.html');
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.redirect('/admin/login.html');
    req.user = decoded;
    next();
  });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', verifierAdminWeb, express.static(path.join(__dirname, 'admin')));
// Expose assets from project root under /assets (convenience for static files like chef.jpg)
app.use('/assets', express.static(path.join(__dirname)));

const PORT = 3000;

// Configuration multer pour les uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    const uploadDir = path.join(__dirname, 'uploads');
    if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive: true});
    cb(null, uploadDir);
  },
  filename: function(req, file, cb){
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recipe-' + uniqueSuffix + path.extname(file.originalname));
  }
});
// Multer: only allow common image types
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PNG/JPEG/WebP allowed.'));
  }
});

// CORS: restrict origins (use ALLOWED_ORIGINS env var comma-separated or allow localhost by default)
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://192.168.1.12:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests like curl or mobile apps
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
// Configuration Helmet avec CSP adapté pour développement (HTTP sur réseau local)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false
    }
  })
);
// En-tête permissif pour développement (permettre HTTP sur réseau local)
app.use((req, res, next) => {
  // Pour production, utiliser maxAge: 31536000 (1 an); pour dev: 0
  const maxAge = process.env.NODE_ENV === 'production' ? 31536000 : 0;
  res.setHeader('Strict-Transport-Security', `max-age=${maxAge}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Force NO CACHE en développement pour les fichiers HTML
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  skip: (req) => req.method === 'GET' && (req.path.startsWith('/assets') || req.path.startsWith('/uploads'))
});

app.use(limiter);

// Progressive rate limiter for logins (2 min penalty per failure)
const failedLogins = new Map();

const progressiveLoginLimiter = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const record = failedLogins.get(clientIp);

  if (record && record.nextAllowedTime > Date.now()) {
    const waitMinutes = Math.ceil((record.nextAllowedTime - Date.now()) / 60000);
    return res.status(429).json({ success: false, message: `Trop de tentatives. Réessayez dans ${waitMinutes} minute(s).` });
  }

  req.handleFailedLogin = () => {
    const current = failedLogins.get(clientIp) || { count: 0 };
    current.count += 1;
    const penaltyMs = current.count * 2 * 60 * 1000;
    current.nextAllowedTime = Date.now() + penaltyMs;
    // Clean up map over time (optional, keep it simple for now)
    failedLogins.set(clientIp, current);
  };

  req.handleSuccessfulLogin = () => {
    failedLogins.delete(clientIp);
  };

  next();
};

// Rate limiter for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Trop d\'uploads. Réessayez plus tard.' }
});

// Additional helmet protections (adaptés pour développement)
app.use(helmet.frameguard({ action: 'SAMEORIGIN' })); // Permettre iframes d'accès locaux
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));





app.use(express.json());
// Do NOT serve the project root. Keep only public and uploads as needed.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const ADMIN_USER = process.env.ADMIN_USER || 'admin';
// Hash bcrypt pour le mot de passe 'admin' (généré avec 10 rounds)
// Hash bcrypt pour le mot de passe 'djamila'
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || '$2b$10$ExOm1jOV2Ns9/5cqkXxR4Ok8Bn8LYXRcmrpD3EE5ufiXPrAxmxNoe';
if (!process.env.ADMIN_PASS_HASH) {
  console.warn('WARN: Using embedded ADMIN_PASS_HASH. Set ADMIN_PASS_HASH in environment for better security.');
}
function verifierToken(req,res,next){
  let token = req.headers['authorization'];

  if (token && token.startsWith && token.startsWith('Bearer ')) {
    token = token.slice(7);
  } else if (!token && req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).json({message:"Token invalide"});
    }
    req.user = decoded;
    next();
  });
}
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir l'interface d'administration depuis le serveur principal
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/dashboard', verifierAdminWeb, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});
// Routes explicites pour pages HTML du site (fournir accès aux pages du projet racine)
app.get('/commande.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'commande.html'));
});
app.get('/suivi.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'suivi.html'));
});

// Route utilitaire pour pré-remplir le panier dans localStorage et rediriger vers la page de commande
app.get('/autofill-cart', (req, res) => {
  const sampleCart = {
    "Poulet frit": 1,
    "Attieke": 2
  };
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Auto-fill Cart</title></head><body>
    <script>
      try {
        localStorage.setItem('cart', JSON.stringify(${JSON.stringify(sampleCart)}));
        // small marker to help debugging
        localStorage.setItem('autofill', 'true');
      } catch(e) { console.error('localStorage error', e); }
      window.location.href = '/commande.html';
    </script>
    <p>Redirection vers la page de commande...</p>
  </body></html>`);
});

app.post('/api/login', progressiveLoginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: "Champs invalides" });
  }

  // Prevent overly long inputs
  // Allow username up to 50 chars, pass up to 100
  if (username.length > 50 || password.length > 100) {
    return res.status(400).json({ success: false, message: "Entrées trop longues" });
  }

  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  try {
    const adminsFile = path.join(__dirname, 'admins.json');
    let admins = [];
    if (fs.existsSync(adminsFile)) {
      admins = JSON.parse(fs.readFileSync(adminsFile, 'utf-8'));
    } else {
      // Fallback
      admins = [{ username: ADMIN_USER, passwordHash: ADMIN_PASS_HASH }];
    }

    const adminUser = admins.find(a => a.username === trimmedUsername);
    if (!adminUser) {
      req.handleFailedLogin();
      return res.status(401).json({ success: false, message: "Identifiants incorrects" });
    }

    const valid = await bcrypt.compare(trimmedPassword, adminUser.passwordHash);

    if (!valid) {
      req.handleFailedLogin();
      return res.status(401).json({ success: false, message: "Identifiants incorrects" });
    }

    req.handleSuccessfulLogin();

    const token = jwt.sign({ user: trimmedUsername }, JWT_SECRET, { expiresIn: "12h" });

    // Set cookie for static files protection (accessible to JS for logout)
    res.cookie('admin_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ token, success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Endpoint admin-data compatible avec l'ancien front admin
app.get('/api/admin-data', verifierToken, (req, res) => {
  res.json({ message: 'Bienvenue sur la page admin !' });
});

// Retourne toutes les commandes (JSON)
app.get('/api/orders', (req, res) => {
  try {
    const ordersFile = path.join(__dirname, 'commandes.json');
    if (!fs.existsSync(ordersFile)) return res.json([]);
    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));

    // Support simple search query via ?q=... (recherche par id, téléphone, email ou nom)
    const q = req.query.q;
    if (q && String(q).trim() !== '') {
      const normalized = String(q).toLowerCase();
      const filtered = orders.filter(o => {
        // rechercher par id exact
        if (String(o.id) === normalized) return true;

        // client fields
        const nom = (o.client && o.client.nom) ? String(o.client.nom).toLowerCase() : '';
        const tel = (o.client && o.client.telephone) ? String(o.client.telephone).toLowerCase() : '';
        const email = (o.client && o.client.email) ? String(o.client.email).toLowerCase() : '';

        if (nom.includes(normalized)) return true;
        if (tel.includes(normalized)) return true;
        if (email.includes(normalized)) return true;

        // adresse and commune
        if (o.adresse && String(o.adresse).toLowerCase().includes(normalized)) return true;
        if (o.commune && String(o.commune).toLowerCase().includes(normalized)) return true;

        return false;
      });

      return res.json(filtered);
    }

    res.json(orders);
  } catch (err) {
    console.error('Erreur lecture commandes:', err);
    res.status(500).json({ success: false, message: 'Erreur lecture commandes' });
  }
});

// Endpoint pour traiter les commandes
app.post('/api/order',(req,res)=>{
  try {
    const {nom, telephone, email, livraison, commune, adresse, paiement, notes, latitude, longitude, panier, total, subtotal, fraisLivraison, date} = req.body;

    // Validation básica
    if(!nom || !telephone || !panier || Object.keys(panier).length === 0){
      return res.json({success: false, message: 'Données manquantes ou panier vide'});
    }

    // Input validation - prevent XSS/injection
    if (typeof nom !== 'string' || nom.length > 100) {
      return res.json({success: false, message: 'Nom invalide'});
    }
    if (typeof telephone !== 'string' || telephone.length > 20) {
      return res.json({success: false, message: 'Téléphone invalide'});
    }
    if (email && (typeof email !== 'string' || email.length > 100)) {
      return res.json({success: false, message: 'Email invalide'});
    }

    // Créer un objet commande
    const ordre = {
      id: Date.now(),
      date: date,
      client: {
        nom: String(nom).trim(),
        telephone: String(telephone).trim(),
        email: email ? String(email).trim() : 'N/A'
      },
      livraison: livraison,
      commune: commune || 'Non spécifiée',
      adresse: adresse,
      position: latitude && longitude ? {latitude, longitude} : null,
      paiement: paiement,
      notes: notes,
      panier: panier,
      total: total,
      subtotal: subtotal,
      fraisLivraison: fraisLivraison,
      statut: 'En attente'
    };

    // Sauvegarder la commande dans un fichier JSON
    const ordersFile = path.join(__dirname, 'commandes.json');
    let orders = [];
    
    if(fs.existsSync(ordersFile)){
      const data = fs.readFileSync(ordersFile, 'utf-8');
      orders = JSON.parse(data || '[]');
    }

    orders.push(ordre);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    console.log('📦 Nouvelle commande:', {id: ordre.id, client: ordre.client.nom, total: ordre.total});

    res.json({success: true, message: 'Commande reçue', orderId: ordre.id});

  } catch(err){
    console.error('Erreur serveur:', err);
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// ===== API GESTION DES ARTICLES =====

// GET tous les articles (endpoint public)
app.get('/api/articles',(req,res)=>{
  try {
    const articlesFile = path.join(__dirname, 'articles.json');
    const data = fs.readFileSync(articlesFile, 'utf-8');
    const articles = JSON.parse(data).articles;
    res.json({success: true, articles});
  } catch(err){
    res.json({success: false, message: 'Erreur lecture articles'});
  }
});

// GET articles.json (compatibilité)
app.get('/articles.json',(req,res)=>{
  try {
    const articlesFile = path.join(__dirname, 'articles.json');
    res.sendFile(articlesFile);
  } catch(err){
    res.json({success: false, message: 'Erreur lecture articles'});
  }
});

// POST ajouter un article
app.post('/api/article', verifierToken, uploadLimiter, upload.single('image'), (req,res)=>{
  try {
    const {nom, categorie, prix, description, fraisLivraison} = req.body;

    if(!nom || !categorie || !prix){
      return res.json({success: false, message: 'Données manquantes'});
    }

    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));
    
    const newId = Math.max(...data.articles.map(a => a.id)) + 1;
    
    // Gérer l'image uploadée ou utiliser placeholder SVG
    let imagePath = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%23999%22%3EImage%3C/text%3E%3C/svg%3E';
    if(req.file){
      imagePath = '/uploads/' + req.file.filename;
    }
    
    const newArticle = {
      id: newId,
      nom,
      categorie,
      prix: parseInt(prix),
      fraisLivraison: (fraisLivraison !== undefined && fraisLivraison !== null && fraisLivraison !== '') ? parseInt(fraisLivraison) : (data.parametres && data.parametres.fraisLivraison ? data.parametres.fraisLivraison : 0),
      description: description || '',
      image: imagePath
    };

    data.articles.push(newArticle);
    fs.writeFileSync(articlesFile, JSON.stringify(data, null, 2));

    console.log('➕ Article ajouté:', nom);
    res.json({success: true, message: 'Article ajouté', article: newArticle});
  } catch(err){
    console.error('Erreur:', err);
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// PUT modifier un article
app.put('/api/article/:id', verifierToken, uploadLimiter, upload.single('image'), (req,res)=>{
  try {
    const articleId = parseInt(req.params.id);
    const {nom, categorie, prix, description, fraisLivraison} = req.body;

    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));
    
    const article = data.articles.find(a => a.id === articleId);
    if(!article){
      return res.json({success: false, message: 'Article non trouvé'});
    }

    article.nom = nom || article.nom;
    article.categorie = categorie || article.categorie;
    article.prix = prix ? parseInt(prix) : article.prix;
    article.description = description !== undefined ? description : article.description;
    if (fraisLivraison !== undefined) {
      article.fraisLivraison = fraisLivraison ? parseInt(fraisLivraison) : 0;
    }
    
    // Si une nouvelle image est uploadée, mettre à jour le chemin
    if(req.file){
      article.image = '/uploads/' + req.file.filename;
    }

    fs.writeFileSync(articlesFile, JSON.stringify(data, null, 2));

    console.log('✏️ Article modifié:', nom);
    res.json({success: true, message: 'Article modifié'});
  } catch(err){
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// DELETE supprimer un article
app.delete('/api/article/:id', verifierToken, (req,res)=>{
  try {
    const articleId = parseInt(req.params.id);

    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));
    
    const index = data.articles.findIndex(a => a.id === articleId);
    if(index === -1){
      return res.json({success: false, message: 'Article non trouvé'});
    }

    const deleted = data.articles.splice(index, 1);
    fs.writeFileSync(articlesFile, JSON.stringify(data, null, 2));

    console.log('🗑️ Article supprimé:', deleted[0].nom);
    res.json({success: true, message: 'Article supprimé'});
  } catch(err){
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// ===== API GESTION DES PARAMETRES =====

// GET paramètres
app.get('/api/parametres',(req,res)=>{
  try {
    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));
    res.json({success: true, parametres: data.parametres});
  } catch(err){
    res.json({success: false, message: 'Erreur lecture paramètres'});
  }
});

// PUT modifier les paramètres
app.put('/api/parametres',(req,res)=>{
  try {
    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));

    // Mettre à jour les paramètres
    data.parametres = {
      ...data.parametres,
      ...req.body
    };

    fs.writeFileSync(articlesFile, JSON.stringify(data, null, 2));

    console.log('⚙️ Paramètres mis à jour');
    res.json({success: true, message: 'Paramètres mis à jour', parametres: data.parametres});
  } catch(err){
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// ===== API SUIVI COMMANDES =====

// GET une commande par son ID (client - public)
app.get('/api/order/:id', (req,res)=>{
  try {
    const orderId = req.params.id;
    const ordersFile = path.join(__dirname, 'commandes.json');
    
    if(!fs.existsSync(ordersFile)){
      return res.json({success: false, message: 'Commande non trouvée'});
    }
    
    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
    const order = orders.find(o => o.id == orderId);
    
    if(!order){
      return res.json({success: false, message: 'Commande non trouvée'});
    }
    
    res.json({success: true, order});
  } catch(err){
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// PUT mettre à jour le statut d'une commande (admin)
app.put('/api/order/:id/statut', (req,res)=>{
  try {
    const orderId = req.params.id;
    const {statut} = req.body;
    
    if(!statut){
      return res.json({success: false, message: 'Statut manquant'});
    }
    
    const ordersFile = path.join(__dirname, 'commandes.json');
    
    if(!fs.existsSync(ordersFile)){
      return res.json({success: false, message: 'Commande non trouvée'});
    }
    
    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
    const order = orders.find(o => o.id == orderId);
    
    if(!order){
      return res.json({success: false, message: 'Commande non trouvée'});
    }
    
    // Mise à jour du statut et de la date
    order.statut = statut;
    order.derniereMajStatut = new Date().toLocaleString('fr-FR');
    
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
    
    console.log('✏️ Statut commande ' + orderId + ' mis à jour:', statut);
    res.json({success: true, message: 'Statut mis à jour', order});
  } catch(err){
    res.json({success: false, message: 'Erreur serveur'});
  }
});

// Utiliser PORT depuis l'environnement si fourni (utile pour l'hébergement)
const port = process.env.PORT || PORT;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur lancé sur http://localhost:${port} et http://192.168.1.12:${port}`);
});

server.on('error', (err) => {
  console.error('Erreur serveur lors du démarrage :', err);
  process.exit(1);
});

// DELETE supprimer une commande (admin)
app.delete('/api/order/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    const ordersFile = path.join(__dirname, 'commandes.json');

    if (!fs.existsSync(ordersFile)) {
      return res.json({ success: false, message: 'Commande non trouvée' });
    }

    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
    const index = orders.findIndex(o => o.id == orderId);
    if (index === -1) {
      return res.json({ success: false, message: 'Commande non trouvée' });
    }

    const deleted = orders.splice(index, 1)[0];
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    console.log('🗑️ Commande supprimée:', deleted.id);
    res.json({ success: true, message: 'Commande supprimée', order: deleted });
  } catch (err) {
    console.error('Erreur suppression commande:', err);
    res.json({ success: false, message: 'Erreur serveur' });
  }
});

// POST upload preuve de paiement pour une commande
app.post('/api/order/:id/proof', upload.single('proof'), (req, res) => {
  try {
    const orderId = req.params.id;
    const paymentNumber = req.body.paymentNumber || null;

    const ordersFile = path.join(__dirname, 'commandes.json');
    if (!fs.existsSync(ordersFile)) {
      return res.json({ success: false, message: 'Commande non trouvée' });
    }

    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
    const order = orders.find(o => o.id == orderId);
    if (!order) {
      return res.json({ success: false, message: 'Commande non trouvée' });
    }

    // Attacher les informations de paiement
    if (paymentNumber) order.paiementNumero = String(paymentNumber);
    if (req.file) {
      order.paymentProof = '/uploads/' + req.file.filename;
    }
    order.derniereMajStatut = new Date().toLocaleString('fr-FR');

    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    console.log('💳 Preuve paiement reçue pour commande', orderId);
    res.json({ success: true, message: 'Preuve reçue', order });
  } catch (err) {
    console.error('Erreur upload preuve:', err);
    res.json({ success: false, message: 'Erreur serveur' });
  }
});

// Global error handler (multer errors and general)
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error('Erreur middleware:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err && err.message && err.message.indexOf('Origin not allowed by CORS') !== -1) {
    return res.status(403).json({ success: false, message: 'Origin not allowed by CORS' });
  }
  res.status(500).json({ success: false, message: 'Erreur serveur' });
});