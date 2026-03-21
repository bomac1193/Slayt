import React, { useMemo } from 'react';

/**
 * GridAestheticScore - Minimal grid aesthetic score display
 */
const GridAestheticScore = ({ gridItems = [], columns = 3 }) => {
  // Calculate aesthetic score
  const scoreData = useMemo(() => {
    if (!gridItems || gridItems.length === 0) {
      return {
        overallScore: 0,
        avgConviction: 0,
        archetypeConsistency: 0,
        visualFlow: 0,
        breakdown: []
      };
    }

    // Filter items with conviction data
    const itemsWithConviction = gridItems.filter(
      item => item.conviction?.score !== null && item.conviction?.score !== undefined
    );

    if (itemsWithConviction.length === 0) {
      return {
        overallScore: 0,
        avgConviction: 0,
        archetypeConsistency: 0,
        visualFlow: 0,
        breakdown: []
      };
    }

    // 1. Average conviction score
    const avgConviction = Math.round(
      itemsWithConviction.reduce((sum, item) => sum + item.conviction.score, 0) / itemsWithConviction.length
    );

    // 2. Archetype consistency
    const archetypes = itemsWithConviction
      .map(item => item.conviction?.archetypeMatch?.designation)
      .filter(Boolean);

    let archetypeConsistency = 0;
    if (archetypes.length > 0) {
      const counts = {};
      archetypes.forEach(arch => {
        counts[arch] = (counts[arch] || 0) + 1;
      });
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      archetypeConsistency = Math.round((mostCommon[1] / archetypes.length) * 100);
    }

    // 3. Visual flow
    const adjacentPairs = getAdjacentPairs(itemsWithConviction, columns);
    const flowScore = adjacentPairs.length > 0
      ? adjacentPairs.filter(([i1, i2]) => {
          if (!i1?.conviction?.score || !i2?.conviction?.score) return false;
          return Math.abs(i1.conviction.score - i2.conviction.score) < 20;
        }).length / adjacentPairs.length
      : 0;

    const visualFlow = Math.round(flowScore * 100);

    // 4. Calculate weighted overall score
    const overallScore = Math.round(
      avgConviction * 0.5 +
      archetypeConsistency * 0.3 +
      visualFlow * 0.2
    );

    // Generate breakdown
    const breakdown = [
      { label: 'Conviction', score: avgConviction, weight: 50 },
      { label: 'Consistency', score: archetypeConsistency, weight: 30 },
      { label: 'Flow', score: visualFlow, weight: 20 }
    ];

    return {
      overallScore,
      avgConviction,
      archetypeConsistency,
      visualFlow,
      breakdown
    };
  }, [gridItems, columns]);

  const getScoreColor = () => 'text-dark-100';

  return (
    <div>
      {/* Overall Score */}
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-dark-700/50">
        <span className={`text-lg font-light tabular-nums font-sans ${getScoreColor(scoreData.overallScore)}`}>
          {scoreData.overallScore}
        </span>
        <span className="text-[8px] text-dark-600 font-sans tracking-[0.1em]">/ 100</span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5">
        {scoreData.breakdown.map((item, index) => (
          <div key={index}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[9px] text-dark-400 font-sans tracking-wide">{item.label}</span>
              <span className="text-[10px] text-dark-300 tabular-nums font-sans">{item.score}</span>
            </div>
            <div className="w-full h-px bg-dark-800 overflow-hidden">
              <div
                className="h-full bg-dark-400 transition-all duration-500"
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get adjacent pairs in grid
function getAdjacentPairs(items, columns) {
  const pairs = [];

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    // Right neighbor
    if (col < columns - 1 && items[index + 1]) {
      pairs.push([item, items[index + 1]]);
    }

    // Bottom neighbor
    if (row < Math.floor(items.length / columns) && items[index + columns]) {
      pairs.push([item, items[index + columns]]);
    }
  });

  return pairs;
}

export default GridAestheticScore;
