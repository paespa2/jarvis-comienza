/**
 * RESPONSE VARIATION ENGINE
 *
 * Provides multiple response variations for each topic
 * to ensure Jarvis never gives the exact same response twice.
 */

export class ResponseVariationEngine {
  private variations: Map<string, string[]> = new Map();

  constructor() {
    this.loadVariations();
  }

  /**
   * Get all variations for a topic
   */
  getVariations(topic: string): string[] {
    return this.variations.get(topic.toLowerCase()) || this.getDefaultVariations(topic);
  }

  /**
   * Select random variation from topic
   */
  selectRandom(topic: string): string {
    const variations = this.getVariations(topic);
    if (variations.length === 0) return "";
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Select random with weighting (preferred variations picked more often)
   */
  selectWeighted(topic: string, weights?: number[]): string {
    const variations = this.getVariations(topic);
    if (variations.length === 0) return "";

    if (!weights || weights.length !== variations.length) {
      return this.selectRandom(topic);
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < variations.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return variations[i];
      }
    }

    return variations[variations.length - 1];
  }

  /**
   * Add new variation (for learning/improvement)
   */
  addVariation(topic: string, variation: string): void {
    const key = topic.toLowerCase();
    if (!this.variations.has(key)) {
      this.variations.set(key, []);
    }
    this.variations.get(key)!.push(variation);
  }

  /**
   * Get diversity score (0-1) for a topic
   * Higher = more varied responses
   */
  getDiversityScore(topic: string): number {
    const variations = this.getVariations(topic);
    // More variations = higher diversity
    // 10+ variations = 1.0 (perfect)
    return Math.min(variations.length / 10, 1.0);
  }

  /**
   * Private: Load default variations
   */
  private loadVariations(): void {
    // SQL Injection variations
    this.variations.set("sql-injection", [
      "SQL injection is one of the most dangerous web vulnerabilities. Here's how it works...",
      "Let me explain SQL injection in a way that makes sense. Picture a login form...",
      "SQL injection exploits the way databases process user input. Think of it like this...",
      "Imagine an attacker can directly manipulate your database queries. That's SQL injection...",
      "The core issue with SQL injection is trusting user input too much. Here's why that's dangerous...",
      "SQL injection reveals a fundamental security principle: never trust user input. Here's the proof...",
      "Before diving in, what's your understanding of how login forms work? That'll help me explain SQL injection better...",
      "SQL injection is fascinating from a security perspective. Let me show you both the vulnerability and the fix...",
      "The mechanics of SQL injection are pretty straightforward once you understand database queries...",
      "Here's a real-world example that illustrates exactly how SQL injection works..."
    ]);

    // XSS variations
    this.variations.set("xss", [
      "Cross-Site Scripting (XSS) is about injecting malicious code into web pages. Here's how...",
      "XSS lets attackers run code in other users' browsers. Picture this scenario...",
      "Think of XSS as breaking the trust between a website and its users. Here's the mechanism...",
      "XSS vulnerabilities come in three types: stored, reflected, and DOM-based. Let me break each down...",
      "The dangerous part of XSS is that users might not even know they're being attacked. Here's why...",
      "XSS demonstrates why filtering user input is critical. Let me show you how...",
      "Before explaining XSS, consider: how does a browser decide whether to run code? That's the key...",
      "XSS is one of the most common web vulnerabilities. Let me show you the mechanics and fixes...",
      "Imagine an attacker can inject code into a page you trust. That's XSS in a nutshell...",
      "The principle behind XSS is simple: malicious input becomes executed code. Here's the process..."
    ]);

    // Authentication variations
    this.variations.set("authentication", [
      "Authentication is how systems verify you are who you claim to be. Here's the landscape...",
      "Let me explain the different authentication methods and their tradeoffs...",
      "Authentication has evolved significantly. Here's a journey through the main approaches...",
      "Password-based auth has many weaknesses. Let me show you the alternatives...",
      "Think of authentication as the gatekeeper to your system. Here's how to do it right...",
      "The security of your authentication directly impacts everything else. Here's why...",
      "Before we dive in, what authentication methods do you currently use? That context helps...",
      "Authentication seems simple but has hidden complexity. Let me break it down...",
      "Multi-factor authentication has become essential. Here's why and how it works...",
      "The best authentication method depends on your threat model. Let me help you choose..."
    ]);

    // Vulnerability Testing variations
    this.variations.set("vulnerability-testing", [
      "Penetration testing follows a systematic methodology. Here's the standard approach...",
      "Let me walk you through the phases of a proper security assessment...",
      "Vulnerability testing isn't just running tools - it requires strategy. Here's the process...",
      "Think of penetration testing as a structured attack. Here's the framework...",
      "The best penetration testers combine tools with critical thinking. Here's how...",
      "A proper security assessment has clear phases and objectives. Here's the breakdown...",
      "Before testing, what's your scope and objectives? That determines the approach...",
      "Vulnerability testing is both art and science. Let me show you both sides...",
      "The most effective penetration tests follow NIST or OWASP frameworks. Here's why...",
      "Penetration testing uncovers real-world attack paths. Here's the methodology..."
    ]);

    // General Security variations
    this.variations.set("security-principles", [
      "Security comes down to a few core principles. Let me break them down...",
      "The foundation of security is understanding the threat model. Here's what that means...",
      "Security isn't about perfect defense - it's about reducing risk. Here's the philosophy...",
      "The best security comes from understanding how attacks work. That's where we start...",
      "Think of security in layers - multiple defenses are stronger than one. Here's why...",
      "Security requires balancing protection with usability. Here's how to think about it...",
      "Before implementing security, what threats are you protecting against? That's crucial...",
      "Security principles have remained consistent despite changing technology. Here's why...",
      "The biggest security gaps are usually in implementation, not theory. Here's what I mean...",
      "Security is a mindset. Once you understand the thinking, everything makes sense..."
    ]);

    // Exploitation variations
    this.variations.set("exploitation", [
      "Exploitation is the process of turning a vulnerability into a working attack. Here's how...",
      "Let me explain the difference between a vulnerability and an exploit...",
      "Exploiting a vulnerability requires understanding both the flaw and the system. Here's the technique...",
      "Think of exploitation as translating theory into practice. Here's the process...",
      "The most effective exploits are often the simplest ones. Here's why and how...",
      "Exploitation requires patience and methodical testing. Here's the approach...",
      "Before writing an exploit, what's your target and goal? That determines the technique...",
      "Exploitation is both about technical skill and creative thinking. Here's the balance...",
      "The hardest part of exploitation is often dealing with protections and filters. Here's how...",
      "Successful exploitation requires understanding the target deeply. Here's what that means..."
    ]);

    // Privilege Escalation variations
    this.variations.set("privilege-escalation", [
      "Privilege escalation is moving from low to high permissions. Here's how it works...",
      "Let me explain the difference between horizontal and vertical privilege escalation...",
      "Privilege escalation often exploits configuration mistakes. Here are the common ones...",
      "Think of privilege escalation as finding the path from user to admin. Here's the logic...",
      "The most dangerous privilege escalation vulnerabilities are often overlooked. Here's why...",
      "Privilege escalation requires understanding the operating system deeply. Here's what I mean...",
      "Before attempting escalation, what information do you have? That determines the approach...",
      "Privilege escalation can be automatic or manual. Here's when to use each...",
      "The kernel is often the target for privilege escalation. Here's why and how...",
      "Successful privilege escalation requires combining multiple techniques. Here's the strategy..."
    ]);

    // Web Security variations
    this.variations.set("web-security", [
      "Web security threats are evolving constantly. Here's the current landscape...",
      "Let me break down the major web security vulnerabilities (OWASP Top 10)...",
      "Web applications are challenging to secure. Here's why and the solutions...",
      "Think of web security as defending multiple attack surfaces. Here's the breakdown...",
      "The most common web vulnerabilities often stem from simple mistakes. Here's what to watch for...",
      "Web security requires both frontend and backend knowledge. Here's the full picture...",
      "Before securing a web app, what's your threat model? That drives the strategy...",
      "Web security frameworks help but can't replace understanding. Here's the right approach...",
      "Client-side security is often overlooked but critical. Here's why...",
      "API security is the new frontier for web security. Here's what you need to know..."
    ]);

    // Network Security variations
    this.variations.set("network-security", [
      "Network security operates at multiple layers. Here's the OSI model perspective...",
      "Let me explain how network-level attacks work and how to defend...",
      "Network security has both defensive and detection aspects. Here's the balance...",
      "Think of network security as controlling who can talk to what. Here's the mechanism...",
      "The best network security combines prevention and detection. Here's how...",
      "Network segmentation is more powerful than most realize. Here's why...",
      "Before implementing network security, what's your topology? That determines the approach...",
      "Network security tools are essential but need proper configuration. Here's what matters...",
      "Encryption at the network level provides important defense. Here's how it works...",
      "Network-level attacks are often overlooked in favor of application attacks. Here's why that's risky..."
    ]);

    // Cryptography variations
    this.variations.set("cryptography", [
      "Cryptography secures data in motion and at rest. Here's how...",
      "Let me explain the difference between symmetric and asymmetric encryption...",
      "Cryptography is necessary but insufficient for security. Here's what I mean...",
      "Think of cryptography as scrambling data so only the right person can unscramble it. Here's the theory...",
      "The most important thing about cryptography is using it correctly. Here's what to avoid...",
      "Cryptographic algorithms are constantly being analyzed and improved. Here's the state of the art...",
      "Before choosing a crypto algorithm, what are you protecting and from whom? That's crucial...",
      "Cryptography has become more accessible but easier to misuse. Here's the right way...",
      "Hash functions are different from encryption - here's the critical distinction...",
      "Key management is often the weakest part of cryptography. Here's how to do it right..."
    ]);

    // Cloud Security variations
    this.variations.set("cloud-security", [
      "Cloud security is shared responsibility between provider and customer. Here's the model...",
      "Let me explain the security considerations specific to cloud environments...",
      "Cloud security threats are different from traditional infrastructure. Here's why...",
      "Think of cloud security as securing a distributed system. Here's the approach...",
      "The most dangerous cloud misconfigurations are surprisingly common. Here's what to watch...",
      "Cloud security requires understanding your provider's security model. Here's what to ask...",
      "Before moving to the cloud, what are your security requirements? That determines the architecture...",
      "Cloud security tools and practices are maturing quickly. Here's the current state...",
      "Cloud-native security requires different thinking than traditional security. Here's what's different...",
      "The cloud's flexibility is also its security challenge. Here's how to manage that..."
    ]);
  }

  /**
   * Get default variations for any topic (fallback)
   */
  private getDefaultVariations(topic: string): string[] {
    return [
      `Here's how ${topic} works:`,
      `Let me explain ${topic} in a way that makes sense:`,
      `Think of ${topic} like this:`,
      `The key insight about ${topic} is:`,
      `What's really happening with ${topic} is:`,
      `Picture this scenario with ${topic}:`,
      `Imagine you're dealing with ${topic}...`,
      `${topic} is fascinating from a security perspective:`,
      `The mechanics of ${topic} are straightforward once you understand:`,
      `Here's a real-world example that illustrates ${topic}:`
    ];
  }

  /**
   * Get statistics
   */
  getStats(): {
    topicsWithVariations: number;
    totalVariations: number;
    averagePerTopic: number;
  } {
    let totalVariations = 0;
    for (const variations of this.variations.values()) {
      totalVariations += variations.length;
    }

    return {
      topicsWithVariations: this.variations.size,
      totalVariations,
      averagePerTopic: this.variations.size > 0 ? totalVariations / this.variations.size : 0
    };
  }
}

// Export singleton
export const responseVariationEngine = new ResponseVariationEngine();
