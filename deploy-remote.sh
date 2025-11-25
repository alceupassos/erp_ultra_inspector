#!/bin/bash

set -e

# Configurações
VPS_HOST="root@147.93.183.55"
VPS_DIR="/root/erp_ultra_inspector"
LOCAL_DIR="$(pwd)"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploy Remoto - ERP ULTRA Inspector${NC}"
echo -e "${YELLOW}Servidor: ${VPS_HOST}${NC}"
echo -e "${YELLOW}Diretório: ${VPS_DIR}${NC}"
echo ""

# Verificar se há mudanças não commitadas
if [ -d ".git" ]; then
  if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Há mudanças não commitadas. Deseja continuar? (s/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
      echo -e "${RED}❌ Deploy cancelado${NC}"
      exit 1
    fi
  fi
fi

echo -e "${YELLOW}📦 Fazendo commit das alterações...${NC}"
git add -A
git commit -m "Deploy: $(date +%Y-%m-%d_%H:%M:%S)" || echo "Nenhuma mudança para commitar"

echo -e "${YELLOW}📤 Enviando código para o servidor...${NC}"
# Criar diretório no servidor se não existir
ssh ${VPS_HOST} "mkdir -p ${VPS_DIR}"

# Sincronizar arquivos (excluindo node_modules, .next, etc)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'coverage' \
  --exclude '.env*.local' \
  --exclude 'cepalab_integration_bundle.zip' \
  --include 'nginx/' \
  --include 'scripts/' \
  --include 'nginx/**' \
  --include 'scripts/**' \
  ${LOCAL_DIR}/ ${VPS_HOST}:${VPS_DIR}/

echo -e "${YELLOW}🔧 Executando deploy no servidor...${NC}"
ssh ${VPS_HOST} << 'ENDSSH'
cd /root/erp_ultra_inspector

echo "📦 Instalando dependências..."
npm ci --production=false

echo "🔨 Construindo aplicação..."
npm run build

echo "📁 Criando diretórios necessários..."
mkdir -p logs
mkdir -p nginx
mkdir -p scripts

echo "🔧 Configurando Nginx..."
chmod +x scripts/setup-nginx.sh 2>/dev/null || true
if [ -f "scripts/setup-nginx.sh" ]; then
  bash scripts/setup-nginx.sh || echo "⚠️  Nginx já configurado ou erro na configuração"
fi

echo "🔄 Gerenciando processo com PM2..."
# Instalar PM2 se não tiver
if ! command -v pm2 &> /dev/null; then
  echo "📦 Instalando PM2..."
  npm install -g pm2
fi

# Parar aplicação existente
pm2 stop erp-ultra-inspector 2>/dev/null || true
pm2 delete erp-ultra-inspector 2>/dev/null || true

# Iniciar aplicação
pm2 start ecosystem.config.cjs
pm2 save

echo "✅ Deploy concluído!"
echo ""
echo "📊 Status da aplicação:"
pm2 status erp-ultra-inspector
ENDSSH

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}🌐 Aplicação disponível em:${NC}"
echo -e "   - http://erp.angrax.com.br"
echo -e "   - http://147.93.183.55:3000"
echo ""
echo -e "${YELLOW}🔒 Para configurar SSL (Let's Encrypt):${NC}"
echo -e "   ${GREEN}ssh ${VPS_HOST} 'cd /root/erp_ultra_inspector && bash scripts/setup-ssl.sh'${NC}"
echo ""
echo -e "${YELLOW}💡 Comandos úteis:${NC}"
echo -e "  Ver logs: ${GREEN}ssh ${VPS_HOST} 'pm2 logs erp-ultra-inspector'${NC}"
echo -e "  Reiniciar: ${GREEN}ssh ${VPS_HOST} 'pm2 restart erp-ultra-inspector'${NC}"
echo -e "  Status: ${GREEN}ssh ${VPS_HOST} 'pm2 status'${NC}"
echo -e "  Nginx status: ${GREEN}ssh ${VPS_HOST} 'systemctl status nginx'${NC}"

