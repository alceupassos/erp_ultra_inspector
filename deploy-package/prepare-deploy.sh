#!/bin/bash

# Script para preparar arquivos para deploy manual
# Use quando SSH não estiver acessível

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Preparando arquivos para deploy manual...${NC}"

# Criar diretório de deploy
DEPLOY_DIR="./deploy-package"
rm -rf ${DEPLOY_DIR}
mkdir -p ${DEPLOY_DIR}

echo -e "${YELLOW}📋 Copiando arquivos necessários...${NC}"

# Copiar arquivos importantes (excluindo node_modules, .next, etc)
rsync -av \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'coverage' \
  --exclude '.env*.local' \
  --exclude 'cepalab_integration_bundle.zip' \
  --exclude 'deploy-package' \
  ./ ${DEPLOY_DIR}/

# Criar script de deploy simplificado
cat > ${DEPLOY_DIR}/DEPLOY_INSTRUCTIONS.txt << 'EOF'
# Instruções de Deploy Manual

## 1. Fazer upload dos arquivos para o servidor

Use seu método preferido (FTP, SCP quando SSH funcionar, painel de controle, etc):
- Upload todos os arquivos para: /root/erp_ultra_inspector

## 2. Conectar ao servidor via SSH

ssh root@147.93.183.55

## 3. No servidor, executar:

cd /root/erp_ultra_inspector

# Instalar dependências
npm ci

# Build
npm run build

# Instalar PM2 (se não tiver)
npm install -g pm2

# Configurar Nginx
bash scripts/setup-nginx.sh

# Iniciar aplicação
pm2 start ecosystem.config.cjs
pm2 save

# Verificar status
pm2 status
pm2 logs erp-ultra-inspector
EOF

# Criar arquivo .tar.gz para facilitar upload
echo -e "${YELLOW}📦 Criando arquivo compactado...${NC}"
tar -czf deploy-package.tar.gz -C ${DEPLOY_DIR} .

echo ""
echo -e "${GREEN}✅ Arquivos preparados!${NC}"
echo -e "${BLUE}📁 Diretório: ${DEPLOY_DIR}${NC}"
echo -e "${BLUE}📦 Arquivo compactado: deploy-package.tar.gz${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "   1. Faça upload de 'deploy-package.tar.gz' para o servidor"
echo -e "   2. No servidor: tar -xzf deploy-package.tar.gz -C /root/erp_ultra_inspector"
echo -e "   3. Siga as instruções em DEPLOY_INSTRUCTIONS.txt"

