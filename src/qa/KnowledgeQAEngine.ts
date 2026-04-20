/**
 * KNOWLEDGE Q&A ENGINE
 *
 * Answers security questions using the knowledge base WITHOUT making API calls.
 * Pure knowledge retrieval + simple reasoning = fast responses (<100ms)
 *
 * ✨ PHASE 3b: Offline Q&A System
 */

import { securityKnowledgeBase } from './SecurityKnowledgeBase';

export interface KnowledgeAnswer {
  answer: string;
  confidence: number; // 0-1
  sources: string[]; // which knowledge entries were used
  relatedTopics: string[];
  followUpQuestions?: string[];
}

export class KnowledgeQAEngine {
  private knowledgeBase = securityKnowledgeBase;

  /**
   * Answer a question using the knowledge base
   */
  async answer(query: string): Promise<KnowledgeAnswer> {
    const startTime = Date.now();

    // Step 1: Extract keywords and intent
    const keywords = this.extractKeywords(query);
    const intent = this.detectIntent(query);

    // Step 2: Search knowledge base
    let sources: string[] = [];
    let answer = '';
    let confidence = 0.5;
    let relatedTopics: string[] = [];

    if (intent === 'explain-vulnerability') {
      const result = this.handleVulnerabilityQuestion(keywords, query);
      answer = result.answer;
      confidence = result.confidence;
      sources = result.sources;
      relatedTopics = result.relatedTopics;
    } else if (intent === 'cve-lookup') {
      const result = this.handleCVEQuestion(keywords, query);
      answer = result.answer;
      confidence = result.confidence;
      sources = result.sources;
    } else if (intent === 'exploit-info') {
      const result = this.handleExploitQuestion(keywords, query);
      answer = result.answer;
      confidence = result.confidence;
      sources = result.sources;
    } else if (intent === 'mitigation') {
      const result = this.handleMitigationQuestion(keywords, query);
      answer = result.answer;
      confidence = result.confidence;
      sources = result.sources;
    } else if (intent === 'hackerone-info') {
      const result = this.handleHackerOneQuestion(keywords, query);
      answer = result.answer;
      confidence = result.confidence;
      sources = result.sources;
    } else {
      answer = this.handleGeneralQuestion(keywords, query);
      confidence = 0.4;
    }

    const executionTime = Date.now() - startTime;
    console.log(`[KnowledgeQA] ⚡ Answered in ${executionTime}ms (confidence: ${(confidence * 100).toFixed(0)}%)`);

    return {
      answer,
      confidence,
      sources,
      relatedTopics,
      followUpQuestions: this.generateFollowUpQuestions(intent, keywords)
    };
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase()
      .split(/[^a-z0-9\-]/g)
      .filter(w => w.length > 2);

    return [...new Set(words)]; // Deduplicate
  }

  /**
   * Detect intent of the question
   */
  private detectIntent(query: string): string {
    query = query.toLowerCase();

    if (query.includes('what') && (query.includes('vulnerability') || query.includes('xss') || query.includes('sql'))) {
      return 'explain-vulnerability';
    }
    if (query.includes('cve') || query.includes('2021') || query.includes('2022')) {
      return 'cve-lookup';
    }
    if (query.includes('exploit') || query.includes('payload') || query.includes('poc')) {
      return 'exploit-info';
    }
    if (query.includes('how to') || query.includes('fix') || query.includes('mitigate')) {
      return 'mitigation';
    }
    if (query.includes('hackerone') || query.includes('bug bounty') || query.includes('program')) {
      return 'hackerone-info';
    }

    return 'general';
  }

  /**
   * Handle "explain vulnerability" questions
   */
  private handleVulnerabilityQuestion(keywords: string[], query: string): any {
    // Try to find relevant vulnerabilities
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw) || kw.includes(type.substring(0, 3))));

    if (vulnerabilities.length === 0) {
      return {
        answer: 'I couldn\'t find information about that specific vulnerability. Try asking about SQL Injection, XSS, CSRF, Command Injection, RCE, LFI, XXE, or SSRF.',
        confidence: 0.3,
        sources: [],
        relatedTopics: this.knowledgeBase.getAllVulnerabilityTypes().slice(0, 5)
      };
    }

    let fullAnswer = '';
    const sources: string[] = [];

    vulnerabilities.forEach((vulnType, index) => {
      const vuln = this.knowledgeBase.getVulnerability(vulnType);
      if (vuln) {
        fullAnswer += `\n**${vuln.type}**\n${vuln.description}\n`;
        fullAnswer += `\nExamples: ${vuln.examples.slice(0, 2).join(', ')}\n`;
        fullAnswer += `Severity: ${vuln.severity.toUpperCase()}\n`;
        fullAnswer += `Remediation: ${vuln.remediation}\n`;
        sources.push(vulnType);

        if (index < vulnerabilities.length - 1) {
          fullAnswer += '\n---\n';
        }
      }
    });

    const relatedTopics = vulnerabilities
      .flatMap(type => this.knowledgeBase.getRelatedTopics(type))
      .filter(t => !vulnerabilities.includes(t))
      .slice(0, 3);

    return {
      answer: fullAnswer,
      confidence: Math.min(0.95, 0.7 + vulnerabilities.length * 0.1),
      sources,
      relatedTopics
    };
  }

  /**
   * Handle CVE lookup questions
   */
  private handleCVEQuestion(keywords: string[], query: string): any {
    const searchTerm = keywords.join(' ') || query;
    const cves = this.knowledgeBase.searchCVEs(searchTerm);

    if (cves.length === 0) {
      return {
        answer: 'No CVEs found matching that search. Known CVEs include: CVE-2021-44228 (Log4j), CVE-2017-5638 (Struts), CVE-2018-8999 (ColdFusion)',
        confidence: 0.4,
        sources: []
      };
    }

    let answer = `Found ${cves.length} CVE(s):\n\n`;
    cves.forEach((cve, index) => {
      answer += `**${cve.id}** - CVSS ${cve.cvss}\n`;
      answer += `Software: ${cve.affected_software.join(', ')}\n`;
      answer += `Description: ${cve.description}\n`;
      answer += `Exploitation Difficulty: ${cve.exploitation_difficulty}\n`;
      answer += `Impact: ${cve.impact}\n`;
      answer += `Mitigation: ${cve.mitigation}\n`;

      if (index < cves.length - 1) {
        answer += '\n---\n';
      }
    });

    return {
      answer,
      confidence: 0.9,
      sources: cves.map(c => c.id)
    };
  }

  /**
   * Handle exploit-related questions
   */
  private handleExploitQuestion(keywords: string[], query: string): any {
    // Find vulnerabilities that might have exploits
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw)));

    if (vulnerabilities.length === 0) {
      return {
        answer: 'Exploit information is available for: SQL Injection, XSS, Command Injection, RCE, XXE, SSRF. Please specify a vulnerability type.',
        confidence: 0.3,
        sources: []
      };
    }

    let answer = 'Exploit Information:\n\n';

    vulnerabilities.forEach((vulnType, index) => {
      const vuln = this.knowledgeBase.getVulnerability(vulnType);
      if (vuln && vuln.examples && vuln.examples.length > 0) {
        answer += `**${vuln.type}**\n`;
        answer += 'Example payloads:\n';
        vuln.examples.forEach(ex => {
          answer += `- \`${ex}\`\n`;
        });
        answer += `Detection: ${vuln.detection_methods.slice(0, 2).join(', ')}\n`;

        if (index < vulnerabilities.length - 1) {
          answer += '\n';
        }
      }
    });

    return {
      answer,
      confidence: 0.85,
      sources: vulnerabilities
    };
  }

  /**
   * Handle mitigation/remediation questions
   */
  private handleMitigationQuestion(keywords: string[], query: string): any {
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw) || kw.includes(type.substring(0, 3))));

    if (vulnerabilities.length === 0) {
      return {
        answer: 'To provide mitigation advice, specify a vulnerability type: SQL Injection, XSS, CSRF, Command Injection, RCE, LFI, XXE, or SSRF.',
        confidence: 0.2,
        sources: []
      };
    }

    let answer = 'Mitigation Strategies:\n\n';

    vulnerabilities.forEach(vulnType => {
      const vuln = this.knowledgeBase.getVulnerability(vulnType);
      if (vuln) {
        answer += `**${vuln.type}**\n`;
        answer += `${vuln.remediation}\n\n`;
      }
    });

    return {
      answer,
      confidence: 0.9,
      sources: vulnerabilities
    };
  }

  /**
   * Handle HackerOne program questions
   */
  private handleHackerOneQuestion(keywords: string[], query: string): any {
    // First, find applicable programs for vulnerability types
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw)));

    if (vulnerabilities.length > 0) {
      const programs = vulnerabilities
        .flatMap(type => this.knowledgeBase.getApplicablePrograms(type))
        .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i); // Deduplicate

      if (programs.length > 0) {
        let answer = `HackerOne programs that accept ${vulnerabilities.join(', ')} reports:\n\n`;
        programs.forEach(program => {
          answer += `**${program.name}** (ID: ${program.id})\n`;
          answer += `Bounty Range: $${program.bounty_range[0]} - $${program.bounty_range[1]}\n`;
          answer += `Response Target: ${program.response_target_days} days\n`;
          answer += `Scope: ${program.scope.slice(0, 2).join(', ')}\n\n`;
        });

        return {
          answer,
          confidence: 0.95,
          sources: programs.map(p => `program:${p.id}`)
        };
      }
    }

    return {
      answer: 'No specific programs found for that vulnerability type. Major programs include Google, Microsoft, and Facebook.',
      confidence: 0.4,
      sources: []
    };
  }

  /**
   * Handle general questions
   */
  private handleGeneralQuestion(keywords: string[], query: string): string {
    const vulnerabilityTypes = this.knowledgeBase.getAllVulnerabilityTypes();
    const relevantTypes = vulnerabilityTypes.filter(type =>
      keywords.some(kw => type.includes(kw) || kw.includes(type.substring(0, 3)))
    );

    if (relevantTypes.length > 0) {
      return `I can help you understand security vulnerabilities. I have information about: ${relevantTypes.join(', ')}. Please ask a specific question about any of these.`;
    }

    return `I'm specialized in security questions. I can help with: vulnerability types, CVEs, exploitation techniques, mitigation strategies, and HackerOne programs. What would you like to know?`;
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(intent: string, keywords: string[]): string[] {
    const questions: string[] = [];

    if (intent === 'explain-vulnerability') {
      questions.push('How can I test for this vulnerability?');
      questions.push('What are the best mitigation strategies?');
    } else if (intent === 'exploit-info') {
      questions.push('How can I detect this attack?');
      questions.push('What are the impact of this vulnerability?');
    } else if (intent === 'mitigation') {
      questions.push('Are there any automated tools for testing?');
      questions.push('What severity level is this vulnerability?');
    }

    return questions.slice(0, 2);
  }
}

export const knowledgeQAEngine = new KnowledgeQAEngine();
