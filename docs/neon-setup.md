# 🗄️ Neon Database Setup Guide

## Step 1: Create Neon Database

1. **Visit Neon Console**: Go to https://console.neon.tech/
2. **Sign up/Login**: Create account or login
3. **Create Project**: Click "Create Project"
4. **Choose Region**: Select a region close to you
5. **Get Connection String**: Copy the connection string from the dashboard

## Step 2: Configure Environment Variables

1. **Create `.env.local` file** in your project root:

```bash
DATABASE_URL="your-neon-connection-string-here"
```

Example:

```bash
DATABASE_URL="postgresql://alex:AbC123dEf@ep-cool-darkness-123456.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

2. **Add to Vercel Environment Variables**:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add `DATABASE_URL` with your Neon connection string

## Step 3: Switch to Database Storage

Replace the current browser storage with database storage by updating imports:

**In all files that import from `data-service.ts`:**

```typescript
// Change this:
import { getMembers, addMember } from "@/lib/data-service";

// To this:
import { getMembers, addMember } from "@/lib/data-service-db";
```

**Or rename the files:**

1. Rename `data-service.ts` → `data-service-old.ts`
2. Rename `data-service-db.ts` → `data-service.ts`

## Step 4: Test Database Connection

The database will automatically:

- ✅ Create all necessary tables on first run
- ✅ Insert demo data (2 members, transactions, etc.)
- ✅ Handle all CRUD operations
- ✅ Persist data permanently

## Step 5: Deploy to Vercel

```bash
git add .
git commit -m "Add Neon database integration"
git push
```

Vercel will automatically use the `DATABASE_URL` environment variable.

## 🎯 What You Get

### ✅ **Real Database Persistence**

- Data survives server restarts
- Multiple users can access same data
- Professional production setup

### ✅ **Automatic Schema Creation**

- `members` table with all member fields
- `transactions`, `loans`, `savings_accounts`
- `cashbook_entries`, `investments`, `audit_logs`
- `users`, `accounts`, `journal_entries`

### ✅ **Demo Data Included**

- 2 sample members (Anathalie & Jean Baptiste)
- Sample transactions and savings
- Demo loan and investment data
- Ready-to-use dashboard

### ✅ **Production Ready**

- Connection pooling
- Error handling
- SQL injection protection
- Automatic retries

## 🔧 Database Schema

**Main Tables:**

- `members` - Member information and balances
- `transactions` - All financial transactions
- `savings_accounts` - Member savings accounts
- `loans` - Loan records and repayments
- `cashbook_entries` - Income and expense entries
- `investments` - Investment portfolio
- `audit_logs` - System activity logs
- `users` - Admin users and permissions

## 🚀 Next Steps

1. **Test locally**: Run `npm run dev` and verify data persists
2. **Deploy**: Push to Vercel and test online
3. **Customize**: Add more fields/tables as needed
4. **Scale**: Neon automatically handles scaling

Your finance app is now ready for production with real database persistence! 🎉
