'use client';

import { cn } from '@/lib/utils';

interface RiskMeterProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  className?: string;
}

export function RiskMeter({ level, className }: RiskMeterProps) {
  const riskConfig = {
    LOW: {
      label: 'Low Risk',
      color: 'bg-emerald-500',
      bars: 1,
      textColor: 'text-emerald-600',
    },
    MEDIUM: {
      label: 'Medium Risk',
      color: 'bg-amber-500',
      bars: 2,
      textColor: 'text-amber-600',
    },
    HIGH: {
      label: 'High Risk',
      color: 'bg-red-500',
      bars: 3,
      textColor: 'text-red-600',
    },
  };

  const config = riskConfig[level];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              'w-1.5 h-4 rounded-sm transition-colors',
              bar <= config.bars ? config.color : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className={cn('text-xs font-medium', config.textColor)}>
        {config.label}
      </span>
    </div>
  );
}
