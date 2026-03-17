const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const TEST_DATA = {
  firstName: 'Alex', lastName: 'Morgan', fullName: 'Alex Morgan',
  email: 'alex.morgan@testbenchmark.example.com',
  phone: '+1 (555) 012-3456', company: 'Benchmark Testing Corp',
  jobTitle: 'Product Manager', website: 'https://testbenchmark.example.com',
  message: "Hi, I'd like to learn more about your services and pricing.",
};

const CONTACT_PATHS = ['/contact','/contact-us','/contact-sales','/get-in-touch','/company/contact','/about/contact','/talk-to-sales','/demo','/request-demo'];

async function findContactPage(page, baseUrl) {
  // Method 1: Visible nav/footer links
  for (const text of ['Contact Us', 'Contact', 'Get in Touch', 'Talk to Sales', 'Contact Sales']) {
    try {
      const link = page.locator(`a:visible:has-text("${text}")`).first();
      if (await link.count() > 0) {
        const href = await link.getAttribute('href');
        if (href && (href.includes('contact') || href.includes('touch') || href.includes('sales'))) {
          await link.click({ timeout: 5000 });
          await page.waitForLoadState('domcontentloaded');
          return { url: page.url(), method: `nav link "${text}"` };
        }
      }
    } catch(e) {}
  }
  // Method 2: Direct URL attempts
  for (const p of CONTACT_PATHS) {
    try {
      const url = new URL(p, baseUrl).href;
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      if (resp && resp.status() < 400) {
        // Verify it has a form or contact-related content
        const hasForm = await page.locator('form, input[type="email"], textarea').count();
        const hasContactText = await page.locator('text=/contact|get in touch|reach out|send.*message/i').count();
        if (hasForm > 0 || hasContactText > 0) return { url: page.url(), method: `direct path ${p}` };
      }
    } catch(e) {}
  }
  return { url: null, method: 'NOT FOUND' };
}

async function analyzeForm(page) {
  await page.waitForTimeout(3000);
  // Check main page AND all iframes for form fields
  let fields = [];
  const allFrames = [page, ...page.frames()];
  for (const frame of allFrames) {
    try {
      const frameFields = await frame.evaluate(() => {
        const result = [];
        document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
          if (el.offsetParent === null && el.type !== 'hidden') return;
          const type = el.getAttribute('type') || el.tagName.toLowerCase();
          if (type === 'search') return; // Skip search bars
          const label = el.closest('label')?.textContent?.trim() ||
            document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() ||
            el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name') || 'unknown';
          result.push({
            tag: el.tagName.toLowerCase(), type: type,
            name: el.getAttribute('name') || '', label: label.substring(0, 60),
            required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
            rect: el.getBoundingClientRect().toJSON()
          });
        });
        return result;
      });
      if (frameFields.length > fields.length) fields = frameFields; // Use frame with most fields
    } catch(e) {}
  }

  const captcha = await page.evaluate(() => {
    if (document.querySelector('.g-recaptcha, [data-sitekey], iframe[src*="recaptcha"]')) return 'reCAPTCHA';
    if (document.querySelector('.h-captcha, iframe[src*="hcaptcha"]')) return 'hCaptcha';
    if (document.querySelector('.cf-turnstile, iframe[src*="turnstile"]')) return 'Turnstile';
    return 'None';
  });

  const cookie = await page.locator('[class*="cookie"], [id*="cookie"], [class*="consent"], #onetrust-banner-sdk, [id*="onetrust"]').count() > 0;
  const formBox = await page.evaluate(() => { const f = document.querySelector('form'); return f ? f.getBoundingClientRect().toJSON() : null; });
  const aboveFold = formBox ? formBox.y < 800 : false;
  const scrollNeeded = formBox ? (formBox.y + formBox.height > 900) : false;
  const multiStep = await page.locator('button:has-text("Next"), button:has-text("Continue"), .step-indicator, [class*="progress"]').count() > 0;
  const submitBtn = await page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Send"), button:has-text("Get in touch")').first();
  const submitText = await submitBtn.count() > 0 ? await submitBtn.textContent() : 'none found';

  return { fields, captcha, cookieBanner: cookie, aboveFold, scrollNeeded, multiStep, submitText: submitText.trim() };
}

async function fillForm(page, fields) {
  let totalClicks = 0, errors = [], interruptions = 0;
  // Dismiss cookie banner
  try {
    const accept = page.locator('button:has-text("Accept"), button:has-text("Accept All"), #onetrust-accept-btn-handler, button:has-text("Allow")').first();
    if (await accept.count() > 0) { await accept.click({ timeout: 3000 }); interruptions++; await page.waitForTimeout(500); }
  } catch(e) {}

  const timings = [];
  for (const f of fields) {
    if (!f.name) continue;
    const sel = `[name="${f.name}"]`;
    const start = Date.now();
    try {
      const el = page.locator(sel).first();
      if (await el.count() === 0) continue;
      switch(f.type) {
        case 'text': case 'name':
          const n = f.name.toLowerCase();
          if (n.includes('first') || n === 'fname') await el.fill(TEST_DATA.firstName);
          else if (n.includes('last') || n === 'lname') await el.fill(TEST_DATA.lastName);
          else if (n.includes('company') || n.includes('org')) await el.fill(TEST_DATA.company);
          else if (n.includes('role') || n.includes('title') || n.includes('job')) await el.fill(TEST_DATA.jobTitle);
          else if (n.includes('name')) await el.fill(TEST_DATA.fullName);
          else await el.fill('Test');
          totalClicks++; break;
        case 'email': await el.fill(TEST_DATA.email); totalClicks++; break;
        case 'tel': await el.fill(TEST_DATA.phone); totalClicks++; break;
        case 'url': await el.fill(TEST_DATA.website); totalClicks++; break;
        case 'textarea': await el.fill(TEST_DATA.message); totalClicks++; break;
        case 'select':
          try { await el.selectOption({ index: 1 }); totalClicks++; } catch(e) { errors.push(`select ${f.name}: ${e.message.substring(0,50)}`); }
          break;
        case 'checkbox':
          if (f.required) { try { await el.check(); totalClicks++; } catch(e) {} }
          break;
        case 'radio':
          try { await el.check(); totalClicks++; } catch(e) {}
          break;
        default: break;
      }
    } catch(e) { errors.push(`${f.name}: ${e.message.substring(0,50)}`); }
    timings.push({ field: f.label.substring(0,30), ms: Date.now() - start });
  }
  return { timings, totalClicks, errors, interruptions };
}

function calcScore(analysis, navTimeMs, fillData) {
  let score = 0;
  const fc = analysis.fields.length;
  score += fc <= 3 ? 0 : fc <= 6 ? 1 : fc <= 10 ? 2 : 3;
  const complex = analysis.fields.filter(f => ['select','file','date'].includes(f.type)).length;
  score += complex >= 3 ? 2 : complex >= 1 ? 1 : 0;
  score += analysis.captcha === 'reCAPTCHA' || analysis.captcha === 'hCaptcha' ? 2 : analysis.captcha === 'Turnstile' ? 1 : 0;
  score += navTimeMs > 5000 ? 2 : navTimeMs > 2000 ? 1 : 0;
  score += analysis.multiStep ? 1 : 0;
  score += analysis.scrollNeeded ? 0.5 : 0;
  score += analysis.cookieBanner ? 0.5 : 0;
  score += !analysis.aboveFold ? 0.5 : 0;
  return Math.min(10, Math.round(score * 10) / 10);
}

function calcHumanTime(analysis) {
  let t = 0;
  for (const f of analysis.fields) {
    if (['text','name','email','tel','url'].includes(f.type)) t += 5;
    else if (f.type === 'textarea') t += 15;
    else if (f.type === 'select') t += 4;
    else if (['checkbox','radio'].includes(f.type)) t += 2;
    else t += 3;
  }
  if (analysis.captcha !== 'None') t += 20;
  if (analysis.cookieBanner) t += 5;
  if (analysis.multiStep) t += 10;
  return t;
}

async function benchmarkSite(context, url) {
  const page = await context.newPage();
  const result = { url, timestamp: new Date().toISOString() };
  try {
    // Phase 1: Navigation
    const navStart = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    result.homepageLoadMs = Date.now() - navStart;
    const nav = await findContactPage(page, url);
    result.contactUrl = nav.url;
    result.navMethod = nav.method;
    result.navTimeMs = Date.now() - navStart;

    if (!nav.url) { result.error = 'Contact page not found'; return result; }

    // Phase 2: Form Analysis
    const analysis = await analyzeForm(page);
    result.totalFields = analysis.fields.length;
    result.requiredFields = analysis.fields.filter(f => f.required).length;
    result.optionalFields = result.totalFields - result.requiredFields;
    result.fieldInventory = analysis.fields.map(f => ({ label: f.label, type: f.type, required: f.required }));
    result.fieldTypes = [...new Set(analysis.fields.map(f => f.type))].join(', ');
    result.complexFields = analysis.fields.filter(f => ['select','file','date'].includes(f.type)).length;
    result.captcha = analysis.captcha;
    result.cookieBanner = analysis.cookieBanner;
    result.aboveFold = analysis.aboveFold;
    result.scrollNeeded = analysis.scrollNeeded;
    result.multiStep = analysis.multiStep;
    result.submitButton = analysis.submitText;

    // Phase 3: Form Fill
    if (analysis.fields.length > 0) {
      const fillStart = Date.now();
      const fill = await fillForm(page, analysis.fields);
      result.fillTimeMs = Date.now() - fillStart;
      result.totalClicks = fill.totalClicks + fill.interruptions;
      result.fieldTimings = fill.timings;
      result.fillErrors = fill.errors;
      result.interruptions = fill.interruptions;
    } else {
      result.fillTimeMs = 0; result.totalClicks = 0; result.fieldTimings = []; result.fillErrors = []; result.interruptions = 0;
    }

    // Phase 4: Scoring
    result.frictionScore = calcScore(analysis, result.navTimeMs, null);
    result.estHumanTimeSec = calcHumanTime(analysis);

  } catch(e) { result.error = e.message.substring(0, 200); }
  finally { await page.close(); }
  return result;
}

function generateReport(results) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const names = results.map(r => new URL(r.url).hostname.replace('www.', ''));

  let md = `# FormRecon Benchmark Report\n_Generated: ${new Date().toISOString()}_\n\n## Summary Comparison\n\n`;
  md += `| Metric | ${names.join(' | ')} |\n|--------|${names.map(() => '--------').join('|')}|\n`;
  md += `| Contact URL | ${results.map(r => r.contactUrl || 'NOT FOUND').join(' | ')} |\n`;
  md += `| Nav Method | ${results.map(r => r.navMethod || '-').join(' | ')} |\n`;
  md += `| Nav Time | ${results.map(r => r.navTimeMs ? r.navTimeMs + 'ms' : '-').join(' | ')} |\n`;
  md += `| Fields (req/opt) | ${results.map(r => r.totalFields != null ? `${r.requiredFields}/${r.optionalFields}` : '-').join(' | ')} |\n`;
  md += `| Field Types | ${results.map(r => r.fieldTypes || '-').join(' | ')} |\n`;
  md += `| CAPTCHA | ${results.map(r => r.captcha || '-').join(' | ')} |\n`;
  md += `| Cookie Banner | ${results.map(r => r.cookieBanner ? 'Yes' : 'No').join(' | ')} |\n`;
  md += `| Above Fold | ${results.map(r => r.aboveFold ? 'Yes' : 'No').join(' | ')} |\n`;
  md += `| Scroll Needed | ${results.map(r => r.scrollNeeded ? 'Yes' : 'No').join(' | ')} |\n`;
  md += `| Multi-step | ${results.map(r => r.multiStep ? 'Yes' : 'No').join(' | ')} |\n`;
  md += `| Total Clicks | ${results.map(r => r.totalClicks ?? '-').join(' | ')} |\n`;
  md += `| Est. Human Time | ${results.map(r => r.estHumanTimeSec ? r.estHumanTimeSec + 's' : '-').join(' | ')} |\n`;
  md += `| **Friction Score** | ${results.map(r => r.frictionScore != null ? `**${r.frictionScore}/10**` : '-').join(' | ')} |\n`;

  md += `\n## Detailed Results\n`;
  for (const r of results) {
    const name = new URL(r.url).hostname.replace('www.', '');
    md += `\n### ${name}\n`;
    md += `- **URL:** ${r.url}\n- **Contact Page:** ${r.contactUrl || 'NOT FOUND'}\n`;
    md += `- **Found via:** ${r.navMethod}\n- **Nav time:** ${r.navTimeMs}ms\n`;
    if (r.error) { md += `- **Error:** ${r.error}\n`; continue; }
    md += `- **Fields:** ${r.requiredFields} required, ${r.optionalFields} optional\n`;
    md += `- **CAPTCHA:** ${r.captcha} | **Cookie Banner:** ${r.cookieBanner ? 'Yes' : 'No'}\n`;
    md += `- **Above Fold:** ${r.aboveFold ? 'Yes' : 'No'} | **Multi-step:** ${r.multiStep ? 'Yes' : 'No'}\n`;
    md += `- **Submit Button:** "${r.submitButton}"\n`;
    md += `- **Fill Time:** ${r.fillTimeMs}ms | **Clicks:** ${r.totalClicks}\n`;
    md += `- **Est. Human Time:** ${r.estHumanTimeSec}s\n`;
    md += `- **Friction Score:** ${r.frictionScore}/10\n`;
    if (r.fieldInventory) {
      md += `\n| # | Field | Type | Required |\n|---|-------|------|----------|\n`;
      r.fieldInventory.forEach((f, i) => { md += `| ${i+1} | ${f.label} | ${f.type} | ${f.required ? '✅' : '❌'} |\n`; });
    }
    if (r.fillErrors && r.fillErrors.length > 0) { md += `\n**Errors:** ${r.fillErrors.join(', ')}\n`; }
  }

  md += `\n## Methodology\nFriction score (1-10) based on: field count, complex fields, CAPTCHA, navigation time, multi-step, scroll, cookie banner, above-fold position. Higher = more friction. Estimated human time based on: 5s/text field, 15s/textarea, 4s/dropdown, 2s/checkbox, +20s CAPTCHA, +5s cookie banner, +10s multi-step.\n`;

  // Save files
  const jsonPath = path.join(__dirname, 'results', `${ts}.json`);
  const mdPath = path.join(__dirname, 'results', `${ts}-report.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(mdPath, md);
  console.log(`\nSaved: ${jsonPath}`);
  console.log(`Saved: ${mdPath}`);
  return md;
}

// Main
(async () => {
  const configFile = process.argv[2];
  if (!configFile) { console.error('Usage: node benchmark.js <sites.json>'); process.exit(1); }
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const results = [];
  for (const url of config.sites) {
    const name = new URL(url).hostname.replace('www.', '');
    console.log(`\n🔍 Benchmarking ${name}...`);
    const r = await benchmarkSite(context, url);
    results.push(r);
    console.log(`   ✅ ${name}: friction ${r.frictionScore}/10, ${r.totalFields || 0} fields, ${r.estHumanTimeSec || 0}s est.`);
  }
  await browser.close();
  const report = generateReport(results);
  console.log('\n' + report);
})();
