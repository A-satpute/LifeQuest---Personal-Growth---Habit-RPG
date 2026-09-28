import React, { useState } from 'react';
import type { CharacterStage, CharacterStats } from '../../types/gamification';
import { getCharacterAppearance, type CharacterGender } from '../../services/characterProgression';
import { Sparkles, Shield, Trophy } from 'lucide-react';

interface CharacterAvatarProps {
  gender?: CharacterGender | string;
  stage?: CharacterStage;
  level?: number;
  stats?: CharacterStats;
  currentStreak?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBadge?: boolean;
  showArchetype?: boolean;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  gender = 'MALE',
  level = 1,
  stats,
  currentStreak = 0,
  size = 'md',
  showBadge = true,
  showArchetype = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const appearance = getCharacterAppearance({
    gender,
    level,
    stats,
    currentStreak,
  });

  // Dimension presets
  const sizeMap = {
    sm: {
      container: 'w-12 h-12',
      badge: 'text-[9px] px-1.5 py-0.2 -bottom-1.5',
      iconSize: 'w-2.5 h-2.5',
    },
    md: {
      container: 'w-24 h-24 sm:w-28 sm:h-28',
      badge: 'text-[11px] px-2.5 py-0.5 -bottom-2',
      iconSize: 'w-3 h-3',
    },
    lg: {
      container: 'w-36 h-36 sm:w-44 sm:h-44',
      badge: 'text-xs px-3 py-1 -bottom-2.5',
      iconSize: 'w-3.5 h-3.5',
    },
    xl: {
      container: 'w-52 h-52 sm:w-64 sm:h-64',
      badge: 'text-xs sm:text-sm px-3.5 py-1 -bottom-3',
      iconSize: 'w-4 h-4',
    },
    '2xl': {
      container: 'w-64 h-64 sm:w-80 sm:h-80',
      badge: 'text-sm px-4 py-1.5 -bottom-3.5',
      iconSize: 'w-4 h-4',
    },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative inline-flex flex-col items-center select-none group ${className}`}>
      {/* Outer ambient glow & RPG frame */}
      <div
        className={`relative ${dim.container} rounded-3xl p-1.5 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/80 border ${appearance.borderColor} shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-105`}
        style={{
          boxShadow: `0 0 30px ${appearance.glowColor}, inset 0 0 20px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Background Aura Gradients */}
        <div
          className="absolute inset-0 opacity-40 blur-xl pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 40%, ${appearance.glowColor}, transparent 70%)` }}
        />

        {/* Master Celestial Rings for Level 10+ */}
        {appearance.stageLevel >= 5 && (
          <div className="absolute inset-0 border-2 border-amber-400/40 rounded-3xl animate-pulse pointer-events-none" />
        )}

        {/* 3D Character Image Render */}
        {!imageError ? (
          <img
            src={appearance.imageSrc}
            alt={`${appearance.archetype} (${appearance.gender})`}
            className="w-full h-full object-cover object-top rounded-2xl relative z-10 transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback if image path fails */
          <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 flex flex-col items-center justify-center text-center p-3 relative z-10">
            <Shield className="w-10 h-10 text-indigo-400 mb-1" />
            <span className="text-xs font-bold text-white">{appearance.archetype}</span>
            <span className="text-[10px] text-indigo-300">Level {level}</span>
          </div>
        )}

        {/* Stage Corner Icon Indicator */}
        <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 flex items-center justify-center shadow-lg">
          {appearance.stageLevel >= 5 ? (
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </div>
      </div>

      {/* Floating Level / Stage Badge */}
      {showBadge && (
        <span
          className={`absolute ${dim.badge} font-bold rounded-full border backdrop-blur-md shadow-xl z-20 flex items-center gap-1.5 whitespace-nowrap bg-slate-950/90 text-white ${appearance.borderColor}`}
        >
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-ping" />
          <span>Lv.{level}</span>
          <span className="text-slate-400 font-normal">•</span>
          <span className="text-indigo-300 font-semibold">{appearance.stageName}</span>
        </span>
      )}

      {/* Optional Archetype Tagline */}
      {showArchetype && (
        <div className="mt-3 text-center">
          <p className="text-xs font-extrabold text-white tracking-wide">{appearance.archetype}</p>
          <p className="text-[10px] text-slate-400 font-medium">{appearance.focusTitle}</p>
        </div>
      )}
    </div>
  );
};
