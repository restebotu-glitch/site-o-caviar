const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  let executablePath = null;
  for (const p of chromePaths) if (fs.existsSync(p)) { executablePath = p; break; }
  const launchOptions = executablePath ? { headless: true, executablePath, args: ['--no-sandbox','--disable-setuid-sandbox'] } : { headless: true };

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  const BASE = 'http://localhost:3000';

  const articleId = 1;
  const newValues = {
    nom: 'Poulet frit ADMINEDIT',
    prix: '7777',
    description: 'Modifié via interface admin (test)'
  };

  try {
    await page.goto(BASE + '/admin/login.html', {waitUntil: 'networkidle2'});
    await page.type('#username', 'admin');
    await page.type('#password', '1234');
    await Promise.all([
      page.click('#login-btn'),
      page.waitForNavigation({waitUntil: 'networkidle2'})
    ]);

    await page.goto(BASE + '/admin/articles.html', {waitUntil: 'networkidle2'});

    // Open edit modal for articleId
    const selector = `button[onclick="editArticle(${articleId})"]`;
    await page.waitForSelector(selector);
    await page.click(selector);
    await page.waitForSelector('#article-modal.active, #article-modal', {visible: true});

    // Fill fields
    await page.evaluate((vals) => {
      document.getElementById('nom').value = vals.nom;
      document.getElementById('prix').value = vals.prix;
      document.getElementById('description').value = vals.description;
    }, newValues);

    // Submit and wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes(`/api/article/${articleId}`) && resp.request().method() === 'PUT', {timeout: 20000}),
      page.click('.btn-submit')
    ]);

    const result = await response.json();
    console.log('Réponse API:', result);

    // Wait a moment and verify articles.json
    await new Promise(r => setTimeout(r, 800));
    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf8'));
    const found = data.articles.find(a => a.id === articleId);
    if (!found) {
      console.error('Article non trouvé dans articles.json');
      await browser.close();
      process.exit(2);
    }

    console.log('Article courant dans articles.json:', {id: found.id, nom: found.nom, prix: found.prix, description: found.description});

    const ok = found.nom === newValues.nom && String(found.prix) === newValues.prix && found.description === newValues.description;
    if (ok) {
      console.log('VÉRIFICATION OK — modifications visibles dans articles.json');
      await browser.close();
      process.exit(0);
    } else {
      console.error('ÉCHEC — valeurs dans articles.json ne correspondent pas aux modifications');
      await browser.close();
      process.exit(3);
    }

  } catch (err) {
    console.error('Erreur test admin:', err);
    try { await browser.close(); } catch(e){}
    process.exit(1);
  }

})();
