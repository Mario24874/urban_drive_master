import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Métrica de dashboard: cifra protagonista en display, etiqueta secundaria.
 * tone controla el acento (marca, éxito, alerta, peligro).
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const toneClass = {
    default: 'text-brand-yellow',
    success: 'text-brand-green',
    warning: 'text-brand-amber',
    danger: 'text-brand-red',
  }[tone];

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3',
        className
      )}
    >
      {icon && <div className={cn('mt-0.5 flex-shrink-0', toneClass)}>{icon}</div>}
      <div className="min-w-0">
        <p className={cn('font-display text-2xl font-bold leading-none', toneClass)}>{value}</p>
        <p className="mt-1.5 text-xs text-white/60 truncate">{label}</p>
      </div>
    </div>
  );
}
