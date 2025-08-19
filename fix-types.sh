#!/bin/bash

# Script para corregir tipos y linting issues automáticamente

echo "🔧 Corrigiendo tipos TypeScript y problemas de linting..."

# Crear tipos globales si no existen
if [ ! -f "src/types/global.d.ts" ]; then
  cat > src/types/global.d.ts << 'EOF'
// Global type definitions
declare global {
  interface Window {
    opera?: string;
  }
}

export {};
EOF
fi

# Corregir automáticamente con ESLint
echo "📝 Aplicando correcciones automáticas de ESLint..."
npx eslint . --fix --ext .ts,.tsx,.js,.jsx 2>/dev/null || true

echo "✅ Correcciones aplicadas"
echo "🔍 Verificando estado actual..."

# Mostrar errores restantes
npm run lint 2>&1 | grep -E "error|warning" | head -20

echo ""
echo "📊 Resumen de errores restantes:"
npm run lint 2>&1 | grep -E "[0-9]+ problems" || echo "Sin errores detectados"