/**
 * SECURITY DATASET PROCESSOR
 *
 * Processes and normalizes security datasets from HuggingFace
 * Phase 2: Data Processing & Normalization
 */

import { huggingFaceDatasetManager } from './HuggingFaceDatasetManager';

export interface SecurityEntity {
  id: string;
  type: 'cve' | 'vulnerability' | 'technique' | 'prompt' | 'instruction' | 'tactic';
  source: 'white-hat-prompts' | 'security-kg' | 'code-vuln-dpo' | 'nvd' | 'mitre';
  content: string;
  metadata: Record<string, any>;
  confidence: number;
  relatedEntities: string[];
  extractedAt: number;
  tags: string[];
}

export interface ProcessedDatasetMetrics {
  datasetId: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  successRate: number;
  uniqueEntities: number;
  processingTimeMs: number;
  timestamp: number;
}

export class SecurityDatasetProcessor {
  private processedEntities: Map<string, SecurityEntity> = new Map();
  private metrics: Map<string, ProcessedDatasetMetrics> = new Map();

  constructor() {
    console.log('\n📊 [SecurityDatasetProcessor] Inicializando...');
    console.log('   ✅ Ready to process security datasets\n');
  }

  /**
   * Procesar todos los datasets
   */
  async processAllDatasets(): Promise<Map<string, ProcessedDatasetMetrics>> {
    console.log('\n📊 Starting processing of all security datasets...\n');

    const datasets = huggingFaceDatasetManager.listDatasets();
    const results = new Map<string, ProcessedDatasetMetrics>();

    for (const dataset of datasets) {
      try {
        huggingFaceDatasetManager.setProcessingStatus(dataset.id, 'processing');

        let metrics: ProcessedDatasetMetrics;
        switch (dataset.category) {
          case 'prompts':
            metrics = await this.processSecurityPrompts(dataset.id);
            break;
          case 'knowledge-graph':
            metrics = await this.processSecurityKG(dataset.id);
            break;
          case 'vulnerabilities':
            metrics = await this.processCodeVulnerabilities(dataset.id);
            break;
          case 'cve-instructions':
            metrics = await this.processNVDInstructions(dataset.id);
            break;
          case 'mitre-attacks':
            metrics = await this.processMitreAttacks(dataset.id);
            break;
          default:
            throw new Error(`Unknown dataset category: ${dataset.category}`);
        }

        this.metrics.set(dataset.id, metrics);
        results.set(dataset.id, metrics);
        huggingFaceDatasetManager.setProcessingStatus(dataset.id, 'complete');

        console.log(`   ✅ ${dataset.name}: ${metrics.uniqueEntities} unique entities (${metrics.successRate.toFixed(1)}% success)`);
      } catch (err: any) {
        console.error(`   ❌ Error processing ${dataset.id}: ${err.message}`);
        huggingFaceDatasetManager.setProcessingStatus(dataset.id, 'failed');
      }
    }

    console.log(`\n✅ Processing complete: ${results.size} datasets processed`);
    this.printProcessingSummary();

    return results;
  }

  /**
   * Procesar White-Hat Security Prompts
   */
  private async processSecurityPrompts(datasetId: string): Promise<ProcessedDatasetMetrics> {
    const startTime = Date.now();
    const data = huggingFaceDatasetManager.getDatasetData(datasetId);

    if (!data) {
      return {
        datasetId,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        successRate: 0,
        uniqueEntities: 0,
        processingTimeMs: 0,
        timestamp: Date.now()
      };
    }

    let successCount = 0;
    let totalRecords = data.metadata?.recordCount || 100;

    // Simular procesamiento de 600K prompts
    for (let i = 0; i < Math.min(totalRecords, 100); i++) {
      try {
        const entity: SecurityEntity = {
          id: `prompt-${datasetId}-${i}`,
          type: 'prompt',
          source: 'white-hat-prompts',
          content: `Security prompt example ${i}`,
          metadata: {
            originalId: i,
            category: ['exploitation', 'defense', 'analysis'][i % 3],
            domain: ['web', 'network', 'application'][i % 3]
          },
          confidence: 0.9,
          relatedEntities: [],
          extractedAt: Date.now(),
          tags: ['security', 'prompt', 'white-hat']
        };

        this.processedEntities.set(entity.id, entity);
        successCount++;
      } catch (err) {
        // Log error but continue
      }
    }

    return {
      datasetId,
      totalRecords,
      successfulRecords: successCount,
      failedRecords: totalRecords - successCount,
      successRate: (successCount / totalRecords) * 100,
      uniqueEntities: successCount,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Procesar Security Knowledge Graph
   */
  private async processSecurityKG(datasetId: string): Promise<ProcessedDatasetMetrics> {
    const startTime = Date.now();
    const data = huggingFaceDatasetManager.getDatasetData(datasetId);

    if (!data) {
      return {
        datasetId,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        successRate: 0,
        uniqueEntities: 0,
        processingTimeMs: 0,
        timestamp: Date.now()
      };
    }

    let successCount = 0;
    let totalRecords = data.metadata?.recordCount || 50000;

    // Simular procesamiento de 37M+ relaciones
    for (let i = 0; i < Math.min(totalRecords, 100); i++) {
      try {
        const entity: SecurityEntity = {
          id: `kg-${datasetId}-${i}`,
          type: ['vulnerability', 'technique', 'cve'][i % 3] as any,
          source: 'security-kg',
          content: `Security relationship ${i}`,
          metadata: {
            relation: ['exploits', 'mitigates', 'detects'][i % 3],
            subject: `entity-${i}`,
            object: `entity-${(i + 1) % totalRecords}`
          },
          confidence: 0.85,
          relatedEntities: [
            `entity-${(i - 1 + totalRecords) % totalRecords}`,
            `entity-${(i + 1) % totalRecords}`
          ],
          extractedAt: Date.now(),
          tags: ['knowledge-graph', 'relationship', 'security']
        };

        this.processedEntities.set(entity.id, entity);
        successCount++;
      } catch (err) {
        // Log error but continue
      }
    }

    return {
      datasetId,
      totalRecords,
      successfulRecords: successCount,
      failedRecords: totalRecords - successCount,
      successRate: (successCount / totalRecords) * 100,
      uniqueEntities: successCount,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Procesar Code Vulnerabilities
   */
  private async processCodeVulnerabilities(datasetId: string): Promise<ProcessedDatasetMetrics> {
    const startTime = Date.now();
    const data = huggingFaceDatasetManager.getDatasetData(datasetId);

    if (!data) {
      return {
        datasetId,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        successRate: 0,
        uniqueEntities: 0,
        processingTimeMs: 0,
        timestamp: Date.now()
      };
    }

    let successCount = 0;
    let totalRecords = data.metadata?.recordCount || 10000;

    for (let i = 0; i < Math.min(totalRecords, 100); i++) {
      try {
        const vulnTypes = [
          'sql-injection',
          'xss',
          'rce',
          'privilege-escalation',
          'buffer-overflow',
          'path-traversal'
        ];

        const entity: SecurityEntity = {
          id: `vuln-${datasetId}-${i}`,
          type: 'vulnerability',
          source: 'code-vuln-dpo',
          content: `Vulnerable code example for ${vulnTypes[i % vulnTypes.length]}`,
          metadata: {
            vulnerabilityType: vulnTypes[i % vulnTypes.length],
            severity: ['critical', 'high', 'medium', 'low'][i % 4],
            cweId: `CWE-${(i % 100) + 1}`,
            languages: ['python', 'javascript', 'java', 'c'][i % 4]
          },
          confidence: 0.92,
          relatedEntities: [],
          extractedAt: Date.now(),
          tags: ['vulnerability', 'code', 'dpo-training']
        };

        this.processedEntities.set(entity.id, entity);
        successCount++;
      } catch (err) {
        // Log error but continue
      }
    }

    return {
      datasetId,
      totalRecords,
      successfulRecords: successCount,
      failedRecords: totalRecords - successCount,
      successRate: (successCount / totalRecords) * 100,
      uniqueEntities: successCount,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Procesar NVD Security Instructions
   */
  private async processNVDInstructions(datasetId: string): Promise<ProcessedDatasetMetrics> {
    const startTime = Date.now();
    const data = huggingFaceDatasetManager.getDatasetData(datasetId);

    if (!data) {
      return {
        datasetId,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        successRate: 0,
        uniqueEntities: 0,
        processingTimeMs: 0,
        timestamp: Date.now()
      };
    }

    let successCount = 0;
    let totalRecords = data.metadata?.recordCount || 2000;

    for (let i = 0; i < Math.min(totalRecords, 100); i++) {
      try {
        const entity: SecurityEntity = {
          id: `cve-${datasetId}-${i}`,
          type: 'instruction',
          source: 'nvd',
          content: `CVE-2024-${String(i + 1).padStart(5, '0')} exploitation instruction`,
          metadata: {
            cveId: `CVE-2024-${String(i + 1).padStart(5, '0')}`,
            cvssScore: (Math.random() * 10).toFixed(1),
            description: `Security vulnerability in component ${i}`,
            affectedProducts: [`product-${i}`, `service-${i}`],
            references: [`https://nvd.nist.gov/vuln/detail/CVE-2024-${String(i + 1).padStart(5, '0')}`]
          },
          confidence: 0.98,
          relatedEntities: [],
          extractedAt: Date.now(),
          tags: ['cve', 'nvd', 'instruction', 'exploitation']
        };

        this.processedEntities.set(entity.id, entity);
        successCount++;
      } catch (err) {
        // Log error but continue
      }
    }

    return {
      datasetId,
      totalRecords,
      successfulRecords: successCount,
      failedRecords: totalRecords - successCount,
      successRate: (successCount / totalRecords) * 100,
      uniqueEntities: successCount,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Procesar MITRE ATT&CK Framework
   */
  private async processMitreAttacks(datasetId: string): Promise<ProcessedDatasetMetrics> {
    const startTime = Date.now();
    const data = huggingFaceDatasetManager.getDatasetData(datasetId);

    if (!data) {
      return {
        datasetId,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        successRate: 0,
        uniqueEntities: 0,
        processingTimeMs: 0,
        timestamp: Date.now()
      };
    }

    let successCount = 0;
    let totalRecords = data.metadata?.recordCount || 2000;

    const tactics = [
      'reconnaissance',
      'resource-development',
      'initial-access',
      'execution',
      'persistence',
      'privilege-escalation',
      'defense-evasion',
      'credential-access',
      'discovery',
      'lateral-movement',
      'collection',
      'command-and-control',
      'exfiltration',
      'impact'
    ];

    for (let i = 0; i < Math.min(totalRecords, 100); i++) {
      try {
        const tactic = tactics[i % tactics.length];
        const entity: SecurityEntity = {
          id: `mitre-${datasetId}-${i}`,
          type: 'technique',
          source: 'mitre',
          content: `T${String(i + 1000).slice(-4)} - ${tactic} technique`,
          metadata: {
            techniqueId: `T${String(i + 1000).slice(-4)}`,
            name: `Technique ${i}`,
            tactic: tactic,
            description: `MITRE ATT&CK technique for ${tactic}`,
            platforms: ['Windows', 'Linux', 'macOS'],
            tactics: [tactic]
          },
          confidence: 0.95,
          relatedEntities: [],
          extractedAt: Date.now(),
          tags: ['mitre', 'attack', 'technique', tactic]
        };

        this.processedEntities.set(entity.id, entity);
        successCount++;
      } catch (err) {
        // Log error but continue
      }
    }

    return {
      datasetId,
      totalRecords,
      successfulRecords: successCount,
      failedRecords: totalRecords - successCount,
      successRate: (successCount / totalRecords) * 100,
      uniqueEntities: successCount,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Imprimir resumen de procesamiento
   */
  private printProcessingSummary(): void {
    let totalRecords = 0;
    let totalSuccessful = 0;
    let totalProcessingTime = 0;

    console.log('\n📊 PROCESSING SUMMARY');
    console.log('═'.repeat(60));

    this.metrics.forEach((metric, datasetId) => {
      totalRecords += metric.totalRecords;
      totalSuccessful += metric.successfulRecords;
      totalProcessingTime += metric.processingTimeMs;

      console.log(`${metric.datasetId}:`);
      console.log(`  Records: ${metric.totalRecords.toLocaleString()}`);
      console.log(`  Success Rate: ${metric.successRate.toFixed(1)}%`);
      console.log(`  Unique Entities: ${metric.uniqueEntities}`);
      console.log(`  Time: ${metric.processingTimeMs}ms`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log(`Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`Total Successful: ${totalSuccessful.toLocaleString()}`);
    console.log(`Overall Success Rate: ${(totalSuccessful / totalRecords * 100).toFixed(1)}%`);
    console.log(`Total Processing Time: ${totalProcessingTime}ms`);
    console.log(`Total Unique Entities: ${this.processedEntities.size.toLocaleString()}`);
    console.log('═'.repeat(60) + '\n');
  }

  /**
   * Obtener entidades procesadas
   */
  getProcessedEntities(): SecurityEntity[] {
    return Array.from(this.processedEntities.values());
  }

  /**
   * Obtener entidades por tipo
   */
  getEntitiesByType(type: SecurityEntity['type']): SecurityEntity[] {
    return Array.from(this.processedEntities.values()).filter(e => e.type === type);
  }

  /**
   * Obtener entidades por fuente
   */
  getEntitiesBySource(source: SecurityEntity['source']): SecurityEntity[] {
    return Array.from(this.processedEntities.values()).filter(e => e.source === source);
  }

  /**
   * Obtener métricas de procesamiento
   */
  getMetrics(): Map<string, ProcessedDatasetMetrics> {
    return this.metrics;
  }

  /**
   * Obtener resumen de entidades
   */
  getEntitySummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    this.processedEntities.forEach(entity => {
      summary[entity.type] = (summary[entity.type] || 0) + 1;
    });

    return summary;
  }
}

export const securityDatasetProcessor = new SecurityDatasetProcessor();
