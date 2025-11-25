#!/bin/bash

echo "🔍 Diagnóstico ERP ULTRA Inspector"
echo "=================================="
echo ""

echo "1. Verificando Node.js..."
node --version || echo "❌ Node.js não encontrado"
echo ""

echo "2. Verificando dependências..."
if [ -d "node_modules" ]; then
  echo "✅ node_modules existe"
else
  echo "❌ node_modules não encontrado - execute: npm install"
fi
echo ""

echo "3. Verificando build..."
if [ -d ".next" ]; then
  echo "✅ .next existe (build feito)"
else
  echo "⚠️  .next não encontrado - execute: npm run build"
fi
echo ""

echo "4. Verificando variáveis de ambiente..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
  echo "✅ Arquivo .env encontrado"
  if grep -q "OPENAI_API_KEY" .env .env.local 2>/dev/null; then
    echo "✅ OPENAI_API_KEY configurado"
  else
    echo "⚠️  OPENAI_API_KEY não encontrado (opcional)"
  fi
else
  echo "⚠️  Arquivo .env não encontrado (pode ser normal)"
fi
echo ""

echo "5. Verificando portas..."
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Porta 3000 em uso"
  lsof -ti:3000 | xargs ps -p
else
  echo "✅ Porta 3000 disponível"
fi
echo ""

echo "6. Testando build..."
npm run build 2>&1 | tail -20
echo ""

echo "7. Verificando erros de lint..."
npm run lint 2>&1 | tail -10
echo ""

echo "8. Verificando servidor (se rodando)..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ Servidor respondendo"
  curl -s http://localhost:3000/api/health | head -1
else
  echo "⚠️  Servidor não está rodando"
  echo "   Execute: npm run dev"
fi
echo ""

echo "=================================="
echo "✅ Diagnóstico concluído"

