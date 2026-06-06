import React from 'react';

interface WeatherBadgeProps {
  condition: string;
  tempMax: number;
  tempMin?: number;
  rainChance: number;
  icon?: string;
  date?: string;
  compact?: boolean;
}

const CONDITION_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Clear':        { emoji: '☀️', color: 'text-amber-700', bg: 'bg-amber-50',    border: 'border-amber-200' },
  'Clouds':       { emoji: '⛅', color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200' },
  'Rain':         { emoji: '🌧️', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  'Drizzle':      { emoji: '🌦️', color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  'Thunderstorm': { emoji: '⛈️', color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200' },
  'Snow':         { emoji: '❄️', color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-200' },
  'Mist':         { emoji: '🌫️', color: 'text-slate-500',  bg: 'bg-slate-100',  border: 'border-slate-200' },
  'Haze':         { emoji: '🌫️', color: 'text-slate-500',  bg: 'bg-slate-100',  border: 'border-slate-200' },
};

export default function WeatherBadge({ condition, tempMax, tempMin, rainChance, icon, date, compact = false }: WeatherBadgeProps) {
  const meta = CONDITION_META[condition] || { emoji: '🌤️', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}>
        <span>{meta.emoji}</span>
        <span>{tempMax}°C</span>
        {rainChance > 30 && <span className="text-blue-500">💧{rainChance}%</span>}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${meta.bg} ${meta.border}`}>
      <span className="text-3xl">{meta.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${meta.color}`}>{condition}</span>
          {date && <span className="text-[10px] text-slate-400">{date}</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-lg font-black text-slate-800">{tempMax}°</span>
          {tempMin !== undefined && <span className="text-sm text-slate-400">{tempMin}°</span>}
          {rainChance > 0 && (
            <span className="text-xs text-blue-500 font-medium">💧 {rainChance}% rain</span>
          )}
        </div>
      </div>
    </div>
  );
}
