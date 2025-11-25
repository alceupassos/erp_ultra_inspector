#!/bin/bash

# Deploy rápido via SSH - comandos diretos
VPS="root@147.93.183.55"
DIR="/root/erp_ultra_inspector"

echo "🚀 Deploy Rápido - ERP ULTRA Inspector"
echo "Servidor: $VPS"

# Enviar código
echo "📤 Enviando código..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude '.env*.local' \
  ./ $VPS:$DIR/

# Executar deploy no servidor
echo "🔧 Executando deploy..."
ssh $VPS "cd $DIR && npm ci && npm run build && pm2 restart erp-ultra-inspector || pm2 start ecosystem.config.cjs"

echo "✅ Deploy concluído!"

