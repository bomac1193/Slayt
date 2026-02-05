/**
 * ADVANCED Conviction Stress Tests
 * Testing extreme edge cases, attack vectors, and long-term robustness
 */

const convictionService = require('../src/services/convictionService');

// ============================================================
// EXTREME EDGE CASES
// ============================================================

const extremeEdgeCases = [
  {
    name: 'All Zeros Attack',
    scenario: 'Completely empty content with no data',
    content: {
      aiScores: {
        viralityScore: 0,
        engagementScore: 0,
        aestheticScore: 0,
        trendScore: 0
      },
      analysis: {
        aestheticDNA: {},
        performanceDNA: {}
      }
    },
    userGenome: null,
    expectedConvictionRange: [15, 30],
    criticalCheck: 'System must not crash, should return minimal viable score'
  },

  {
    name: 'Perfect Score Gaming',
    scenario: 'User sets all scores to 100 (vanity metric attack)',
    content: {
      aiScores: {
        viralityScore: 100,
        engagementScore: 100,
        aestheticScore: 100,
        trendScore: 100
      },
      analysis: {
        aestheticDNA: {
          tone: [],
          voice: '',
          style: []
        },
        performanceDNA: {
          hooks: [],
          structure: ''
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'S-0',
          glyph: 'KETH',
          confidence: 0.30, // Low confidence
          creativeMode: 'Visionary'
        }
      },
      confidence: 0.25
    },
    expectedConvictionRange: [50, 70],
    criticalCheck: 'Must penalize fake perfection - taste score should be low'
  },

  {
    name: 'Trend Bomb (99/100)',
    scenario: 'Extreme trend-chasing content',
    content: {
      aiScores: {
        viralityScore: 70,
        engagementScore: 68,
        aestheticScore: 60,
        trendScore: 99 // EXTREME trend dependency
      },
      analysis: {
        aestheticDNA: {
          tone: ['trendy', 'copycat'],
          voice: 'generic',
          style: ['viral-template']
        },
        performanceDNA: {
          hooks: ['trending-audio', 'trending-filter'],
          structure: 'trend-clone'
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'C-4',
          glyph: 'CULL',
          confidence: 0.88,
          creativeMode: 'Editorial'
        }
      },
      confidence: 0.85
    },
    expectedConvictionRange: [45, 60],
    criticalCheck: 'Temporal factor must penalize heavily (92% multiplier at trend=99)'
  },

  {
    name: 'Schizophrenic Signals',
    scenario: 'Conflicting data - high performance but user hates this style',
    content: {
      aiScores: {
        viralityScore: 85,
        engagementScore: 82,
        aestheticScore: 88,
        trendScore: 60
      },
      analysis: {
        aestheticDNA: {
          tone: ['minimalist', 'refined'],
          voice: 'quiet',
          style: ['subtle']
        },
        performanceDNA: {
          hooks: ['visual', 'aesthetic'],
          structure: 'slow-burn'
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'H-6',
          glyph: 'TOLL',
          confidence: 0.92,
          creativeMode: 'Advocacy' // Opposite of minimalist
        }
      },
      confidence: 0.88,
      signals: [
        { type: 'skip', value: 'minimalist-content-1', timestamp: new Date() },
        { type: 'skip', value: 'minimalist-content-2', timestamp: new Date() },
        { type: 'skip', value: 'minimalist-content-3', timestamp: new Date() }
      ]
    },
    expectedConvictionRange: [55, 70],
    criticalCheck: 'Taste mismatch should lower conviction despite high performance'
  },

  {
    name: 'New Artist Cold Start',
    scenario: 'First content ever, no genome, no history',
    content: {
      aiScores: {
        viralityScore: 65,
        engagementScore: 60,
        aestheticScore: 70,
        trendScore: 55
      },
      analysis: {
        aestheticDNA: {
          tone: ['authentic'],
          voice: 'personal',
          style: ['raw']
        },
        performanceDNA: {
          hooks: ['story'],
          structure: 'simple'
        }
      }
    },
    userGenome: null,
    expectedConvictionRange: [58, 68],
    criticalCheck: 'Must give reasonable score to enable first post without penalizing newbies'
  },

  {
    name: 'Archetype Evolution Conflict',
    scenario: 'User evolved from one archetype to another, old content scored',
    content: {
      aiScores: {
        viralityScore: 75,
        engagementScore: 72,
        aestheticScore: 78,
        trendScore: 50
      },
      analysis: {
        aestheticDNA: {
          tone: ['bold', 'innovative'], // S-0 Visionary style
          voice: 'confident',
          style: ['visionary']
        },
        performanceDNA: {
          hooks: ['surprise'],
          structure: 'layered'
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'L-3', // Patient Cultivator (opposite of Visionary)
          glyph: 'SILT',
          confidence: 0.85,
          creativeMode: 'Developmental'
        },
        secondary: {
          designation: 'S-0', // Former archetype
          confidence: 0.25,
          creativeMode: 'Visionary'
        }
      },
      confidence: 0.80
    },
    expectedConvictionRange: [60, 75],
    criticalCheck: 'Should partially recognize secondary archetype match'
  },

  {
    name: 'Override Abuse Pattern',
    scenario: 'User overrode last 10 low-conviction posts',
    content: {
      aiScores: {
        viralityScore: 42,
        engagementScore: 38,
        aestheticScore: 45,
        trendScore: 35
      },
      analysis: {
        aestheticDNA: {
          tone: [],
          voice: '',
          style: []
        },
        performanceDNA: {
          hooks: [],
          structure: ''
        }
      },
      conviction: {
        userOverride: true,
        overrideReason: 'I know better #10'
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'F-9',
          glyph: 'ANVIL',
          confidence: 0.65,
          creativeMode: 'Manifestation'
        }
      },
      confidence: 0.60
    },
    overrideHistory: [
      { score: 45, overridden: true },
      { score: 41, overridden: true },
      { score: 48, overridden: true },
      { score: 39, overridden: true },
      { score: 44, overridden: true },
      { score: 46, overridden: true },
      { score: 40, overridden: true },
      { score: 43, overridden: true },
      { score: 47, overridden: true },
      { score: 38, overridden: true }
    ],
    expectedConvictionRange: [38, 50],
    criticalCheck: 'Should flag pattern abuse (future feature: penalize habitual overriders)'
  },

  {
    name: 'AI Content Detector',
    scenario: 'Generic AI-generated content (future threat)',
    content: {
      aiScores: {
        viralityScore: 78,
        engagementScore: 75,
        aestheticScore: 82,
        trendScore: 72
      },
      analysis: {
        aestheticDNA: {
          tone: ['polished', 'perfect', 'generic'],
          voice: 'ai-generated',
          style: ['template', 'formulaic']
        },
        performanceDNA: {
          hooks: ['generic-hook'],
          structure: 'ai-template'
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'D-8',
          glyph: 'WICK',
          confidence: 0.75,
          creativeMode: 'Channelling'
        }
      },
      confidence: 0.70
    },
    expectedConvictionRange: [60, 75],
    criticalCheck: 'Should detect AI-generic patterns (creative integrity metric needed)'
  },

  {
    name: 'Cross-Platform Mismatch',
    scenario: 'Instagram content scored for TikTok (format incompatibility)',
    content: {
      aiScores: {
        viralityScore: 80,
        engagementScore: 75,
        aestheticScore: 88,
        trendScore: 50
      },
      analysis: {
        aestheticDNA: {
          tone: ['polished', 'aesthetic', 'curated'],
          voice: 'instagram-native',
          style: ['grid-optimized', 'square-format']
        },
        performanceDNA: {
          hooks: ['carousel', 'swipe'],
          structure: 'multi-slide'
        }
      },
      platform: 'tiktok', // But content is IG-optimized
      metadata: {
        aspectRatio: '1:1' // Square, not vertical
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'S-0',
          glyph: 'KETH',
          confidence: 0.85,
          creativeMode: 'Visionary'
        }
      },
      confidence: 0.82
    },
    expectedConvictionRange: [60, 75],
    criticalCheck: 'Should penalize platform format mismatch (future: platform-specific weights)'
  },

  {
    name: 'Viral But Off-Brand',
    scenario: 'Content will go viral but damages brand long-term',
    content: {
      aiScores: {
        viralityScore: 95, // EXTREMELY viral
        engagementScore: 92,
        aestheticScore: 60, // But low quality
        trendScore: 88
      },
      analysis: {
        aestheticDNA: {
          tone: ['clickbait', 'sensational'],
          voice: 'aggressive',
          style: ['controversial']
        },
        performanceDNA: {
          hooks: ['rage-bait', 'controversy'],
          structure: 'divisive'
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'P-7',
          glyph: 'VAULT',
          confidence: 0.90,
          creativeMode: 'Archival' // Refined, knowledgeable, not controversial
        }
      },
      confidence: 0.88
    },
    expectedConvictionRange: [55, 70],
    criticalCheck: 'Must penalize brand damage despite viral potential'
  }
];

// ============================================================
// TEMPORAL DECAY VALIDATION TESTS
// ============================================================

const temporalDecayTests = [
  {
    name: 'Temporal Factor: Trend 0',
    trendScore: 0,
    expectedFactor: 1.0,
    expectedPenalty: '0%'
  },
  {
    name: 'Temporal Factor: Trend 50',
    trendScore: 50,
    expectedFactor: 1.0,
    expectedPenalty: '0% (no penalty under 80)'
  },
  {
    name: 'Temporal Factor: Trend 80',
    trendScore: 80,
    expectedFactor: 1.0,
    expectedPenalty: '0% (threshold)'
  },
  {
    name: 'Temporal Factor: Trend 85',
    trendScore: 85,
    expectedFactor: 0.95,
    expectedPenalty: '5%'
  },
  {
    name: 'Temporal Factor: Trend 90',
    trendScore: 90,
    expectedFactor: 0.90,
    expectedPenalty: '10% (IMPROVED: more aggressive penalty)'
  },
  {
    name: 'Temporal Factor: Trend 95',
    trendScore: 95,
    expectedFactor: 0.90,
    expectedPenalty: '10% (plateau at 90+ due to max cap)'
  },
  {
    name: 'Temporal Factor: Trend 100',
    trendScore: 100,
    expectedFactor: 0.80,
    expectedPenalty: '20% (maximum penalty for extreme trend-chasing)'
  }
];

// ============================================================
// WEIGHT EVOLUTION SIMULATION
// ============================================================

const weightEvolutionTests = {
  current: { performance: 0.3, taste: 0.5, brand: 0.2 },
  year5: { performance: 0.25, taste: 0.55, brand: 0.2 },
  year10: { performance: 0.15, taste: 0.65, brand: 0.2 },
  year20: { performance: 0.05, taste: 0.75, brand: 0.2 },

  testScenario: {
    performance: 80,
    taste: 70,
    brand: 85
  },

  expectedScores: {
    current: 76,   // Current formula: (80×0.3)+(70×0.5)+(85×0.2) = 76
    year5: 74,     // Slight decrease as performance matters less
    year10: 75,    // Taste dominates: (80×0.15)+(70×0.65)+(85×0.2) = 74.5
    year20: 74     // Almost pure taste: (80×0.05)+(70×0.75)+(85×0.2) = 73.5
  }
};

// ============================================================
// ATTACK VECTOR TESTS
// ============================================================

const attackVectors = [
  {
    name: 'Sybil Attack (Fake Genome)',
    scenario: 'User creates fake genome with perfect confidence',
    attack: 'Artificially inflates genome confidence to 1.0',
    content: {
      aiScores: {
        viralityScore: 60,
        engagementScore: 58,
        aestheticScore: 62,
        trendScore: 55
      },
      analysis: {
        aestheticDNA: {
          tone: ['bold'],
          voice: 'confident',
          style: ['visionary']
        },
        performanceDNA: {
          hooks: ['question'],
          structure: 'simple'
        }
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'S-0',
          glyph: 'KETH',
          confidence: 1.0, // FAKE perfect confidence
          creativeMode: 'Visionary'
        }
      },
      confidence: 1.0, // FAKE
      signals: [] // No actual signals
    },
    expectedConvictionRange: [63, 73],
    mitigation: 'Future: Require minimum signal count for high confidence',
    criticalCheck: 'Should work but genome confidence alone shouldn\'t dominate'
  },

  {
    name: 'Score Injection Attack',
    scenario: 'Direct database manipulation of scores',
    attack: 'User modifies MongoDB directly to set scores',
    content: {
      aiScores: {
        viralityScore: 100,
        engagementScore: 100,
        aestheticScore: 100,
        trendScore: 100,
        convictionScore: 100, // INJECTED
        tasteAlignment: 100,  // INJECTED
        brandConsistency: 100 // INJECTED
      },
      analysis: {
        aestheticDNA: {},
        performanceDNA: {}
      }
    },
    userGenome: null,
    expectedConvictionRange: [80, 95],
    mitigation: 'Future: Cryptographic signing of scores, timestamp validation',
    criticalCheck: 'System should recalculate, not trust injected values'
  },

  {
    name: 'Time Travel Attack',
    scenario: 'User sets timestamps in the future',
    attack: 'scheduledFor date is in 2050',
    content: {
      aiScores: {
        viralityScore: 70,
        engagementScore: 68,
        aestheticScore: 72,
        trendScore: 65
      },
      scheduledFor: new Date('2050-01-01'),
      conviction: {
        calculatedAt: new Date('2050-01-01')
      }
    },
    userGenome: {
      archetype: {
        primary: {
          designation: 'V-2',
          glyph: 'OMEN',
          confidence: 0.75,
          creativeMode: 'Prophetic'
        }
      },
      confidence: 0.70
    },
    expectedConvictionRange: [60, 75],
    mitigation: 'Future: Timestamp validation, max scheduling window',
    criticalCheck: 'Should accept but validate timestamp sanity'
  }
];

// ============================================================
// PERFORMANCE DEGRADATION TESTS
// ============================================================

const performanceDegradationTests = [
  {
    name: 'Large Genome (10,000 signals)',
    scenario: 'User has accumulated 10k taste signals',
    genomeSize: 10000,
    expectedCalculationTime: '<100ms',
    criticalCheck: 'Algorithm must remain O(1) or O(log n), not O(n)'
  },
  {
    name: 'Concurrent Calculations',
    scenario: '100 users calculating conviction simultaneously',
    concurrentUsers: 100,
    expectedThroughput: '>50 req/sec',
    criticalCheck: 'No database locking, efficient queries'
  },
  {
    name: 'Missing Data Resilience',
    scenario: 'Content with various null/undefined fields',
    variations: [
      'No aiScores object',
      'No analysis object',
      'No aestheticDNA',
      'No performanceDNA',
      'Partial scores only'
    ],
    expectedBehavior: 'Graceful degradation, no crashes',
    criticalCheck: 'Must handle all null/undefined cases'
  }
];

// ============================================================
// EXPORT TEST SUITE
// ============================================================

module.exports = {
  extremeEdgeCases,
  temporalDecayTests,
  weightEvolutionTests,
  attackVectors,
  performanceDegradationTests,

  // Summary
  summary: {
    totalTests: extremeEdgeCases.length + temporalDecayTests.length + attackVectors.length,
    categories: {
      edgeCases: extremeEdgeCases.length,
      temporal: temporalDecayTests.length,
      attacks: attackVectors.length,
      performance: performanceDegradationTests.length
    },
    criticalChecks: [
      'No system crashes on invalid data',
      'Vanity metric gaming penalized',
      'Temporal decay works correctly',
      'Brand damage detection',
      'Override abuse tracking',
      'Performance scales with large genomes',
      'Attack vectors mitigated'
    ]
  }
};
