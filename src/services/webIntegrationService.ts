/**
 * WEB INTEGRATION SERVICE
 *
 * Integración con internet en vivo:
 * - Web scraping
 * - API calls
 * - HackerOne integration
 * - CVE database queries
 * - Vulnerability information gathering
 */

import axios, { AxiosInstance } from 'axios';

interface WebScrapingResult {
  url: string;
  title?: string;
  content: string;
  statusCode: number;
  timestamp: number;
}

interface HackerOneProgram {
  id: string;
  name: string;
  handle: string;
  offers_bounties: boolean;
  average_bounty?: number;
  maximum_bounty?: number;
}

interface HackerOneReport {
  id: string;
  title: string;
  state: string;
  type: string;
  bounty_awarded?: number;
  vulnerability_types: string[];
  created_at: string;
}

interface CVEInfo {
  id: string;
  description: string;
  severity: string;
  cvss_score?: number;
  affected_versions: string[];
  published_date: string;
}

interface APICallResult {
  status: number;
  data: any;
  headers: any;
  timestamp: number;
}

export class WebIntegrationService {
  private axiosInstance: AxiosInstance;
  private h1ApiKey: string | null = null;
  private hackerOneUsername: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'JARVIS-IA/1.0 (+http://localhost:3000)',
      },
    });

    // Cargar credenciales HackerOne si existen
    if (process.env.HACKERONE_API_KEY) {
      this.h1ApiKey = process.env.HACKERONE_API_KEY;
    }
    if (process.env.HACKERONE_USERNAME) {
      this.hackerOneUsername = process.env.HACKERONE_USERNAME;
    }
  }

  /**
   * WEB SCRAPING
   * Obtiene contenido de una URL
   */
  async scrapeWebpage(url: string): Promise<WebScrapingResult> {
    try {
      console.log(`🌐 Scraping: ${url}`);

      const response = await this.axiosInstance.get(url, {
        validateStatus: () => true,
      });

      // Extraer texto del contenido (básico)
      let content = response.data;
      if (typeof content === 'string') {
        // Remover scripts y styles
        content = content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      return {
        url,
        content: content.substring(0, 5000), // Limitar a 5000 chars
        statusCode: response.status,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`❌ Error scraping ${url}:`, error.message);
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  /**
   * API CALL GENÉRICA
   * Realiza llamadas HTTP a APIs externas
   */
  async callAPI(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: any
  ): Promise<APICallResult> {
    try {
      console.log(`📡 API Call: ${method} ${url}`);

      const config: any = { headers };
      const response = await this.axiosInstance({
        method,
        url,
        data,
        ...config,
        validateStatus: () => true,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`❌ Error en API call:`, error.message);
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  /**
   * HACKERONE - BUSCAR PROGRAMAS
   * Busca programas activos en HackerOne
   */
  async searchHackerOnePrograms(criteria?: {
    offers_bounties?: boolean;
    min_bounty?: number;
    max_bounty?: number;
  }): Promise<HackerOneProgram[]> {
    if (!this.h1ApiKey) {
      console.warn('⚠️  HackerOne API key no disponible');
      return [];
    }

    try {
      console.log(`🎯 Buscando programas HackerOne...`);

      // HackerOne API endpoint
      const response = await this.axiosInstance.get('https://api.hackerone.com/v1/programs', {
        headers: {
          Authorization: `Bearer ${this.h1ApiKey}`,
        },
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        throw new Error(`HackerOne API error: ${response.status}`);
      }

      let programs = response.data.data || [];

      // Aplicar filtros
      if (criteria?.offers_bounties) {
        programs = programs.filter((p: any) => p.attributes.offers_bounties);
      }

      return programs.map((p: any) => ({
        id: p.id,
        name: p.attributes.name,
        handle: p.attributes.handle,
        offers_bounties: p.attributes.offers_bounties,
        average_bounty: p.attributes.average_bounty,
        maximum_bounty: p.attributes.maximum_bounty,
      }));
    } catch (error: any) {
      console.error(`❌ Error buscando programas HackerOne:`, error.message);
      return [];
    }
  }

  /**
   * HACKERONE - OBTENER REPORTES
   * Obtiene reportes de un programa específico
   */
  async getHackerOneReports(programHandle: string, limit: number = 20): Promise<HackerOneReport[]> {
    if (!this.h1ApiKey) {
      console.warn('⚠️  HackerOne API key no disponible');
      return [];
    }

    try {
      console.log(`📋 Obteniendo reportes de ${programHandle}...`);

      const response = await this.axiosInstance.get(
        `https://api.hackerone.com/v1/programs/${programHandle}/reports`,
        {
          headers: {
            Authorization: `Bearer ${this.h1ApiKey}`,
          },
          params: {
            'filter[state]': 'resolved',
            sort: '-created_at',
            limit,
          },
          validateStatus: () => true,
        }
      );

      if (response.status !== 200) {
        throw new Error(`HackerOne API error: ${response.status}`);
      }

      return (response.data.data || []).map((r: any) => ({
        id: r.id,
        title: r.attributes.title,
        state: r.attributes.state,
        type: r.attributes.vulnerability_types?.join(', ') || 'Unknown',
        bounty_awarded: r.attributes.bounty_awarded,
        vulnerability_types: r.attributes.vulnerability_types || [],
        created_at: r.attributes.created_at,
      }));
    } catch (error: any) {
      console.error(`❌ Error obteniendo reportes:`, error.message);
      return [];
    }
  }

  /**
   * CVE DATABASE - BUSCAR VULNERABILIDADES
   * Busca en el CVE database (NVD API)
   */
  async searchCVE(query: string, limit: number = 10): Promise<CVEInfo[]> {
    try {
      console.log(`🔍 Buscando CVEs: ${query}`);

      // Usar NVD (National Vulnerability Database) API
      const response = await this.axiosInstance.get('https://services.nvd.nist.gov/rest/json/cves/2.0', {
        params: {
          keywordSearch: query,
          resultsPerPage: limit,
        },
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        console.warn(`⚠️  NVD API error: ${response.status}`);
        return [];
      }

      return (response.data.vulnerabilities || []).map((vuln: any) => {
        const cveData = vuln.cve;
        return {
          id: cveData.id,
          description:
            cveData.descriptions?.[0]?.value || 'No description available',
          severity: cveData.metrics?.cvssV3?.baseSeverity || 'UNKNOWN',
          cvss_score: cveData.metrics?.cvssV3?.baseScore,
          affected_versions: cveData.configurations?.map((c: any) => c.nodes).flat() || [],
          published_date: cveData.published,
        };
      });
    } catch (error: any) {
      console.error(`❌ Error buscando CVEs:`, error.message);
      return [];
    }
  }

  /**
   * OSINT - RECOPILACIÓN DE INTELIGENCIA ABIERTA
   * Busca información pública sobre un dominio/target
   */
  async performOSINT(target: string): Promise<{
    whois?: any;
    dns?: any;
    certs?: any;
    vulnerabilities?: CVEInfo[];
    reputation?: any;
  }> {
    try {
      console.log(`🔎 Realizando OSINT en ${target}...`);

      const result: any = {};

      // DNS records (usando API pública)
      try {
        const dnsResponse = await this.callAPI(`https://dns.google/resolve?name=${target}`);
        result.dns = dnsResponse.data;
      } catch (e) {
        console.warn('DNS lookup falló');
      }

      // Certificados SSL
      try {
        const certResponse = await this.callAPI(
          `https://crt.sh/?q=%25.${target}&output=json`
        );
        result.certs = certResponse.data;
      } catch (e) {
        console.warn('Cert lookup falló');
      }

      // Vulnerabilidades del dominio
      result.vulnerabilities = await this.searchCVE(target, 5);

      // Reputación (usando APIs públicas)
      try {
        const abuseResponse = await this.callAPI(
          `https://api.abuseipdb.com/api/v2/check`,
          'GET',
          undefined,
          {
            Key: process.env.ABUSEIPDB_API_KEY || '',
          }
        );
        result.reputation = abuseResponse.data;
      } catch (e) {
        console.warn('Reputation lookup falló');
      }

      return result;
    } catch (error: any) {
      console.error(`❌ Error en OSINT:`, error.message);
      throw error;
    }
  }

  /**
   * BUSCAR EXPLOITS
   * Busca exploits públicos en ExploitDB
   */
  async searchExploits(keyword: string, limit: number = 10): Promise<any[]> {
    try {
      console.log(`🔓 Buscando exploits: ${keyword}`);

      // Usando ExploitDB API (si está disponible)
      const response = await this.callAPI(
        `https://www.exploitdb.com/api/search?q=${encodeURIComponent(keyword)}`
      );

      return (response.data.results || []).slice(0, limit);
    } catch (error: any) {
      console.error(`❌ Error buscando exploits:`, error.message);
      return [];
    }
  }

  /**
   * GOOGLE DORKING
   * Construye y busca usando Google Dork queries
   */
  async performGoogleDork(dorkQuery: string): Promise<string[]> {
    try {
      console.log(`🔍 Google Dork: ${dorkQuery}`);

      // Nota: Requiere Programmable Search Engine o Custom Search API
      if (!process.env.GOOGLE_SEARCH_API_KEY) {
        console.warn('⚠️  Google Search API key no disponible');
        return [];
      }

      const response = await this.callAPI(
        'https://www.googleapis.com/customsearch/v1',
        'GET',
        undefined,
        {
          q: dorkQuery,
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        }
      );

      return (response.data.items || []).map((item: any) => item.link);
    } catch (error: any) {
      console.error(`❌ Error en Google Dork:`, error.message);
      return [];
    }
  }

  /**
   * VERIFICAR STATUS DEL SERVICIO
   */
  getStatus(): {
    hackerOneConfigured: boolean;
    cveDatabaseAvailable: boolean;
    axiorsConfigured: boolean;
  } {
    return {
      hackerOneConfigured: !!this.h1ApiKey,
      cveDatabaseAvailable: true,
      axiorsConfigured: true,
    };
  }
}

export const webIntegrationService = new WebIntegrationService();
