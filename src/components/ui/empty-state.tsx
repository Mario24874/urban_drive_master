import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Estado vacío estándar: icono en halo de marca, mensaje y CTA opcional.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-white/60">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
