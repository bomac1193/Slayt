import React from 'react';

/**
 * ConvictionBadge - Compact circular conviction score badge
 */
const ConvictionBadge = ({
  score,
  tier,
  size = 'sm',
}) => {
  // Tier-based styling with maximum contrast - darker backgrounds
  const getTierStyles = () => {
    if (!score && score !== 0) {
      return {
        bg: 'bg-gray-900',
        text: 'text-gray-100',
        ring: 'ring-gray-700',
        shadow: 'shadow-black/50'
      };
    }

    if (score >= 70) {
      return {
        bg: 'bg-green-700',
        text: 'text-white',
        ring: 'ring-green-600',
        shadow: 'shadow-green-900/50'
      };
    } else if (score >= 50) {
      return {
        bg: 'bg-orange-700',
        text: 'text-white',
        ring: 'ring-orange-600',
        shadow: 'shadow-orange-900/50'
      };
    } else {
      return {
        bg: 'bg-red-700',
        text: 'text-white',
        ring: 'ring-red-600',
        shadow: 'shadow-red-900/50'
      };
    }
  };

  const styles = getTierStyles();

  // Smaller, sleeker sizes
  const sizeClasses = {
    xs: 'w-5 h-5 text-[11px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  };

  return (
    <div className="flex items-center gap-1">
      <div
        className={`
          ${sizeClasses[size]}
          ${styles.bg}
          ${styles.text}
          rounded-full
          flex items-center justify-center
          ring-2 ${styles.ring}
          font-sans
          font-semibold
          tracking-tight
          shadow-xl ${styles.shadow}
          tabular-nums
        `}
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        {score !== null && score !== undefined ? Math.round(score) : '?'}
      </div>

    </div>
  );
};

export default ConvictionBadge;
