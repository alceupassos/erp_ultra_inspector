#!/bin/bash

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="erp.angrax.com.br"
EMAIL="admin@angrax.com.br"  # Altere para seu email

echo -e "${BLUE}🔒 Configurando SSL para ${DOMAIN}${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Este script precisa ser executado como root${NC}"
  exit 1
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}📦 Instalando Certbot...${NC}"
  apt update
  apt install -y certbot python3-certbot-nginx
else
  echo -e "${GREEN}✅ Certbot já instalado${NC}"
fi

# Verificar se Nginx está configurado
if [ ! -f "/etc/nginx/sites-available/erp-angrax" ]; then
  echo -e "${RED}❌ Nginx não está configurado. Execute setup-nginx.sh primeiro${NC}"
  exit 1
fi

# Obter certificado SSL
echo -e "${YELLOW}🔐 Obtendo certificado SSL...${NC}"
echo -e "${YELLOW}⚠️  Certifique-se de que o DNS de ${DOMAIN} aponta para este servidor${NC}"

certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

# Configurar renovação automática
echo -e "${YELLOW}🔄 Configurando renovação automática...${NC}"
systemctl enable certbot.timer
systemctl start certbot.timer

# Testar renovação
echo -e "${YELLOW}🧪 Testando renovação...${NC}"
certbot renew --dry-run

echo -e "${GREEN}✅ SSL configurado com sucesso!${NC}"
echo -e "${BLUE}🌐 Site disponível em: https://${DOMAIN}${NC}"
echo -e "${GREEN}📅 Certificado será renovado automaticamente${NC}"

