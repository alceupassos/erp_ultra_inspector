export type ColumnInfo = {
  column_name: string;
  data_type: string;
  max_length: number;
  is_nullable: boolean;
  is_identity: boolean;
};

export type ForeignKeyInfo = {
  fk_name: string;
  parent_table: string;
  referenced_table: string;
};

export type TableInfo = {
  schema: string;
  name: string;
  objectId: number;
  rowCount: number;
  primaryKey: string[];
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  purpose: string;
};

export type AnalysisResult = {
  server: string;
  port: number;
  database: string;
  tables: TableInfo[];
};

export type VulnerabilityMetrics = {
  missingPrimaryKeyRatio: number;
  tablesWithoutForeignKeysRatio: number;
  nullableKeyLikeColumnsRatio: number;
  potentialSensitiveColumns: number;
  totalTables: number;
};

export type StructuralKpis = {
  avgColumnsPerTable: number;
  avgRowCount: number;
  maxRowCount: number;
  fkPerTableAvg: number;
};

export type SensitiveDataInfo = {
  tableName: string;
  columnName: string;
  dataType: string;
  sensitiveType: 'CPF' | 'CNPJ' | 'RG' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'CARD' | 'BANK_ACCOUNT' | 'SALARY' | 'HEALTH' | 'MEDICAL' | 'PASSWORD' | 'API_KEY';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rowCount: number;
  isNullable: boolean;
  maxLength: number;
};

export type UserPermissionInfo = {
  userName: string;
  principalType: string;
  permissions: {
    permissionName: string;
    state: string;
    objectName: string;
    objectType: string;
  }[];
  riskScore: number;
};

export type AuditConfig = {
  serverAuditEnabled: boolean;
  databaseAuditEnabled: boolean;
  cdcEnabled: boolean;
  auditTables: string[];
  complianceScore: number;
};

export type SecurityMetrics = {
  sensitiveDataScore: number;
  userAccessScore: number;
  securityConfigurationScore: number;
  encryptionScore: number;
  overallSecurityScore: number;
  totalSensitiveColumns: number;
  criticalRiskColumns: number;
  highRiskUsers: number;
  dangerousFeaturesEnabled: number;
};
