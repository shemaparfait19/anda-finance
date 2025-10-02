// Browser-based storage for Vercel deployment
"use server";

// Initial demo data embedded in the application
const INITIAL_DATA = {
  "members.json": [
    {
      id: "1",
      name: "Anathalie Mukamana",
      firstName: "Anathalie",
      lastName: "Mukamana",
      phoneNumber: "0788888881",
      savingsGroup: "Group-A",
      memberRole: "Member",
      memberId: "MEM001",
      joinDate: "2024-01-15",
      savingsBalance: 250000,
      loanBalance: 0,
      status: "Active",
      avatarId: "avatar1",
    },
    {
      id: "2",
      name: "Jean Baptiste Nzeyimana",
      firstName: "Jean Baptiste",
      lastName: "Nzeyimana",
      phoneNumber: "0788888882",
      savingsGroup: "Group-A",
      memberRole: "Treasurer",
      memberId: "MEM002",
      joinDate: "2024-01-10",
      savingsBalance: 180000,
      loanBalance: 100000,
      status: "Active",
      avatarId: "avatar2",
    },
  ],
  "transactions.json": [
    {
      id: "TXN001",
      member: { name: "Anathalie Mukamana", avatarId: "avatar1" },
      type: "Deposit",
      amount: 50000,
      date: "2024-01-20",
      status: "Completed",
    },
  ],
  "savings.json": [
    {
      id: "SAV001",
      memberId: "1",
      memberName: "Anathalie Mukamana",
      accountNumber: "SAV001",
      type: "Voluntary",
      balance: 250000,
      openDate: "2024-01-15",
    },
  ],
  "loans.json": [
    {
      id: "LN001",
      memberId: "2",
      memberName: "Jean Baptiste Nzeyimana",
      loanId: "LN001",
      principal: 100000,
      balance: 100000,
      interestRate: 10,
      issueDate: "2024-01-10",
      dueDate: "2024-07-10",
      status: "Active",
      loanTerm: 6,
      loanPurpose: "Business expansion",
    },
  ],
  "cashbook.json": {
    income: [
      {
        id: "INC001",
        date: "2024-01-20",
        description: "Member savings deposits",
        category: "Savings",
        amount: 500000,
      },
    ],
    expenses: [
      {
        id: "EXP001",
        date: "2024-01-18",
        description: "Office rent",
        category: "Operations",
        amount: 50000,
      },
    ],
  },
  "investments.json": [
    {
      id: "INV001",
      name: "Government Bonds",
      type: "Bond",
      amountInvested: 500000,
      currentValue: 525000,
      purchaseDate: "2024-01-01",
      returnOnInvestment: 5,
    },
  ],
  "audit.json": [
    {
      id: "AUD001",
      timestamp: "2024-01-20T10:30:00Z",
      user: { name: "Admin User", avatarId: "avatar1" },
      action: "Member Added",
      details: "Added new member: Anathalie Mukamana",
    },
  ],
  "users.json": [
    {
      id: 1,
      name: "Admin User",
      email: "admin@andafinance.com",
      role: "Admin",
    },
  ],
  "reports.json": [
    {
      id: "RPT001",
      title: "Monthly Financial Summary",
      type: "financial",
      period: "2024-01",
      generatedDate: "2024-01-31",
      data: {
        totalSavings: 430000,
        totalLoans: 100000,
        totalInvestments: 525000,
        netPosition: 855000,
      },
      status: "completed",
    },
  ],
  "payments.json": [
    {
      id: "PAY001",
      memberId: "1",
      memberName: "Anathalie Mukamana",
      type: "savings_deposit",
      amount: 50000,
      paymentDate: "2024-01-20",
      paymentMethod: "cash",
      reference: "SAV001-DEP-001",
      status: "completed",
      description: "Monthly savings contribution",
    },
  ],
  "accounting.json": {
    accounts: [
      {
        id: "ACC001",
        code: "1000",
        name: "Cash at Hand",
        type: "asset",
        balance: 200000,
        lastUpdated: "2024-01-31",
      },
      {
        id: "ACC002",
        code: "2000",
        name: "Member Savings",
        type: "liability",
        balance: 430000,
        lastUpdated: "2024-01-31",
      },
    ],
    journalEntries: [
      {
        id: "JE001",
        date: "2024-01-20",
        description: "Member savings deposit",
        reference: "SAV001",
        entries: [
          { accountId: "ACC001", debit: 50000, credit: 0 },
          { accountId: "ACC002", debit: 0, credit: 50000 },
        ],
      },
    ],
  },
};

// In-memory storage for the application
const memoryStorage: Record<string, any> = {};
let isInitialized = false;

// Initialize storage with demo data
export function initializeStorage() {
  if (!isInitialized) {
    Object.assign(memoryStorage, INITIAL_DATA);
    isInitialized = true;
    console.log("🚀 Initialized browser storage with demo data");
  }
}

// Read data from memory storage
export async function readStorageData<T>(filename: string): Promise<T> {
  initializeStorage();

  if (memoryStorage[filename]) {
    return memoryStorage[filename];
  }

  // Return default empty data if not found
  if (filename === "cashbook.json") {
    return { income: [], expenses: [] } as T;
  }
  if (filename === "accounting.json") {
    return { accounts: [], journalEntries: [] } as T;
  }

  return [] as T;
}

// Write data to memory storage
export async function writeStorageData<T>(
  filename: string,
  data: T
): Promise<void> {
  initializeStorage();
  memoryStorage[filename] = data;
  console.log(`💾 Saved ${filename} to browser storage`);
}

// Get all stored data (for debugging)
export function getAllStorageData() {
  initializeStorage();
  return memoryStorage;
}
