# 🔧 Troubleshooting - Deploy

## Problema: SSH não conecta

### Erro: "Network is unreachable" ou "Operation timed out"

**Possíveis causas:**
1. Servidor offline ou IP mudou
2. Firewall bloqueando porta 22
3. VPN necessária para acessar
4. Porta SSH diferente de 22

### Soluções:

#### 1. Verificar conectividade básica
```bash
# Testar ping
ping 147.93.183.55

# Testar porta SSH
nc -zv 147.93.183.55 22

# Ou com telnet
telnet 147.93.183.55 22
```

#### 2. Verificar se precisa de VPN
- Alguns servidores exigem VPN para acesso SSH
- Conecte na VPN antes de tentar SSH

#### 3. Verificar porta SSH alternativa
```bash
# Se a porta for diferente (ex: 2222)
ssh -p 2222 root@147.93.183.55
```

#### 4. Verificar configuração SSH
```bash
# Verificar se há configuração no ~/.ssh/config
cat ~/.ssh/config

# Testar com verbose para ver o erro
ssh -v root@147.93.183.55
```

#### 5. Deploy Manual (se SSH funcionar depois)

**Opção A: Via SSH direto**
```bash
# 1. Conectar
ssh root@147.93.183.55

# 2. No servidor, criar diretório se não existir
mkdir -p /root/erp_ultra_inspector
cd /root/erp_ultra_inspector

# 3. Clonar repositório (se não existir)
git clone https://github.com/alceupassos/erp_ultra_inspector.git .

# OU atualizar se já existe
git pull origin main

# 4. Executar deploy
chmod +x deploy.sh
./deploy.sh
```

**Opção B: Upload manual via SCP**
```bash
# Do seu Mac, no diretório do projeto
cd /Users/alceualvespasssosmac/erp_ultra_inspector

# Enviar arquivos
scp -r . root@147.93.183.55:/root/erp_ultra_inspector/

# Depois conectar e fazer deploy
ssh root@147.93.183.55
cd /root/erp_ultra_inspector
./deploy.sh
```

## Problema: Diretório não existe no servidor

Se o diretório `/root/erp_ultra_inspector` não existe:

```bash
ssh root@147.93.183.55
mkdir -p /root/erp_ultra_inspector
cd /root/erp_ultra_inspector
git clone https://github.com/alceupassos/erp_ultra_inspector.git .
```

## Problema: Script não encontrado

Certifique-se de estar no diretório correto:

```bash
# Verificar diretório atual
pwd

# Deve ser:
# /Users/alceualvespasssosmac/erp_ultra_inspector

# Se não for, navegar para lá
cd /Users/alceualvespasssosmac/erp_ultra_inspector

# Verificar se script existe
ls -la deploy-remote.sh

# Executar
./deploy-remote.sh
```

## Verificar Status do Servidor

Se conseguir acessar de outra forma, verificar:

```bash
# Verificar se aplicação está rodando
pm2 status

# Ver logs
pm2 logs erp-ultra-inspector

# Verificar Nginx
systemctl status nginx
nginx -t
```

## Alternativa: Deploy via Painel de Controle

Se o servidor tiver painel (cPanel, Plesk, etc):
1. Acesse o painel
2. Use File Manager para fazer upload
3. Use Terminal do painel para executar comandos

