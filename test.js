#!/usr/bin/env node

/**
 * Script de test pour vérifier que le serveur et les APIs fonctionnent
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: body ? JSON.parse(body) : body
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function test() {
    console.log('🧪 Test du serveur O\'CAVIAR...\n');

    try {
        // Test 1: Page d'accueil
        console.log('1️⃣ Test de la page d\'accueil...');
        const home = await makeRequest('/');
        console.log(`   ✅ Status: ${home.status}\n`);

        // Test 2: Login avec identifiants corrects
        console.log('2️⃣ Test de connexion (CORRECT)...');
        const loginOK = await makeRequest('/api/login', 'POST', {
            username: 'admin',
            password: '1234'
        });
        console.log(`   Status: ${loginOK.status}`);
        console.log(`   Réponse: ${JSON.stringify(loginOK.data)}\n`);

        if (loginOK.data.success) {
            console.log('   ✅ Connexion réussie!\n');
        } else {
            console.log('   ❌ Connexion échouée!\n');
        }

        // Test 3: Login avec identifiants incorrects
        console.log('3️⃣ Test de connexion (INCORRECT)...');
        const loginFail = await makeRequest('/api/login', 'POST', {
            username: 'wrong',
            password: 'wrong'
        });
        console.log(`   Status: ${loginFail.status}`);
        console.log(`   Réponse: ${JSON.stringify(loginFail.data)}\n`);

        if (!loginFail.data.success) {
            console.log('   ✅ Rejet correctement effectué!\n');
        }

        // Test 4: Fichier articles.json
        console.log('4️⃣ Test du fichier articles.json...');
        const articles = await makeRequest('/articles.json');
        console.log(`   Status: ${articles.status}`);
        if (articles.data && articles.data.articles) {
            console.log(`   ✅ ${articles.data.articles.length} articles trouvés`);
            console.log(`   Frais de livraison: ${articles.data.parametres.fraisLivraison} FCFA\n`);
        }

        // Test 5: Fichier commandes.json
        console.log('5️⃣ Test du fichier commandes.json...');
        const orders = await makeRequest('/commandes.json');
        console.log(`   Status: ${orders.status}`);
        if (orders.status === 200) {
            console.log(`   ✅ Fichier accessible\n`);
        } else {
            console.log(`   ⚠️ Fichier non trouvé (normal au démarrage)\n`);
        }

        console.log('✅ Tous les tests sont terminés!');
        console.log('\n📝 Points d\'accès:');
        console.log('   • Page d\'accueil: http://localhost:3000');
        console.log('   • Admin Login: http://localhost:3000/admin/login.html');
        console.log('   • Dashboard: http://localhost:3000/admin/dashboard.html');
        console.log('   • Gestion Articles: http://localhost:3000/admin/articles.html');
        console.log('   • Paramètres: http://localhost:3000/admin/parametres.html');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        console.error('\n⚠️ Le serveur n\'est peut-être pas en cours d\'exécution.');
        console.error('Lancez d\'abord: node server.js');
        process.exit(1);
    }
}

test();
