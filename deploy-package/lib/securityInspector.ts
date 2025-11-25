import sql from "mssql";
import type { SecurityMetrics, SensitiveDataInfo, UserPermissionInfo, AuditConfig } from "./types";

export async function inspectSecurity(
  pool: sql.ConnectionPool,
  database: string
): Promise<{
  securityMetrics: SecurityMetrics;
  sensitiveData: SensitiveDataInfo[];
  userPermissions: UserPermissionInfo[];
  auditConfig: AuditConfig;
}> {
  
  // Análise de dados sensíveis
  const sensitiveData = await detectSensitiveData(pool);
  
  // Análise de permissões
  const userPermissions = await analyzeUserPermissions(pool);
  
  // Configurações de auditoria
  const auditConfig = await analyzeAuditConfiguration(pool, database);
  
  // Métricas de segurança
  const securityMetrics = await computeSecurityMetrics(pool, sensitiveData, userPermissions);

  return {
    securityMetrics,
    sensitiveData,
    userPermissions,
    auditConfig
  };
}

async function detectSensitiveData(pool: sql.ConnectionPool): Promise<SensitiveDataInfo[]> {
  const sensitivePatterns: Array<{
    pattern: RegExp;
    type: SensitiveDataInfo['sensitiveType'];
    risk: SensitiveDataInfo['riskLevel'];
  }> = [
    // PII Brasileiro
    { pattern: /cpf|cgc|cadastro.*federal/i, type: 'CPF', risk: 'CRITICAL' },
    { pattern: /rg|registro.*geral/i, type: 'RG', risk: 'HIGH' },
    { pattern: /cnpj|cadastro.*nacional.*pessoa.*jur[ií]dica/i, type: 'CNPJ', risk: 'CRITICAL' },
    { pattern: /email|e-mail|mail/i, type: 'EMAIL', risk: 'MEDIUM' },
    { pattern: /telefone|celular|fone/i, type: 'PHONE', risk: 'MEDIUM' },
    { pattern: /endereco|address|logradouro/i, type: 'ADDRESS', risk: 'LOW' },
    
    // Financeiro
    { pattern: /cartao|card|credito|debito/i, type: 'CARD', risk: 'CRITICAL' },
    { pattern: /banco|agencia|conta.*bancaria/i, type: 'BANK_ACCOUNT', risk: 'HIGH' },
    { pattern: /salario|salary|remuneracao/i, type: 'SALARY', risk: 'HIGH' },
    
    // Saúde
    { pattern: /paciente|patient|medico|doctor/i, type: 'HEALTH', risk: 'CRITICAL' },
    { pattern: /diagnostico|diagnosis|tratamento|treatment/i, type: 'MEDICAL', risk: 'CRITICAL' },
    
    // Segurança
    { pattern: /senha|password|pass|pwd/i, type: 'PASSWORD', risk: 'CRITICAL' },
    { pattern: /token|api.*key|secret/i, type: 'API_KEY', risk: 'CRITICAL' }
  ];

  const result = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name,
      ty.name AS data_type,
      c.max_length,
      c.is_nullable,
      CAST(p.rows AS BIGINT) AS row_count
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped = 0
    ORDER BY t.name, c.column_id
  `);

  const sensitiveColumns: SensitiveDataInfo[] = [];
  
  result.recordset.forEach((row: any) => {
    const columnName = row.column_name;
    const tableName = row.table_name;
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.pattern.test(columnName)) {
        sensitiveColumns.push({
          tableName,
          columnName,
          dataType: row.data_type,
          sensitiveType: pattern.type,
          riskLevel: pattern.risk,
          rowCount: row.row_count,
          isNullable: row.is_nullable,
          maxLength: row.max_length
        });
      }
    });
  });

  return sensitiveColumns;
}

async function analyzeUserPermissions(pool: sql.ConnectionPool): Promise<UserPermissionInfo[]> {
  const result = await pool.request().query(`
    SELECT 
      dp.name AS principal_name,
      dp.type_desc AS principal_type,
      perm.permission_name,
      perm.state_desc AS permission_state,
      obj.name AS object_name,
      obj.type_desc AS object_type
    FROM sys.database_permissions perm
    JOIN sys.database_principals dp ON perm.grantee_principal_id = dp.principal_id
    LEFT JOIN sys.objects obj ON perm.major_id = obj.object_id
    WHERE dp.name NOT IN ('public', 'guest')
    ORDER BY dp.name, obj.name, perm.permission_name
  `);

  const permissionsByUser: Record<string, UserPermissionInfo> = {};
  
  result.recordset.forEach((row: any) => {
    const userName = row.principal_name;
    if (!permissionsByUser[userName]) {
      permissionsByUser[userName] = {
        userName,
        principalType: row.principal_type,
        permissions: [],
        riskScore: 0
      };
    }
    
    permissionsByUser[userName].permissions.push({
      permissionName: row.permission_name,
      state: row.permission_state,
      objectName: row.object_name,
      objectType: row.object_type
    });
  });

  // Calcula risk score baseado em permissões perigosas
  Object.values(permissionsByUser).forEach(user => {
    user.riskScore = user.permissions.reduce((score, perm) => {
      if (['CONTROL', 'ALTER', 'DELETE', 'INSERT', 'UPDATE'].includes(perm.permissionName)) {
        score += perm.state === 'GRANT' ? 3 : 2;
      }
      if (perm.permissionName === 'SELECT' && perm.objectType === 'USER_TABLE') {
        score += 1;
      }
      return score;
    }, 0);
  });

  return Object.values(permissionsByUser);
}

async function analyzeAuditConfiguration(pool: sql.ConnectionPool, database: string): Promise<AuditConfig> {
  // Verifica se audit está habilitado
  const auditResult = await pool.request().query(`
    SELECT 
      audit_id,
      name AS audit_name,
      is_state_enabled,
      create_date,
      modify_date
    FROM sys.server_audits
    WHERE is_state_enabled = 1
  `);

  // Verifica especificações de audit do banco
  const auditSpecResult = await pool.request().query(`
    SELECT 
      s.name AS audit_specification_name,
      s.is_state_enabled,
      d.audit_action_name,
      d.audited_principal_name
    FROM sys.database_audit_specifications s
    JOIN sys.database_audit_specification_details d ON s.database_specification_id = d.database_specification_id
    WHERE s.is_state_enabled = 1
  `);

  // Verifica CDC (Change Data Capture)
  const cdcResult = await pool.request().query(`
    SELECT 
      name AS table_name,
      is_tracked_by_cdc
    FROM sys.tables
    WHERE is_tracked_by_cdc = 1
  `);

  return {
    serverAuditEnabled: auditResult.recordset.length > 0,
    databaseAuditEnabled: auditSpecResult.recordset.length > 0,
    cdcEnabled: cdcResult.recordset.length > 0,
    auditTables: cdcResult.recordset.map((row: any) => row.table_name),
    complianceScore: calculateComplianceScore(auditResult.recordset, auditSpecResult.recordset, cdcResult.recordset)
  };
}

function calculateComplianceScore(
  serverAudits: any[], 
  databaseAudits: any[], 
  cdcTables: any[]
): number {
  let score = 0;
  
  if (serverAudits.length > 0) score += 30;
  if (databaseAudits.length > 0) score += 30;
  if (cdcTables.length > 0) score += 20;
  
  // Bônus por configurações adicionais
  if (serverAudits.length > 1) score += 10;
  if (databaseAudits.length > 2) score += 10;
  
  return Math.min(100, score);
}

async function computeSecurityMetrics(
  pool: sql.ConnectionPool, 
  sensitiveData: SensitiveDataInfo[], 
  userPermissions: UserPermissionInfo[]
): Promise<SecurityMetrics> {
  
  // Conta vulnerabilidades por nível
  const criticalColumns = sensitiveData.filter(d => d.riskLevel === 'CRITICAL').length;
  const highColumns = sensitiveData.filter(d => d.riskLevel === 'HIGH').length;
  const mediumColumns = sensitiveData.filter(d => d.riskLevel === 'MEDIUM').length;
  
  // Análise de usuários privilegiados
  const highRiskUsers = userPermissions.filter(u => u.riskScore > 10).length;
  const totalUsers = userPermissions.length;
  
  // Verifica configurações de segurança
  const securityConfig = await pool.request().query(`
    SELECT 
      name AS config_name,
      value AS config_value,
      value_in_use AS current_value
    FROM sys.configurations
    WHERE name IN ('xp_cmdshell', 'Database Mail XPs', 'Ole Automation Procedures', 'cross db ownership chaining')
  `);

  const dangerousFeatures = securityConfig.recordset.filter((row: any) => 
    row.current_value === 1
  ).length;

  return {
    sensitiveDataScore: calculateSensitiveDataScore(criticalColumns, highColumns, mediumColumns),
    userAccessScore: calculateUserAccessScore(highRiskUsers, totalUsers),
    securityConfigurationScore: calculateSecurityConfigScore(dangerousFeatures),
    encryptionScore: await calculateEncryptionScore(pool),
    overallSecurityScore: 0, // Calculado no componente
    totalSensitiveColumns: sensitiveData.length,
    criticalRiskColumns: criticalColumns,
    highRiskUsers,
    dangerousFeaturesEnabled: dangerousFeatures
  };
}

function calculateSensitiveDataScore(critical: number, high: number, medium: number): number {
  const total = critical + high + medium;
  if (total === 0) return 100;
  
  const weightedScore = (critical * 10) + (high * 5) + (medium * 2);
  return Math.max(0, 100 - Math.min(100, weightedScore));
}

function calculateUserAccessScore(highRiskUsers: number, totalUsers: number): number {
  if (totalUsers === 0) return 100;
  const ratio = highRiskUsers / totalUsers;
  return Math.max(0, 100 - (ratio * 100));
}

function calculateSecurityConfigScore(dangerousFeatures: number): number {
  return Math.max(0, 100 - (dangerousFeatures * 25));
}

async function calculateEncryptionScore(pool: sql.ConnectionPool): Promise<number> {
  // Verifica TDE (Transparent Data Encryption)
  const tdeResult = await pool.request().query(`
    SELECT 
      db.name,
      db.is_encrypted,
      dm.encryption_state
    FROM sys.databases db
    LEFT JOIN sys.dm_database_encryption_keys dm ON db.database_id = dm.database_id
    WHERE db.name = DB_NAME()
  `);

  const encryptionEnabled = tdeResult.recordset.some((row: any) => 
    row.is_encrypted || row.encryption_state === 3
  );

  return encryptionEnabled ? 100 : 0;
}