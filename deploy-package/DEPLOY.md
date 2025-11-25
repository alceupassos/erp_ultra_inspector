# 🚀 Guia de Deploy - ERP ULTRA Inspector

## Deploy no VPS Root

### Pré-requisitos

1. **Node.js 20+** instalado
2. **PM2** para gerenciamento de processos (será instalado automaticamente)
3. **Git** (se usar repositório)
4. Acesso **root** ao VPS

### Método 1: Deploy Automático (Recomendado)

```bash
# 1. Conectar ao VPS como root
ssh root@seu-vps-ip

# 2. Clonar ou navegar para o diretório do projeto
cd /root
git clone seu-repositorio.git erp_ultra_inspector
# OU se já existe:
cd /root/erp_ultra_inspector

# 3. Executar script de deploy
chmod +x deploy.sh
./deploy.sh
```

### Método 2: Deploy Manual

```bash
# 1. Conectar ao VPS
ssh root@seu-vps-ip

# 2. Navegar para o diretório
cd /root/erp_ultra_inspector

# 3. Atualizar código (se usar git)
git pull origin main

# 4. Instalar dependências
npm ci

# 5. Build da aplicação
npm run build

# 6. Criar diretório de logs
mkdir -p logs

# 7. Instalar PM2 (se não tiver)
npm install -g pm2

# 8. Parar aplicação existente
pm2 stop erp-ultra-inspector || true
pm2 delete erp-ultra-inspector || true

# 9. Iniciar aplicação
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Configurar para iniciar no boot
```

### Método 3: Deploy com Docker

```bash
# 1. Build da imagem
docker build -t erp-ultra-inspector .

# 2. Parar container existente
docker stop erp-ultra-inspector || true
docker rm erp-ultra-inspector || true

# 3. Executar container
docker run -d \
  --name erp-ultra-inspector \
  -p 3000:3000 \
  --restart unless-stopped \
  erp-ultra-inspector
```

## Configuração de Variáveis de Ambiente

Crie arquivo `.env.production` no VPS:

```bash
# .env.production
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# OpenAI (opcional - para análise AI)
OPENAI_API_KEY=sua-chave-aqui

# NextAuth (se usar)
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=seu-secret-aqui
```

## Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs erp-ultra-inspector

# Reiniciar
pm2 restart erp-ultra-inspector

# Parar
pm2 stop erp-ultra-inspector

# Iniciar
pm2 start erp-ultra-inspector

# Monitorar
pm2 monit
```

## Configuração de Nginx (Recomendado)

Crie arquivo `/etc/nginx/sites-available/erp-ultra-inspector`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:
```bash
ln -s /etc/nginx/sites-available/erp-ultra-inspector /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## SSL com Let's Encrypt

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com
```

## Troubleshooting

### Aplicação não inicia
```bash
# Ver logs
pm2 logs erp-ultra-inspector --lines 100

# Verificar porta
netstat -tulpn | grep 3000

# Verificar processos
ps aux | grep node
```

### Porta já em uso
```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 PID
```

### Rebuild necessário
```bash
cd /root/erp_ultra_inspector
rm -rf .next node_modules
npm ci
npm run build
pm2 restart erp-ultra-inspector
```

## Backup

O script de deploy cria backup automático em:
```
/root/erp_ultra_inspector_backup_YYYYMMDD_HHMMSS
```

## Monitoramento

```bash
# Ver uso de recursos
pm2 monit

# Ver informações detalhadas
pm2 show erp-ultra-inspector
```

