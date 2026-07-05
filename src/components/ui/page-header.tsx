import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Encabezado estándar de pantalla: título display + subtítulo + acción opcional.
 * Única fuente de verdad para la jerarquía tipográfica de páginas internas.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-4 pt-4 pb-3 md:px-6', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold leading-tight text-white truncate">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
