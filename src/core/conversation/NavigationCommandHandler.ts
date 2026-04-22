/**
 * NAVIGATION COMMAND HANDLER
 *
 * Interpreta comandos de navegación en conversaciones:
 * - "abre https://..."
 * - "busca en Google..."
 * - "extrae datos de..."
 * - Muestra previsualización de navegación
 */

import { autonomousWebNavigator, NavigationSession } from '../../autonomy/AutonomousWebNavigator';

export interface NavigationCommand {
  type: 'open-url' | 'search' | 'extract' | 'interact' | 'analyze';
  target?: string;
  selectors?: Record<string, string>;
  query?: string;
  action?: string;
  confidence: number;
}

export class NavigationCommandHandler {
  private currentSession: NavigationSession | null = null;

  constructor() {
    console.log('\n🧭 [NavigationCommandHandler] Inicializando...');
  }

  /**
   * Detectar comando de navegación en texto conversacional
   */
  detectNavigationCommand(text: string): NavigationCommand | null {
    const lower = text.toLowerCase();

    // Detectar comando "abre URL"
    if (/(abre|open|navega|go to)\s+(https?:\/\/[^\s]+)/i.test(text)) {
      const match = text.match(/https?:\/\/[^\s]+/i);
      if (match) {
        return {
          type: 'open-url',
          target: match[0],
          confidence: 0.95
        };
      }
    }

    // Detectar comando de búsqueda
    if (/(busca|search|googlea)\s+(.+)/i.test(text)) {
      const match = text.match(/(busca|search|googlea)\s+(.+)/i);
      if (match) {
        return {
          type: 'search',
          query: match[2].trim(),
          target: `https://www.google.com/search?q=${encodeURIComponent(match[2])}`,
          confidence: 0.9
        };
      }
    }

    // Detectar comando de extracción
    if (/(extrae|extract)\s+(.+)\s+(de|from|en)\s+(https?:\/\/[^\s]+)/i.test(text)) {
      const match = text.match(/(extrae|extract)\s+(.+)\s+(de|from|en)\s+(https?:\/\/[^\s]+)/i);
      if (match) {
        return {
          type: 'extract',
          query: match[2].trim(),
          target: match[4],
          confidence: 0.85
        };
      }
    }

    // Detectar comando de análisis
    if (/(analiza|analyze)\s+(https?:\/\/[^\s]+)/i.test(text)) {
      const match = text.match(/https?:\/\/[^\s]+/i);
      if (match) {
        return {
          type: 'analyze',
          target: match[0],
          confidence: 0.9
        };
      }
    }

    return null;
  }

  /**
   * Ejecutar comando de navegación
   */
  async executeNavigationCommand(command: NavigationCommand): Promise<any> {
    console.log(`\n🎯 [NavigationHandler] Ejecutando comando: ${command.type}`);

    if (!command.target && !command.query) {
      return { error: 'No se especificó destino o consulta' };
    }

    // Crear sesión si no existe
    if (!this.currentSession || this.currentSession.status !== 'active') {
      const url = command.target || command.query || 'about:blank';
      this.currentSession = autonomousWebNavigator.createSession(url);
    }

    try {
      switch (command.type) {
        case 'open-url':
          return await this.handleOpenUrl(command.target!);

        case 'search':
          return await this.handleSearch(command.query!, command.target!);

        case 'extract':
          return await this.handleExtract(command.target!, command.query!);

        case 'analyze':
          return await this.handleAnalyze(command.target!);

        case 'interact':
          return await this.handleInteract(command.action!, command.target!);

        default:
          return { error: `Comando no reconocido: ${command.type}` };
      }
    } catch (err: any) {
      console.error(`❌ Error ejecutando comando: ${err.message}`);
      return { error: err.message };
    }
  }

  /**
   * Manejar apertura de URL
   */
  private async handleOpenUrl(url: string): Promise<any> {
    if (!this.currentSession) return { error: 'Sin sesión activa' };

    console.log(`📍 Abriendo: ${url}`);

    const capture = await autonomousWebNavigator.navigateToUrl(
      this.currentSession.id,
      url
    );

    if (capture) {
      autonomousWebNavigator.recordInsight(
        this.currentSession.id,
        `Navegó a ${new URL(url).hostname}`
      );

      return {
        success: true,
        message: `Abierto: ${capture.title}`,
        preview: {
          url: capture.url,
          title: capture.title,
          screenshotPath: capture.screenshotPath,
          timestamp: new Date(capture.timestamp).toISOString()
        }
      };
    }

    return { error: 'No se pudo abrir la URL' };
  }

  /**
   * Manejar búsqueda
   */
  private async handleSearch(query: string, searchUrl: string): Promise<any> {
    if (!this.currentSession) return { error: 'Sin sesión activa' };

    console.log(`🔍 Buscando: ${query}`);

    const capture = await autonomousWebNavigator.navigateToUrl(
      this.currentSession.id,
      searchUrl
    );

    if (capture) {
      autonomousWebNavigator.recordInsight(
        this.currentSession.id,
        `Realizó búsqueda por: ${query}`
      );

      return {
        success: true,
        message: `Búsqueda realizada: ${query}`,
        searchUrl: searchUrl,
        preview: {
          screenshotPath: capture.screenshotPath,
          timestamp: new Date(capture.timestamp).toISOString()
        }
      };
    }

    return { error: 'Error realizando búsqueda' };
  }

  /**
   * Manejar extracción de datos
   */
  private async handleExtract(url: string, query: string): Promise<any> {
    if (!this.currentSession) return { error: 'Sin sesión activa' };

    console.log(`🔍 Extrayendo datos de: ${url}`);

    // Navegar a la URL
    await autonomousWebNavigator.navigateToUrl(this.currentSession.id, url);

    // Intentar extraer selectores comunes
    const selectors = this.generateCommonSelectors(query);

    const data = await autonomousWebNavigator.extractData(
      this.currentSession.id,
      selectors
    );

    autonomousWebNavigator.recordInsight(
      this.currentSession.id,
      `Extrajo datos buscando: ${query}`
    );

    return {
      success: true,
      message: `Datos extraídos de ${new URL(url).hostname}`,
      extracted: data,
      selectorsUsed: Object.keys(selectors).length
    };
  }

  /**
   * Manejar análisis de página
   */
  private async handleAnalyze(url: string): Promise<any> {
    if (!this.currentSession) return { error: 'Sin sesión activa' };

    console.log(`🔬 Analizando: ${url}`);

    const capture = await autonomousWebNavigator.navigateToUrl(
      this.currentSession.id,
      url
    );

    if (capture) {
      // Análisis básico del HTML
      const analysis = this.analyzePageContent(capture.htmlContent);

      autonomousWebNavigator.recordInsight(
        this.currentSession.id,
        `Analizó estructura de ${new URL(url).hostname}`
      );

      return {
        success: true,
        message: `Análisis completado: ${url}`,
        analysis,
        preview: {
          screenshotPath: capture.screenshotPath,
          title: capture.title
        }
      };
    }

    return { error: 'Error analizando página' };
  }

  /**
   * Manejar interacción con elementos
   */
  private async handleInteract(action: string, selector: string): Promise<any> {
    if (!this.currentSession) return { error: 'Sin sesión activa' };

    if (action === 'click') {
      const result = await autonomousWebNavigator.clickElement(
        this.currentSession.id,
        selector
      );
      return {
        success: result,
        message: result ? `Click realizado en ${selector}` : 'Error en click'
      };
    }

    return { error: `Acción no soportada: ${action}` };
  }

  /**
   * Generar selectores comunes para extracción
   */
  private generateCommonSelectors(query: string): Record<string, string> {
    const lower = query.toLowerCase();

    const selectors: Record<string, string> = {};

    if (lower.includes('precio') || lower.includes('price')) {
      selectors['price'] = '.price, .precio, [data-price], span.amount';
    }
    if (lower.includes('título') || lower.includes('title')) {
      selectors['title'] = 'h1, h2, .title, [data-title]';
    }
    if (lower.includes('descripción') || lower.includes('description')) {
      selectors['description'] = '.description, .desc, p, [data-description]';
    }
    if (lower.includes('enlace') || lower.includes('link')) {
      selectors['links'] = 'a[href]';
    }
    if (lower.includes('tabla') || lower.includes('table')) {
      selectors['table'] = 'table, .table, [role="table"]';
    }

    // Selectores por defecto
    if (Object.keys(selectors).length === 0) {
      selectors['content'] = 'body, main, [role="main"]';
      selectors['title'] = 'h1, h2, title';
    }

    return selectors;
  }

  /**
   * Analizar contenido de página
   */
  private analyzePageContent(html: string): any {
    const headingsCount = (html.match(/<h[1-6]/gi) || []).length;
    const linksCount = (html.match(/<a\s+href/gi) || []).length;
    const formsCount = (html.match(/<form/gi) || []).length;
    const imagesCount = (html.match(/<img/gi) || []).length;
    const scriptsCount = (html.match(/<script/gi) || []).length;

    // Detectar tecnologías
    const technologies: string[] = [];
    if (html.includes('react')) technologies.push('React');
    if (html.includes('vue')) technologies.push('Vue');
    if (html.includes('angular')) technologies.push('Angular');
    if (html.includes('jquery')) technologies.push('jQuery');

    return {
      structure: {
        headings: headingsCount,
        links: linksCount,
        forms: formsCount,
        images: imagesCount,
        scripts: scriptsCount
      },
      detectedTechnologies: technologies,
      size: html.length,
      complexity: headingsCount + linksCount > 20 ? 'high' : 'medium'
    };
  }

  /**
   * Obtener resumen de navegación actual
   */
  getCurrentSessionSummary(): any {
    if (!this.currentSession) {
      return { error: 'Sin sesión activa' };
    }

    return autonomousWebNavigator.getSessionSummary(this.currentSession.id);
  }

  /**
   * Finalizar sesión actual
   */
  endCurrentSession(): any {
    if (!this.currentSession) {
      return { error: 'Sin sesión activa' };
    }

    const summary = autonomousWebNavigator.getSessionSummary(this.currentSession.id);
    autonomousWebNavigator.endSession(this.currentSession.id);
    this.currentSession = null;

    return {
      message: 'Sesión de navegación finalizada',
      summary
    };
  }

  /**
   * Generar respuesta conversacional sobre navegación
   */
  generateNavigationResponse(command: NavigationCommand, result: any): string {
    if (result.error) {
      return `❌ Error: ${result.error}`;
    }

    let response = '';

    switch (command.type) {
      case 'open-url':
        response = `✅ Abrí ${command.target}\n`;
        if (result.preview?.title) response += `📄 Título: ${result.preview.title}\n`;
        if (result.preview?.screenshotPath) response += `📸 Screenshot: ${result.preview.screenshotPath}`;
        break;

      case 'search':
        response = `🔍 Realicé búsqueda: "${command.query}"\n`;
        response += `📊 Mostrando resultados de Google`;
        if (result.preview?.screenshotPath) response += `\n📸 Preview: ${result.preview.screenshotPath}`;
        break;

      case 'extract':
        response = `📦 Extraje datos de ${command.target}\n`;
        if (result.extracted) {
          response += `🎯 Datos encontrados: ${Object.keys(result.extracted).length}\n`;
          response += `📋 Información: ${JSON.stringify(result.extracted, null, 2)}`;
        }
        break;

      case 'analyze':
        response = `🔬 Analicé la página: ${command.target}\n`;
        if (result.analysis?.structure) {
          response += `📊 Estructura: ${result.analysis.structure.headings} headings, `;
          response += `${result.analysis.structure.links} links, `;
          response += `${result.analysis.structure.forms} formularios\n`;
        }
        if (result.analysis?.detectedTechnologies?.length) {
          response += `🛠️  Tecnologías: ${result.analysis.detectedTechnologies.join(', ')}`;
        }
        if (result.preview?.screenshotPath) {
          response += `\n📸 Preview: ${result.preview.screenshotPath}`;
        }
        break;

      default:
        response = `✅ ${result.message || 'Comando completado'}`;
    }

    return response;
  }
}

export const navigationCommandHandler = new NavigationCommandHandler();
