/**
 * HUGGINGFACE DATASET MANAGER
 *
 * Manages downloading, caching, and validation of security datasets from HuggingFace
 * Phase 1: Dataset Infrastructure
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface DatasetConfig {
  id: string;
  name: string;
  description: string;
  datasetId: string; // HuggingFace dataset ID
  estimatedSize: string;
  format: 'parquet' | 'json' | 'csv';
  priority: number; // 1 = highest priority
  category: 'prompts' | 'knowledge-graph' | 'vulnerabilities' | 'cve-instructions' | 'mitre-attacks';
}

export interface DatasetCacheEntry {
  id: string;
  name: string;
  downloadedAt: number;
  version: string;
  sizeBytes: number;
  checksumSha256: string;
  status: 'cached' | 'corrupted' | 'partial';
  processingStatus: 'pending' | 'processing' | 'complete' | 'failed';
}

export class HuggingFaceDatasetManager {
  private cacheDir: string;
  private registry: Map<string, DatasetConfig> = new Map();
  private cache: Map<string, DatasetCacheEntry> = new Map();
  private hfToken: string | null = null;
  private maxCacheSize: number = 500 * 1024 * 1024; // 500MB default

  constructor() {
    console.log('\n🌐 [HuggingFaceDatasetManager] Inicializando...');
    this.cacheDir = path.join(process.cwd(), 'data', 'huggingface-cache');
    this.hfToken = process.env.HF_TOKEN || null;
    this.maxCacheSize = parseInt(process.env.MAX_CACHE_SIZE || '536870912', 10);

    this.initializeCacheDirectory();
    this.registerDatasets();
    this.loadCacheMetadata();
  }

  /**
   * Inicializar directorio de cache
   */
  private initializeCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log(`   📁 Cache directory created: ${this.cacheDir}`);
    }

    // Crear subdirectorios para cada categoría
    const categories = ['prompts', 'knowledge-graph', 'vulnerabilities', 'cve-instructions', 'mitre-attacks'];
    categories.forEach(cat => {
      const categoryDir = path.join(this.cacheDir, cat);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
    });
  }

  /**
   * Registrar datasets disponibles
   */
  private registerDatasets(): void {
    const datasets: DatasetConfig[] = [
      {
        id: 'white-hat-security-prompts',
        name: 'White-Hat Security Agent Prompts',
        description: '600K security-focused prompts and instructions',
        datasetId: 'White-Hat-Security-Agent-Prompts-600K',
        estimatedSize: '2GB',
        format: 'json',
        priority: 1,
        category: 'prompts'
      },
      {
        id: 'security-kg',
        name: 'Security Knowledge Graph',
        description: '37.1M security relationships and entities',
        datasetId: 'security-kg',
        estimatedSize: '8GB',
        format: 'parquet',
        priority: 2,
        category: 'knowledge-graph'
      },
      {
        id: 'code-vulnerability-dpo',
        name: 'Code Vulnerability Security DPO',
        description: 'Vulnerability examples and DPO pairs for training',
        datasetId: 'Code_Vulnerability_Security_DPO',
        estimatedSize: '500MB',
        format: 'json',
        priority: 3,
        category: 'vulnerabilities'
      },
      {
        id: 'nvd-security-instructions',
        name: 'NVD Security Instructions',
        description: '2000+ CVE exploitation instructions and details',
        datasetId: 'nvd-security-instructions',
        estimatedSize: '300MB',
        format: 'json',
        priority: 4,
        category: 'cve-instructions'
      },
      {
        id: 'mitre-attack',
        name: 'MITRE ATT&CK Framework',
        description: '2000+ attack techniques and tactics',
        datasetId: 'security-attacks-MITRE',
        estimatedSize: '150MB',
        format: 'json',
        priority: 5,
        category: 'mitre-attacks'
      }
    ];

    datasets.forEach(ds => this.registry.set(ds.id, ds));
    console.log(`   ✅ Registered ${datasets.length} datasets`);
  }

  /**
   * Cargar metadata de cache existente
   */
  private loadCacheMetadata(): void {
    const metadataFile = path.join(this.cacheDir, '.metadata.json');
    if (fs.existsSync(metadataFile)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
        Object.entries(metadata).forEach(([id, entry]: [string, any]) => {
          this.cache.set(id, entry);
        });
        console.log(`   ✅ Loaded cache metadata for ${this.cache.size} datasets`);
      } catch (err) {
        console.warn(`   ⚠️  Error loading cache metadata: ${err}`);
      }
    }
  }

  /**
   * Guardar metadata de cache
   */
  private saveCacheMetadata(): void {
    const metadataFile = path.join(this.cacheDir, '.metadata.json');
    const metadata: Record<string, DatasetCacheEntry> = {};
    this.cache.forEach((entry, id) => {
      metadata[id] = entry;
    });
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  }

  /**
   * Descargar dataset desde HuggingFace
   */
  async downloadDataset(datasetId: string, skipIfExists: boolean = true): Promise<boolean> {
    const config = this.registry.get(datasetId);
    if (!config) {
      console.error(`   ❌ Dataset ${datasetId} not found in registry`);
      return false;
    }

    // Verificar si ya está en cache
    if (skipIfExists && this.cache.has(datasetId)) {
      const cached = this.cache.get(datasetId)!;
      if (cached.status === 'cached') {
        console.log(`   ℹ️  Dataset ${datasetId} already cached (${cached.sizeBytes} bytes)`);
        return true;
      }
    }

    console.log(`\n📥 Downloading ${config.name}...`);
    console.log(`   Dataset: ${config.datasetId}`);
    console.log(`   Est. Size: ${config.estimatedSize}`);

    const categoryDir = path.join(this.cacheDir, config.category);
    const outputPath = path.join(categoryDir, `${datasetId}.${config.format}`);

    try {
      // Aquí iría la lógica real de descarga desde HuggingFace
      // Por ahora, simulamos la descarga
      console.log(`   ✅ Download simulated for development`);
      console.log(`   📍 Would download to: ${outputPath}`);

      // En producción, usarías huggingface_hub:
      // const ds = await hf_api.dataset_info(config.datasetId);
      // const download_url = hf_api.repo_url(config.datasetId, repo_type='dataset');
      // await downloadFile(download_url, outputPath, headers);

      // Crear fichero dummy para desarrollo
      const dummyData = {
        metadata: {
          dataset: datasetId,
          name: config.name,
          downloadedAt: Date.now(),
          format: config.format,
          recordCount: Math.floor(Math.random() * 100000)
        },
        status: 'mock-downloaded',
        message: 'This is a mock dataset for development. In production, real HuggingFace data would be downloaded here.'
      };
      fs.writeFileSync(outputPath, JSON.stringify(dummyData, null, 2));

      // Guardar cache metadata
      const cacheEntry: DatasetCacheEntry = {
        id: datasetId,
        name: config.name,
        downloadedAt: Date.now(),
        version: '1.0.0',
        sizeBytes: JSON.stringify(dummyData).length,
        checksumSha256: this.generateChecksum(datasetId),
        status: 'cached',
        processingStatus: 'pending'
      };

      this.cache.set(datasetId, cacheEntry);
      this.saveCacheMetadata();

      console.log(`   ✅ Dataset cached successfully`);
      console.log(`   💾 Size: ${cacheEntry.sizeBytes} bytes`);
      return true;
    } catch (err: any) {
      console.error(`   ❌ Error downloading dataset: ${err.message}`);
      return false;
    }
  }

  /**
   * Descargar todos los datasets con reintentos
   */
  async downloadAllDatasets(maxRetries: number = 3): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const datasets = Array.from(this.registry.values())
      .sort((a, b) => a.priority - b.priority);

    console.log(`\n📥 Starting download of ${datasets.length} datasets...`);

    for (const dataset of datasets) {
      let success = false;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          success = await this.downloadDataset(dataset.id);
          if (success) break;
        } catch (err) {
          if (attempt < maxRetries) {
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.log(`   ⏳ Retry in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }
      results.set(dataset.id, success);
    }

    return results;
  }

  /**
   * Obtener ruta del dataset cacheado
   */
  getDatasetPath(datasetId: string): string | null {
    const config = this.registry.get(datasetId);
    if (!config) return null;

    const categoryDir = path.join(this.cacheDir, config.category);
    const filePath = path.join(categoryDir, `${datasetId}.${config.format}`);

    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  /**
   * Obtener datos del dataset
   */
  getDatasetData(datasetId: string): any | null {
    const filePath = this.getDatasetPath(datasetId);
    if (!filePath) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Error reading dataset ${datasetId}: ${err}`);
      return null;
    }
  }

  /**
   * Verificar integridad del cache
   */
  verifyIntegrity(): Map<string, boolean> {
    const results = new Map<string, boolean>();

    this.cache.forEach((entry, datasetId) => {
      const filePath = this.getDatasetPath(datasetId);
      if (!filePath) {
        results.set(datasetId, false);
        return;
      }

      try {
        const stats = fs.statSync(filePath);
        results.set(datasetId, stats.size === entry.sizeBytes);
      } catch {
        results.set(datasetId, false);
      }
    });

    return results;
  }

  /**
   * Obtener estado del cache
   */
  getCacheStatus(): {
    totalSize: number;
    cachedDatasets: number;
    totalDatasets: number;
    datasets: Record<string, any>;
  } {
    let totalSize = 0;
    const datasets: Record<string, any> = {};

    this.cache.forEach((entry, id) => {
      totalSize += entry.sizeBytes;
      datasets[id] = {
        name: entry.name,
        size: entry.sizeBytes,
        status: entry.status,
        processingStatus: entry.processingStatus,
        downloadedAt: new Date(entry.downloadedAt).toISOString()
      };
    });

    return {
      totalSize,
      cachedDatasets: this.cache.size,
      totalDatasets: this.registry.size,
      datasets
    };
  }

  /**
   * Generar checksum simple
   */
  private generateChecksum(datasetId: string): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(datasetId + Date.now())
      .digest('hex');
  }

  /**
   * Limpiar cache
   */
  clearCache(datasetId?: string): void {
    if (datasetId) {
      const filePath = this.getDatasetPath(datasetId);
      if (filePath) {
        fs.unlinkSync(filePath);
        this.cache.delete(datasetId);
        this.saveCacheMetadata();
        console.log(`✅ Cleared cache for ${datasetId}`);
      }
    } else {
      const categoryDirs = fs.readdirSync(this.cacheDir);
      categoryDirs.forEach(dir => {
        const dirPath = path.join(this.cacheDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath);
          files.forEach(file => {
            fs.unlinkSync(path.join(dirPath, file));
          });
        }
      });
      this.cache.clear();
      this.saveCacheMetadata();
      console.log(`✅ Cleared all cache`);
    }
  }

  /**
   * Obtener lista de datasets
   */
  listDatasets(): DatasetConfig[] {
    return Array.from(this.registry.values())
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Actualizar estado de procesamiento
   */
  setProcessingStatus(datasetId: string, status: 'pending' | 'processing' | 'complete' | 'failed'): void {
    const cached = this.cache.get(datasetId);
    if (cached) {
      cached.processingStatus = status;
      this.saveCacheMetadata();
    }
  }
}

export const huggingFaceDatasetManager = new HuggingFaceDatasetManager();
