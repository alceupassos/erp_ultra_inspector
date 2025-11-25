#!/bin/bash

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="erp.angrax.com.br"
NGINX_CONF="/etc/nginx/sites-available/erp-angrax"
NGINX_ENABLED="/etc/nginx/sites-enabled/erp-angrax"
PROJECT_DIR="/root/erp_ultra_inspector"

echo -e "${BLUE}🔧 Configurando Nginx para ${DOMAIN}${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Este script precisa ser executado como root${NC}"
  exit 1
fi

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}📦 Instalando Nginx...${NC}"
  apt update
  apt install -y nginx
fi

# Copiar configuração
echo -e "${YELLOW}📝 Copiando configuração Nginx...${NC}"
cp ${PROJECT_DIR}/nginx/erp-angrax.conf ${NGINX_CONF}

# Criar link simbólico (se não existir)
if [ ! -L ${NGINX_ENABLED} ]; then
  echo -e "${YELLOW}🔗 Ativando site...${NC}"
  ln -s ${NGINX_CONF} ${NGINX_ENABLED}
fi

# Testar configuração
echo -e "${YELLOW}🧪 Testando configuração Nginx...${NC}"
if nginx -t; then
  echo -e "${GREEN}✅ Configuração Nginx válida${NC}"
else
  echo -e "${RED}❌ Erro na configuração Nginx${NC}"
  exit 1
fi

# Recarregar Nginx
echo -e "${YELLOW}🔄 Recarregando Nginx...${NC}"
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configurado com sucesso!${NC}"
echo -e "${BLUE}🌐 Site disponível em: http://${DOMAIN}${NC}"

