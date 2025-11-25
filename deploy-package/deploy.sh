#!/bin/bash

set -e

echo "🚀 Iniciando deploy do ERP ULTRA Inspector..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no VPS root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Este script precisa ser executado como root${NC}"
  exit 1
fi

# Diretório do projeto
PROJECT_DIR="/root/erp_ultra_inspector"
BACKUP_DIR="/root/erp_ultra_inspector_backup_$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}📦 Fazendo backup do projeto atual...${NC}"
if [ -d "$PROJECT_DIR" ]; then
  cp -r "$PROJECT_DIR" "$BACKUP_DIR"
  echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
fi

echo -e "${YELLOW}📥 Atualizando código do repositório...${NC}"
cd "$PROJECT_DIR" || exit 1

# Se estiver usando git
if [ -d ".git" ]; then
  git pull origin main || echo -e "${YELLOW}⚠️  Git pull falhou, continuando...${NC}"
fi

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm ci --production=false

echo -e "${YELLOW}🔨 Construindo aplicação...${NC}"
npm run build

echo -e "${YELLOW}📁 Criando diretório de logs...${NC}"
mkdir -p "$PROJECT_DIR/logs"

echo -e "${YELLOW}🔄 Reiniciando aplicação com PM2...${NC}"
# Instalar PM2 globalmente se não estiver instalado
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}📦 Instalando PM2...${NC}"
  npm install -g pm2
fi

# Parar aplicação existente
pm2 stop erp-ultra-inspector 2>/dev/null || true
pm2 delete erp-ultra-inspector 2>/dev/null || true

# Iniciar aplicação
pm2 start ecosystem.config.cjs
pm2 save

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}📊 Status da aplicação:${NC}"
pm2 status erp-ultra-inspector

echo -e "${YELLOW}💡 Comandos úteis:${NC}"
echo -e "  - Ver logs: ${GREEN}pm2 logs erp-ultra-inspector${NC}"
echo -e "  - Reiniciar: ${GREEN}pm2 restart erp-ultra-inspector${NC}"
echo -e "  - Parar: ${GREEN}pm2 stop erp-ultra-inspector${NC}"
echo -e "  - Status: ${GREEN}pm2 status${NC}"

