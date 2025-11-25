# 🔧 Configuração Nginx + SSL - erp.angrax.com.br

## Configuração Automática

O deploy automático já configura o Nginx. Mas você pode fazer manualmente:

### 1. Configurar Nginx

```bash
ssh root@147.93.183.55
cd /root/erp_ultra_inspector
bash scripts/setup-nginx.sh
```

### 2. Configurar SSL (Let's Encrypt)

```bash
# Certifique-se de que o DNS aponta para o servidor primeiro!
ssh root@147.93.183.55
cd /root/erp_ultra_inspector
bash scripts/setup-ssl.sh
```

## Configuração Manual

### Nginx

1. Copiar configuração:
```bash
cp /root/erp_ultra_inspector/nginx/erp-angrax.conf /etc/nginx/sites-available/erp-angrax
```

2. Ativar site:
```bash
ln -s /etc/nginx/sites-available/erp-angrax /etc/nginx/sites-enabled/
```

3. Testar e recarregar:
```bash
nginx -t
systemctl reload nginx
```

### SSL com Certbot

1. Instalar Certbot:
```bash
apt update
apt install -y certbot python3-certbot-nginx
```

2. Obter certificado:
```bash
certbot --nginx -d erp.angrax.com.br --non-interactive --agree-tos --email admin@angrax.com.br --redirect
```

3. Configurar renovação automática:
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

## Verificar Configuração

```bash
# Verificar Nginx
systemctl status nginx
nginx -t

# Verificar certificado SSL
certbot certificates

# Verificar renovação
certbot renew --dry-run

# Ver logs
tail -f /var/log/nginx/erp-angrax-access.log
tail -f /var/log/nginx/erp-angrax-error.log
```

## Porta Utilizada

- **Aplicação Next.js**: Porta `3000` (localhost apenas)
- **Nginx**: Porta `80` (HTTP) e `443` (HTTPS)
- **Domínio**: `erp.angrax.com.br`

A aplicação roda apenas em localhost:3000 e o Nginx faz proxy reverso, então não interfere com outros sites.

## Troubleshooting

### Nginx não inicia
```bash
nginx -t  # Verificar erros
systemctl status nginx
journalctl -u nginx -n 50
```

### Certificado não funciona
```bash
# Verificar DNS
dig erp.angrax.com.br

# Verificar se porta 80/443 está aberta
netstat -tulpn | grep -E ':(80|443)'

# Ver logs do certbot
journalctl -u certbot -n 50
```

### Aplicação não responde
```bash
# Verificar se PM2 está rodando
pm2 status

# Verificar se aplicação está na porta 3000
netstat -tulpn | grep 3000

# Ver logs
pm2 logs erp-ultra-inspector
```

