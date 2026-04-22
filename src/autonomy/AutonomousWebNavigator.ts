/**
 * AUTONOMOUS WEB NAVIGATOR
 *
 * Jarvis navega la web de forma autónoma usando un navegador:
 * - Abre URLs y captura screenshots
 * - Interactúa con formularios y elementos
 * - Analiza contenido en tiempo real
 * - Reporta navegación para previsualización
 *
 * ✨ FASE 4a: Navegación Autónoma con Previsualización
 */

import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface NavigationAction {
  type: 'open' | 'click' | 'type' | 'scroll' | 'wait' | 'extract' | 'submit';
  selector?: string;
  value?: string;
  url?: string;
  description: string;
  timestamp: number;
}

export interface PageCapture {
  url: string;
  title: string;
  screenshotPath?: string;
  screenshot?: string; // base64
  htmlContent: string;
  timestamp: number;
}

export interface NavigationSession {
  id: string;
  startTime: number;
  endTime?: number;
  startUrl: string;
  currentUrl: string;
  actions: NavigationAction[];
  captures: PageCapture[];
  extractedData: Record<string, any>;
  insights: string[];
  status: 'active' | 'completed' | 'failed';
  error?: string;
}

export class AutonomousWebNavigator {
  private sessions: Map<string, NavigationSession> = new Map();
  private screenshotsDir: string = './navigation-previews';
  private browser: any = null;
  private puppeteer: any = null;

  constructor() {
    console.log('\n🌐 [AutonomousWebNavigator] Inicializando...');
    this.initializePuppeteer();
  }

  /**
   * Inicializar Puppeteer de forma lazy
   */
  private async initializePuppeteer(): Promise<any> {
    if (!this.browser) {
      try {
        this.puppeteer = require('puppeteer');
        console.log('✅ Puppeteer cargado correctamente');
      } catch (err) {
        console.warn('⚠️  Puppeteer no instalado - ejecutar: npm install puppeteer');
        return null;
      }
    }
    return this.browser;
  }

  /**
   * Asegurar que existe directorio de screenshots
   */
  private async ensureScreenshotsDir(): Promise<void> {
    if (!fs.existsSync(this.screenshotsDir)) {
      await mkdir(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Crear nueva sesión de navegación
   */
  createSession(startUrl: string): NavigationSession {
    const session: NavigationSession = {
      id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      startUrl,
      currentUrl: startUrl,
      actions: [],
      captures: [],
      extractedData: {},
      insights: [],
      status: 'active'
    };

    this.sessions.set(session.id, session);
    console.log(`\n🚀 [Navigator] Nueva sesión: ${session.id}`);
    return session;
  }

  /**
   * Navegar a una URL y capturar screenshot
   */
  async navigateToUrl(
    sessionId: string,
    url: string,
    options?: { waitUntil?: string; timeout?: number }
  ): Promise<PageCapture | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`❌ Sesión no encontrada: ${sessionId}`);
      return null;
    }

    try {
      if (!this.puppeteer) {
        return this.simulateNavigation(session, url);
      }

      const browser = await this.puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      console.log(`📍 Navegando a: ${url}`);

      await page.goto(url, {
        waitUntil: options?.waitUntil || 'networkidle2',
        timeout: options?.timeout || 30000
      });

      // Capturar screenshot
      await this.ensureScreenshotsDir();
      const timestamp = Date.now();
      const screenshotPath = path.join(this.screenshotsDir, `${session.id}-${timestamp}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Extraer título y contenido
      const title = await page.title();
      const htmlContent = await page.content();

      // Registrar acción
      const action: NavigationAction = {
        type: 'open',
        url,
        description: `Navegó a ${url}`,
        timestamp
      };

      const capture: PageCapture = {
        url,
        title,
        screenshotPath,
        htmlContent: htmlContent.substring(0, 10000), // Limitar tamaño
        timestamp
      };

      session.actions.push(action);
      session.captures.push(capture);
      session.currentUrl = url;

      console.log(`✅ Screenshot capturado: ${screenshotPath}`);

      await browser.close();
      return capture;
    } catch (err: any) {
      console.error(`❌ Error navegando: ${err.message}`);
      session.error = err.message;
      session.status = 'failed';
      return null;
    }
  }

  /**
   * Simulación de navegación (cuando Puppeteer no está disponible)
   */
  private async simulateNavigation(session: NavigationSession, url: string): Promise<PageCapture> {
    console.log(`📍 [Simulación] Navegando a: ${url}`);

    const action: NavigationAction = {
      type: 'open',
      url,
      description: `Navegó a ${url} (simulado)`,
      timestamp: Date.now()
    };

    const capture: PageCapture = {
      url,
      title: `Página: ${new URL(url).hostname}`,
      htmlContent: `<!-- Página simulada: ${url} -->`,
      timestamp: Date.now()
    };

    session.actions.push(action);
    session.captures.push(capture);
    session.currentUrl = url;
    session.insights.push(`Visitó ${new URL(url).hostname}`);

    return capture;
  }

  /**
   * Hacer click en un elemento
   */
  async clickElement(sessionId: string, selector: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      if (!this.puppeteer) {
        session.actions.push({
          type: 'click',
          selector,
          description: `Click en ${selector} (simulado)`,
          timestamp: Date.now()
        });
        return true;
      }

      const browser = await this.puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(session.currentUrl);
      await page.click(selector);

      console.log(`✅ Click realizado en: ${selector}`);

      session.actions.push({
        type: 'click',
        selector,
        description: `Click en elemento: ${selector}`,
        timestamp: Date.now()
      });

      await browser.close();
      return true;
    } catch (err: any) {
      console.error(`❌ Error en click: ${err.message}`);
      return false;
    }
  }

  /**
   * Escribir texto en un input
   */
  async typeText(sessionId: string, selector: string, text: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      if (!this.puppeteer) {
        session.actions.push({
          type: 'type',
          selector,
          value: text,
          description: `Escribió en ${selector}: "${text}" (simulado)`,
          timestamp: Date.now()
        });
        return true;
      }

      const browser = await this.puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(session.currentUrl);
      await page.type(selector, text);

      console.log(`✅ Texto escrito en: ${selector}`);

      session.actions.push({
        type: 'type',
        selector,
        value: text,
        description: `Escribió texto en ${selector}`,
        timestamp: Date.now()
      });

      await browser.close();
      return true;
    } catch (err: any) {
      console.error(`❌ Error escribiendo texto: ${err.message}`);
      return false;
    }
  }

  /**
   * Extraer datos de la página
   */
  async extractData(
    sessionId: string,
    selectors: Record<string, string>
  ): Promise<Record<string, any> | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    try {
      if (!this.puppeteer) {
        session.insights.push(`Extraería datos de: ${Object.keys(selectors).join(', ')}`);
        return {};
      }

      const browser = await this.puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(session.currentUrl);

      const extractedData: Record<string, any> = {};
      for (const [key, selector] of Object.entries(selectors)) {
        try {
          const value = await page.$eval(selector, (el: any) => el.textContent || el.value);
          extractedData[key] = value;
        } catch (err) {
          extractedData[key] = null;
        }
      }

      console.log(`✅ Datos extraídos:`, extractedData);

      session.actions.push({
        type: 'extract',
        description: `Extrajo datos de ${Object.keys(selectors).length} selectores`,
        timestamp: Date.now()
      });

      session.extractedData = { ...session.extractedData, ...extractedData };

      await browser.close();
      return extractedData;
    } catch (err: any) {
      console.error(`❌ Error extrayendo datos: ${err.message}`);
      return null;
    }
  }

  /**
   * Esperar a que un elemento esté visible
   */
  async waitForElement(sessionId: string, selector: string, timeout = 10000): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      if (!this.puppeteer) {
        session.actions.push({
          type: 'wait',
          selector,
          description: `Esperó elemento ${selector} (simulado)`,
          timestamp: Date.now()
        });
        return true;
      }

      const browser = await this.puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(session.currentUrl);
      await page.waitForSelector(selector, { timeout });

      console.log(`✅ Elemento encontrado: ${selector}`);

      session.actions.push({
        type: 'wait',
        selector,
        description: `Esperó y encontró: ${selector}`,
        timestamp: Date.now()
      });

      await browser.close();
      return true;
    } catch (err: any) {
      console.error(`❌ Error esperando elemento: ${err.message}`);
      return false;
    }
  }

  /**
   * Registrar insight durante navegación
   */
  recordInsight(sessionId: string, insight: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.insights.push(insight);
      console.log(`💡 Insight: ${insight}`);
    }
  }

  /**
   * Finalizar sesión
   */
  endSession(sessionId: string): NavigationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.endTime = Date.now();
    session.status = 'completed';

    console.log(`\n✅ Sesión finalizada: ${sessionId}`);
    console.log(`   Acciones: ${session.actions.length}`);
    console.log(`   Capturas: ${session.captures.length}`);
    console.log(`   Insights: ${session.insights.length}`);

    return session;
  }

  /**
   * Obtener resumen de sesión para previsualizar
   */
  getSessionSummary(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      status: session.status,
      duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime,
      actionsCount: session.actions.length,
      capturesCount: session.captures.length,
      screenshots: session.captures.map(c => c.screenshotPath),
      insights: session.insights,
      extractedData: session.extractedData,
      visitedUrls: [...new Set(session.actions.filter(a => a.url).map(a => a.url))],
      timeline: session.actions.map(a => ({
        type: a.type,
        description: a.description,
        time: new Date(a.timestamp).toISOString()
      }))
    };
  }

  /**
   * Generar reporte de navegación
   */
  generateNavigationReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '❌ Sesión no encontrada';

    const duration = (session.endTime || Date.now()) - session.startTime;
    const durationSeconds = (duration / 1000).toFixed(1);

    const report = `
🌐 NAVEGACIÓN WEB - REPORTE COMPLETO

📋 Sesión: ${session.id}
⏱️  Duración: ${durationSeconds}s
🔗 URL Inicial: ${session.startUrl}
📍 URL Actual: ${session.currentUrl}

📸 CAPTURAS DE PANTALLA
${session.captures.map((c, i) => `  ${i + 1}. ${c.url} (${new Date(c.timestamp).toLocaleTimeString()})`).join('\n')}

🎯 ACCIONES REALIZADAS
${session.actions.map((a, i) => `  ${i + 1}. [${a.type.toUpperCase()}] ${a.description}`).join('\n')}

💡 INSIGHTS DESCUBIERTOS
${session.insights.map((i) => `  • ${i}`).join('\n')}

📊 DATOS EXTRAÍDOS
${Object.entries(session.extractedData).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')}

🔍 ANÁLISIS
  • Navegador: Puppeteer (Automatizado)
  • Estado: ${session.status.toUpperCase()}
  • Archivos capturados: ${session.captures.length}
  • Elementos interactuados: ${session.actions.filter(a => a.type === 'click').length}
  • Texto ingresado: ${session.actions.filter(a => a.type === 'type').length}
`;

    return report;
  }

  /**
   * Obtener todas las sesiones activas
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys()).filter(id => {
      const session = this.sessions.get(id);
      return session?.status === 'active';
    });
  }

  /**
   * Obtener historial de sesiones
   */
  getSessionHistory(): any[] {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      startTime: new Date(session.startTime).toISOString(),
      endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
      status: session.status,
      startUrl: session.startUrl,
      actionsCount: session.actions.length,
      capturesCount: session.captures.length
    }));
  }
}

// Exportar instancia singleton
export const autonomousWebNavigator = new AutonomousWebNavigator();
