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

echo -e "${YELLOW}🔧 Configurando Nginx...${NC}"
# Configurar Nginx se os scripts existirem
if [ -f "scripts/setup-nginx.sh" ]; then
  chmod +x scripts/setup-nginx.sh
  bash scripts/setup-nginx.sh || echo -e "${YELLOW}⚠️  Nginx já configurado ou erro na configuração${NC}"
fi

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

echo -e "${YELLOW}🔒 Configurando SSL (Let's Encrypt)...${NC}"
# Configurar SSL se o script existir e Nginx estiver configurado
if [ -f "scripts/setup-ssl.sh" ] && [ -f "/etc/nginx/sites-available/erp-angrax" ]; then
  chmod +x scripts/setup-ssl.sh
  echo -e "${YELLOW}⚠️  Certifique-se de que o DNS de erpultra.angrax.com.br aponta para este servidor${NC}"
  read -p "DNS configurado? (s/N): " dns_ok
  if [[ "$dns_ok" =~ ^[Ss]$ ]]; then
    bash scripts/setup-ssl.sh || echo -e "${YELLOW}⚠️  SSL já configurado ou erro na configuração${NC}"
  else
    echo -e "${YELLOW}⏭️  Pulando configuração SSL. Execute manualmente depois: bash scripts/setup-ssl.sh${NC}"
  fi
fi

echo -e "${YELLOW}🔒 Configurando SSL (Let's Encrypt)...${NC}"
# Configurar SSL se o script existir e Nginx estiver configurado
if [ -f "$PROJECT_DIR/scripts/setup-ssl.sh" ] && [ -f "/etc/nginx/sites-available/erp-angrax" ]; then
  chmod +x "$PROJECT_DIR/scripts/setup-ssl.sh"
  echo -e "${YELLOW}⚠️  Certifique-se de que o DNS de erp.angrax.com.br aponta para este servidor${NC}"
  echo -e "${YELLOW}💡 Para configurar SSL depois, execute: ${GREEN}bash scripts/setup-ssl.sh${NC}"
  # Tentar configurar SSL automaticamente (pode falhar se DNS não estiver pronto)
  bash "$PROJECT_DIR/scripts/setup-ssl.sh" 2>/dev/null || echo -e "${YELLOW}⏭️  SSL não configurado. Execute manualmente quando DNS estiver pronto: ${GREEN}bash scripts/setup-ssl.sh${NC}"
else
  echo -e "${YELLOW}⏭️  Pulando configuração SSL (Nginx não configurado ou script não encontrado)${NC}"
fi

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}📊 Status da aplicação:${NC}"
pm2 status erp-ultra-inspector

echo -e "${BLUE}🌐 Aplicação disponível em:${NC}"
echo -e "   - http://erp.angrax.com.br"
echo -e "   - http://147.93.183.55:3000"

echo -e "${YELLOW}💡 Comandos úteis:${NC}"
echo -e "  - Ver logs: ${GREEN}pm2 logs erp-ultra-inspector${NC}"
echo -e "  - Reiniciar: ${GREEN}pm2 restart erp-ultra-inspector${NC}"
echo -e "  - Parar: ${GREEN}pm2 stop erp-ultra-inspector${NC}"
echo -e "  - Status: ${GREEN}pm2 status${NC}"
echo -e "  - Configurar SSL: ${GREEN}bash scripts/setup-ssl.sh${NC}"
echo -e "  - Status Nginx: ${GREEN}systemctl status nginx${NC}"

