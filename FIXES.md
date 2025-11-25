# 🔧 Problemas Comuns e Soluções

## ✅ Status Atual

- ✅ Build funcionando
- ✅ Lint sem erros
- ✅ Servidor rodando localmente
- ✅ APIs respondendo
- ✅ Frontend carregando

## 🔍 Problemas Possíveis

### 1. Problema: Aplicação não conecta ao banco de dados

**Sintomas:**
- Erro ao tentar analisar
- Timeout na conexão
- "Falha ao conectar"

**Soluções:**
- Verificar se o servidor SQL está acessível: `ping 104.234.224.238`
- Verificar se a porta 1445 está aberta
- Testar credenciais (usuário: angrax, senha: [sua senha])
- Verificar se o banco "sgc" existe
- Tentar com TLS desabilitado primeiro

### 2. Problema: Erro 500 na API

**Sintomas:**
- Erro ao fazer análise
- Console mostra erro 500

**Soluções:**
- Verificar logs do servidor: `npm run dev` (ver console)
- Verificar se todas as dependências estão instaladas: `npm ci`
- Verificar variáveis de ambiente: `.env` ou `.env.local`

### 3. Problema: Aplicação não carrega no navegador

**Sintomas:**
- Página em branco
- Erro no console do navegador

**Soluções:**
- Limpar cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
- Verificar se o servidor está rodando: `curl http://localhost:3000`
- Verificar console do navegador (F12) para erros JavaScript

### 4. Problema: Deploy no VPS não funciona

**Sintomas:**
- Aplicação não responde no servidor
- Erro 502 Bad Gateway

**Soluções:**
- Verificar se PM2 está rodando: `pm2 status`
- Verificar logs: `pm2 logs erp-ultra-inspector`
- Verificar Nginx: `systemctl status nginx`
- Verificar se aplicação está na porta 3000: `netstat -tulpn | grep 3000`
- Reiniciar aplicação: `pm2 restart erp-ultra-inspector`

## 🛠️ Comandos Úteis

### Local
```bash
# Iniciar servidor
npm run dev

# Build
npm run build

# Verificar erros
npm run lint

# Diagnóstico completo
./diagnose.sh
```

### Produção (VPS)
```bash
# Ver status
pm2 status
pm2 logs erp-ultra-inspector

# Reiniciar
pm2 restart erp-ultra-inspector

# Verificar Nginx
systemctl status nginx
nginx -t

# Verificar porta
netstat -tulpn | grep 3000
```

## 📞 Qual é o Problema Específico?

Para ajudar melhor, informe:
1. Onde está tentando acessar? (localhost ou VPS)
2. Qual erro específico aparece?
3. O que acontece quando tenta usar?
4. Há mensagens de erro no console?

