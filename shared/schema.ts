import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Company/Tenant role enum
export const tenantRoleEnum = pgEnum("tenant_role", [
  "admin",
  "finance_manager", 
  "finance_exec",
  "auditor",
  "viewer"
]);

// Company subscription enum
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "starter",
  "professional", 
  "enterprise",
  "trial"
]);

// Tenant/Company table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name").notNull(),
  cin: varchar("cin").unique(), // Company Identification Number
  gstin: varchar("gstin"), // GST Identification Number
  pan: varchar("pan"), // PAN Number
  registeredAddress: text("registered_address"),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  industryType: varchar("industry_type"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("trial").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("finance_exec").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  tenantRole: tenantRoleEnum("tenant_role").default("finance_exec").notNull(),
  phone: varchar("phone"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document types enum
export const documentTypeEnum = pgEnum("document_type", [
  "journal",
  "gst",
  "tds",
  "trial_balance",
  "fixed_asset_register",
  "purchase_register",
  "sales_register",
  "salary_register",
  "vendor_invoice",
  "bank_statement",
  "other"
]);

// Document status enum
export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "processing",
  "classified",
  "extracted",
  "validated",
  "completed",
  "failed"
]);

// Agent status enum
export const agentStatusEnum = pgEnum("agent_status", [
  "idle",
  "running",
  "completed",
  "failed",
  "paused"
]);

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: varchar("file_path").notNull(),
  documentType: documentTypeEnum("document_type"),
  status: documentStatusEnum("status").default("uploaded").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  metadata: jsonb("metadata"),
  extractedData: jsonb("extracted_data"),
  validationErrors: jsonb("validation_errors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent jobs table
export const agentJobs = pgTable("agent_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: varchar("job_id").unique().notNull(),
  agentName: varchar("agent_name").notNull(),
  status: agentStatusEnum("status").default("idle").notNull(),
  documentId: uuid("document_id").references(() => documents.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalId: varchar("journal_id").unique().notNull(),
  date: timestamp("date").notNull(),
  accountCode: varchar("account_code").notNull(),
  accountName: varchar("account_name").notNull(),
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).default("0"),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).default("0"),
  narration: text("narration"),
  entity: varchar("entity"),
  documentId: uuid("document_id").references(() => documents.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial statements table
export const financialStatements = pgTable("financial_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  statementType: varchar("statement_type").notNull(), // trial_balance, profit_loss, balance_sheet, cash_flow
  period: varchar("period").notNull(), // Q1_2025, Q2_2025, etc.
  entity: varchar("entity"),
  data: jsonb("data").notNull(),
  isValid: boolean("is_valid").notNull().default(true),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  generatedBy: varchar("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Compliance checks table
export const complianceChecks = pgTable("compliance_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  checkType: varchar("check_type").notNull(), // gst, tds, ind_as, companies_act
  documentId: uuid("document_id").references(() => documents.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  status: varchar("status").default("pending").notNull(), // pending, compliant, non_compliant
  findings: jsonb("findings"),
  checkedBy: varchar("checked_by").references(() => users.id),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Audit trail table
export const auditTrail = pgTable("audit_trail", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(), // document, job, user, etc.
  entityId: varchar("entity_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Reconciliation tables
export const reconciliationRules = pgTable("reconciliation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  entityPairs: text("entity_pairs").array().notNull(),
  accountCodes: text("account_codes").array().notNull(),
  tolerancePercent: decimal("tolerance_percent", { precision: 5, scale: 4 }).notNull().default("0.0100"),
  toleranceAmount: decimal("tolerance_amount", { precision: 15, scale: 2 }).notNull().default("100.00"),
  autoReconcile: boolean("auto_reconcile").notNull().default(false),
  priority: integer("priority").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reconciliationMatches = pgTable("reconciliation_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityA: varchar("entity_a").notNull(),
  entityB: varchar("entity_b").notNull(),
  transactionAId: uuid("transaction_a_id").references(() => journalEntries.id).notNull(),
  transactionBId: uuid("transaction_b_id").references(() => journalEntries.id).notNull(),
  matchScore: decimal("match_score", { precision: 5, scale: 4 }).notNull(),
  matchType: varchar("match_type").notNull(), // exact, partial, suspected
  variance: decimal("variance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  varianceReasons: text("variance_reasons").array().notNull(),
  reconciliationDate: timestamp("reconciliation_date").notNull(),
  status: varchar("status").notNull().default("matched"), // matched, unmatched, disputed
  ruleId: uuid("rule_id").references(() => reconciliationRules.id),
  period: varchar("period").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const intercompanyTransactions = pgTable("intercompany_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentEntity: varchar("parent_entity").notNull(),
  childEntity: varchar("child_entity").notNull(),
  transactionType: varchar("transaction_type").notNull(), // transfer, loan, service, dividend, expense_allocation
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  transactionDate: timestamp("transaction_date").notNull(),
  description: text("description"),
  documentIds: text("document_ids").array().notNull(),
  isReconciled: boolean("is_reconciled").notNull().default(false),
  reconciliationId: uuid("reconciliation_id").references(() => reconciliationMatches.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reconciliationReports = pgTable("reconciliation_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: varchar("period").notNull(),
  totalTransactions: integer("total_transactions").notNull(),
  matchedTransactions: integer("matched_transactions").notNull(),
  unmatchedTransactions: integer("unmatched_transactions").notNull(),
  disputedTransactions: integer("disputed_transactions").notNull(),
  totalVariance: decimal("total_variance", { precision: 15, scale: 2 }).notNull(),
  reconciliationRate: decimal("reconciliation_rate", { precision: 5, scale: 4 }).notNull(),
  recommendations: text("recommendations").array().notNull(),
  reportData: jsonb("report_data"),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
});

// Data sources table
export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // database, api, file_system, ftp, cloud_storage, erp, banking_api, gst_portal, mca_portal
  connectionString: text("connection_string"),
  host: varchar("host"),
  port: integer("port"),
  username: varchar("username"),
  password: varchar("password"),
  database: varchar("database"),
  schema: varchar("schema"),
  table: varchar("table"),
  apiKey: varchar("api_key"),
  apiSecret: varchar("api_secret"),
  baseUrl: varchar("base_url"),
  authToken: varchar("auth_token"),
  isActive: boolean("is_active").default(true).notNull(),
  lastSync: timestamp("last_sync"),
  syncFrequency: varchar("sync_frequency").default("daily"), // hourly, daily, weekly, monthly, manual
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  documents: many(documents),
  agentJobs: many(agentJobs),
  journalEntries: many(journalEntries),
  financialStatements: many(financialStatements),
  complianceChecks: many(complianceChecks),
  auditTrail: many(auditTrail),
  reconciliationReports: many(reconciliationReports),
  dataSources: many(dataSources),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  documents: many(documents),
  agentJobs: many(agentJobs),
  journalEntries: many(journalEntries),
  financialStatements: many(financialStatements),
  complianceChecks: many(complianceChecks),
  auditTrail: many(auditTrail),
  reconciliationReports: many(reconciliationReports),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  agentJobs: many(agentJobs),
  journalEntries: many(journalEntries),
  complianceChecks: many(complianceChecks),
}));

export const agentJobsRelations = relations(agentJobs, ({ one }) => ({
  document: one(documents, {
    fields: [agentJobs.documentId],
    references: [documents.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  document: one(documents, {
    fields: [journalEntries.documentId],
    references: [documents.id],
  }),
  createdBy: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
  }),
}));

export const financialStatementsRelations = relations(financialStatements, ({ one }) => ({
  generatedBy: one(users, {
    fields: [financialStatements.generatedBy],
    references: [users.id],
  }),
}));

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  document: one(documents, {
    fields: [complianceChecks.documentId],
    references: [documents.id],
  }),
  checkedBy: one(users, {
    fields: [complianceChecks.checkedBy],
    references: [users.id],
  }),
}));

export const auditTrailRelations = relations(auditTrail, ({ one }) => ({
  user: one(users, {
    fields: [auditTrail.userId],
    references: [users.id],
  }),
}));

export const reconciliationRulesRelations = relations(reconciliationRules, ({ many }) => ({
  matches: many(reconciliationMatches),
}));

export const reconciliationMatchesRelations = relations(reconciliationMatches, ({ one }) => ({
  rule: one(reconciliationRules, {
    fields: [reconciliationMatches.ruleId],
    references: [reconciliationRules.id],
  }),
  transactionA: one(journalEntries, {
    fields: [reconciliationMatches.transactionAId],
    references: [journalEntries.id],
  }),
  transactionB: one(journalEntries, {
    fields: [reconciliationMatches.transactionBId],
    references: [journalEntries.id],
  }),
}));

export const intercompanyTransactionsRelations = relations(intercompanyTransactions, ({ one }) => ({
  reconciliation: one(reconciliationMatches, {
    fields: [intercompanyTransactions.reconciliationId],
    references: [reconciliationMatches.id],
  }),
}));

export const reconciliationReportsRelations = relations(reconciliationReports, ({ one }) => ({
  createdBy: one(users, {
    fields: [reconciliationReports.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentJobSchema = createInsertSchema(agentJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export const insertFinancialStatementSchema = createInsertSchema(financialStatements).omit({
  id: true,
  generatedAt: true,
});

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({
  id: true,
  checkedAt: true,
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  timestamp: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;



export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertAgentJob = z.infer<typeof insertAgentJobSchema>;
export type AgentJob = typeof agentJobs.$inferSelect;

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

export type InsertFinancialStatement = z.infer<typeof insertFinancialStatementSchema>;
export type FinancialStatement = typeof financialStatements.$inferSelect;

export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;

export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;

export type ReconciliationRule = typeof reconciliationRules.$inferSelect;
export type InsertReconciliationRule = typeof reconciliationRules.$inferInsert;

export type ReconciliationMatch = typeof reconciliationMatches.$inferSelect;
export type InsertReconciliationMatch = typeof reconciliationMatches.$inferInsert;

export type IntercompanyTransaction = typeof intercompanyTransactions.$inferSelect;
export type InsertIntercompanyTransaction = typeof intercompanyTransactions.$inferInsert;

export type ReconciliationReport = typeof reconciliationReports.$inferSelect;
export type InsertReconciliationReport = typeof reconciliationReports.$inferInsert;

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type UpsertDataSource = typeof dataSources.$inferInsert;
