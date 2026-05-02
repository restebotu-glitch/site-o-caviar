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

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('JWT_SECRET manquant');
  JWT_SECRET = 'dev_secret';
}

// 🔥 IMPORTANT : dossier corrigé ici
app.use(express.static(path.join(__dirname, 'PUBLIQUE')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================= ROUTE PRINCIPALE ================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'PUBLIQUE', 'index.html'));
});

app.get('/commande.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'PUBLIQUE', 'commande.html'));
});

app.get('/suivi.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'PUBLIQUE', 'suivi.html'));
});

/* ================= SERVER ================= */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur lancé sur port ${PORT}`);
});
