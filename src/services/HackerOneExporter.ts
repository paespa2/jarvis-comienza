/**
 * HACKERONE EXPORTER - Integración con HackerOne API
 * Exporta vulnerabilidades encontradas directamente a HackerOne
 */

import { VulnerabilityCase } from './CaseManager';

interface HackerOneReport {
  vulnerability_type: string;
  vulnerability_description: string;
  structured_scope: {
    asset_type: string;
    asset_identifier: string;
  };
  severity_rating: string;
  cvss_vector_string: string;
  attachments?: { file_name: string; file_content: string }[];
}

class HackerOneExporter {
  private apiToken: string | null = null;
  private apiUrl = 'https://api.hackerone.com/v1';

  /**
   * Initialize with HackerOne API token
   */
  initialize(token: string) {
    this.apiToken = token;
    console.log('[HackerOneExporter] Initialized with token');
  }

  /**
   * Convert severity to HackerOne rating
   */
  private severityToRating(severity: string): string {
    const map: { [key: string]: string } = {
      'Crítica': 'critical',
      'Alta': 'high',
      'Media': 'medium',
      'Baja': 'low'
    };
    return map[severity] || 'medium';
  }

  /**
   * Convert CVSS to vector string (simplified)
   */
  private cvssToVector(cvss: number): string {
    // CVSS 3.1 format - simplified
    if (cvss >= 9.0) return 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
    if (cvss >= 7.0) return 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H';
    if (cvss >= 5.0) return 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N';
    return 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N';
  }

  /**
   * Create HackerOne report payload from case
   */
  private caseToHackerOneReport(caseData: VulnerabilityCase): HackerOneReport {
    const [assetType, assetId] = caseData.target.includes('/')
      ? ['url', caseData.target]
      : ['domain', caseData.target];

    return {
      vulnerability_type: caseData.type,
      vulnerability_description: `
## Vulnerability Description
${caseData.impact}

## Affected Location
- **Target**: ${caseData.target}
- **Endpoint**: ${caseData.location}
- **Parameter**: ${caseData.parameter || 'N/A'}

## Steps to Reproduce
1. Access ${caseData.target}
2. Navigate to ${caseData.location}
3. Inject payload: \`${caseData.payload}\`
4. Observe vulnerability execution

## Impact
${caseData.impact}

## CVSS Score
${caseData.cvss.toFixed(1)} / 10 (${caseData.severity})
      `.trim(),
      structured_scope: {
        asset_type: assetType,
        asset_identifier: assetId
      },
      severity_rating: this.severityToRating(caseData.severity),
      cvss_vector_string: this.cvssToVector(caseData.cvss),
      attachments: caseData.screenshot ? [
        {
          file_name: `screenshot-${caseData.id}.png`,
          file_content: caseData.screenshot
        }
      ] : undefined
    };
  }

  /**
   * Submit report to HackerOne
   */
  async submitReport(
    caseData: VulnerabilityCase,
    programHandle: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    if (!this.apiToken) {
      return {
        success: false,
        error: 'HackerOne API token not configured. Set HO_API_TOKEN env var'
      };
    }

    try {
      const payload = this.caseToHackerOneReport(caseData);

      const response = await fetch(
        `${this.apiUrl}/programs/${programHandle}/report_drafts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HO API Error: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;

      return {
        success: true,
        reportId: result.data?.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch submit multiple cases
   */
  async submitBatch(
    cases: VulnerabilityCase[],
    programHandle: string
  ): Promise<{ success: boolean; submitted: number; failed: number; results: any[] }> {
    const results = [];

    for (const caseData of cases) {
      const result = await this.submitReport(caseData, programHandle);
      results.push(result);

      // Rate limiting: wait between submissions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const submitted = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: failed === 0,
      submitted,
      failed,
      results
    };
  }

  /**
   * Format case as markdown for HackerOne submission
   */
  formatAsMarkdown(caseData: VulnerabilityCase): string {
    return `
# ${caseData.type} Vulnerability Report

**Target**: ${caseData.target}
**Severity**: ${caseData.severity}
**CVSS Score**: ${caseData.cvss.toFixed(1)}
**Bounty Estimate**: $${caseData.bountyEstimate}

## Vulnerability Description
${caseData.impact}

## Affected Component
- **Location**: ${caseData.location}
- **Parameter**: ${caseData.parameter || 'N/A'}
- **Type**: ${caseData.type}

## Proof of Concept
\`\`\`
${caseData.payload}
\`\`\`

## Steps to Reproduce
${
  caseData.steps
    ?.map((step, i) => `${i + 1}. ${step.title}: ${step.description}`)
    .join('\n') || '1. Access the target\n2. Navigate to vulnerable endpoint\n3. Submit payload'
}

## Impact
${caseData.impact}

## Recommendation
Validate and sanitize all user inputs. Use parameterized queries for database operations.

---
*Report generated by JARVIS v2.0-Kimi-K26*
    `.trim();
  }

  /**
   * Get HackerOne programs list (requires API token)
   */
  async listPrograms(): Promise<{ success: boolean; programs?: any[]; error?: string }> {
    if (!this.apiToken) {
      return {
        success: false,
        error: 'HackerOne API token not configured'
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/me/programs`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HO API Error: ${response.status}`);
      }

      const result = await response.json() as any;

      return {
        success: true,
        programs: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const hackerOneExporter = new HackerOneExporter();
