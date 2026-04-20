/**
 * WEBHOOK MANAGER
 *
 * Gestiona webhooks para disparar eventos automáticamente
 * (evoluciones, análisis de código, consolidaciones, etc.)
 */

import { v4 as uuidv4 } from 'uuid';

export type WebhookEvent =
  | 'task_completed'
  | 'task_failed'
  | 'memory_consolidation'
  | 'genome_evolution'
  | 'model_deployment'
  | 'github_push'
  | 'github_pr'
  | 'threshold_exceeded'
  | 'custom';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: number;
  lastTriggered?: number;
  secret?: string;
  retries: number;
  timeout: number; // ms
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  createdAt: number;
  deliveredAt?: number;
  error?: string;
}

export interface WebhookEvent_TaskCompleted {
  taskId: string;
  query: string;
  result: any;
  executionTime: number;
  successRate: number;
}

export interface WebhookEvent_MemoryConsolidation {
  consolidationId: string;
  episodesConsolidated: number;
  skillsCreated: number;
  knowledgeNodesCreated: number;
}

export interface WebhookEvent_GenomeEvolution {
  generationId: string;
  successRate: number;
  mutationVector: {
    aggressiveness: number;
    caution: number;
    predictivity: number;
    creativity: number;
  };
}

export interface WebhookEvent_ModelDeployment {
  modelId: string;
  modelName: string;
  improvementPercent: number;
  qualityScore: number;
}

export class WebhookManager {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveryHistory: Map<string, WebhookDelivery[]> = new Map();
  private eventQueue: Array<{ event: WebhookEvent; payload: any }> = [];
  private processing: boolean = false;

  constructor() {
    console.log(`\n🪝 Inicializando Webhook Manager`);
    console.log(`   ✅ Listo para registrar webhooks\n`);
  }

  /**
   * REGISTRAR WEBHOOK
   */
  registerWebhook(
    url: string,
    events: WebhookEvent[],
    options?: {
      secret?: string;
      retries?: number;
      timeout?: number;
    }
  ): Webhook {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('URL debe comenzar con http:// o https://');
    }

    const webhook: Webhook = {
      id: `webhook-${uuidv4()}`,
      url,
      events,
      active: true,
      createdAt: Date.now(),
      secret: options?.secret,
      retries: options?.retries || 3,
      timeout: options?.timeout || 5000,
    };

    this.webhooks.set(webhook.id, webhook);

    console.log(`\n✅ Webhook registrado`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${url}`);
    console.log(`   Eventos: ${events.join(', ')}`);

    return webhook;
  }

  /**
   * DESREGISTRAR WEBHOOK
   */
  unregisterWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);

    if (!webhook) {
      console.log(`❌ Webhook no encontrado: ${webhookId}`);
      return false;
    }

    this.webhooks.delete(webhookId);

    console.log(`\n✅ Webhook desregistrado: ${webhookId}`);

    return true;
  }

  /**
   * DISPARAR EVENTO
   */
  async triggerEvent(event: WebhookEvent, payload: any): Promise<void> {
    console.log(`\n🔔 Disparando evento: ${event}`);

    // Agregar a cola
    this.eventQueue.push({ event, payload });

    // Procesar la cola
    this.processQueue();
  }

  /**
   * PROCESAR COLA DE EVENTOS
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) return;

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const { event, payload } = this.eventQueue.shift()!;

      // Encontrar webhooks que escuchan este evento
      const relevantWebhooks = Array.from(this.webhooks.values()).filter(
        w => w.active && w.events.includes(event)
      );

      console.log(`   Webhooks relevantes: ${relevantWebhooks.length}`);

      // Disparar cada webhook
      for (const webhook of relevantWebhooks) {
        await this.deliverWebhook(webhook, event, payload);
      }
    }

    this.processing = false;
  }

  /**
   * ENTREGAR WEBHOOK
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: any
  ): Promise<void> {
    const delivery: WebhookDelivery = {
      id: `delivery-${uuidv4()}`,
      webhookId: webhook.id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
    };

    if (!this.deliveryHistory.has(webhook.id)) {
      this.deliveryHistory.set(webhook.id, []);
    }

    this.deliveryHistory.get(webhook.id)!.push(delivery);

    // Simular intento de envío
    let success = false;

    for (let attempt = 1; attempt <= webhook.retries; attempt++) {
      delivery.attempts = attempt;

      console.log(`   Intentando enviar a ${webhook.url} (intento ${attempt}/${webhook.retries})`);

      // Simular delay y probabilidad de éxito
      await new Promise(resolve => setTimeout(resolve, 100));

      // 90% de probabilidad de éxito
      success = Math.random() > 0.1;

      if (success) {
        delivery.status = 'delivered';
        delivery.deliveredAt = Date.now();
        console.log(`      ✅ Entregado en intento ${attempt}`);
        webhook.lastTriggered = Date.now();
        break;
      } else if (attempt < webhook.retries) {
        console.log(`      ⚠️  Fallo, reintentando...`);
      }
    }

    if (!success) {
      delivery.status = 'failed';
      delivery.error = 'Falló después de todos los reintentos';
      console.log(`      ❌ Fallo después de ${webhook.retries} intentos`);
    }
  }

  /**
   * OBTENER HISTORIAL DE ENTREGAS
   */
  getDeliveryHistory(webhookId?: string): WebhookDelivery[] {
    if (webhookId) {
      return this.deliveryHistory.get(webhookId) || [];
    }

    // Retornar todas las entregas
    const allDeliveries: WebhookDelivery[] = [];
    this.deliveryHistory.forEach(deliveries => {
      allDeliveries.push(...deliveries);
    });

    return allDeliveries;
  }

  /**
   * OBTENER ESTADO DE UN WEBHOOK
   */
  getWebhookStatus(webhookId: string): any {
    const webhook = this.webhooks.get(webhookId);

    if (!webhook) {
      return null;
    }

    const deliveries = this.deliveryHistory.get(webhookId) || [];
    const successfulDeliveries = deliveries.filter(d => d.status === 'delivered').length;

    return {
      webhook,
      totalDeliveries: deliveries.length,
      successfulDeliveries,
      failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
      successRate:
        deliveries.length > 0
          ? (successfulDeliveries / deliveries.length) * 100
          : 0,
      lastDelivery: deliveries.length > 0 ? deliveries[deliveries.length - 1] : null,
    };
  }

  /**
   * HABILITAR/DESHABILITAR WEBHOOK
   */
  setWebhookActive(webhookId: string, active: boolean): boolean {
    const webhook = this.webhooks.get(webhookId);

    if (!webhook) {
      return false;
    }

    webhook.active = active;

    console.log(`\n${active ? '✅' : '⛔'} Webhook ${webhookId} ${active ? 'habilitado' : 'deshabilitado'}`);

    return true;
  }

  /**
   * LISTAR TODOS LOS WEBHOOKS
   */
  listWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * OBTENER ESTADÍSTICAS
   */
  getStatistics() {
    const allDeliveries = this.getDeliveryHistory();

    return {
      totalWebhooks: this.webhooks.size,
      activeWebhooks: Array.from(this.webhooks.values()).filter(w => w.active)
        .length,
      totalDeliveries: allDeliveries.length,
      successfulDeliveries: allDeliveries.filter(d => d.status === 'delivered')
        .length,
      failedDeliveries: allDeliveries.filter(d => d.status === 'failed').length,
      pendingDeliveries: allDeliveries.filter(d => d.status === 'pending').length,
      successRate:
        allDeliveries.length > 0
          ? (allDeliveries.filter(d => d.status === 'delivered').length /
            allDeliveries.length) *
          100
          : 0,
      eventQueueLength: this.eventQueue.length,
    };
  }

  /**
   * SIMULAR EVENTOS COMUNES
   */
  async simulateTaskCompletedEvent(taskId: string, query: string, executionTime: number): Promise<void> {
    await this.triggerEvent('task_completed', {
      taskId,
      query,
      result: { success: true },
      executionTime,
      successRate: 0.95,
    });
  }

  async simulateMemoryConsolidationEvent(
    episodesCount: number,
    skillsCreated: number
  ): Promise<void> {
    await this.triggerEvent('memory_consolidation', {
      consolidationId: `cons-${uuidv4()}`,
      episodesConsolidated: episodesCount,
      skillsCreated,
      knowledgeNodesCreated: Math.floor(episodesCount * 0.3),
    });
  }

  async simulateGenomeEvolutionEvent(): Promise<void> {
    await this.triggerEvent('genome_evolution', {
      generationId: `gen-${uuidv4()}`,
      successRate: 0.82,
      mutationVector: {
        aggressiveness: 0.55,
        caution: 0.45,
        predictivity: 0.62,
        creativity: 0.58,
      },
    });
  }

  async simulateModelDeploymentEvent(
    modelId: string,
    modelName: string
  ): Promise<void> {
    await this.triggerEvent('model_deployment', {
      modelId,
      modelName,
      improvementPercent: 12.5,
      qualityScore: 88,
    });
  }
}
