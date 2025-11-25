# 📦 Deploy Manual - Passo a Passo

## Situação: SSH não está acessível

Se o SSH não está funcionando, siga estes passos:

### Opção 1: Deploy Manual via SSH (quando SSH funcionar)

```bash
# 1. Conectar ao servidor
ssh root@147.93.183.55

# 2. Criar diretório (se não existir)
mkdir -p /root/erp_ultra_inspector
cd /root/erp_ultra_inspector

# 3. Clonar repositório (primeira vez)
git clone https://github.com/alceupassos/erp_ultra_inspector.git .

# OU atualizar (se já existe)
git pull origin main

# 4. Instalar dependências
npm ci

# 5. Build
npm run build

# 6. Instalar PM2 (se não tiver)
npm install -g pm2

# 7. Configurar Nginx
bash scripts/setup-nginx.sh

# 8. Iniciar aplicação
pm2 start ecosystem.config.cjs
pm2 save

# 9. Verificar status
pm2 status
pm2 logs erp-ultra-inspector
```

### Opção 2: Upload via SCP (se SSH funcionar)

```bash
# Do seu Mac, no diretório do projeto
cd /Users/alceualvespasssosmac/erp_ultra_inspector

# Enviar todos os arquivos (exceto node_modules, .next)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  ./ root@147.93.183.55:/root/erp_ultra_inspector/

# Depois conectar e fazer deploy
ssh root@147.93.183.55
cd /root/erp_ultra_inspector
./deploy.sh
```

### Opção 3: Verificar Problemas de Conectividade

```bash
# Testar ping
ping 147.93.183.55

# Testar porta SSH
nc -zv 147.93.183.55 22

# Testar SSH com verbose
ssh -v root@147.93.183.55

# Verificar se precisa VPN
# (Conecte na VPN da empresa/rede antes)
```

### Opção 4: Usar Porta SSH Alternativa

Se a porta SSH for diferente de 22:

```bash
# Exemplo: porta 2222
ssh -p 2222 root@147.93.183.55

# Atualizar deploy-remote.sh com:
# VPS_HOST="root@147.93.183.55 -p 2222"
```

## Comandos Úteis no Servidor

```bash
# Ver status PM2
pm2 status
pm2 logs erp-ultra-inspector
pm2 restart erp-ultra-inspector

# Ver status Nginx
systemctl status nginx
nginx -t
systemctl reload nginx

# Ver logs
tail -f /var/log/nginx/erp-angrax-access.log
tail -f /var/log/nginx/erp-angrax-error.log

# Verificar porta 3000
netstat -tulpn | grep 3000
lsof -i :3000
```

## Próximos Passos Após Deploy

1. **Configurar SSL:**
   ```bash
   ssh root@147.93.183.55
   cd /root/erp_ultra_inspector
   bash scripts/setup-ssl.sh
   ```

2. **Verificar aplicação:**
   - http://erp.angrax.com.br
   - http://147.93.183.55:3000

3. **Monitorar:**
   ```bash
   pm2 monit
   ```

