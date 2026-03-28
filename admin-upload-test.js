const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  // Si Chromium n'est pas fourni par Puppeteer, tenter d'utiliser une installation locale de Chrome/Edge
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  let executablePath = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) { executablePath = p; break; }
  }
  const launchOptions = executablePath ? { headless: true, executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] } : { headless: true };
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  const BASE = 'http://localhost:3000';

  try {
    // Login
    await page.goto(BASE + '/admin/login.html', {waitUntil: 'networkidle2'});
    await page.type('#username', 'admin');
    await page.type('#password', '1234');
    await Promise.all([
      page.click('#login-btn'),
      page.waitForNavigation({waitUntil: 'networkidle2'})
    ]);

    // Open articles page
    await page.goto(BASE + '/admin/articles.html', {waitUntil: 'networkidle2'});

    // Open add modal
    await page.evaluate(() => { if (typeof openAddModal === 'function') openAddModal(); });
    await page.waitForSelector('#article-modal', {visible: true});

    // Fill form
    await page.type('#nom', 'Puppeteer Test Dish');
    await page.select('#categorie', 'plats');
    await page.type('#prix', '1234');
    await page.type('#description', 'Test upload via Puppeteer');

    // Attach file
    const input = await page.$('#image');
    const uploadFile = path.join(__dirname, 'uploads', 'recipe-1771609677684-267650477.png');
    if (!fs.existsSync(uploadFile)) {
      console.error('Fichier d\'upload introuvable:', uploadFile);
      await browser.close();
      process.exit(2);
    }
    await input.uploadFile(uploadFile);

    // Submit and wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/article') && resp.request().method() === 'POST', {timeout: 20000}),
      page.click('.btn-submit')
    ]);

    const result = await response.json();
    console.log('Réponse API:', result);

    // Small wait to ensure file written
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();

    // Verify articles.json
    const articlesFile = path.join(__dirname, 'articles.json');
    const data = JSON.parse(fs.readFileSync(articlesFile, 'utf8'));
    const found = data.articles.find(a => a.nom === 'Puppeteer Test Dish');
    if (found) {
      console.log('Test réussi — article ajouté avec id:', found.id);
      process.exit(0);
    } else {
      console.error('Échec — article non trouvé dans articles.json');
      process.exit(3);
    }

  } catch (err) {
    console.error('Erreur lors du test headless:', err);
    try { await browser.close(); } catch(e){}
    process.exit(1);
  }

})();
