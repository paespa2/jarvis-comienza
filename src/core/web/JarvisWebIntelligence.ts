/**
 * JARVIS WEB INTELLIGENCE
 *
 * Capacidad de Jarvis para analizar la estructura de páginas web en tiempo real:
 * - Identificar formularios, inputs, APIs
 * - Detectar frameworks y tecnologías usadas
 * - Mapear endpoints y parámetros
 * - Extraer datos siguiendo patrones
 * - Generar estrategias de scraping automáticamente
 *
 * Esto permite a Jarvis saber "qué hace la página" mientras trabaja,
 * y planificar automáticamente cómo extraer datos de cualquier sitio.
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// ============================================
// TIPOS
// ============================================

export interface FormField {
  name: string;
  type: string;
  id?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];    // for select elements
}

export interface DetectedForm {
  action: string;
  method: string;
  fields: FormField[];
  purpose: string;       // 'login' | 'search' | 'contact' | 'register' | 'unknown'
}

export interface APIEndpoint {
  url: string;
  method: string;
  params: string[];
  type: 'rest' | 'graphql' | 'websocket' | 'xhr' | 'unknown';
}

export interface PageLink {
  href: string;
  text: string;
  type: 'internal' | 'external' | 'api' | 'resource';
}

export interface DetectedTechnology {
  name: string;
  category: 'framework' | 'cms' | 'analytics' | 'cdn' | 'security' | 'language' | 'server';
  confidence: number;
  evidence: string;
}

export interface DataTable {
  headers: string[];
  rowCount: number;
  sampleRow?: string[];
}

export interface PageStructureAnalysis {
  url: string;
  title: string;
  statusCode: number;
  fetchedAt: string;

  // Structure
  forms: DetectedForm[];
  links: PageLink[];
  apiEndpoints: APIEndpoint[];
  tables: DataTable[];

  // Intelligence
  technologies: DetectedTechnology[];
  securityHeaders: Record<string, string>;
  scrapingStrategy: ScrapingStrategy;
  bugBountyRelevance: BugBountyRelevance;

  // Raw metadata
  metaTags: Record<string, string>;
  scripts: string[];
  externalDomains: string[];
}

export interface ScrapingStrategy {
  approach: 'simple-http' | 'browser-needed' | 'api-available' | 'auth-required' | 'rate-limited';
  recommended_tool: string;
  selectors: Record<string, string>;   // e.g. { "title": "h1", "price": ".price-tag" }
  notes: string[];
  sampleCode: string;
}

export interface BugBountyRelevance {
  interestingEndpoints: string[];
  exposedParameters: string[];
  potentialVulnerabilities: string[];
  recommendedTests: string[];
}

// ============================================
// HTTP FETCHER CON SOPORTE HTTP Y HTTPS
// ============================================

function fetchPage(urlStr: string, maxSizeKb = 500): Promise<{ body: string; statusCode: number; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    let parsedUrl: URL;
    try { parsedUrl = new URL(urlStr); } catch { return reject(new Error(`URL inválida: ${urlStr}`)); }

    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JarvisBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
    };

    const req = lib.request(options, (res) => {
      // Follow single redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirect = res.headers.location.startsWith('http') ? res.headers.location : parsedUrl.origin + res.headers.location;
        fetchPage(redirect, maxSizeKb).then(resolve).catch(reject);
        return;
      }

      const maxBytes = maxSizeKb * 1024;
      let data = '';
      let bytesRead = 0;

      res.on('data', (chunk: Buffer) => {
        bytesRead += chunk.length;
        if (bytesRead <= maxBytes) data += chunk.toString();
      });
      res.on('end', () => {
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (typeof v === 'string') headers[k] = v;
          else if (Array.isArray(v)) headers[k] = v[0];
        }
        resolve({ body: data, statusCode: res.statusCode || 200, headers });
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout al conectar')); });
    req.end();
  });
}

// ============================================
// ANALIZADORES DE ESTRUCTURA HTML
// ============================================

function extractText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const patterns = [
    /<meta\s+name="([^"]+)"\s+content="([^"]+)"/gi,
    /<meta\s+content="([^"]+)"\s+name="([^"]+)"/gi,
    /<meta\s+property="([^"]+)"\s+content="([^"]+)"/gi,
  ];
  for (const pat of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pat.exec(html)) !== null) {
      meta[m[1]] = m[2];
    }
  }
  return meta;
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractForms(html: string, baseUrl: string): DetectedForm[] {
  const forms: DetectedForm[] = [];
  const formPattern = /<form([^>]*)>([\s\S]*?)<\/form>/gi;
  let fm: RegExpExecArray | null;

  while ((fm = formPattern.exec(html)) !== null) {
    const attrs = fm[1];
    const body = fm[2];

    const actionMatch = attrs.match(/action="([^"]*)"/i);
    const methodMatch = attrs.match(/method="([^"]*)"/i);
    const action = actionMatch ? actionMatch[1] : '';
    const method = (methodMatch ? methodMatch[1] : 'GET').toUpperCase();

    const fields: FormField[] = [];
    const inputPat = /<input([^>]*)>/gi;
    let im: RegExpExecArray | null;
    while ((im = inputPat.exec(body)) !== null) {
      const inp = im[1];
      const name = inp.match(/name="([^"]*)"/i)?.[1] || '';
      const type = inp.match(/type="([^"]*)"/i)?.[1] || 'text';
      const id = inp.match(/id="([^"]*)"/i)?.[1];
      const placeholder = inp.match(/placeholder="([^"]*)"/i)?.[1];
      const required = /required/i.test(inp);
      if (name && type !== 'hidden' && type !== 'submit' && type !== 'button') {
        fields.push({ name, type, id, placeholder, required });
      }
    }

    // Detect select fields
    const selectPat = /<select([^>]*)>([\s\S]*?)<\/select>/gi;
    let sm: RegExpExecArray | null;
    while ((sm = selectPat.exec(body)) !== null) {
      const name = sm[1].match(/name="([^"]*)"/i)?.[1] || '';
      const opts: string[] = [];
      const optPat = /<option[^>]*value="([^"]*)"/gi;
      let om: RegExpExecArray | null;
      while ((om = optPat.exec(sm[2])) !== null) opts.push(om[1]);
      if (name) fields.push({ name, type: 'select', required: false, options: opts.slice(0, 5) });
    }

    // Classify form purpose
    const formText = body.toLowerCase();
    let purpose = 'unknown';
    if (/password|passwd|login|signin|sign.in/.test(formText)) purpose = 'login';
    else if (/register|signup|sign.up|create.*account/.test(formText)) purpose = 'register';
    else if (/search|query|find|buscar/.test(formText)) purpose = 'search';
    else if (/contact|message|email.*send|send.*email/.test(formText)) purpose = 'contact';
    else if (/upload|file|attach/.test(formText)) purpose = 'upload';
    else if (/checkout|payment|credit|card/.test(formText)) purpose = 'payment';

    forms.push({ action, method, fields, purpose });
  }

  return forms;
}

function extractLinks(html: string, baseUrl: string): PageLink[] {
  const links: PageLink[] = [];
  const seen = new Set<string>();
  const base = (() => { try { return new URL(baseUrl); } catch { return null; } })();
  const linkPat = /<a[^>]+href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;

  while ((lm = linkPat.exec(html)) !== null && links.length < 80) {
    const href = lm[1].trim();
    const text = extractText(lm[2]).substring(0, 60);
    if (seen.has(href) || !href) continue;
    seen.add(href);

    let type: PageLink['type'] = 'external';
    if (href.startsWith('/') || (base && href.startsWith(base.origin))) type = 'internal';
    if (/\.(jpg|png|gif|svg|css|js|woff|ico)$/i.test(href)) type = 'resource';
    if (/\/api\/|\/graphql|\/rest\/|\.json$/.test(href)) type = 'api';

    links.push({ href, text, type });
  }

  return links;
}

function extractScripts(html: string): string[] {
  const scripts: string[] = [];
  const pat = /<script[^>]+src="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = pat.exec(html)) !== null) scripts.push(m[1]);
  return scripts;
}

function detectTechnologies(html: string, headers: Record<string, string>, scripts: string[]): DetectedTechnology[] {
  const techs: DetectedTechnology[] = [];
  const lower = html.toLowerCase();
  const scriptStr = scripts.join(' ').toLowerCase();
  const headerStr = JSON.stringify(headers).toLowerCase();

  const checks: Array<{ name: string; category: DetectedTechnology['category']; patterns: RegExp[]; evidence: string }> = [
    { name: 'React', category: 'framework', patterns: [/react\.js|react\.min\.js|react-dom|__react/i], evidence: 'React library detected in scripts' },
    { name: 'Next.js', category: 'framework', patterns: [/__next|next\/dist|_next\/static/i], evidence: 'Next.js SSR framework' },
    { name: 'Angular', category: 'framework', patterns: [/ng-app|ng-controller|angular\.js|angular\.min/i], evidence: 'AngularJS/Angular framework' },
    { name: 'Vue.js', category: 'framework', patterns: [/vue\.js|vue\.min|__vue|v-bind|v-model/i], evidence: 'Vue.js framework' },
    { name: 'jQuery', category: 'framework', patterns: [/jquery\.js|jquery\.min/i], evidence: 'jQuery library' },
    { name: 'WordPress', category: 'cms', patterns: [/wp-content|wp-includes|wordpress/i], evidence: 'WordPress CMS' },
    { name: 'Shopify', category: 'cms', patterns: [/cdn\.shopify\.com|myshopify\.com|shopify\.js/i], evidence: 'Shopify e-commerce' },
    { name: 'Cloudflare', category: 'cdn', patterns: [/cloudflare|__cf_chl|cf-ray/i], evidence: 'Cloudflare CDN/WAF' },
    { name: 'reCAPTCHA', category: 'security', patterns: [/recaptcha|google\.com\/recaptcha/i], evidence: 'Google reCAPTCHA present' },
    { name: 'GraphQL', category: 'language', patterns: [/graphql|__schema|gql\(/i], evidence: 'GraphQL API detected' },
    { name: 'Bootstrap', category: 'framework', patterns: [/bootstrap\.css|bootstrap\.min|navbar-brand/i], evidence: 'Bootstrap CSS framework' },
    { name: 'Express/Node', category: 'server', patterns: [/express|x-powered-by.*express/i], evidence: 'Express.js backend' },
    { name: 'PHP', category: 'language', patterns: [/\.php|x-powered-by.*php|phpsessid/i], evidence: 'PHP backend' },
    { name: 'Nginx', category: 'server', patterns: [/nginx/i], evidence: 'Nginx web server' },
    { name: 'Apache', category: 'server', patterns: [/apache/i], evidence: 'Apache web server' },
    { name: 'Google Analytics', category: 'analytics', patterns: [/google-analytics|gtag|ga\(|_ga\b/i], evidence: 'Google Analytics tracking' },
    { name: 'Webpack', category: 'framework', patterns: [/webpackjsonp|__webpack/i], evidence: 'Webpack bundler' },
    { name: 'AWS', category: 'cdn', patterns: [/amazonaws\.com|aws-load-balancer|x-amz/i], evidence: 'Amazon AWS infrastructure' },
  ];

  const allText = lower + ' ' + scriptStr + ' ' + headerStr;
  for (const { name, category, patterns, evidence } of checks) {
    const confidence = patterns.reduce((acc, pat) => pat.test(allText) ? acc + 1 : acc, 0);
    if (confidence > 0) {
      techs.push({ name, category, confidence: Math.min(confidence / patterns.length, 1.0), evidence });
    }
  }

  return techs.sort((a, b) => b.confidence - a.confidence);
}

function detectAPIEndpoints(html: string, scripts: string[]): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  const seen = new Set<string>();
  const allText = html + ' ' + scripts.join(' ');

  // REST API patterns
  const apiPat = /['"](\/api\/[^\s'"<>?#]+)['"]/gi;
  let m: RegExpExecArray | null;
  while ((m = apiPat.exec(allText)) !== null) {
    const url = m[1];
    if (seen.has(url) || url.length > 100) continue;
    seen.add(url);
    const params: string[] = [];
    const paramMatch = url.match(/\{([^}]+)\}/g);
    if (paramMatch) params.push(...paramMatch.map(p => p.slice(1, -1)));
    endpoints.push({ url, method: 'GET', params, type: 'rest' });
  }

  // Fetch/XHR calls
  const fetchPat = /fetch\s*\(\s*['"`]([^'"`\s]{4,80})['"`]/gi;
  while ((m = fetchPat.exec(allText)) !== null) {
    const url = m[1];
    if (seen.has(url)) continue;
    seen.add(url);
    endpoints.push({ url, method: 'GET', params: [], type: 'xhr' });
  }

  // GraphQL
  if (/graphql|__schema/i.test(allText)) {
    endpoints.push({ url: '/graphql', method: 'POST', params: ['query', 'variables'], type: 'graphql' });
  }

  return endpoints.slice(0, 20);
}

function extractTables(html: string): DataTable[] {
  const tables: DataTable[] = [];
  const tablePat = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tm: RegExpExecArray | null;

  while ((tm = tablePat.exec(html)) !== null && tables.length < 5) {
    const tableHtml = tm[1];
    const headers: string[] = [];
    const hPat = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    let hm: RegExpExecArray | null;
    while ((hm = hPat.exec(tableHtml)) !== null) headers.push(extractText(hm[1]).substring(0, 40));

    const rows = (tableHtml.match(/<tr/gi) || []).length;
    if (headers.length > 0 || rows > 1) {
      tables.push({ headers: headers.slice(0, 10), rowCount: Math.max(0, rows - 1) });
    }
  }

  return tables;
}

function extractExternalDomains(links: PageLink[], baseHost: string): string[] {
  const domains = new Set<string>();
  for (const link of links) {
    if (link.type === 'external' && link.href.startsWith('http')) {
      try {
        const u = new URL(link.href);
        if (u.hostname !== baseHost) domains.add(u.hostname);
      } catch { /* ignore */ }
    }
  }
  return [...domains].slice(0, 15);
}

function extractSecurityHeaders(headers: Record<string, string>): Record<string, string> {
  const secHeaders: Record<string, string> = {};
  const interesting = [
    'content-security-policy', 'x-frame-options', 'x-content-type-options',
    'strict-transport-security', 'x-xss-protection', 'referrer-policy',
    'permissions-policy', 'access-control-allow-origin', 'set-cookie',
    'x-powered-by', 'server', 'x-aspnet-version', 'x-generator',
  ];
  for (const h of interesting) {
    if (headers[h]) secHeaders[h] = headers[h].substring(0, 150);
  }
  return secHeaders;
}

// ============================================
// GENERADOR DE ESTRATEGIA DE SCRAPING
// ============================================

function generateScrapingStrategy(
  techs: DetectedTechnology[],
  forms: DetectedForm[],
  apiEndpoints: APIEndpoint[],
  html: string,
  url: string,
): ScrapingStrategy {
  const hasCaptcha = techs.some(t => t.name === 'reCAPTCHA');
  const hasReact = techs.some(t => ['React', 'Next.js', 'Angular', 'Vue.js'].includes(t.name));
  const hasAPI = apiEndpoints.length > 0;
  const hasAuth = forms.some(f => f.purpose === 'login');
  const hasCloudflare = techs.some(t => t.name === 'Cloudflare');

  let approach: ScrapingStrategy['approach'] = 'simple-http';
  let recommended_tool = 'node-fetch / axios';
  const notes: string[] = [];

  if (hasCloudflare) {
    approach = 'browser-needed';
    recommended_tool = 'Puppeteer / Playwright';
    notes.push('⚠️  Cloudflare detectado — requiere browser real o bypass');
  } else if (hasReact && !hasAPI) {
    approach = 'browser-needed';
    recommended_tool = 'Puppeteer / Playwright';
    notes.push('Contenido dinámico (SPA) — DOM renderizado en cliente');
  } else if (hasAPI) {
    approach = 'api-available';
    recommended_tool = 'axios + endpoint directo';
    notes.push(`✅ API encontrada: ${apiEndpoints[0].url} — usar directamente`);
  } else if (hasAuth) {
    approach = 'auth-required';
    recommended_tool = 'axios con sesión/cookies';
    notes.push('Autenticación requerida — mantener cookies de sesión');
  }

  if (hasCaptcha) notes.push('⚠️  CAPTCHA presente — scraping automatizado puede fallar');

  // Auto-generate CSS selectors based on common patterns
  const selectors: Record<string, string> = {};
  if (/<h1[^>]*class="([^"]+)"/i.test(html)) selectors['title'] = 'h1';
  if (/<article/i.test(html)) selectors['content'] = 'article';
  if (/class="price[^"]*"/i.test(html)) selectors['price'] = '[class*="price"]';
  if (/class="description[^"]*"|id="description"/i.test(html)) selectors['description'] = '[class*="description"], #description';
  if (/<table/i.test(html)) selectors['table'] = 'table tr';
  if (/class="card[^"]*"/i.test(html)) selectors['cards'] = '[class*="card"]';
  if (/class="product[^"]*"/i.test(html)) selectors['products'] = '[class*="product"]';

  const sampleCode = generateSampleCode(approach, recommended_tool, url, selectors, apiEndpoints);

  return { approach, recommended_tool, selectors, notes, sampleCode };
}

function generateSampleCode(
  approach: string,
  tool: string,
  url: string,
  selectors: Record<string, string>,
  apis: APIEndpoint[],
): string {
  if (approach === 'api-available' && apis.length > 0) {
    return `// Usar API directamente (más eficiente)
const response = await fetch('${apis[0].url}');
const data = await response.json();
console.log(data);`;
  }

  if (approach === 'browser-needed') {
    const selectorExample = Object.entries(selectors)[0];
    return `// Puppeteer (página dinámica/SPA)
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto('${url}', { waitUntil: 'networkidle2' });
${selectorExample ? `const data = await page.$$eval('${selectorExample[1]}', els => els.map(e => e.textContent.trim()));` : `const content = await page.content();`}
await browser.close();`;
  }

  return `// HTTP simple + regex/extracción
const response = await fetch('${url}', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});
const html = await response.text();
${Object.entries(selectors).slice(0, 2).map(([k, v]) => `// Extraer ${k}: buscar elementos '${v}'`).join('\n')}
// Usar cheerio para parsear:
const cheerio = require('cheerio');
const $ = cheerio.load(html);
${Object.entries(selectors).slice(0, 2).map(([k, v]) => `const ${k} = $('${v}').first().text().trim();`).join('\n') || `const title = $('h1').first().text().trim();`}`;
}

// ============================================
// ANÁLISIS DE RELEVANCIA PARA BUG BOUNTY
// ============================================

function analyzeBugBountyRelevance(
  forms: DetectedForm[],
  links: PageLink[],
  apiEndpoints: APIEndpoint[],
  securityHeaders: Record<string, string>,
  html: string,
): BugBountyRelevance {
  const interesting: string[] = [];
  const params: string[] = [];
  const vulns: string[] = [];
  const tests: string[] = [];

  // Missing security headers
  if (!securityHeaders['content-security-policy']) vulns.push('Sin Content-Security-Policy → posible XSS');
  if (!securityHeaders['x-frame-options'] && !securityHeaders['content-security-policy']) vulns.push('Sin X-Frame-Options → posible clickjacking');
  if (!securityHeaders['strict-transport-security']) vulns.push('Sin HSTS → tráfico HTTP interceptable');
  if (securityHeaders['x-powered-by']) vulns.push(`X-Powered-By expuesto: ${securityHeaders['x-powered-by']} → info disclosure`);

  // Login forms → auth bypass candidates
  const loginForms = forms.filter(f => f.purpose === 'login');
  if (loginForms.length > 0) {
    interesting.push('Formulario de login detectado');
    tests.push('Probar SQLi en campos de login: admin\' OR \'1\'=\'1\'--');
    tests.push('Probar auth bypass: username=admin&password[]=');
    tests.push('Verificar si permite enumeración de usuarios');
  }

  // File upload forms
  const uploadForms = forms.filter(f => f.purpose === 'upload');
  if (uploadForms.length > 0) {
    interesting.push('Formulario de upload de archivos');
    tests.push('Probar upload de webshell .php / .aspx');
    tests.push('Probar MIME type mismatch (imagen con código PHP)');
    tests.push('Verificar restricciones de extensión (doble extensión: shell.php.jpg)');
  }

  // API endpoints
  for (const ep of apiEndpoints.slice(0, 5)) {
    interesting.push(`API endpoint: ${ep.url}`);
    if (/user|account|profile|me|self/i.test(ep.url)) {
      tests.push(`Probar IDOR en ${ep.url} — cambiar ID en la URL`);
    }
    if (/admin|internal|debug/i.test(ep.url)) {
      tests.push(`Endpoint sensible detectado: ${ep.url} — verificar acceso sin auth`);
    }
  }

  // Extract URL parameters from links
  for (const link of links.slice(0, 30)) {
    try {
      const u = new URL(link.href.startsWith('/') ? 'http://x.com' + link.href : link.href);
      for (const [k] of u.searchParams.entries()) {
        if (!params.includes(k)) params.push(k);
        if (/url|redirect|next|return|goto|path|file|page|src/i.test(k)) {
          tests.push(`Parámetro "${k}" → probar Open Redirect / SSRF / Path Traversal`);
        }
        if (/id|user_id|account|doc|item/i.test(k)) {
          tests.push(`Parámetro "${k}" → probar IDOR (cambiar valor al de otro usuario)`);
        }
      }
    } catch { /* ignore */ }
  }

  // Inline JS for secrets
  if (/api_key|apikey|secret|token|bearer|password\s*=/i.test(html)) {
    vulns.push('Posible secreto/API key expuesto en HTML/JS');
    tests.push('Revisar JS inline y archivos .js para credenciales hardcodeadas');
  }

  // Comments that might expose info
  if (/<!--[\s\S]{20,200}-->/i.test(html)) {
    tests.push('Revisar comentarios HTML — pueden contener info sensible');
  }

  return {
    interestingEndpoints: interesting.slice(0, 8),
    exposedParameters: params.slice(0, 10),
    potentialVulnerabilities: vulns.slice(0, 8),
    recommendedTests: tests.slice(0, 10),
  };
}

// ============================================
// CLASE PRINCIPAL
// ============================================

export class JarvisWebIntelligence {

  async analyzePage(url: string): Promise<PageStructureAnalysis> {
    console.log(`\n🌐 [WebIntelligence] Analizando: ${url}`);

    let parsedBase: URL;
    try { parsedBase = new URL(url); } catch { throw new Error(`URL inválida: ${url}`); }

    const { body: html, statusCode, headers } = await fetchPage(url, 800);

    console.log(`   ✅ Página obtenida (${Math.round(html.length / 1024)}KB, status: ${statusCode})`);

    const title = extractTitle(html);
    const metaTags = extractMetaTags(html);
    const scripts = extractScripts(html);
    const links = extractLinks(html, url);
    const forms = extractForms(html, url);
    const tables = extractTables(html);
    const apiEndpoints = detectAPIEndpoints(html, scripts);
    const technologies = detectTechnologies(html, headers, scripts);
    const securityHeaders = extractSecurityHeaders(headers);
    const externalDomains = extractExternalDomains(links, parsedBase.hostname);
    const scrapingStrategy = generateScrapingStrategy(technologies, forms, apiEndpoints, html, url);
    const bugBountyRelevance = analyzeBugBountyRelevance(forms, links, apiEndpoints, securityHeaders, html);

    console.log(`   📊 Análisis: ${forms.length} forms | ${links.length} links | ${apiEndpoints.length} APIs | ${technologies.length} techs`);

    return {
      url,
      title,
      statusCode,
      fetchedAt: new Date().toISOString(),
      forms,
      links: links.filter(l => l.type !== 'resource').slice(0, 50),
      apiEndpoints,
      tables,
      technologies,
      securityHeaders,
      scrapingStrategy,
      bugBountyRelevance,
      metaTags,
      scripts: scripts.slice(0, 20),
      externalDomains,
    };
  }

  generateReport(analysis: PageStructureAnalysis): string {
    const lines: string[] = [
      `# Análisis Web: ${analysis.title || analysis.url}`,
      `**URL:** ${analysis.url}  |  **Status:** ${analysis.statusCode}  |  **Analizado:** ${analysis.fetchedAt.substring(0, 10)}`,
      '',
      '## Tecnologías Detectadas',
      ...analysis.technologies.slice(0, 8).map(t =>
        `- **${t.name}** (${t.category}) — ${t.evidence}`
      ),
      '',
      '## Formularios',
      analysis.forms.length === 0 ? '- Sin formularios' :
        analysis.forms.map(f =>
          `- **${f.purpose.toUpperCase()}** [${f.method} ${f.action || '/'}] — campos: ${f.fields.map(fi => fi.name).join(', ')}`
        ).join('\n'),
      '',
      '## API Endpoints Detectados',
      analysis.apiEndpoints.length === 0 ? '- Ninguno detectado' :
        analysis.apiEndpoints.slice(0, 8).map(e =>
          `- \`${e.method} ${e.url}\` (${e.type})`
        ).join('\n'),
      '',
      '## Estrategia de Scraping',
      `**Enfoque:** ${analysis.scrapingStrategy.approach}`,
      `**Herramienta:** ${analysis.scrapingStrategy.recommended_tool}`,
      ...analysis.scrapingStrategy.notes.map(n => `- ${n}`),
      '',
      '```javascript',
      analysis.scrapingStrategy.sampleCode,
      '```',
      '',
      '## Relevancia Bug Bounty',
      '**Vulnerabilidades potenciales:**',
      ...analysis.bugBountyRelevance.potentialVulnerabilities.map(v => `- 🔴 ${v}`),
      '**Tests recomendados:**',
      ...analysis.bugBountyRelevance.recommendedTests.slice(0, 5).map(t => `- 🧪 ${t}`),
      '',
      '## Cabeceras de Seguridad',
      ...Object.entries(analysis.securityHeaders).map(([k, v]) => `- \`${k}\`: ${v.substring(0, 80)}`),
    ];

    return lines.join('\n');
  }
}

export const jarvisWebIntelligence = new JarvisWebIntelligence();
