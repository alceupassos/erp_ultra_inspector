# Oi, Gabriel — Guia rápido para habilitar TLS no SQL Server (Angra DB Manager)

## Por que fazer
- Garantir conexão segura (`encrypt: true`) sem precisar de `trustServerCertificate`.
- Nosso app (Angra DB Manager) mostra no Log: "Conexão segura via TLS/SSL." quando está ok.

## O que você precisa
- Hostname oficial que os clientes usam (FQDN), ex.: `erp-sql.company.local`.
- Porta do SQL (padrão `1433`, ou a que estiver em uso como `1445`).
- CA que vai assinar o certificado (interna ou externa).
- Se clientes usam IP, incluir o IP no SAN do certificado.

## Requisitos do certificado
- EKU: Server Authentication (`1.3.6.1.5.5.7.3.1`).
- CN/SAN com `erp-sql.company.local` (e IP, se aplicável).
- Chave privada acessível ao serviço do SQL (Windows) ou processo `mssql-server` (Linux).
- RSA 2048+ (ou ECC equivalente).

## Passo a passo — Windows
1. Emitir/instalar certificado no "Computador Local > Pessoal (My)"
   - CA corporativa (preferido):
     - Criar CSR via INF (exemplo `sqlserver.inf`):
       ```
       [NewRequest]
       Subject = "CN=erp-sql.company.local"
       KeyLength = 2048
       Exportable = TRUE
       MachineKeySet = TRUE
       RequestType = PKCS10
       [Extensions]
       2.5.29.17 = "{text}" ; SAN
       ; dns=erp-sql.company.local&ip=104.234.224.238
       1.3.6.1.5.5.7.3.1 = "" ; Server Authentication
       ```
     - Gerar CSR: `certreq -new sqlserver.inf sqlserver.req`
     - Enviar para a CA e instalar o certificado emitido.
   - Homologação (self-signed):
     - `New-SelfSignedCertificate -DnsName erp-sql.company.local -CertStoreLocation Cert:\LocalMachine\My -KeyLength 2048 -FriendlyName "SQL Server TLS"`

2. Vincular no SQL Server
   - Abrir "SQL Server Configuration Manager".
   - Em "SQL Server Network Configuration > Protocols for MSSQLSERVER":
     - Aba "Certificate": selecionar o certificado.
     - Aba "Flags": opcionalmente `Force Encryption = Yes`.

3. Reiniciar serviço
   - Reiniciar o serviço do SQL Server.

4. Verificar no servidor
   - `SELECT encrypt_option FROM sys.dm_exec_connections WHERE session_id = @@SPID;`
   - Deve retornar `TRUE` na sessão atual.

## Passo a passo — Linux
1. Posicionar arquivos
   - `tlscert = /var/opt/mssql/tls/server.crt`
   - `tlskey  = /var/opt/mssql/tls/server.key`
   - `tlsca   = /var/opt/mssql/tls/ca.crt`

2. Configurar `mssql.conf`
   - `sudo vi /var/opt/mssql/mssql.conf`
   - Seção:
     ```
     [network]
     tlscert = /var/opt/mssql/tls/server.crt
     tlskey  = /var/opt/mssql/tls/server.key
     tlsca   = /var/opt/mssql/tls/ca.crt
     encrypt = mandatory
     ```

3. Reiniciar
   - `sudo systemctl restart mssql-server`

4. Verificar
   - `SELECT encrypt_option FROM sys.dm_exec_connections WHERE session_id = @@SPID;`

## Como aparece no Angra DB Manager
- Use o FQDN igual ao CN/SAN na conexão.
- Se tudo certo, no Log do app: "Conexão segura via TLS/SSL.".
- Se o servidor não tiver cert confiável, o app loga: "Conexão sem TLS/SSL (TrustServerCertificate). Gabriel pode exigir certificado TLS válido no SQL Server.".

## Exemplo de uso (teste rápido)
1. Abrir o Angra DB Manager (http://localhost:3000) e preencher:
   - Servidor: `erp-sql.company.local`
   - Porta: `1433` (ou `1445`)
   - Usuário: `angra_reader`
   - Senha: `******`
   - Database: `ERP_ULTRA_PROD`
2. Clicar em "Analisar ERP ULTRA".
3. Checar o painel "Log de Sessão":
   - "Conectando ao SQL Server..."
   - "Conexão segura via TLS/SSL." (esperado)
   - "Análise concluída"

## Modelo de pedido (copiar e mandar)
> Oi, Gabriel! Preciso habilitar TLS no SQL Server para o Angra DB Manager.
> Dados: FQDN `erp-sql.company.local`, porta `1433`/`1445`.
> Certificado com EKU Server Authentication, CN/SAN com o FQDN (e IP, se necessário), RSA 2048+.
> No Windows: instalar no "LocalMachine\My", vincular via SQL Server Configuration Manager (aba Certificate) e considerar `Force Encryption = Yes`. No Linux: configurar `mssql.conf` com paths TLS e `encrypt=mandatory`.
> Depois eu valido com `SELECT encrypt_option ...` e pelo app (o Log indica TLS). Valeu!

## Dicas
- DNS precisa resolver o FQDN para o IP correto.
- Firewall: garantir a porta do SQL aberta para os clientes.
- Se alguns clientes usam IP, incluir IP no SAN, senão vai dar mismatch de nome.