# FedFish Integration Strategy for Jarvis

## Overview
FedFish (Federated Learning with Fisher Information) from the paper "Leveraging Function Space Aggregation for Federated Learning at Scale" provides a superior model aggregation approach compared to simple parameter averaging (FedAvg). This document outlines how to apply FedFish to improve Jarvis's Mixture of Experts (MoE) system.

## Problem Statement
Current MoE Implementation:
- Three specialized experts (Security, Methodology, Research)
- Each expert trains independently on domain data
- Simple routing: keyword matching selects best expert for each query
- No sophisticated aggregation of expert knowledge

FedFish Opportunity:
- Expert heterogeneity: Each expert has different data distributions
- Parameter importance varies: Some parameters matter more to each expert's predictions
- Better aggregation: Use Fisher Information to weight expert contributions
- Improved robustness: Resistant to data heterogeneity and longer training

## Key Concepts from FedFish Paper

### Function Space Perspective
Instead of averaging parameters (θG = avg(θi)), match the functions learned:
```
θ*G = arg min Σ D(f(Xi; θ), f(Xi; θi))  for each expert i
```
where D is function space distance (using KL divergence in paper)

### Fisher Information Weighting
Approximate with diagonal Fisher Information:
```
θ*G = (Σ diag(Fi)^T * θi) / (Σ diag(Fi))
```
Each parameter weighted by importance to that expert's predictions

### Advantages Over FedAvg
1. **Heterogeneous Data**: Better handles experts trained on different domains
2. **Longer Training**: Robust to more local epochs (more specialist updates)
3. **Function Matching**: Preserves what each expert learned functionally
4. **Personalization**: Global model better serves as initialization for local fine-tuning

## Jarvis-Specific Implementation Plan

### Phase 1: Fisher Information Tracking (Weeks 1-2)
Track diagonal Fisher Information for each expert during training:
```typescript
interface ExpertFisher {
  expertType: 'security' | 'methodology' | 'research';
  fisherDiagonal: Map<string, number>;  // parameter name → fisher value
  computedAt: number;
  trainingEpochs: number;
}
```

**Changes to ExpertAgent**:
- After each training batch, accumulate squared gradients
- Maintain running average of ||∇L||² for each parameter
- Export as `getFisherDiagonal()` method
- Update stats with fisher metrics

### Phase 2: FedFish Aggregation (Weeks 2-3)
Implement FedFish aggregator at MoE level:
```typescript
class FedFishAggregator {
  async aggregateExpertKnowledge(
    experts: ExpertAgent[],
    userQuery: string
  ): Promise<AggregatedExpertResponse>;
  
  private computeGlobalWeights(
    fishers: ExpertFisher[]
  ): Map<string, number>;  // parameter → weight
  
  private aggregateResponses(
    responses: ExpertResponse[],
    weights: Map<string, number>
  ): string;
  
  private evaluateAggregation(
    aggregated: string,
    originalResponses: ExpertResponse[]
  ): number;  // client-server barrier metric
}
```

**Algorithm**:
1. Get expert responses and Fisher diagonals
2. Compute FedFish weights: w_j = Fisher_j(θ) / Σ Fisher_j(θ)
3. Aggregate expert knowledge weighted by Fisher importance
4. Track "Client-Server Barrier" (CSB) as quality metric

### Phase 3: Adaptive Routing (Week 3-4)
Enhance query routing using Fisher information:
```typescript
class AdaptiveExpertRouter {
  routeQuery(query: string): {
    selectedExpert: ExpertType;
    confidenceInSelection: number;
    alternativeExperts: Array<{expert: ExpertType, score: number}>;
    shouldAggregate: boolean;  // when to use FedFish
  };
  
  private scoreExpertRelevance(
    expert: ExpertAgent,
    query: string,
    fisher: ExpertFisher
  ): number;  // accounts for confidence AND parameter importance
}
```

**Logic**:
- Single expert if confidence > 0.85
- Aggregate with FedFish if 0.5 < confidence ≤ 0.85 (uncertain)
- Force aggregation for novel queries (zero-shot learning)

### Phase 4: Personalization (Week 4+)
Use FedFish-trained global model as better initialization:
```typescript
class PersonalizationEngine {
  async personalizeForDomain(
    domain: string,
    examplesCount: number,
    globalModel: FedFishGlobalModel
  ): SpecializedExpert;
  
  // Compare: FedAvg baseline vs FedFish-trained
  // Expected: 5-7% improvement in few-shot performance
}
```

## Expected Benefits (from FedFish Paper)

### Quantitative
- **Global Accuracy**: 3-5% improvement over simple averaging
- **Post-Personalization**: 5-7% improvement in few-shot learning
- **Robustness**: Stable performance with 2x more training epochs
- **Communication**: Fewer rounds needed for same quality

### Qualitative
- Expert knowledge aggregated by function, not parameters
- Better zero-shot generalization to new domains
- More robust to heterogeneous query distributions
- Framework for multi-expert collaboration

## Compatibility with Existing Systems

### MoE Integration
- Wrapper around current mixtureOfExperts
- Optional: can be toggled for A/B testing
- Backward compatible: original keyword routing still works

### Evolution Engine
- FedFish weights can inform which capabilities to promote
- Parameters with high Fisher scores = important to predictions
- Use for capability selection: promote high-Fisher capabilities

### Wiki System
- Aggregate insights from multiple experts using FedFish
- Function-space synthesis: better consensus across experts

## Measurement Framework

### Client-Server Barrier (CSB) Metric
```typescript
CSB = (1/N) Σ [Global_Model_Loss(data_i) - Expert_Model_Loss(data_i)]
```
- Lower = better aggregation
- Expected: FedFish CSB < FedAvg CSB, especially for heterogeneous data

### Continuous Monitoring
```json
{
  "timestamp": "2024-04-22T15:00:00Z",
  "aggregationMetrics": {
    "expertCount": 3,
    "queriesAggregated": 1250,
    "avgCSB": 0.0342,
    "bestExpertAccuracy": 0.92,
    "aggregatedAccuracy": 0.935,
    "improvementPercent": 1.6
  }
}
```

## Implementation Priority

**MVP (High Priority - Immediate)**:
1. Fisher Information tracking in ExpertAgent
2. Basic FedFish aggregator
3. Integration with POST /api/chat for uncertain cases
4. CSB metric logging

**Enhancement (Medium Priority - 2-3 weeks)**:
1. Adaptive routing based on Fisher scores
2. Personalization engine
3. A/B testing framework
4. Evolution integration

**Advanced (Low Priority - 1 month+)**:
1. Multi-round FedFish (iterative aggregation)
2. K-FAC approximation (higher-order Fisher)
3. Differential privacy integration
4. Cross-domain knowledge transfer

## Code Organization

```
src/core/
├── expertise/
│   ├── MixtureOfExperts.ts (existing)
│   ├── ExpertAgent.ts (enhance with Fisher)
│   └── FedFishAggregator.ts (new)
├── aggregation/
│   ├── FedFishAggregation.ts
│   ├── AdaptiveRouter.ts
│   └── PersonalizationEngine.ts
└── metrics/
    └── ClientServerBarrier.ts
```

## Risk Mitigation

**Complexity Risk**: Start with basic diagonal Fisher only
**Performance Risk**: FedFish adds ~2x communication per round, but reduces total rounds needed
**Integration Risk**: Keep original MoE routing available as fallback

## Success Criteria

- [ ] Fisher Information tracked for all experts
- [ ] FedFish aggregator implemented and tested
- [ ] 3% improvement in uncertain query handling
- [ ] CSB metric < FedAvg baseline
- [ ] Zero regression in existing functionality
- [ ] Can toggle between FedAvg and FedFish for testing

---

**Status**: Detailed design ready for implementation
**Next Step**: Begin Phase 1 (Fisher tracking) with ExpertAgent modifications
