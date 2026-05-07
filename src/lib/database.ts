import { neon } from "@neondatabase/serverless";

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!);

// Database initialization and schema creation
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        last_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        member_id VARCHAR(50) UNIQUE NOT NULL,
        join_date DATE NOT NULL DEFAULT CURRENT_DATE,
        savings_balance DECIMAL(15,2) DEFAULT 0,
        loan_balance DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        avatar_id VARCHAR(50),
        date_of_birth DATE,
        gender VARCHAR(10),
        national_id VARCHAR(50),
        email VARCHAR(255),
        alternative_phone VARCHAR(20),
        province VARCHAR(100),
        district VARCHAR(100),
        sector VARCHAR(100),
        cell VARCHAR(100),
        village VARCHAR(100),
        address TEXT,
        next_of_kin_name VARCHAR(255),
        next_of_kin_phone VARCHAR(20),
        next_of_kin_relationship VARCHAR(100),
        share_amount DECIMAL(15,2),
        number_of_shares DECIMAL(10,2),
        monthly_contribution DECIMAL(15,2),
        contribution_date DATE,
        collection_means VARCHAR(50),
        other_collection_means TEXT,
        account_number VARCHAR(100),
        deactivation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        member_name VARCHAR(255) NOT NULL,
        member_avatar_id VARCHAR(50),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS savings_accounts (
        id VARCHAR(50) PRIMARY KEY,
        member_id VARCHAR(50),
        member_name VARCHAR(255),
        account_number VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(50) DEFAULT 'Voluntary',
        balance DECIMAL(15,2) DEFAULT 0,
        account_name VARCHAR(255),
        open_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(50) PRIMARY KEY,
        member_id VARCHAR(50) NOT NULL,
        member_name VARCHAR(255) NOT NULL,
        loan_id VARCHAR(50) UNIQUE NOT NULL,
        principal DECIMAL(15,2) NOT NULL,
        balance DECIMAL(15,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Dormant', 'Closed')),
        loan_term INTEGER NOT NULL,
        loan_purpose TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cashbook_entries (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        date DATE NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS investments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount_invested DECIMAL(15,2) NOT NULL,
        current_value DECIMAL(15,2) NOT NULL,
        purchase_date DATE NOT NULL,
        return_on_investment DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_avatar_id VARCHAR(50),
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        period VARCHAR(50),
        generated_date DATE NOT NULL,
        data JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        member_id VARCHAR(50) NOT NULL,
        member_name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50),
        reference VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Fix loan status constraint: old schema had wrong values (Inactive/Dormant/Closed)
    // Correct values match app logic: Active/Paid/Overdue/Defaulted/Pending
    try {
      await sql`ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check`;
      await sql`
        ALTER TABLE loans ADD CONSTRAINT loans_status_check
        CHECK (status IN ('Active', 'Paid', 'Overdue', 'Defaulted', 'Pending'))
      `;
    } catch (_) {
      // Constraint already correct or table doesn't exist yet, safe to continue
    }

    // Ensure accounts table exists (was missing from original schema)
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
        balance DECIMAL(15,2) DEFAULT 0,
        last_updated DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Ensure journal_entries table exists
    await sql`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference VARCHAR(100),
        entries JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // OTP codes for email-based login
    await sql`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Pending actions (maker/checker approval workflow)
    await sql`
      CREATE TABLE IF NOT EXISTS pending_actions (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(100) NOT NULL,
        action_data JSONB NOT NULL,
        initiated_by_email VARCHAR(255) NOT NULL,
        initiated_by_name VARCHAR(255) NOT NULL,
        initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        required_approvals INTEGER DEFAULT 1,
        executed_at TIMESTAMP,
        notes TEXT
      )
    `;

    // Approval records for pending actions
    await sql`
      CREATE TABLE IF NOT EXISTS action_approvals (
        id SERIAL PRIMARY KEY,
        action_id INTEGER REFERENCES pending_actions(id) ON DELETE CASCADE,
        approver_email VARCHAR(255) NOT NULL,
        approver_name VARCHAR(255) NOT NULL,
        decision VARCHAR(10) NOT NULL CHECK (decision IN ('approved', 'rejected')),
        comment TEXT,
        decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Groups (cooperative / company / client tenants)
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id           VARCHAR(50)  PRIMARY KEY,
        name         VARCHAR(255) NOT NULL,
        code         VARCHAR(20),
        address      TEXT,
        phone        VARCHAR(20),
        email        VARCHAR(255),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await insertInitialData();
    await createIndexes();
    await migrateConstraints();
    console.log("✅ Database tables created successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

async function createIndexes() {
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_members_member_id   ON members(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_name        ON members(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_status      ON members(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_acct   ON transactions(account_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_savings_member      ON savings_accounts(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_savings_acct        ON savings_accounts(account_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_member        ON loans(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_status        ON loans(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_due_date      ON loans(due_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_member     ON payments(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_date       ON payments(payment_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_timestamp     ON audit_logs(timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_email           ON otp_codes(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_expires         ON otp_codes(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_status      ON pending_actions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_initiator   ON pending_actions(initiated_by_email)`;
    // Group-scoping indexes — one per data table
    await sql`CREATE INDEX IF NOT EXISTS idx_users_group            ON users(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_group          ON members(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_group     ON transactions(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_savings_group          ON savings_accounts(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_group            ON loans(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cashbook_group         ON cashbook_entries(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_investments_group      ON investments(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_group            ON audit_logs(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_group          ON pending_actions(group_id)`;
  } catch (_) {
    // Non-fatal: indexes are a perf optimization, not schema correctness
  }
}

// Drop global unique constraints and replace with per-group composite ones.
// Each block is isolated so a "already exists" error on ADD doesn't stop the rest.
async function migrateConstraints() {
  // member_id must be unique within a group, not globally
  try {
    await sql`ALTER TABLE members DROP CONSTRAINT IF EXISTS members_member_id_key`;
    await sql`ALTER TABLE members ADD CONSTRAINT members_member_id_group_uq UNIQUE (member_id, group_id)`;
  } catch (_) {}

  // account_number must be unique within a group
  try {
    await sql`ALTER TABLE savings_accounts DROP CONSTRAINT IF EXISTS savings_accounts_account_number_key`;
    await sql`ALTER TABLE savings_accounts ADD CONSTRAINT savings_accounts_acct_group_uq UNIQUE (account_number, group_id)`;
  } catch (_) {}

  // loan_id must be unique within a group
  try {
    await sql`ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_id_key`;
    await sql`ALTER TABLE loans ADD CONSTRAINT loans_loan_id_group_uq UNIQUE (loan_id, group_id)`;
  } catch (_) {}
}

// Insert initial demo data (and run idempotent migrations)
async function insertInitialData() {
  try {
    // Check if members table is empty
    const memberCount = await sql`SELECT COUNT(*) as count FROM members`;

    if (memberCount[0].count === "0") {
      // Insert demo members
      await sql`
        INSERT INTO members (id, name, first_name, last_name, phone_number, member_id, join_date, savings_balance, loan_balance, status, avatar_id, contribution_date, collection_means, other_collection_means, account_number)
        VALUES
        ('1', 'Anathalie Mukamana', 'Anathalie', 'Mukamana', '0788888881', 'BIF001', '2024-01-15', 250000, 0, 'Active', 'avatar1', '2024-01-15', 'MOMO', NULL, '0788888881'),
        ('2', 'Jean Baptiste Nzeyimana', 'Jean Baptiste', 'Nzeyimana', '0788888882', 'BIF002', '2024-01-10', 180000, 100000, 'Active', 'avatar2', '2024-01-10', 'BANKS IN RWANDA', NULL, '1234567890')
      `;

      // Insert demo transactions
      await sql`
        INSERT INTO transactions (id, member_name, member_avatar_id, type, amount, date, status)
        VALUES ('TXN001', 'Anathalie Mukamana', 'avatar1', 'Deposit', 50000, '2024-01-20', 'Completed')
      `;

      // Insert demo savings accounts
      await sql`
        INSERT INTO savings_accounts (id, member_id, member_name, account_number, type, balance, open_date)
        VALUES ('SAV001', '1', 'Anathalie Mukamana', 'BIF00101', 'Voluntary', 250000, '2024-01-15')
      `;

      // Insert demo loans
      await sql`
        INSERT INTO loans (id, member_id, member_name, loan_id, principal, balance, interest_rate, issue_date, due_date, status, loan_term, loan_purpose)
        VALUES ('LN001', '2', 'Jean Baptiste Nzeyimana', 'LN001', 100000, 100000, 10, '2024-01-10', '2024-07-10', 'Active', 6, 'Business expansion')
      `;

      // Insert demo cashbook entries
      await sql`
        INSERT INTO cashbook_entries (id, type, date, description, category, amount)
        VALUES 
        ('INC001', 'income', '2024-01-20', 'Member savings deposits', 'Savings', 500000),
        ('EXP001', 'expense', '2024-01-18', 'Office rent', 'Operations', 50000)
      `;

      // Insert demo investments
      await sql`
        INSERT INTO investments (id, name, type, amount_invested, current_value, purchase_date, return_on_investment)
        VALUES ('INV001', 'Government Bonds', 'Bond', 500000, 525000, '2024-01-01', 5)
      `;

      // Insert demo users
      await sql`
        INSERT INTO users (id, name, email, role)
        VALUES (1, 'Admin User', 'admin@andafinance.com', 'SUPER_ADMIN')
      `;

      // Insert demo accounts
      await sql`
        INSERT INTO accounts (id, code, name, type, balance, last_updated)
        VALUES 
        ('ACC001', '1000', 'Cash at Hand', 'asset', 200000, '2024-01-31'),
        ('ACC002', '2000', 'Member Savings', 'liability', 430000, '2024-01-31')
      `;

      console.log("✅ Initial demo data inserted successfully");
    }

    // Idempotent migrations — run on every cold start regardless of data state
    await sql`ALTER TABLE savings_accounts ALTER COLUMN member_id DROP NOT NULL`;
    await sql`ALTER TABLE savings_accounts ALTER COLUMN member_name DROP NOT NULL`;
    await sql`ALTER TABLE savings_accounts ADD COLUMN IF NOT EXISTS account_name VARCHAR(255)`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_number VARCHAR(50)`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reason TEXT`;

    // User table extensions for auth system
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS approvals_required INTEGER DEFAULT 1`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_set_credentials BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pre_auth_token VARCHAR(64)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pre_auth_token_expires_at TIMESTAMP`;

    // Multi-tenancy: group_id on every data table (idempotent)
    await sql`ALTER TABLE users            ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE members          ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE transactions     ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE savings_accounts ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE loans            ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE cashbook_entries ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE investments      ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE audit_logs       ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE reports          ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE payments         ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE accounts         ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE journal_entries  ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;
    await sql`ALTER TABLE pending_actions  ADD COLUMN IF NOT EXISTS group_id VARCHAR(50)`;

    // General Pool Account flag
    await sql`ALTER TABLE savings_accounts ADD COLUMN IF NOT EXISTS is_general_pool BOOLEAN DEFAULT FALSE`;

    // Migrate old role names to new format
    await sql`UPDATE users SET role = 'SUPER_ADMIN' WHERE role = 'Admin'`;
    await sql`UPDATE users SET role = 'ADMIN_FULL'    WHERE role = 'Manager'`;
    await sql`UPDATE users SET role = 'ADMIN_MAKER'   WHERE role = 'Teller'`;
    await sql`UPDATE users SET role = 'ADMIN_CHECKER' WHERE role = 'Auditor'`;
    await sql`UPDATE users SET role = 'IT_ADMIN'      WHERE role = 'User'`;

    // Fix users sequence so new inserts don't conflict with the demo row (id=1)
    await sql`SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1))`;

    // Member portal tables
    await sql`
      CREATE TABLE IF NOT EXISTS member_pins (
        member_id  VARCHAR(50) PRIMARY KEY,
        pin_hash   TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS member_invite_tokens (
        token      TEXT PRIMARY KEY,
        member_id  VARCHAR(50) NOT NULL,
        group_id   TEXT NOT NULL,
        used       BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS member_push_subscriptions (
        id          SERIAL PRIMARY KEY,
        member_id   VARCHAR(50) NOT NULL,
        endpoint    TEXT NOT NULL,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (member_id, endpoint)
      )
    `;

    // Sync super-admin credentials from env vars
    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminName     = process.env.ADMIN_NAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPin      = process.env.ADMIN_PIN;

    if (adminEmail) {
      await sql`
        UPDATE users
        SET email = ${adminEmail.toLowerCase()},
            name  = ${adminName ?? 'Admin'},
            updated_at = NOW()
        WHERE role = 'SUPER_ADMIN'
      `;
    }

    if (adminPassword) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(adminPassword, 12);
      // Only set if not already set — avoids expensive re-hash on every cold start
      await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE role = 'SUPER_ADMIN' AND password_hash IS NULL`;
    }

    if (adminPin) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(adminPin, 10);
      await sql`UPDATE users SET pin_hash = ${hash}, updated_at = NOW() WHERE role = 'SUPER_ADMIN' AND pin_hash IS NULL`;
    }
  } catch (error) {
    console.error("❌ Error inserting initial data:", error);
  }
}

// Helper function to handle database errors
export function handleDatabaseError(error: any, operation: string) {
  console.error(`❌ Database error during ${operation}:`, error);
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  throw new Error(`Database operation failed: ${operation} - ${errorMessage}`);
}
