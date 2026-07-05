import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Fila de lista táctil (conversaciones, conductores, documentos):
 * leading (avatar/icono) + contenido + trailing (hora/badge/chevron).
 * Altura mínima 56px para target táctil cómodo.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex w-full min-h-14 items-center gap-3 px-4 py-2.5 text-left transition-colors',
        onClick &&
          'hover:bg-white/5 active:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-yellow/60',
        className
      )}
    >
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        {subtitle && <p className="truncate text-xs text-white/50">{subtitle}</p>}
      </div>
      {trailing && <div className="flex-shrink-0 text-xs text-white/50">{trailing}</div>}
    </Comp>
  );
}
