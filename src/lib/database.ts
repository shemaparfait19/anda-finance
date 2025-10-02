import { neon } from "@neondatabase/serverless";
import type {
  Member,
  Transaction,
  SavingsAccount,
  Loan,
  CashbookEntry,
  Investment,
  AuditLog,
  User,
  Report,
  Payment,
  AccountingData,
  JournalEntry,
} from "./types";

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
        last_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        savings_group VARCHAR(100),
        member_role VARCHAR(50) DEFAULT 'Member',
        member_id VARCHAR(50) UNIQUE NOT NULL,
        join_date DATE NOT NULL,
        savings_balance DECIMAL(15,2) DEFAULT 0,
        loan_balance DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        avatar_id VARCHAR(50),
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
        member_id VARCHAR(50) NOT NULL,
        member_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(50) DEFAULT 'Voluntary',
        balance DECIMAL(15,2) DEFAULT 0,
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
        status VARCHAR(20) DEFAULT 'Active',
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        last_updated DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id SERIAL PRIMARY KEY,
        journal_entry_id VARCHAR(50) NOT NULL,
        account_id VARCHAR(50) NOT NULL,
        debit DECIMAL(15,2) DEFAULT 0,
        credit DECIMAL(15,2) DEFAULT 0,
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `;

    console.log("✅ Database tables created successfully");

    // Insert initial demo data if tables are empty
    await insertInitialData();
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

// Insert initial demo data
async function insertInitialData() {
  try {
    // Check if members table is empty
    const memberCount = await sql`SELECT COUNT(*) as count FROM members`;

    if (memberCount[0].count === "0") {
      // Insert demo members
      await sql`
        INSERT INTO members (id, name, first_name, last_name, phone_number, savings_group, member_role, member_id, join_date, savings_balance, loan_balance, status, avatar_id)
        VALUES 
        ('1', 'Anathalie Mukamana', 'Anathalie', 'Mukamana', '0788888881', 'Group-A', 'Member', 'MEM001', '2024-01-15', 250000, 0, 'Active', 'avatar1'),
        ('2', 'Jean Baptiste Nzeyimana', 'Jean Baptiste', 'Nzeyimana', '0788888882', 'Group-A', 'Treasurer', 'MEM002', '2024-01-10', 180000, 100000, 'Active', 'avatar2')
      `;

      // Insert demo transactions
      await sql`
        INSERT INTO transactions (id, member_name, member_avatar_id, type, amount, date, status)
        VALUES ('TXN001', 'Anathalie Mukamana', 'avatar1', 'Deposit', 50000, '2024-01-20', 'Completed')
      `;

      // Insert demo savings accounts
      await sql`
        INSERT INTO savings_accounts (id, member_id, member_name, account_number, type, balance, open_date)
        VALUES ('SAV001', '1', 'Anathalie Mukamana', 'SAV001', 'Voluntary', 250000, '2024-01-15')
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
        VALUES (1, 'Admin User', 'admin@andafinance.com', 'Admin')
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
  } catch (error) {
    console.error("❌ Error inserting initial data:", error);
  }
}

// Helper function to handle database errors
export function handleDatabaseError(error: any, operation: string) {
  console.error(`❌ Database error during ${operation}:`, error);
  throw new Error(`Database operation failed: ${operation}`);
}
